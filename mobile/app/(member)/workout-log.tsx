/**
 * Registrar entrenamiento (bitácora del miembro).
 * El miembro anota ejercicios (series, reps, peso) y su peso corporal del día.
 * Al guardar: queda en su bitácora, cuenta como asistencia y actualiza métricas.
 */
import React, { useState, useMemo, useCallback } from 'react';
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

interface WorkoutItem {
  id: string;
  nombre_rutina: string;
  fecha: string;
  duracion_min?: number | null;
  total_ejercicios: number;
  total_series: number;
  volumen_total: number;
  calorias_estimadas?: number;
  peso_corporal?: number | null;
}
interface WorkoutsResponse {
  workouts: WorkoutItem[];
  resumen: { total: number; este_mes: number; volumen_total: number; calorias_total: number };
}

const emptySerie = (): Serie => ({ repeticiones: '', peso: '' });
const emptyExercise = (): Exercise => ({ nombre: '', series: [emptySerie()] });

export default function WorkoutLogScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data, loading, refetch } = useFetch<WorkoutsResponse>(ENDPOINTS.USER_WORKOUTS);

  const [nombre, setNombre]   = useState('Entrenamiento de hoy');
  const [duracion, setDuracion] = useState('');
  const [pesoCorporal, setPeso] = useState('');
  const [notas, setNotas]     = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()]);
  const [saving, setSaving]   = useState(false);

  const setExName = (i: number, v: string) => setExercises(xs => xs.map((x, idx) => idx === i ? { ...x, nombre: v } : x));
  const addExercise = () => setExercises(xs => [...xs, emptyExercise()]);
  const removeExercise = (i: number) => setExercises(xs => xs.length > 1 ? xs.filter((_, idx) => idx !== i) : xs);
  const addSerie = (i: number) => setExercises(xs => xs.map((x, idx) => idx === i ? { ...x, series: [...x.series, emptySerie()] } : x));
  const removeSerie = (i: number, si: number) => setExercises(xs => xs.map((x, idx) =>
    idx === i ? { ...x, series: x.series.length > 1 ? x.series.filter((_, k) => k !== si) : x.series } : x));
  const setSerie = (i: number, si: number, field: keyof Serie, v: string) => setExercises(xs => xs.map((x, idx) =>
    idx === i ? { ...x, series: x.series.map((s, k) => k === si ? { ...s, [field]: v } : s) } : x));

  const volumen = exercises.reduce((acc, ex) =>
    acc + ex.series.reduce((a, s) => a + (parseFloat(s.repeticiones) || 0) * (parseFloat(s.peso) || 0), 0), 0);

  const save = useCallback(async () => {
    const ejercicios = exercises
      .filter(ex => ex.nombre.trim())
      .map(ex => ({
        nombre: ex.nombre.trim(),
        series: ex.series
          .filter(s => s.repeticiones || s.peso)
          .map(s => ({ repeticiones: parseInt(s.repeticiones) || 0, peso: parseFloat(s.peso) || 0 })),
      }));
    if (ejercicios.length === 0) { Alert.alert('Falta información', 'Agrega al menos un ejercicio con sus series.'); return; }

    setSaving(true);
    try {
      const { data: res } = await api.post(ENDPOINTS.WORKOUT_COMPLETE, {
        nombre_rutina: nombre.trim() || 'Entrenamiento libre',
        duracion_min: duracion ? parseInt(duracion) : undefined,
        peso_corporal: pesoCorporal ? parseFloat(pesoCorporal) : undefined,
        notas: notas.trim() || undefined,
        ejercicios,
      });
      Alert.alert(
        'Entrenamiento guardado',
        `${res.total_ejercicios} ejercicios · ${res.total_series} series.\n` +
        `Quemaste aproximadamente ${res.calorias_estimadas} kcal.` +
        (res.peso_registrado ? '\n\nTu peso del día actualizó tus métricas.' : ''),
      );
      setExercises([emptyExercise()]);
      setDuracion(''); setPeso(''); setNotas(''); setNombre('Entrenamiento de hoy');
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar el entrenamiento.');
    } finally {
      setSaving(false);
    }
  }, [exercises, nombre, duracion, pesoCorporal, notas, refetch]);

  const workouts = toArray<WorkoutItem>(data?.workouts);
  const resumen = data?.resumen;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text style={styles.title} accessibilityRole="header">Registrar entrenamiento</Text>
      <Text style={styles.subtitle}>Anota lo que hiciste. Tu peso del día actualiza tus métricas y predicción.</Text>

      {/* Formulario */}
      <Card>
        <Text style={styles.inputLabel}>Nombre del entrenamiento</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Día de pecho" placeholderTextColor={colors.textMuted} />

        {exercises.map((ex, i) => (
          <View key={i} style={styles.exCard}>
            <View style={styles.exHead}>
              <Ionicons name="barbell-outline" size={16} color={colors.accent} />
              <TextInput style={[styles.input, { flex: 1, marginVertical: 0 }]} value={ex.nombre}
                onChangeText={(v) => setExName(i, v)} placeholder={`Ejercicio ${i + 1}`} placeholderTextColor={colors.textMuted} />
              <TouchableOpacity onPress={() => removeExercise(i)} accessibilityLabel="Quitar ejercicio" hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
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
                <TouchableOpacity onPress={() => removeSerie(i, si)} accessibilityLabel="Quitar serie" hitSlop={8} style={{ width: 26, alignItems: 'center' }}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => addSerie(i)} style={styles.addSerie}>
              <Ionicons name="add" size={15} color={colors.accent} />
              <Text style={styles.addSerieTxt}>Agregar serie</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity onPress={addExercise} style={styles.addEx}>
          <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
          <Text style={styles.addExTxt}>Agregar ejercicio</Text>
        </TouchableOpacity>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Duración (min)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={duracion} onChangeText={setDuracion} placeholder="45" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Peso corporal (opcional)</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={pesoCorporal} onChangeText={setPeso} placeholder="Si te pesaste" placeholderTextColor={colors.textMuted} />
          </View>
        </View>
        <Text style={styles.hint}>Tus calorías quemadas se calculan automáticamente. El peso es opcional: regístralo solo si te pesaste hoy.</Text>
        <Text style={styles.inputLabel}>Notas</Text>
        <TextInput style={styles.input} value={notas} onChangeText={setNotas} placeholder="Cómo te sentiste…" placeholderTextColor={colors.textMuted} />

        <View style={styles.volBar}>
          <Text style={styles.volLabel}>Volumen de la sesión</Text>
          <Text style={styles.volValue}>{volumen.toFixed(0)} kg</Text>
        </View>

        <Button label="Guardar entrenamiento" onPress={save} loading={saving} style={{ marginTop: 14 }} />
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
        {loading && workouts.length === 0 ? (
          <LoadingSpinner message="Cargando bitácora…" />
        ) : workouts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={38} color={colors.textMuted} />
            <Text style={styles.emptyTxt}>Aún no registras entrenamientos. ¡Registra el primero!</Text>
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
    inputLabel: { color: colors.textSecondary, fontSize: 12.5 * fs, marginBottom: 4, marginTop: 10, fontWeight: '600' },
    hint: { color: colors.textMuted, fontSize: 11 * fs, marginTop: 6, lineHeight: 16 },
    input: { backgroundColor: colors.inputBg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 * fs, marginVertical: 2 },
    exCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginTop: 12, gap: 4 },
    exHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    serieHead: { flexDirection: 'row', gap: 8, paddingHorizontal: 2, marginBottom: 2 },
    serieHeadTxt: { color: colors.textMuted, fontSize: 11 * fs, fontWeight: '600' },
    serieRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
    serieNum: { width: 24, textAlign: 'center', color: colors.accent, fontWeight: '700', fontSize: 13 * fs },
    addSerie: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
    addSerieTxt: { color: colors.accent, fontSize: 12.5 * fs, fontWeight: '600' },
    addEx: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent, backgroundColor: colors.accent + '14' },
    addExTxt: { color: colors.accent, fontSize: 13 * fs, fontWeight: '700' },
    row2: { flexDirection: 'row', gap: 12 },
    volBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: colors.accent + '14' },
    volLabel: { color: colors.text, fontSize: 13 * fs },
    volValue: { color: colors.accent, fontSize: 16 * fs, fontWeight: '800' },
    resumen: { flexDirection: 'row', gap: 10, marginBottom: 14 },
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
