/**
 * Dashboard del Miembro.
 * Muestra: saludo, racha, KPIs, membresía, rutina de hoy, logros.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { toFirstName } from '../../utils/format';
import { ENDPOINTS } from '../../constants/Api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import KPICard from '../../components/member/KPICard';
import MembershipCard from '../../components/member/MembershipCard';
import WorkoutRow from '../../components/member/WorkoutRow';
import Card from '../../components/ui/Card';
import type { DashboardData, Exercise } from '../../types';
import api from '../../services/api';

export default function MemberDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch<DashboardData>(ENDPOINTS.USER_DASHBOARD);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [checkinDone, setCheckinDone] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const workoutExercises: Exercise[] = exercises.length
    ? exercises
    : (data?.todayWorkout?.exercises ?? []);

  const toggleExercise = (idx: number) => {
    setExercises((prev) => {
      const list = prev.length ? prev : [...workoutExercises];
      return list.map((e, i) => (i === idx ? { ...e, completed: !e.completed } : e));
    });
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
          tintColor={Colors.accent}
          colors={[Colors.accent]}
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
            color={checkinDone ? Colors.success : Colors.accent}
          />
        </TouchableOpacity>
      </View>

      {/* ── Racha banner ── */}
      {!!stats?.streakDays && (
        <View style={styles.streakBanner}>
          <Ionicons name="flame" size={20} color="#fbbf24" />
          <Text style={styles.streakText}>
            ¡Racha de <Text style={{ fontWeight: '800' }}>{stats.streakDays} días</Text>! Sigue así
          </Text>
        </View>
      )}

      {/* ── KPIs ── */}
      <View style={styles.kpiGrid}>
        <KPICard
          label="Entrenamientos"
          value={stats?.totalWorkouts ?? 0}
          icon={<Ionicons name="barbell-outline" size={18} color="#fff" />}
          gradient={['#6c63ff', '#8b5cf6']}
        />
        <KPICard
          label="Semana actual"
          value={`S${stats?.currentWeek ?? 1}`}
          icon={<Ionicons name="calendar-outline" size={18} color="#fff" />}
          gradient={['#3b82f6', '#6366f1']}
        />
        <KPICard
          label="Calorías (est.)"
          value={stats?.caloriesBurned ?? 0}
          unit="kcal"
          icon={<Ionicons name="flame-outline" size={18} color="#fff" />}
          gradient={['#ef4444', '#f59e0b']}
        />
        <KPICard
          label="Peso actual"
          value={stats?.currentWeight ?? '—'}
          unit="kg"
          icon={<Ionicons name="scale-outline" size={18} color="#fff" />}
          gradient={['#10b981', '#06b6d4']}
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
                  {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={[styles.dayLabel, isToday && { color: Colors.accent }]}>
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
          <Ionicons name="barbell-outline" size={18} color={Colors.accent} />
        </View>
        {workoutExercises.length === 0 ? (
          <View style={styles.emptyWorkout}>
            <Ionicons name="moon-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Día de descanso o sin rutina asignada</Text>
          </View>
        ) : (
          workoutExercises.map((ex, i) => (
            <WorkoutRow
              key={`${ex.name}-${i}`}
              exercise={ex}
              index={i}
              onToggle={toggleExercise}
            />
          ))
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

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  topBar: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  greeting:    { color: Colors.text, fontSize: 26, fontWeight: '700' },
  subGreeting: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  checkinBtn: {
    width:           44,
    height:          44,
    borderRadius:    14,
    backgroundColor: Colors.card,
    borderWidth:     1,
    borderColor:     Colors.border,
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
    backgroundColor: '#7c3aed',  // equivale al primer color del gradiente anterior
  },
  streakText: { color: '#fff', fontSize: 14 },
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
    color:        Colors.text,
    fontSize:     16,
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
    borderColor:     Colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  dayCirDone:  { backgroundColor: Colors.success, borderColor: Colors.success },
  dayCirToday: { borderColor: Colors.accent },
  dayLabel: { color: Colors.textSecondary, fontSize: 11 },
  emptyWorkout: {
    alignItems:   'center',
    paddingVertical: 24,
    gap:          8,
  },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
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
  achTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  achDesc:  { color: Colors.textSecondary, fontSize: 12 },
});
