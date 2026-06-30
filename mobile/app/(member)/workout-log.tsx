/**
 * Registrar entrenamiento (bitácora del miembro).
 * El miembro SELECCIONA una de sus rutinas y un día; los ejercicios se cargan
 * desde ahí (no se escriben a mano). Solo ajusta reps y peso de cada serie.
 * Al guardar: queda en su bitácora, cuenta como asistencia y calcula calorías.
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';

type Serie = { repeticiones: string; peso: string };
type Exercise = { nombre: string; series: Serie[] };

interface RoutineEx { nombre: string; series?: string | number; reps?: string | number; peso?: string | number }
interface RoutineDay { id: string; dia?: string; grupo?: string; ejercicios: RoutineEx[] }
interface Routine { id: string; nombre: string; activa?: boolean; duracion_minutos?: number; dias: RoutineDay[] }

interface WorkoutItem {
  id: string; nombre_rutina: string; fecha: string; duracion_min?: number | null;
  total_ejercicios: number; total_series: number; volumen_total: number;
  calorias_estimadas?: number; peso_corporal?: number | null;
}
interface WorkoutsResponse {
  workouts: WorkoutItem[];
  resumen: { total: number; este_mes: number; volumen_total: number; calorias_total: number };
}

const emptySerie = (): Serie => ({ repeticiones: '', peso: '' });
const seriesFrom = (e: RoutineEx): Serie[] => {
  const n = Math.min(10, Math.max(1, parseInt(String(e.series ?? 3), 10) || 3));
  const reps = e.reps ? String(e.reps) : '';
  const peso = e.peso ? String(e.peso) : '';
  return Array.from({ length: n }, () => ({ repeticiones: reps, peso }));
};

// ── Auto-detección del día por la fecha de hoy ──────────────────────────────
const WEEKDAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const normTxt = (s?: string) =>
  (s ?? '').toString().toLowerCase()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u').trim();
const todayName = () => WEEKDAYS_ES[new Date().getDay()];
// ¿El día de la rutina (p.ej. "Martes") coincide con hoy?
const dayMatchesToday = (d?: RoutineDay | null) => normTxt(d?.dia).includes(todayName());
// Día que cae hoy; si ninguno coincide, el primero.
const pickTodayOrFirst = (dias?: RoutineDay[]) =>
  (dias || []).find(dayMatchesToday) || (dias || [])[0] || null;
const exercisesFromDay = (day?: RoutineDay | null): Exercise[] =>
  (day?.ejercicios || []).filter(e => e.nombre).map(e => ({ nombre: e.nombre, series: seriesFrom(e) }));

export default function WorkoutLogScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data: routinesData, loading: loadingRoutines } = useFetch<{ rutinas: Routine[] }>(ENDPOINTS.USER_ROUTINES);
  const { data: histData, loading: loadingHist, refetch } = useFetch<WorkoutsResponse>(ENDPOINTS.USER_WORKOUTS);

  const routines = toArray<Routine>(routinesData?.rutinas);

  const [routineId, setRoutineId] = useState('');
  const [dayId, setDayId] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [duracion, setDuracion] = useState('');
  const [pesoCorporal, setPeso] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedRoutine = routines.find(r => r.id === routineId) || null;
  const days = selectedRoutine?.dias || [];
  const selectedDay = days.find(d => d.id === dayId) || null;

  // Aplica una rutina: fija duración y preselecciona el día que cae HOY
  // (o el primero si ninguno coincide), cargando sus ejercicios.
  const applyRoutine = useCallback((r?: Routine | null) => {
    if (!r) { setRoutineId(''); setDayId(''); setExercises([]); return; }
    setRoutineId(r.id);
    setDuracion(r.duracion_minutos ? String(r.duracion_minutos) : '');
    const day = pickTodayOrFirst(r.dias);
    setDayId(day?.id || '');
    setExercises(exercisesFromDay(day));
  }, []);

  const onRoutine = (r: Routine) => applyRoutine(r);
  const onDay = (d: RoutineDay) => { setDayId(d.id); setExercises(exercisesFromDay(d)); };

  // Auto-selección inicial: primera rutina activa + día de hoy (una sola vez).
  const [autoApplied, setAutoApplied] = useState(false);
  useEffect(() => {
    if (!autoApplied && !routineId && routines.length > 0) {
      applyRoutine(routines.find(r => r.activa !== false) || routines[0]);
      setAutoApplied(true);
    }
  }, [routines, autoApplied, routineId, applyRoutine]);

  const addSerie = (i: number) => setExercises(xs => xs.map((x, idx) => idx === i ? { ...x, series: [...x.series, emptySerie()] } : x));
  const removeSerie = (i: number, si: number) => setExercises(xs => xs.map((x, idx) =>
    idx === i ? { ...x, series: x.series.length > 1 ? x.series.filter((_, k) => k !== si) : x.series } : x));
  const setSerie = (i: number, si: number, field: keyof Serie, v: string) => setExercises(xs => xs.map((x, idx) =>
    idx === i ? { ...x, series: x.series.map((s, k) => k === si ? { ...s, [field]: v } : s) } : x));

  const volumen = exercises.reduce((acc, ex) =>
    acc + ex.series.reduce((a, s) => a + (parseFloat(s.repeticiones) || 0) * (parseFloat(s.peso) || 0), 0), 0);

  const save = useCallback(async () => {
    if (!selectedRoutine || !selectedDay) { Alert.alert('Falta', 'Selecciona una rutina y un día.'); return; }
    const ejercicios = exercises
      .map(ex => ({
        nombre: ex.nombre,
        series: ex.series.filter(s => s.repeticiones || s.peso)
          .map(s => ({ repeticiones: parseInt(s.repeticiones) || 0, peso: parseFloat(s.peso) || 0 })),
      }))
      .filter(ex => ex.series.length > 0);
    if (ejercicios.length === 0) { Alert.alert('Falta', 'Registra al menos una serie en algún ejercicio.'); return; }

    setSaving(true);
    try {
      const { data: res } = await api.post(ENDPOINTS.WORKOUT_COMPLETE, {
        nombre_rutina: `${selectedRoutine.nombre}${selectedDay.grupo ? ' - ' + selectedDay.grupo : ''}`,
        grupo_muscular: selectedDay.grupo || undefined,
        id_rutina: selectedRoutine.id,
        duracion_min: duracion ? parseInt(duracion) : undefined,
        peso_corporal: pesoCorporal ? parseFloat(pesoCorporal) : undefined,
        notas: notas.trim() || undefined,
        ejercicios,
      });
      Alert.alert(
        'Entrenamiento guardado',
        `${res.total_ejercicios} ejercicios · ${res.total_series} series.\nQuemaste aproximadamente ${res.calorias_estimadas} kcal.` +
        (res.peso_registrado ? '\n\nTu peso del día actualizó tus métricas.' : ''),
      );
      setExercises(exercisesFromDay(selectedDay));
      setPeso(''); setNotas('');
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar el entrenamiento.');
    } finally {
      setSaving(false);
    }
  }, [selectedRoutine, selectedDay, exercises, duracion, pesoCorporal, notas, refetch]);

  const workouts = toArray<WorkoutItem>(histData?.workouts);
  const resumen = histData?.resumen;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loadingHist} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text style={styles.title} accessibilityRole="header">Registrar entrenamiento</Text>
      <Text style={styles.subtitle}>Elige tu rutina y registra lo que hiciste. Tus calorías se calculan solas.</Text>

      <Card>
        {loadingRoutines ? (
          <LoadingSpinner message="Cargando tus rutinas…" />
        ) : routines.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={38} color={colors.textMuted} />
            <Text style={styles.emptyTxt}>Aún no tienes rutinas. Pídele a tu entrenador que te asigne una o crea la tuya para registrar entrenamientos.</Text>
          </View>
        ) : (
          <>
            {/* Selector de rutina */}
            <Text style={styles.inputLabel}>Rutina</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {routines.map(r => {
                const active = r.id === routineId;
                return (
                  <TouchableOpacity key={r.id} onPress={() => onRoutine(r)}
                    style={[styles.chip, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                    <Text style={[styles.chipTxt, active && { color: '#fff' }]}>{r.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Selector de día */}
            {days.length > 1 && (
              <>
                <Text style={styles.inputLabel}>Día</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {days.map(d => {
                    const active = d.id === dayId;
                    return (
                      <TouchableOpacity key={d.id} onPress={() => onDay(d)}
                        style={[styles.chip, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                        <Text style={[styles.chipTxt, active && { color: '#fff' }]}>
                          {(d.dia || 'Día') + (d.grupo ? ` · ${d.grupo}` : '') + (dayMatchesToday(d) ? ' · hoy' : '')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Ejercicios de la rutina */}
            {selectedDay && (exercises.length === 0 ? (
              <Text style={styles.hint}>Este día no tiene ejercicios.</Text>
            ) : exercises.map((ex, i) => (
              <View key={i} style={styles.exCard}>
                <View style={styles.exHead}>
                  <Ionicons name="barbell-outline" size={16} color={colors.accent} />
                  <Text style={styles.exName}>{ex.nombre}</Text>
                </View>
                <View style={styles.serieHead}>
                  <Text style={[styles.serieHeadTxt, { width: 24 }]}>#</Text>
                  <Text style={[styles.serieHeadTxt, { flex: 1 }]}>Reps</Text>
                  <Text style={[styles.serieHeadTxt, { flex: 1 }]}>Peso (kg)</Text>
                  <View style={{ width: 26 }} />
                </View>
                {ex.series.map((s, si) => (
                  <View key={si} style={styles.serieRow}>
                    <Text style={styles.serieNum}>{si + 1}</Text>
                    <TextInput style={[styles.input, { flex: 1, marginVertical: 0 }]} keyboardType="number-pad"
                      value={s.repeticiones} onChangeText={(v) => setSerie(i, si, 'repeticiones', v)} placeholder="12" placeholderTextColor={colors.textMuted} />
                    <TextInput style={[styles.input, { flex: 1, marginVertical: 0 }]} keyboardType="decimal-pad"
                      value={s.peso} onChangeText={(v) => setSerie(i, si, 'peso', v)} placeholder="40" placeholderTextColor={colors.textMuted} />
                    <TouchableOpacity onPress={() => removeSerie(i, si)} hitSlop={8} style={{ width: 26, alignItems: 'center' }}>
                      <Ionicons name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={() => addSerie(i)} style={styles.addSerie}>
                  <Ionicons name="add" size={15} color={colors.accent} />
                  <Text style={styles.addSerieTxt}>Agregar serie</Text>
                </TouchableOpacity>
              </View>
            )))}

            {selectedDay && (
              <>
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Duración (min)</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={duracion} onChangeText={setDuracion} placeholder="45" placeholderTextColor={colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Peso (opcional)</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={pesoCorporal} onChangeText={setPeso} placeholder="Si te pesaste" placeholderTextColor={colors.textMuted} />
                  </View>
                </View>
                <Text style={styles.hint}>Tus calorías quemadas se calculan automáticamente. El peso es opcional.</Text>
                <Text style={styles.inputLabel}>Notas</Text>
                <TextInput style={styles.input} value={notas} onChangeText={setNotas} placeholder="Cómo te sentiste…" placeholderTextColor={colors.textMuted} />

                <View style={styles.volBar}>
                  <Text style={styles.volLabel}>Volumen de la sesión</Text>
                  <Text style={styles.volValue}>{volumen.toFixed(0)} kg</Text>
                </View>

                <Button label="Guardar entrenamiento" onPress={save} loading={saving} disabled={!selectedDay} style={{ marginTop: 14 }} />
              </>
            )}
          </>
        )}
      </Card>

      {/* Bitácora */}
      <Card>
        <Text style={styles.sectionTitle}>Tu bitácora</Text>
        {resumen && (
          <View style={styles.resumen}>
            <View style={styles.resItem}><Text style={styles.resVal}>{resumen.total}</Text><Text style={styles.resLbl}>Total</Text></View>
            <View style={styles.resItem}><Text style={styles.resVal}>{resumen.este_mes}</Text><Text style={styles.resLbl}>Este mes</Text></View>
            <View style={styles.resItem}><Text style={styles.resVal}>{Math.round(resumen.volumen_total || 0)}</Text><Text style={styles.resLbl}>kg vol.</Text></View>
            <View style={styles.resItem}><Text style={styles.resVal}>{resumen.calorias_total ?? 0}</Text><Text style={styles.resLbl}>kcal</Text></View>
          </View>
        )}
        {loadingHist && workouts.length === 0 ? (
          <LoadingSpinner message="Cargando bitácora…" />
        ) : workouts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={38} color={colors.textMuted} />
            <Text style={styles.emptyTxt}>Aún no registras entrenamientos.</Text>
          </View>
        ) : (
          workouts.map((w) => (
            <View key={w.id} style={styles.wItem}>
              <View style={styles.wItemTop}>
                <Text style={styles.wName}>{w.nombre_rutina}</Text>
                <Text style={styles.wDate}>{w.fecha}</Text>
              </View>
              <View style={styles.wMeta}>
                <Text style={styles.wMetaTxt}>{w.total_ejercicios} ejercicios</Text>
                <Text style={styles.wMetaTxt}>{w.total_series} series</Text>
                <Text style={styles.wMetaTxt}>{Math.round(w.volumen_total || 0)} kg</Text>
                {w.calorias_estimadas ? <Text style={[styles.wMetaTxt, { color: colors.accent }]}>{w.calorias_estimadas} kcal</Text> : null}
                {w.peso_corporal ? <Text style={styles.wMetaTxt}>Peso: {w.peso_corporal} kg</Text> : null}
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:   { flex: 1, backgroundColor: colors.background },
    content:  { padding: 16, gap: 14, paddingBottom: 40 },
    title:    { color: colors.text, fontSize: 22 * fs, fontWeight: '700' },
    subtitle: { color: colors.textSecondary, fontSize: 12.5 * fs, marginTop: 2, marginBottom: 4 },
    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 12 },
    inputLabel: { color: colors.textSecondary, fontSize: 12.5 * fs, marginBottom: 6, marginTop: 10, fontWeight: '600' },
    hint: { color: colors.textMuted, fontSize: 11 * fs, marginTop: 6, lineHeight: 16 },
    input: { backgroundColor: colors.inputBg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 * fs, marginVertical: 2 },
    chips: { flexDirection: 'row', gap: 8, paddingVertical: 2, paddingRight: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    chipTxt: { color: colors.text, fontSize: 13 * fs, fontWeight: '600' },
    exCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginTop: 12, gap: 4 },
    exHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    exName: { flex: 1, color: colors.text, fontSize: 14 * fs, fontWeight: '700' },
    serieHead: { flexDirection: 'row', gap: 8, paddingHorizontal: 2, marginBottom: 2 },
    serieHeadTxt: { color: colors.textMuted, fontSize: 11 * fs, fontWeight: '600' },
    serieRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
    serieNum: { width: 24, textAlign: 'center', color: colors.accent, fontWeight: '700', fontSize: 13 * fs },
    addSerie: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
    addSerieTxt: { color: colors.accent, fontSize: 12.5 * fs, fontWeight: '600' },
    row2: { flexDirection: 'row', gap: 12, marginTop: 6 },
    volBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: colors.accent + '14' },
    volLabel: { color: colors.text, fontSize: 13 * fs },
    volValue: { color: colors.accent, fontSize: 16 * fs, fontWeight: '800' },
    resumen: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    resItem: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    resVal: { color: colors.accent, fontSize: 20 * fs, fontWeight: '800' },
    resLbl: { color: colors.textSecondary, fontSize: 10.5 * fs, marginTop: 2 },
    empty: { alignItems: 'center', paddingVertical: 26, gap: 10 },
    emptyTxt: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center', lineHeight: 19 },
    wItem: { backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 8 },
    wItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    wName: { color: colors.text, fontSize: 14 * fs, fontWeight: '700' },
    wDate: { color: colors.textSecondary, fontSize: 12 * fs },
    wMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
    wMetaTxt: { color: colors.textSecondary, fontSize: 12 * fs },
  });
}
