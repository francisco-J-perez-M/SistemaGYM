/**
 * RoutineDetailModal — detalle completo de una rutina con ejercicios,
 * imágenes y video. Funciona tanto para el entrenador (campos en inglés
 * del API: name, exerciseList[{name,sets,rest,day,peso,imagenes,video}])
 * como para el miembro (campos en español: nombre, dias[{dia,grupo,
 * ejercicios[{nombre,series,reps,peso,notas,imagenes,video}]}]).
 */
import React, { useState } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Dimensions, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { toStr, toArray } from '../../utils/format';
import Badge from '../ui/Badge';

const { width: SW } = Dimensions.get('window');
const IMG_SIZE = (SW - 64) / 3;   // 3 columnas

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TrainerExercise {
  name:     string;
  sets:     string;          // "3x12"
  rest:     string;
  day?:     string;
  peso?:    string;
  imagenes?: string[];
  video?:   string;
}

export interface MemberEjercicio {
  nombre:    string;
  series?:   string | number;
  reps?:     string | number;
  peso?:     string | number;
  notas?:    string;
  imagenes?: string[];
  video?:    string;
}

export interface DiaRutinaDetail {
  id:         string;
  dia:        string;
  grupo:      string;
  ejercicios: MemberEjercicio[];
}

// Rutina unificada — acepta tanto formato trainer como miembro
export interface RoutineForModal {
  // Campos comunes (trainer usa inglés, se normaliza)
  id?:          string;
  name?:        string;   // trainer
  nombre?:      string;   // miembro
  category?:    string;
  categoria?:   string;
  difficulty?:  string;
  dificultad?:  string;
  duration?:    string;
  duracion_minutos?: number;
  description?: string;
  descripcion?: string;
  active?:      boolean;
  activa?:      boolean;
  clients?:     number;
  nombre_entrenador?: string;
  notas_entrenador?:  string;
  // Ejercicios según rol
  exerciseList?: TrainerExercise[];    // trainer
  dias?:         DiaRutinaDetail[];   // miembro
}

interface Props {
  visible:  boolean;
  routine:  RoutineForModal | null;
  onClose:  () => void;
  mode:     'trainer' | 'member';
}

