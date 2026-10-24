/**
 * Dashboard del Miembro.
 * Muestra: saludo, racha, KPIs, membresía, rutina de hoy, logros.
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { toFirstName } from '../../utils/format';
import { ENDPOINTS } from '../../constants/Api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import KPICard from '../../components/member/KPICard';
import MembershipCard from '../../components/member/MembershipCard';
import WorkoutRow from '../../components/member/WorkoutRow';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import type { DashboardData, Exercise } from '../../types';
import api from '../../services/api';
import { refreshMemberReminders } from '../../services/reminders';

export default function MemberDashboard() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch<DashboardData>(ENDPOINTS.USER_DASHBOARD);

  // Programa recordatorios locales (racha diaria + vencimiento de membresía).
  useEffect(() => {
    if (!data) return;
    refreshMemberReminders({
      membershipEnd: data.membership?.fecha_fin ?? null,
      streakDays:    data.workoutStats?.streakDays ?? 0,
    });
  }, [data]);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [checkinDone, setCheckinDone] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [workoutDone, setWorkoutDone] = useState(false);
  const [workoutSaving, setWorkoutSaving] = useState(false);

  const workoutExercises: Exercise[] = exercises.length
    ? exercises
    : (data?.todayWorkout?.exercises ?? []);

  const toggleExercise = (idx: number) => {
    setExercises((prev) => {
      const list = prev.length ? prev : [...workoutExercises];
      return list.map((e, i) => (i === idx ? { ...e, completed: !e.completed } : e));
    });
  };

  const completeWorkout = async () => {
    setWorkoutSaving(true);
    try {
      await api.post(ENDPOINTS.WORKOUT_COMPLETE, {
        type:      data?.todayWorkout?.type,
        exercises: workoutExercises.map((e) => ({ name: e.name, completed: e.completed })),
        fecha:     new Date().toISOString(),
      });
      setWorkoutDone(true);
      refetch();
    } catch {
      // Endpoint stub: marcamos completado localmente aunque falle la red.
      setWorkoutDone(true);
    } finally {
      setWorkoutSaving(false);
    }
  };

  const handleCheckin = async () => {
    setCheckinLoading(true);
    try {
      await api.post(ENDPOINTS.USER_CHECKIN);
      setCheckinDone(true);
    } catch {
      setCheckinDone(true);
    } finally {
      setCheckinLoading(false);
    }
  };

  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const todayIdx = (new Date().getDay() + 6) % 7; // lunes=0

  if (loading) return <LoadingSpinner fullScreen message="Cargando tu dashboard…" />;

  const nombre = toFirstName(user?.nombre, 'Miembro');
  const stats  = data?.workoutStats;
  const weekly = data?.weeklyProgress ?? [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refetch}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      {/* ── Header ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting} accessibilityRole="header">
            Hola, {nombre}
          </Text>
          <Text style={styles.subGreeting}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.checkinBtn}
          onPress={handleCheckin}
          disabled={checkinDone || checkinLoading}
          accessibilityLabel={checkinDone ? 'Asistencia registrada' : 'Registrar asistencia'}
          accessibilityRole="button"
        >
          <Ionicons
            name={checkinDone ? 'checkmark-circle' : 'location-outline'}
            size={22}
            color={checkinDone ? colors.success : colors.accent}
          />
        </TouchableOpacity>
      </View>

      {/* ── Racha banner ── */}
      {!!stats?.streakDays && (
        <View style={styles.streakBanner}>
          <Ionicons name="flame" size={20} color={colors.dataProgreso} />
          <Text style={styles.streakText}>
            ¡Racha de <Text style={{ fontWeight: '800' }}>{stats.streakDays} días</Text>! Sigue así
          </Text>
        </View>
      )}

      {/* ── KPIs ── */}
      <View style={styles.kpiGrid}>
        {/* El `tono` dice qué significa cada cifra; el color lo pone la paleta. */}
        <KPICard
          label="Entrenamientos"
          value={stats?.totalWorkouts ?? 0}
          icon={<Ionicons name="barbell-outline" size={18} color={colors.dataActividad} />}
          tono="actividad"
        />
        <KPICard
          label="Semana actual"
          value={`S${stats?.currentWeek ?? 1}`}
          icon={<Ionicons name="calendar-outline" size={18} color={colors.dataActividad} />}
          tono="actividad"
        />
        <KPICard
          label="Calorías (est.)"
          value={stats?.caloriesBurned ?? 0}
          unit="kcal"
          icon={<Ionicons name="flame-outline" size={18} color={colors.dataProgreso} />}
          tono="progreso"
        />
        <KPICard
          label="Peso actual"
          value={stats?.currentWeight ?? '—'}
          unit="kg"
          icon={<Ionicons name="scale-outline" size={18} color={colors.dataProgreso} />}
          tono="progreso"
        />
      </View>

      {/* ── Membresía ── */}
      {data?.membership && (
        <MembershipCard membership={data.membership} />
      )}

      {/* ── Progreso semanal ── */}
      <Card style={styles.weekCard}>
        <Text style={styles.sectionTitle}>Progreso semanal</Text>
        <View style={styles.weekRow}>
          {dayNames.map((day, i) => {
            const done    = (weekly[i] ?? 0) > 0;
            const isToday = i === todayIdx;
            return (
              <View key={day} style={styles.dayCol}>
                <View
                  style={[
                    styles.dayCircle,
                    done    && styles.dayCirDone,
                    isToday && !done && styles.dayCirToday,
                  ]}
                  accessible
                  accessibilityLabel={`${day}: ${done ? 'completado' : 'pendiente'}`}
                >
                  {done && <Ionicons name="checkmark" size={12} color={colors.onAccent} />}
                </View>
                <Text style={[styles.dayLabel, isToday && { color: colors.accent }]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* ── Rutina de hoy ── */}
      <Card>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            Hoy — {data?.todayWorkout?.type ?? 'Sin rutina'}
          </Text>
          <Ionicons name="barbell-outline" size={18} color={colors.accent} />
        </View>
        {workoutExercises.length === 0 ? (
          <View style={styles.emptyWorkout}>
            <Ionicons name="moon-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>Día de descanso o sin rutina asignada</Text>
          </View>
        ) : (
          <>
            {workoutExercises.map((ex, i) => (
              <WorkoutRow
                key={`${ex.name}-${i}`}
                exercise={ex}
                index={i}
                onToggle={toggleExercise}
              />
            ))}
            <Button
              label={workoutDone ? 'Entrenamiento completado' : 'Marcar entrenamiento completado'}
              variant={workoutDone ? 'secondary' : 'primary'}
              onPress={completeWorkout}
              loading={workoutSaving}
              disabled={workoutDone}
              icon={
                <Ionicons
                  name={workoutDone ? 'checkmark-done' : 'checkmark-circle-outline'}
                  size={18}
                  color={workoutDone ? colors.dataProgreso : colors.onAccent}
                />
              }
              style={{ marginTop: 12 }}
            />
          </>
        )}
      </Card>

      {/* ── Logros recientes ── */}
      {!!data?.achievements?.length && (
        <Card>
          <Text style={styles.sectionTitle}>Logros recientes</Text>
          <View style={styles.achievementList}>
            {data.achievements.map((a, i) => (
              <View key={i} style={styles.achievement} accessible accessibilityLabel={`${a.title}: ${a.description}`}>
                <View style={[styles.achIcon, { backgroundColor: `${a.color}22` }]}>
                  <Ionicons name="trophy-outline" size={18} color={a.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.achTitle}>{a.title}</Text>
                  <Text style={styles.achDesc}>{a.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  topBar: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  greeting:    { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
  subGreeting: { color: colors.textSecondary, fontSize: 13 * fs, marginTop: 2 },
  checkinBtn: {
    width:           44,
    height:          44,
    borderRadius:    14,
    backgroundColor: colors.card,
    borderWidth:     1,
    borderColor:     colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  streakBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius:    14,
    // La racha es progreso acumulado -> tono progreso, no un color decorativo.
    backgroundColor: colors.dataProgresoBg,
    borderWidth:     1,
    borderColor:     colors.dataProgreso,
  },
  streakText: { color: colors.dataProgreso, fontSize: 14 * fs, fontWeight: '600' },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           12,
  },
  weekCard:   {},
  sectionRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   12,
  },
  sectionTitle: {
    color:        colors.text,
    fontSize: 16 * fs,
    fontWeight:   '700',
    marginBottom: 12,
  },
  weekRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  dayCol: { alignItems: 'center', gap: 6 },
  dayCircle: {
    width:           32,
    height:          32,
    borderRadius:    16,
    borderWidth:     2,
    borderColor:     colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  dayCirDone:  { backgroundColor: colors.success, borderColor: colors.success },
  dayCirToday: { borderColor: colors.accent },
  dayLabel: { color: colors.textSecondary, fontSize: 11 * fs },
  emptyWorkout: {
    alignItems:   'center',
    paddingVertical: 24,
    gap:          8,
  },
  emptyText: { color: colors.textMuted, fontSize: 13 * fs },
  achievementList: { gap: 12 },
  achievement: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  achIcon: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  },
  achTitle: { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  achDesc:  { color: colors.textSecondary, fontSize: 12 * fs },
});
}
