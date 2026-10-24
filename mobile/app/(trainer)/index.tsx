/**
 * Dashboard del Entrenador — KPIs, clientes de hoy, sesiones próximas.
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/admin/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { TrainerDashboard, TrainerClient } from '../../types';

export default function TrainerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data,    loading,   refetch   } = useFetch<TrainerDashboard>(ENDPOINTS.TRAINER_DASHBOARD);
  const { data: clients } = useFetch<TrainerClient[]>(ENDPOINTS.TRAINER_CLIENTS);

  if (loading) return <LoadingSpinner fullScreen message="Cargando panel…" />;

  const nombre = user?.nombre?.split(' ')[0] ?? 'Entrenador';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
    >
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting} accessibilityRole="header">Panel de Entrenador</Text>
          <Text style={styles.sub}>Hola, {nombre}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          accessibilityLabel="Cerrar sesión"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Hero banner */}
      <LinearGradient colors={['#1e1b4b', '#312e81']} style={styles.heroBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.heroIcon}>
          <Ionicons name="fitness-outline" size={28} color={Colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{data?.trainer?.nombre ?? user?.nombre ?? 'Entrenador'}</Text>
          <Text style={styles.heroSub}>{data?.trainer?.especialidad ?? 'Entrenador personal'}</Text>
        </View>
        <Badge label="Activo" color="success" />
      </LinearGradient>

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        <StatCard
          label="Total clientes"
          value={data?.total_clients ?? 0}
          icon={<Ionicons name="people-outline" size={20} color={Colors.accent} />}
          color={Colors.accent}
        />
        <StatCard
          label="Activos hoy"
          value={data?.active_today ?? 0}
          icon={<Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />}
          color={Colors.success}
        />
        <StatCard
          label="Sesiones / semana"
          value={data?.sessions_week ?? 0}
          icon={<Ionicons name="calendar-outline" size={20} color={Colors.warning} />}
          color={Colors.warning}
        />
        <StatCard
          label="Tareas pendientes"
          value={data?.pending_tasks ?? 0}
          icon={<Ionicons name="list-outline" size={20} color={Colors.error} />}
          color={Colors.error}
        />
      </View>

      {/* Recent clients */}
      <Card>
        <Text style={styles.sectionTitle}>Clientes recientes</Text>
        {(clients ?? []).slice(0, 5).length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No tienes clientes asignados aún.</Text>
          </View>
        ) : (
          (clients ?? []).slice(0, 5).map((c) => (
            <View key={c._id} style={styles.clientRow}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientInitial}>
                  {c.nombre.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{c.nombre}</Text>
                <Text style={styles.clientMeta}>{c.objetivo ?? c.email}</Text>
              </View>
              {c.ultima_sesion && (
                <Text style={styles.lastSession}>
                  Última: {c.ultima_sesion.slice(0, 10)}
                </Text>
              )}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.background },
  content:  { padding: 20, gap: 16, paddingBottom: 32 },
  topBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  sub:      { color: Colors.textSecondary, fontSize: 13 },
  logoutBtn:{ padding: 8 },
  heroBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 16, gap: 12 },
  heroIcon: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: 'rgba(108,99,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  heroSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  kpiGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  clientAvatar: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(108,99,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  clientInitial: { color: Colors.accent, fontSize: 16, fontWeight: '700' },
  clientName:    { color: Colors.text, fontSize: 14, fontWeight: '600' },
  clientMeta:    { color: Colors.textSecondary, fontSize: 12 },
  lastSession:   { color: Colors.textMuted, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
});
