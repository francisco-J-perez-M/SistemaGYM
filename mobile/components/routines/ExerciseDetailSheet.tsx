/**
 * ExerciseDetailSheet — bottom sheet con detalle completo de un ejercicio.
 * Muestra: nombre, series/reps/peso, notas, imágenes (base64 o URL), video.
 *
 * Estrategia anti-TransactionTooLargeException (Android):
 *   Los blobs base64 (imágenes y videos) NUNCA se pasan como props/state.
 *   Se almacenan en mapas module-level (_imageCache, _videoCache) y solo
 *   se referencian por clave string. Al reproducir video se escribe al
 *   filesystem con expo-file-system y se usa expo-av.
 */
import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { toStr, toArray } from '../../utils/format';
// expo-file-system/legacy mantiene writeAsStringAsync en v54+
import * as FSLegacy from 'expo-file-system/legacy';
// expo-video incluido en Expo Go SDK 50+
import { VideoView, useVideoPlayer } from 'expo-video';

const { width: SW } = Dimensions.get('window');

// ── Cachés module-level (nunca en estado de React) ───────────────────────────
const _videoCache = new Map<string, string>();   // key → base64
const _imageCache = new Map<string, string[]>(); // key → string[]

/** Guarda el video base64 en caché; devuelve la clave. */
export function cacheVideo(key: string, base64: string) {
  _videoCache.set(key, base64);
}

/** Guarda el array de imágenes base64 en caché; devuelve la clave. */
export function cacheImages(key: string, images: string[]) {
  _imageCache.set(key, images);
}

// ── Tipos públicos ────────────────────────────────────────────────────────────
export interface ExerciseDetail {
  nombre:    string;
  setsStr?:  string;
  rest?:     string;
  day?:      string;
  peso?:     string;
  notas?:    string;
  instrucciones?: string;
  /** NO pasar arrays de base64 aquí — usar imageKey */
  imagenes?: string[];
  imageKey?: string;  // clave en _imageCache
  /** URL http/https directa */
  video?:    string;
  /** clave en _videoCache para base64 */
  videoKey?: string;
}

interface Props {
  visible:   boolean;
  exercise:  ExerciseDetail | null;
  onClose:   () => void;
}

