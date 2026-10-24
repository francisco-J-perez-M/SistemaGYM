/**
 * Pantalla Mis Rutinas — selector de día + lista de ejercicios.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import WorkoutRow from '../../components/member/WorkoutRow';
import Card from '../../components/ui/Card';
import type { DashboardData, Exercise } from '../../types';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function RoutinesScreen() {
  const colors = useColors();
  const styles = useMemo(() => make_styles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const todayIdx = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(todayIdx);
  const { data, loading, refetch } = useFetch<DashboardData>(ENDPOINTS.USER_DASHBOARD);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Al cambiar datos o día, actualizar ejercicios del día seleccionado
  useEffect(() => {
    if (data?.todayWorkout && selectedDay === todayIdx) {
      setExercises(data.todayWorkout.exercises.map((e) => ({ ...e, completed: false })));
    }
  }, [data, selectedDay, todayIdx]);

  const workoutType  = selectedDay === todayIdx ? (data?.todayWorkout?.type ?? 'Sin rutina') : 'Ver en la web';
  const displayExers = selectedDay === todayIdx ? exercises : [];

  const completed  = exercises.filter((e) => e.completed).length;
  const total      = exercises.length;
  const progress   = total > 0 ? Math.round((completed / total) * 100) : 0;

  const toggleExercise = (idx: number) => {
    setExercises((prev) => prev.map((e, i) => (i === idx ? { ...e, completed: !e.completed } : e)));
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando rutinas…" />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Mis Rutinas</Text>
        <Text style={styles.subtitle}>Selecciona un día para ver tus ejercicios</Text>
      </View>

      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
        {DAYS.map((d, i) => {
          const isToday    = i === todayIdx;
          const isSelected = i === selectedDay;
          return (
            <TouchableOpacity
              key={d}
              style={[styles.dayChip, isSelected && styles.dayChipActive]}
              onPress={() => setSelectedDay(i)}
              accessibilityRole="tab"
              accessibilityLabel={`${DAYS_ES[i]}${isToday ? ', hoy' : ''}`}
              accessibilityState={{ selected: isSelected }}
            >
              {isToday && <View style={styles.todayDot} />}
              <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                {d}
              </Text>
              <Text style={[styles.dayChipFull, isSelected && styles.dayChipTextActive]}>
                {DAYS_ES[i].slice(0, 3)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Workout header */}
      <Card>
        <View style={styles.workoutHeader}>
          <View>
            <Text style={styles.workoutDay}>{DAYS_ES[selectedDay]}</Text>
            <Text style={styles.workoutType}>{workoutType}</Text>
          </View>
          {total > 0 && (
            <View style={styles.progressWrap}>
              <Text style={styles.progressText}>{progress}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
              </View>
              <Text style={styles.progressSub}>{completed}/{total} completados</Text>
            </View>
          )}
        </View>

        {/* Exercises */}
        {selectedDay !== todayIdx ? (
          <View style={styles.noDataBox}>
            <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
            <Text style={styles.noDataText}>
              Solo se muestra la rutina del día actual.{'\n'}
              Usa el portal web para ver toda la semana.
            </Text>
          </View>
        ) : displayExers.length === 0 ? (
          <View style={styles.noDataBox}>
            <Ionicons name="moon-outline" size={32} color={colors.textMuted} />
            <Text style={styles.noDataText}>Día de descanso o sin rutina asignada.</Text>
          </View>
        ) : (
          displayExers.map((ex, i) => (
            <WorkoutRow key={`${ex.name}-${i}`} exercise={ex} index={i} onToggle={toggleExercise} />
          ))
        )}
      </Card>

      {/* Tips */}
      <Card style={styles.tipsCard}>
        <View style={styles.tipsRow}>
          <Ionicons name="information-circle-outline" size={18} color={colors.info} />
          <Text style={styles.tipsText}>
            Marca cada ejercicio al completarlo. Tu progreso se guarda localmente durante la sesión.
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  screen:   { flex: 1, backgroundColor: colors.background },
  content:  { padding: 20, gap: 16, paddingBottom: 32 },
  header:   { gap: 4 },
  title:    { color: colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 13 },
  dayScroll:   { marginHorizontal: -20, paddingHorizontal: 20 },
  dayChip: {
    alignItems:       'center',
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderRadius:      14,
    marginRight:       8,
    backgroundColor:   colors.card,
    borderWidth:       1,
    borderColor:       colors.border,
    gap:               2,
    position:          'relative',
  },
  dayChipActive:    { backgroundColor: colors.accent, borderColor: colors.accent },
  dayChipText:      { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  dayChipFull:      { color: colors.textMuted, fontSize: 10 },
  dayChipTextActive:{ color: '#fff' },
  todayDot: {
    position:        'absolute',
    top:             6,
    right:           6,
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: colors.warning,
  },
  workoutHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   12,
  },
  workoutDay:  { color: colors.textSecondary, fontSize: 13 },
  workoutType: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 2 },
  progressWrap: { alignItems: 'flex-end', gap: 4 },
  progressText: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  progressBar: {
    width:           80,
    height:          4,
    backgroundColor: colors.border,
    borderRadius:    2,
    overflow:        'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  progressSub:  { color: colors.textSecondary, fontSize: 11 },
  noDataBox: {
    alignItems:     'center',
    paddingVertical: 28,
    gap:            10,
  },
  noDataText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  tipsCard: { backgroundColor: colors.infoBg, borderColor: colors.info },
  tipsRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipsText: { color: colors.text, fontSize: 13, flex: 1, lineHeight: 18 },
});
}
