/**
 * PerfilEntrenador — ficha del entrenador vista por el miembro.
 *
 * Reúne en un solo lugar lo que antes estaba disperso en la pantalla de
 * Entrenamiento: los datos del entrenador, sus certificaciones y la
 * calificación. Sacarlo a una hoja aparte libera la pantalla, donde el chat
 * quedaba aplastado entre tarjetas.
 *
 *   GET  /api/user/training/trainers/<id>   ficha pública
 *   GET  /api/user/training/trainer-rating  calificación que ya dio el miembro
 *   POST /api/user/training/trainer-rating  guardar calificación
 *
 * SECCIONES QUE PINTA
 *   velo ............ colors.overlay
 *   hoja ............ colors.background
 *   avatar .......... colors.accent + colors.onAccent
 *   estrellas ....... colors.promo cuando están marcadas
 *   certificaciones . tarjetas colors.card con borde colors.border
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { toStr, toArray } from '../../utils/format';
import api from '../../services/api';
import VisorCertificado from './VisorCertificado';

interface Certificacion {
  nombre?:  string;
  emisor?:  string;
  anio?:    string | number;
  /** Documento escaneado en data URL; si viene, se puede previsualizar. */
  archivo?: string;
  nombre_archivo?: string;
}

interface FichaEntrenador {
  id?:              number;
  nombre?:          string;
  email?:           string;
  foto?:            string | null;
  especialidad?:    string;
  biografia?:       string;
  experiencia?:     string;
  certificaciones?: Certificacion[];
  rating?:          number | null;
  num_ratings?:     number;
  total_rutinas?:   number;
  total_clientes?:  number;
}

interface Props {
  /** Identificador del entrenador; null cierra la hoja. */
  trainerId: number | null;
  onClose:   () => void;
  /** Si es su entrenador asignado, se permite calificar y terminar. */
  esMiEntrenador?: boolean;
  onTerminar?: () => void;
}