// ── Imagen con fallback ───────────────────────────────────────────────────────
function EImg({ uri, colors }: { uri: string; colors: any }) {
  const [err, setErr] = useState(false);
  const size = (SW - 56) / 2;
  if (err || !uri) {
    return (
      <View style={[iS.ph, { width: size, height: size, backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="image-outline" size={28} color={colors.textMuted} />
      </View>
    );
  }
  const source = uri.startsWith('data:') || uri.startsWith('http') || uri.startsWith('file:')
    ? { uri }
    : { uri: `data:image/jpeg;base64,${uri}` };
  return (
    <Image source={source}
      style={{ width: size, height: size, borderRadius: 12 }}
      resizeMode="cover"
      onError={() => setErr(true)}
      accessibilityRole="image" />
  );
}
const iS = StyleSheet.create({
  ph: { borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

// ── Reproductor de video ──────────────────────────────────────────────────────
function VideoPlayer({ exercise, colors, fs }: { exercise: ExerciseDetail; colors: any; fs: number }) {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const externalUrl = exercise.video?.startsWith('http') ? exercise.video : null;
  const hasVideo    = !!(externalUrl || exercise.videoKey);
  const videoUri    = externalUrl ?? fileUri;

  // Escribe el base64 al filesystem y guarda el URI local
  const prepareBase64Video = async (key: string) => {
    const b64 = _videoCache.get(key);
    if (!b64) { setError('Video no disponible en caché'); return; }
    setLoading(true);
    setError(null);
    try {
      const raw  = b64.includes(',') ? b64.split(',')[1] : b64;
      const path = `${FSLegacy.cacheDirectory}video_${key}.mp4`;
      const info = await FSLegacy.getInfoAsync(path);
      if (!info.exists) {
        await FSLegacy.writeAsStringAsync(path, raw, {
          encoding: FSLegacy.EncodingType.Base64,
        });
      }
      setFileUri(path);
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFileUri(null);
    setError(null);
    if (exercise.videoKey) prepareBase64Video(exercise.videoKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.videoKey]);

  if (!hasVideo) return null;

  const sectionLabel = (
    <Text style={[vS.label, { color: colors.text, fontSize: 14 * fs }]}>
      Video demostrativo
    </Text>
  );

  if (loading) return (
    <View style={vS.container}>
      {sectionLabel}
      <View style={[vS.placeholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[vS.placeholderText, { color: colors.textSecondary, fontSize: 13 * fs }]}>
          Cargando video…
        </Text>
      </View>
    </View>
  );

  if (error) return (
    <View style={vS.container}>
      {sectionLabel}
      <View style={[vS.placeholder, { backgroundColor: colors.error + '10', borderColor: colors.error }]}>
        <Ionicons name="alert-circle-outline" size={28} color={colors.error} />
        <Text style={[vS.placeholderText, { color: colors.error, fontSize: 13 * fs }]}>
          {error}
        </Text>
      </View>
    </View>
  );

  if (videoUri) return (
    <View style={vS.container}>
      {sectionLabel}
      <VideoViewWrapper uri={videoUri} />
    </View>
  );

  return null;
}

// Componente separado para respetar las reglas de hooks
function VideoViewWrapper({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri }, p => {
    p.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={vS.player}
      nativeControls
      contentFit="contain"
      accessibilityLabel="Video demostrativo del ejercicio"
    />
  );
}
const vS = StyleSheet.create({
  container:       { gap: 8 },
  label:           { fontWeight: '700' },
  player:          { width: '100%', aspectRatio: 16 / 9, borderRadius: 14, backgroundColor: '#000' },
  placeholder:     { width: '100%', aspectRatio: 16 / 9, borderRadius: 14, borderWidth: 1,
                     alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderText: { textAlign: 'center', paddingHorizontal: 16 },
  btn:             { flexDirection: 'row', alignItems: 'center', gap: 10,
                     paddingVertical: 14, paddingHorizontal: 16,
                     borderRadius: 14, borderWidth: 1 },
  btnText:         { flex: 1, fontWeight: '600' },
});

// ── Componente principal ──────────────────────────────────────────────────────
export default function ExerciseDetailSheet({ visible, exercise, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const fs     = useFontScale();

  if (!exercise) return null;

  // Resolver imágenes: primero desde imageKey (caché), luego prop directo
  const imgs = exercise.imageKey
    ? (_imageCache.get(exercise.imageKey) ?? []).filter(Boolean)
    : toArray(exercise.imagenes).filter(Boolean);

  const hasVideo = !!(exercise.video || exercise.videoKey);

  const pills = [
    exercise.setsStr,
    exercise.rest  && `Desc: ${exercise.rest}`,
    exercise.peso  && `${exercise.peso} kg`,
    exercise.day,
  ].filter(Boolean) as string[];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} onPress={onClose}
          accessibilityLabel="Cerrar" accessibilityRole="button" />

        <View style={[s.sheet, {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + 20,
        }]}>
          {/* Handle */}
          <View style={[s.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={s.header}>
            <Text style={[s.title, { color: colors.text, fontSize: 18 * fs }]}
              numberOfLines={2}>
              {exercise.nombre}
            </Text>
            <TouchableOpacity onPress={onClose}
              style={[s.closeBtn, { backgroundColor: colors.card }]}
              accessibilityLabel="Cerrar detalle"
              accessibilityRole="button">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}
            contentContainerStyle={s.content}>

            {/* Pills */}
            {pills.length > 0 && (
              <View style={s.pillsRow}>
                {pills.map((p, i) => (
                  <View key={i} style={[s.pill, { backgroundColor: colors.accent + '18' }]}>
                    <Text style={[s.pillText, { color: colors.accent, fontSize: 12 * fs }]}>
                      {p}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Notas del entrenador */}
            {exercise.notas ? (
              <View style={[s.notasBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="chatbubble-outline" size={14} color={colors.accent} />
                <Text style={[s.notasText, { color: colors.textSecondary, fontSize: 13 * fs }]}>
                  {exercise.notas}
                </Text>
              </View>
            ) : null}

            {/* Instrucciones */}
            {exercise.instrucciones ? (
              <>
                <Text style={[s.sectionLabel, { color: colors.text, fontSize: 14 * fs }]}>
                  Instrucciones
                </Text>
                <Text style={[s.instrucciones, { color: colors.textSecondary, fontSize: 13 * fs }]}>
                  {exercise.instrucciones}
                </Text>
              </>
            ) : null}

            {/* Imágenes */}
            {imgs.length > 0 && (
              <>
                <Text style={[s.sectionLabel, { color: colors.text, fontSize: 14 * fs }]}>
                  Imágenes ({imgs.length})
                </Text>
                <View style={s.imgGrid}>
                  {imgs.map((uri, i) => (
                    <EImg key={i} uri={uri} colors={colors} />
                  ))}
                </View>
              </>
            )}

            {/* Video */}
            <VideoPlayer exercise={exercise} colors={colors} fs={fs} />

            {/* Placeholder sin media */}
            {imgs.length === 0 && !hasVideo && !exercise.instrucciones && (
              <View style={s.noMedia}>
                <Ionicons name="barbell-outline" size={36} color={colors.textMuted} />
                <Text style={[s.noMediaText, { color: colors.textMuted, fontSize: 13 * fs }]}>
                  Sin imágenes ni video para este ejercicio.
                </Text>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet:    { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%' },
  handle:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12,
              paddingHorizontal: 20, paddingVertical: 14 },
  title:    { flex: 1, fontWeight: '700', lineHeight: 24 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  content:  { paddingHorizontal: 20, paddingBottom: 8, gap: 14 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontWeight: '600' },
  notasBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8,
              padding: 12, borderRadius: 12, borderWidth: 1 },
  notasText:{ flex: 1, lineHeight: 18 },
  sectionLabel: { fontWeight: '700', marginBottom: -6 },
  instrucciones:{ lineHeight: 20 },
  imgGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  noMedia:  { alignItems: 'center', gap: 8, paddingVertical: 20 },
  noMediaText: { textAlign: 'center' },
});
