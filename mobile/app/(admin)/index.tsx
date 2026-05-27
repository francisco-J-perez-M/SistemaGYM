/**
 * Dashboard del Administrador / Owner — KPIs del gimnasio + alertas.
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
import type { AdminKPI, MiembroAdmin } from '../../types';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data: kpis,    loading: loadingK, refetch } = useFetch<AdminKPI>(ENDPOINTS.ADMIN_KPIS);
  const { data: miembros, loading: loadingM }          = useFetch<MiembroAdmin[]>(ENDPOINTS.MIEMBROS);
  const loading = loadingK || loadingM;

  if (loading) return <LoadingSpinner fullScreen message="Cargando panel…" />;

  const nombre     = user?.nombre?.split(' ')[0] ?? 'Admin';
  const porVencer  = (miembros ?? []).filter((m) => m.estado === 'por_vencer').slice(0, 5);
  const recientes  = (miembros ?? []).slice(0, 5);

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
          <Text style={styles.title} accessibilityRole="header">Panel de control</Text>
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
          <Ionicons name="business-outline" size={28} color={Colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>GymPro</Text>
          <Text style={styles.heroSub}>Gestión del gimnasio</Text>
        </View>
        <Badge label={user?.role === 'owner_gym' ? 'Owner' : 'Admin'} color="accent" />
      </LinearGradient>

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        <StatCard
          label="Total miembros"
          value={kpis?.total_miembros ?? 0}
          icon={<Ionicons name="people-outline" size={20} color={Colors.accent} />}
          color={Colors.accent}
        />
        <StatCard
          label="Nuevos este mes"
          value={kpis?.nuevos_mes ?? 0}
          icon={<Ionicons name="person-add-outline" size={20} color={Colors.success} />}
          color={Colors.success}
          trend={kpis?.nuevos_mes ? 12 : undefined}
        />
        <StatCard
          label="Ingresos mes"
          value={kpis?.ingresos_mes ? `$${kpis.ingresos_mes.toLocaleString()}` : '$0'}
          icon={<Ionicons name="cash-outline" size={20} color={Colors.warning} />}
          color={Colors.warning}
        />
        <StatCard
          label="Membresías activas"
          value={kpis?.membresias_activas ?? 0}
          icon={<Ionicons name="card-outline" size={20} color={Colors.info} />}
          color={Colors.info}
        />
        <StatCard
          label="Asistencias hoy"
          value={kpis?.asistencias_hoy ?? 0}
          icon={<Ionicons name="location-outline" size={20} color={Colors.purple} />}
          color={Colors.purple}
        />
        <StatCard
          label="Por vencer"
          value={kpis?.por_vencer ?? 0}
          icon={<Ionicons name="warning-outline" size={20} color={Colors.error} />}
          color={Colors.error}
        />
      </View>

      {/* Membresías por vencer */}
      {porVencer.length > 0 && (
        <Card>
          <View style={styles.alertRow}>
            <Ionicons name="warning-outline" size={18} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Membresías por vencer</Text>
          </View>
          {porVencer.map((m) => (
            <View key={m._id} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>{m.nombre.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.nombre}</Text>
                <Text style={styles.memberEmail}>{m.email}</Text>
              </View>
              <Badge label="Por vencer" color="warning" />
            </View>
          ))}
        </Card>
      )}

      {/* Miembros recientes */}
      <Card>
        <Text style={styles.sectionTitle}>Miembros recientes</Text>
        {recientes.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No hay miembros registrados.</Text>
          </View>
        ) : (
          recientes.map((m) => (
            <View key={m._id} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>{m.nombre.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.nombre}</Text>
                <Text style={styles.memberEmail}>{m.email}</Text>
              </View>
              <Badge
                label={m.estado ?? 'Activo'}
                color={m.estado === 'Activo' ? 'success' : 'warning'}
              />
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
  title:    { color: Colors.text, fontSize: 22, fontWeight: '700' },
  sub:      { color: Colors.textSecondary, fontSize: 13 },
  logoutBtn:{ padding: 8 },
  heroBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 16, gap: 12 },
  heroIcon: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: 'rgba(108,99,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  heroTitle:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  heroSub:    { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  kpiGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  alertRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  memberAvatar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(108,99,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  memberInitial: { color: Colors.accent, fontSize: 15, fontWeight: '700' },
  memberName:    { color: Colors.text, fontSize: 14, fontWeight: '600' },
  memberEmail:   { color: Colors.textSecondary, fontSize: 12 },
  empty:         { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText:     { color: Colors.textMuted, fontSize: 13 },
});