// ── Componente imagen ─────────────────────────────────────────────────────────
function ExerciseImage({ uri, colors }: { uri: string; colors: any }) {
  const [error, setError] = useState(false);
  if (error || !uri) {
    return (
      <View style={[imgS.placeholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="image-outline" size={20} color={colors.textMuted} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={imgS.img}
      resizeMode="cover"
      onError={() => setError(true)}
      accessibilityRole="image"
    />
  );
}

const imgS = StyleSheet.create({
  img:         { width: IMG_SIZE, height: IMG_SIZE, borderRadius: 10 },
  placeholder: { width: IMG_SIZE, height: IMG_SIZE, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

// ── Ejercicio individual ──────────────────────────────────────────────────────
function ExerciseCard({
  nombre, setsStr, rest, day, peso, notas, imagenes, video, colors, fs, index,
}: {
  nombre: string; setsStr: string; rest?: string; day?: string;
  peso?: string; notas?: string; imagenes?: string[]; video?: string;
  colors: any; fs: number; index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const imgs = toArray(imagenes).filter(Boolean);
  const hasMedia = imgs.length > 0 || !!video;

  return (
    <View style={[exS.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={exS.header}
        onPress={() => hasMedia && setExpanded(e => !e)}
        activeOpacity={hasMedia ? 0.7 : 1}
        accessibilityRole="button"
        accessibilityLabel={`Ejercicio ${nombre}`}
        accessibilityState={{ expanded }}
      >
        <View style={[exS.numBox, { backgroundColor: colors.accent + '20' }]}>
          <Text style={[exS.num, { color: colors.accent }]}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[exS.name, { color: colors.text, fontSize: 14 * fs }]}>{nombre}</Text>
          <Text style={[exS.meta, { color: colors.accent, fontSize: 12 * fs }]}>
            {[setsStr, rest && `Desc: ${rest}`, peso && `${peso} kg`, day]
              .filter(Boolean).join('  ·  ')}
          </Text>
          {notas ? (
            <Text style={[exS.notas, { color: colors.textSecondary, fontSize: 11 * fs }]}>{notas}</Text>
          ) : null}
        </View>
        {hasMedia && (
          <Ionicons
            name={expanded ? 'chevron-up' : 'images-outline'}
            size={18}
            color={colors.textSecondary}
          />
        )}
      </TouchableOpacity>

      {/* Imágenes + video (expandibles) */}
      {expanded && (
        <View style={exS.media}>
          {imgs.length > 0 && (
            <View style={exS.imgGrid}>
              {imgs.map((uri, i) => (
                <ExerciseImage key={i} uri={uri} colors={colors} />
              ))}
            </View>
          )}
          {video ? (
            <TouchableOpacity
              style={[exS.videoBtn, { backgroundColor: colors.error + '18', borderColor: colors.error }]}
              onPress={() => Linking.openURL(video)}
              accessibilityLabel="Ver video del ejercicio"
              accessibilityRole="button"
            >
              <Ionicons name="play-circle-outline" size={20} color={colors.error} />
              <Text style={[exS.videoText, { color: colors.error, fontSize: 13 * fs }]}>Ver video</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

const exS = StyleSheet.create({
  card:    { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  header:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  numBox:  { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  num:     { fontSize: 13, fontWeight: '800' },
  name:    { fontWeight: '700' },
  meta:    { marginTop: 2 },
  notas:   { marginTop: 2, fontStyle: 'italic' },
  media:   { paddingHorizontal: 12, paddingBottom: 12, gap: 10 },
  imgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  videoBtn:{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10,
             paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start' },
  videoText:{ fontWeight: '600' },
});

// ── Modal principal ───────────────────────────────────────────────────────────
export default function RoutineDetailModal({ visible, routine, onClose, mode }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const fs     = useFontScale();

  if (!routine) return null;

  // Normalizar campos
  const name        = toStr(routine.name ?? routine.nombre, 'Rutina');
  const category    = toStr(routine.category ?? routine.categoria, '');
  const difficulty  = toStr(routine.difficulty ?? routine.dificultad, '');
  const duration    = routine.duration ?? (routine.duracion_minutos ? `${routine.duracion_minutos} min` : '');
  const description = toStr(routine.description ?? routine.descripcion, '');
  const active      = routine.active ?? routine.activa ?? true;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.background }]}
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: 17 * fs }]} numberOfLines={1}>
            {name}
          </Text>
          <Badge
            label={active ? 'Activa' : 'Inactiva'}
            color={active ? 'success' : 'warning'}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Info de la rutina */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              {category ? (
                <View style={[styles.pill, { backgroundColor: colors.accent + '18' }]}>
                  <Ionicons name="grid-outline" size={13} color={colors.accent} />
                  <Text style={[styles.pillText, { color: colors.accent, fontSize: 12 * fs }]}>{category}</Text>
                </View>
              ) : null}
              {difficulty ? (
                <View style={[styles.pill, { backgroundColor: colors.warning + '18' }]}>
                  <Ionicons name="flash-outline" size={13} color={colors.warning} />
                  <Text style={[styles.pillText, { color: colors.warning, fontSize: 12 * fs }]}>{difficulty}</Text>
                </View>
              ) : null}
              {duration ? (
                <View style={[styles.pill, { backgroundColor: colors.info + '18' }]}>
                  <Ionicons name="time-outline" size={13} color={colors.info} />
                  <Text style={[styles.pillText, { color: colors.info, fontSize: 12 * fs }]}>{duration}</Text>
                </View>
              ) : null}
            </View>

            {description ? (
              <Text style={[styles.description, { color: colors.textSecondary, fontSize: 13 * fs }]}>
                {description}
              </Text>
            ) : null}

            {routine.nombre_entrenador ? (
              <Text style={[styles.trainerNote, { color: colors.textMuted, fontSize: 12 * fs }]}>
                Por {routine.nombre_entrenador}
              </Text>
            ) : null}
            {routine.notas_entrenador ? (
              <View style={[styles.notasBox, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}>
                <Ionicons name="chatbubble-outline" size={13} color={colors.accent} />
                <Text style={[styles.notasText, { color: colors.textSecondary, fontSize: 12 * fs }]}>
                  {routine.notas_entrenador}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ── MODO TRAINER: exerciseList plano ──────────────────────────── */}
          {mode === 'trainer' && toArray(routine.exerciseList).length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 15 * fs }]}>
                Ejercicios ({routine.exerciseList!.length})
              </Text>
              {routine.exerciseList!.map((ex, i) => (
                <ExerciseCard
                  key={i}
                  index={i}
                  nombre={toStr(ex.name)}
                  setsStr={toStr(ex.sets)}
                  rest={ex.rest}
                  day={ex.day}
                  peso={ex.peso}
                  imagenes={ex.imagenes}
                  video={ex.video}
                  colors={colors}
                  fs={fs}
                />
              ))}
            </>
          )}

          {/* ── MODO MEMBER: días → ejercicios ────────────────────────────── */}
          {mode === 'member' && toArray(routine.dias).length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 15 * fs }]}>
                Plan de entrenamiento
              </Text>
              {routine.dias!.map((dia) => (
                <View key={dia.id} style={styles.dayBlock}>
                  <View style={[styles.dayHeader, { backgroundColor: colors.accent + '18' }]}>
                    <Ionicons name="calendar-outline" size={15} color={colors.accent} />
                    <Text style={[styles.dayName, { color: colors.accent, fontSize: 13 * fs }]}>
                      {toStr(dia.dia)}
                    </Text>
                    {dia.grupo ? (
                      <Text style={[styles.dayGrupo, { color: colors.textSecondary, fontSize: 12 * fs }]}>
                        · {dia.grupo}
                      </Text>
                    ) : null}
                  </View>
                  {toArray(dia.ejercicios).map((ej, i) => (
                    <ExerciseCard
                      key={i}
                      index={i}
                      nombre={toStr(ej.nombre)}
                      setsStr={[ej.series && `${ej.series} series`, ej.reps && `${ej.reps} reps`].filter(Boolean).join(' × ')}
                      peso={ej.peso ? String(ej.peso) : undefined}
                      notas={ej.notas}
                      imagenes={ej.imagenes}
                      video={ej.video}
                      colors={colors}
                      fs={fs}
                    />
                  ))}
                </View>
              ))}
            </>
          )}

          {/* Sin ejercicios */}
          {(mode === 'trainer' ? toArray(routine.exerciseList).length === 0 : toArray(routine.dias).length === 0) && (
            <View style={styles.empty}>
              <Ionicons name="barbell-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: 14 * fs }]}>
                Sin ejercicios registrados aún.
              </Text>
            </View>
          )}

          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  closeBtn:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontWeight: '700' },
  content:     { padding: 20, gap: 16 },
  infoCard:    { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  infoRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pillText:    { fontWeight: '600' },
  description: { lineHeight: 20 },
  trainerNote: { fontStyle: 'italic' },
  notasBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  notasText:   { flex: 1, lineHeight: 18 },
  sectionTitle:{ fontWeight: '700', marginBottom: -8 },
  dayBlock:    { gap: 8 },
  dayHeader:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  dayName:     { fontWeight: '700' },
  dayGrupo:    {},
  empty:       { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText:   { fontWeight: '600', textAlign: 'center' },
});
