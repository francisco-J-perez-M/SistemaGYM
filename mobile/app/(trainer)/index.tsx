/**
 * Dashboard del Entrenador — KPIs, sesiones de hoy, clientes recientes.
 *
 * GET /api/trainer/dashboard → {trainer_name, stats:{total_clients, sessions_today,
 *                               sessions_week, completion_rate}, today_sessions, upcoming_sessions}
 * GET /api/trainer/clients   → {clients:[{id,name,goal,sessionsTotal,attendance,streak,status}],
 *                               pagination}
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { toInitial, toStr, toFirstName, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/admin/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { TrainerDashboard, TrainerClientsResponse, TrainerClientAPI } from '../../types';

export default function TrainerDashboardScreen() {
  const colors = useColors();
  const styles = useMemo(() => make_styles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data,          loading,   refetch } = useFetch<TrainerDashboard>(ENDPOINTS.TRAINER_DASHBOARD);
  const { data: clientsData }                 = useFetch<TrainerClientsResponse>(ENDPOINTS.TRAINER_CLIENTS);

  if (loading) return <LoadingSpinner fullScreen message="Cargando panel…" />;

  // Extraer datos desde la estructura real del API
  const trainerName  = toFirstName(data?.trainer_name ?? user?.nombre, 'Entrenador');
  const totalClients = data?.stats?.total_clients   ?? 0;
  const sessionsToday= data?.stats?.sessions_today  ?? 0;
  const sessionsWeek = data?.stats?.sessions_week   ?? 0;
  const completionRate= data?.stats?.completion_rate ?? 0;
  const clients      = toArray(clientsData?.clients);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting} accessibilityRole="header">Panel de Entrenador</Text>
          <Text style={styles.sub}>Hola, {trainerName}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          accessibilityLabel="Cerrar sesión"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Hero banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroIcon}>
          <Ionicons name="fitness-outline" size={28} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{toStr(data?.trainer_name ?? user?.nombre, 'Entrenador')}</Text>
          <Text style={styles.heroSub}>Entrenador Personal</Text>
        </View>
        <Badge label="Activo" color="success" />
      </View>

      {/* KPIs — campos reales del API */}
      <View style={styles.kpiGrid}>
        <StatCard
          label="Total clientes"
          value={totalClients}
          icon={<Ionicons name="people-outline" size={20} color={colors.accent} />}
          color={colors.accent}
        />
        <StatCard
          label="Sesiones hoy"
          value={sessionsToday}
          icon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />}
          color={colors.success}
        />
        <StatCard
          label="Sesiones / semana"
          value={sessionsWeek}
          icon={<Ionicons name="calendar-outline" size={20} color={colors.warning} />}
          color={colors.warning}
        />
        <StatCard
          label="% Completado"
          value={`${completionRate}%`}
          icon={<Ionicons name="trending-up-outline" size={20} color={colors.info} />}
          color={colors.info}
        />
      </View>

      {/* Clientes recientes — campos reales: id, name, goal, attendance */}
      <Card>
        <Text style={styles.sectionTitle}>Clientes recientes</Text>
        {clients.slice(0, 5).length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No tienes clientes asignados aún.</Text>
          </View>
        ) : (
          clients.slice(0, 5).map((c: TrainerClientAPI) => (
            <View key={c.id} style={styles.clientRow}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientInitial}>{toInitial(c.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{toStr(c.name)}</Text>
                <Text style={styles.clientMeta}>{toStr(c.goal)}</Text>
              </View>
              {c.attendance != null ? (
                <Text style={styles.lastSession}>{c.attendance}% asist.</Text>
              ) : null}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  screen:   { flex: 1, backgroundColor: colors.background },
  content:  { padding: 20, gap: 16, paddingBottom: 32 },
  topBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: colors.text, fontSize: 22, fontWeight: '700' },
  sub:      { color: colors.textSecondary, fontSize: 13 },
  logoutBtn:{ padding: 8 },
  heroBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 16, gap: 12, backgroundColor: colors.heroTop },
  heroIcon: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: 'rgba(108,99,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  heroSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  kpiGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  clientAvatar: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(108,99,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  clientInitial: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  clientName:    { color: colors.text, fontSize: 14, fontWeight: '600' },
  clientMeta:    { color: colors.textSecondary, fontSize: 12 },
  lastSession:   { color: colors.textMuted, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: 13 },
});
}
