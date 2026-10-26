/**
 * Entrenamiento — Paso A: Dashboard del Plan Diario (Miembro).
 *
 * Primer paso del flujo unificado de 3 pasos de Entrenamiento (ver también
 * components/routines/RoutineDetailModal.tsx -- Paso B -- y
 * app/(member)/start-workout.tsx -- Paso C). Antes esta pantalla era un tab
 * "Mi Rutina" (lista de rutinas asignadas) + un tab "Entrenador" (chat);
 * ambos se repartieron al consolidar el menú (ver components/navigation/
 * CustomDrawer.tsx y app/(member)/_layout.tsx): la lista de rutinas
 * asignadas se unió con las propias en "Mi Biblioteca" (mi-rutina.tsx) y la
 * gestión de PT + chat se movió completa a chat.tsx -- ver los comentarios
 * de cabecera de esos dos archivos para el detalle de qué se llevó cada uno.
 *
 * GET /api/user/training/assigned-routines y GET /api/user/routines --
 * mismos endpoints y formas de siempre (ambos ya traen dias[].ejercicios[]
 * completos, incluido el grupo muscular POR EJERCICIO -- ver
 * api/app/routes/miembro/user_routine.py y .../training.py-- no hace falta
 * ningún endpoint nuevo), solo que ahora se combinan aquí para resolver "qué
 * rutina toca" en CUALQUIER día de la semana, no solo hoy (ver candidata).
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import RoutineDetailModal, { type RoutineForModal } from '../../components/routines/RoutineDetailModal';

// ── Resolución de día (mismo criterio que start-workout.tsx, sin acentos) ───
const DIAS        = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTOS = ['Lun',   'Mar',    'Mié',       'Jue',    'Vie',     'Sáb',    'Dom'];
const normTxt = (s?: string) =>
  (s ?? '').toString().toLowerCase()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u').trim();
// Date#getDay(): domingo=0..sábado=6; DIAS empieza en lunes -- este índice
// traduce uno al otro para que el chip de "hoy" arranque seleccionado.
const indiceHoy = () => (new Date().getDay() + 6) % 7;

interface Ejercicio {
  nombre: string; series?: string | number; reps?: string | number; peso?: string | number;
  grupo?: string; notas?: string; imagenes?: string[]; video?: string;
}
interface DiaRutina { id: string; dia: string; grupo: string; ejercicios: Ejercicio[] }
interface Rutina {
  id: string; nombre: string; activa?: boolean; categoria?: string; dificultad?: string;
  duracion_minutos?: number; nombre_entrenador?: string; notas_entrenador?: string; dias: DiaRutina[];
}
type Origen = 'propia' | 'entrenador';
type RutinaUI = Rutina & { origen: Origen };

export default function TrainingScreen() {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data: propiasData,   loading: loadingPropias,   refetch: refetchPropias } =
    useFetch<{ rutinas: Rutina[] }>(ENDPOINTS.USER_ROUTINES);
  const { data: asignadasData, loading: loadingAsignadas, refetch: refetchAsignadas } =
    useFetch<{ rutinas: Rutina[] }>(ENDPOINTS.USER_ASSIGNED_ROUTINES);

  const cargando = loadingPropias || loadingAsignadas;
  const refetch  = () => { refetchPropias(); refetchAsignadas(); };

  const rutinas = useMemo<RutinaUI[]>(() => [
    ...toArray<Rutina>(asignadasData?.rutinas).map((r) => ({ ...r, origen: 'entrenador' as const })),
    ...toArray<Rutina>(propiasData?.rutinas).map((r) => ({ ...r, origen: 'propia' as const })),
  ], [asignadasData, propiasData]);

  const [diaIdx, setDiaIdx] = useState(indiceHoy());
  const nombreDia = DIAS[diaIdx];

  // Candidata del día elegido: se prioriza la asignada por el entrenador
  // sobre la propia -- mismo criterio que usa start-workout.tsx al arrancar
  // la sesión en vivo (Paso C), para que lo que se previsualiza aquí y lo
  // que de verdad se entrena después nunca contradigan.
  const candidata = useMemo(() => {
    for (const origen of ['entrenador', 'propia'] as const) {
      for (const r of rutinas) {
        if (r.origen !== origen || r.activa === false) continue;
        const dia = toArray(r.dias).find((d) => normTxt(d.dia).includes(normTxt(nombreDia)));
        if (dia) return { routine: r, dia };
      }
    }
    return null;
  }, [rutinas, nombreDia]);

  const [verDetalle, setVerDetalle] = useState(false);

  if (cargando && rutinas.length === 0) {
    return <LoadingSpinner fullScreen message="Cargando tu plan…" />;
  }

  const rutinaParaModal: RoutineForModal | null = candidata ? {
    id:                candidata.routine.id,
    nombre:            candidata.routine.nombre,
    categoria:         candidata.routine.categoria,
    dificultad:        candidata.routine.dificultad,
    duracion_minutos:  candidata.routine.duracion_minutos,
    activa:            candidata.routine.activa,
    nombre_entrenador: candidata.routine.nombre_entrenador,
    notas_entrenador:  candidata.routine.notas_entrenador,
    dias:              candidata.routine.dias,
  } : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={cargando} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Entrenamiento</Text>
        <Text style={styles.subtitle}>Tu plan, día por día.</Text>
      </View>

      {/* Selector de día -- unifica lo que antes era "elegir día" dentro de
          Mi Rutina con la vista general del plan. No fuerza nada: solo
          cambia qué día se PREVISUALIZA en la tarjeta de abajo. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.diasRow}>
        {DIAS.map((d, i) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDiaIdx(i)}
            style={[styles.diaChip, i === diaIdx && styles.diaChipActivo]}
            accessibilityRole="button"
            accessibilityLabel={`${d}${i === diaIdx ? ', seleccionado' : ''}`}
          >
            <Text style={[styles.diaChipTexto, i === diaIdx && styles.diaChipTextoActivo]}>
              {DIAS_CORTOS[i]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tarjeta del día */}
      <Card style={styles.diaCard}>
        {candidata ? (
          <>
            <View style={styles.diaCardHeader}>
              <View style={styles.diaCardIcon}>
                <Ionicons name="barbell-outline" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.diaCardDia}>
                  {nombreDia}{candidata.dia.grupo ? ` — ${candidata.dia.grupo}` : ''}
                </Text>
                <Text style={styles.diaCardNombre}>{candidata.routine.nombre}</Text>
              </View>
              <Ionicons
                name={candidata.routine.origen === 'entrenador' ? 'school-outline' : 'person-outline'}
                size={16}
                color={colors.textMuted}
              />
            </View>
            <View style={styles.diaCardMetaRow}>
              {!!candidata.routine.duracion_minutos && (
                <View style={styles.metaPill}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.metaPillTexto}>{candidata.routine.duracion_minutos} min</Text>
                </View>
              )}
              <View style={styles.metaPill}>
                <Ionicons name="list-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.metaPillTexto}>
                  {toArray(candidata.dia.ejercicios).length} ejercicios
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.verBtn}
              onPress={() => setVerDetalle(true)}
              accessibilityRole="button"
              accessibilityLabel={`Ver ${candidata.routine.nombre}`}
            >
              <Ionicons name="eye-outline" size={14} color={colors.onAccent} />
              <Text style={styles.verBtnTexto}>Ver</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.diaVacio}>
            <Ionicons name="moon-outline" size={32} color={colors.textMuted} />
            <Text style={styles.diaVacioTexto}>
              {diaIdx === indiceHoy() ? 'Hoy no tienes rutina asignada.' : 'Sin rutina para este día.'}
            </Text>
          </View>
        )}
      </Card>

      {/* Accesos directos */}
      <View style={styles.accesosRow}>
        <TouchableOpacity
          style={styles.accesoCard}
          onPress={() => router.push('/(member)/mi-rutina')}
          accessibilityRole="button"
          accessibilityLabel="Mi Biblioteca"
        >
          <Ionicons name="library-outline" size={22} color={colors.accent} />
          <Text style={styles.accesoTexto}>Mi Biblioteca</Text>
        </TouchableOpacity>

        {/* Generar entrenamiento con IA -- fuera de alcance por ahora (no hay
            backend ni modelo todavía): se deja el acceso visible como
            "Próximamente" para no prometer algo que no funciona. */}
        <View style={[styles.accesoCard, styles.accesoDeshabilitado]}>
          <Ionicons name="sparkles-outline" size={22} color={colors.textMuted} />
          <Text style={[styles.accesoTexto, { color: colors.textMuted }]}>Generar con IA</Text>
          <View style={styles.proximamenteBadge}>
            <Text style={styles.proximamenteTexto}>Próximamente</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.accesoCard}
          onPress={() => router.push('/(member)/chat')}
          accessibilityRole="button"
          accessibilityLabel="Chat con tu entrenador"
        >
          <Ionicons name="chatbubbles-outline" size={22} color={colors.accent} />
          <Text style={styles.accesoTexto}>Chat con tu entrenador</Text>
        </TouchableOpacity>
      </View>

      {/* Paso B -- ver RoutineDetailModal.tsx: diaId acota el modal a SOLO
          este día (distribución muscular + botón flotante "Empezar
          Entrenamiento" directo al Paso C). */}
      <RoutineDetailModal
        visible={verDetalle}
        routine={rutinaParaModal}
        diaId={candidata?.dia.id}
        mode="member"
        onClose={() => setVerDetalle(false)}
      />
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 16, paddingBottom: 40 },
    header:  { gap: 4 },
    title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
    subtitle:{ color: colors.textSecondary, fontSize: 13 * fs },
    diasRow: { gap: 6, paddingVertical: 2 },
    diaChip: {
      paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    diaChipActivo:      { backgroundColor: colors.accent, borderColor: colors.accent },
    diaChipTexto:       { color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '700' },
    diaChipTextoActivo: { color: colors.onAccent },
    diaCard:        { gap: 12 },
    diaCardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    diaCardIcon:    {
      width: 46, height: 46, borderRadius: 14, backgroundColor: colors.accentBg,
      alignItems: 'center', justifyContent: 'center',
    },
    diaCardDia:     { color: colors.accent, fontSize: 12 * fs, fontWeight: '700', textTransform: 'uppercase' },
    diaCardNombre:  { color: colors.text, fontSize: 18 * fs, fontWeight: '700', marginTop: 2 },
    diaCardMetaRow: { flexDirection: 'row', gap: 8 },
    metaPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    },
    metaPillTexto: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600' },
    verBtn: {
      flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6,
      backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9,
    },
    verBtnTexto: { color: colors.onAccent, fontSize: 13 * fs, fontWeight: '700' },
    diaVacio:      { alignItems: 'center', gap: 8, paddingVertical: 16 },
    diaVacioTexto: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center' },
    accesosRow: { flexDirection: 'row', gap: 10 },
    accesoCard: {
      flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, paddingVertical: 16, paddingHorizontal: 8,
    },
    accesoDeshabilitado: { opacity: 0.75 },
    accesoTexto: { color: colors.text, fontSize: 11.5 * fs, fontWeight: '600', textAlign: 'center' },
    proximamenteBadge: {
      backgroundColor: colors.warning + '22', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2,
    },
    proximamenteTexto: { color: colors.warning, fontSize: 9.5 * fs, fontWeight: '700' },
  });
}