export default function PerfilEntrenador({
  trainerId, onClose, esMiEntrenador = false, onTerminar,
}: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  const [ficha, setFicha]     = useState<FichaEntrenador | null>(null);
  const [cargando, setCargando] = useState(false);
  const [rating, setRating]   = useState(0);
  const [guardado, setGuardado] = useState(false);
  const [verCert, setVerCert] = useState<Certificacion | null>(null);

  useEffect(() => {
    if (!trainerId) { setFicha(null); return; }
    let vivo = true;
    setCargando(true);
    (async () => {
      try {
        const { data } = await api.get(`${ENDPOINTS.USER_TRAINERS_LIST}/${trainerId}`);
        if (vivo) setFicha(data ?? null);
      } catch {
        if (vivo) setFicha(null);
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => { vivo = false; };
  }, [trainerId]);

  // La calificación solo aplica al entrenador con el que se entrena.
  useEffect(() => {
    if (!trainerId || !esMiEntrenador) return;
    api.get(ENDPOINTS.USER_TRAINER_RATING)
      .then(({ data }) => {
        if (data?.rating != null) { setRating(data.rating); setGuardado(true); }
      })
      .catch(() => {});
  }, [trainerId, esMiEntrenador]);

  const calificar = async (v: number) => {
    setRating(v);
    try {
      await api.post(ENDPOINTS.USER_TRAINER_RATING, { calificacion: v });
      setGuardado(true);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar la calificación.');
    }
  };

  const terminar = () => {
    Alert.alert(
      'Terminar entrenamiento',
      '¿Terminar con este entrenador? Después podrás solicitar a otro.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(ENDPOINTS.USER_PT_ACTIVO);
              onClose();
              onTerminar?.();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo terminar.');
            }
          },
        },
      ],
    );
  };

  const certificaciones = toArray<Certificacion>(ficha?.certificaciones);
  const nombre = toStr(ficha?.nombre, 'Entrenador');

  return (
    <Modal
      visible={!!trainerId}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.velo}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Cerrar perfil"
          accessibilityRole="button"
        />

        <View style={[styles.hoja, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.asa} />

          <View style={styles.encabezado}>
            <Text style={styles.tituloHoja}>Perfil del entrenador</Text>
            <TouchableOpacity onPress={onClose} style={styles.cerrar} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {cargando ? (
            <Text style={styles.cargando}>Cargando perfil…</Text>
          ) : !ficha ? (
            <Text style={styles.cargando}>No se pudo cargar el perfil.</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Identidad */}
              <View style={styles.identidad}>
                {ficha.foto && ficha.foto.startsWith('data:image') ? (
                  <Image source={{ uri: ficha.foto }} style={styles.fotoGrande} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarGrande}>
                    <Text style={styles.iniciales}>{nombre.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.nombre}>{nombre}</Text>
                {ficha.especialidad ? (
                  <Text style={styles.especialidad}>{ficha.especialidad}</Text>
                ) : null}
                {ficha.rating != null ? (
                  <View style={styles.ratingFila}>
                    <Ionicons name="star" size={15} color={colors.promo} />
                    <Text style={styles.ratingText}>
                      {ficha.rating} · {ficha.num_ratings ?? 0} reseñas
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Cifras */}
              <View style={styles.cifras}>
                <View style={styles.cifra}>
                  <Text style={styles.cifraValor}>{ficha.total_clientes ?? 0}</Text>
                  <Text style={styles.cifraLabel}>Clientes</Text>
                </View>
                <View style={styles.cifraDivisor} />
                <View style={styles.cifra}>
                  <Text style={styles.cifraValor}>{ficha.total_rutinas ?? 0}</Text>
                  <Text style={styles.cifraLabel}>Rutinas</Text>
                </View>
                <View style={styles.cifraDivisor} />
                <View style={styles.cifra}>
                  <Text style={styles.cifraValor}>{toStr(ficha.experiencia, '—')}</Text>
                  <Text style={styles.cifraLabel}>Experiencia</Text>
                </View>
              </View>

              {/* Biografía */}
              {ficha.biografia ? (
                <>
                  <Text style={styles.seccion}>Sobre mí</Text>
                  <Text style={styles.parrafo}>{ficha.biografia}</Text>
                </>
              ) : null}

              {/* Certificaciones */}
              <Text style={styles.seccion}>Certificaciones</Text>
              {certificaciones.length === 0 ? (
                <Text style={styles.vacio}>Sin certificaciones registradas.</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {certificaciones.map((c, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.certFila}
                      activeOpacity={c.archivo ? 0.85 : 1}
                      onPress={() => c.archivo && setVerCert(c)}
                      disabled={!c.archivo}
                      accessibilityRole={c.archivo ? 'button' : 'text'}
                      accessibilityLabel={c.archivo
                        ? `Ver el certificado de ${toStr(c.nombre)}`
                        : toStr(c.nombre, 'Certificación')}
                    >
                      <View style={styles.certIcono}>
                        <Ionicons name="ribbon-outline" size={16} color={colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.certNombre}>{toStr(c.nombre, 'Certificación')}</Text>
                        <Text style={styles.certMeta}>
                          {[toStr(c.emisor), c.anio ? String(c.anio) : ''].filter(Boolean).join(' · ') || '—'}
                        </Text>
                      </View>
                      {/* El ojo solo aparece si hay documento que revisar */}
                      {c.archivo ? (
                        <Ionicons name="eye-outline" size={18} color={colors.accent} />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Calificación: solo con el entrenador propio */}
              {esMiEntrenador ? (
                <>
                  <Text style={styles.seccion}>
                    {guardado ? 'Tu calificación' : 'Califica a tu entrenador'}
                  </Text>
                  <View style={styles.estrellas}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => calificar(i)}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel={`Calificar con ${i} de 5`}
                      >
                        <Ionicons
                          name={i <= rating ? 'star' : 'star-outline'}
                          size={30}
                          color={i <= rating ? colors.promo : colors.textMuted}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.terminarBtn}
                    onPress={terminar}
                    accessibilityRole="button"
                    accessibilityLabel="Terminar entrenamiento personal"
                  >
                    <Ionicons name="exit-outline" size={17} color={colors.dataRiesgo} />
                    <Text style={styles.terminarText}>Terminar entrenamiento personal</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </ScrollView>
          )}
        </View>

        {/* Previsualización del certificado, sobre esta misma hoja */}
        <VisorCertificado certificado={verCert} onClose={() => setVerCert(null)} />
      </View>
    </Modal>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    velo: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    hoja: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingTop: 10, maxHeight: '90%',
    },
    asa: {
      width: 40, height: 4, borderRadius: 2, alignSelf: 'center',
      backgroundColor: colors.border, marginBottom: 10,
    },
    encabezado: { flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 6 },
    tituloHoja: { color: colors.text, fontSize: 17 * fs, fontWeight: '700' },
    cerrar: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
    },
    cargando: { color: colors.textMuted, fontSize: 13 * fs,
                textAlign: 'center', paddingVertical: 40 },

    identidad:   { alignItems: 'center', gap: 6, paddingVertical: 14 },
    avatarGrande: {
      width: 84, height: 84, borderRadius: 26,
      backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    },
    fotoGrande:  { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.surface },
    iniciales:   { color: colors.onAccent, fontSize: 32 * fs, fontWeight: '800' },
    nombre:      { color: colors.text, fontSize: 20 * fs, fontWeight: '800', textAlign: 'center' },
    especialidad:{ color: colors.accent, fontSize: 13 * fs, fontWeight: '600' },
    ratingFila:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    ratingText:  { color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '600' },

    cifras: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 14, paddingVertical: 14,
      borderWidth: 1, borderColor: colors.border, marginTop: 6,
    },
    cifra:        { flex: 1, alignItems: 'center', gap: 2 },
    cifraValor:   { color: colors.text, fontSize: 17 * fs, fontWeight: '800' },
    cifraLabel:   { color: colors.textMuted, fontSize: 11 * fs },
    cifraDivisor: { width: 1, height: 30, backgroundColor: colors.border },

    seccion: { color: colors.text, fontSize: 14 * fs, fontWeight: '700',
               marginTop: 20, marginBottom: 8 },
    parrafo: { color: colors.textSecondary, fontSize: 13 * fs, lineHeight: 19 },
    vacio:   { color: colors.textMuted, fontSize: 12.5 * fs },

    certFila: {
      flexDirection: 'row', alignItems: 'center', gap: 11,
      backgroundColor: colors.card, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    certIcono: {
      width: 32, height: 32, borderRadius: 10, backgroundColor: colors.accentBg,
      alignItems: 'center', justifyContent: 'center',
    },
    certNombre: { color: colors.text, fontSize: 13.5 * fs, fontWeight: '700' },
    certMeta:   { color: colors.textSecondary, fontSize: 11.5 * fs, marginTop: 1 },

    estrellas: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 4 },

    terminarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginTop: 20, paddingVertical: 13, borderRadius: 12,
      backgroundColor: colors.dataRiesgoBg,
    },
    terminarText: { color: colors.dataRiesgo, fontSize: 13.5 * fs, fontWeight: '700' },
  });
}
