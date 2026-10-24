/**
 * Dashboard del Owner Gym / Admin — KPIs del gimnasio + miembros recientes.
 *
 * Endpoint: GET /api/owner_gym/dashboard
 * Respuesta: OwnerDashboard (estructura anidada con miembros, ingresos, staff)
 *
 * El endpoint /api/miembros devuelve respuesta paginada { miembros: [...], total, pages }
 * Extraemos el array con data?.miembros.
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { toArray, toFirstName, toInitial, toStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/admin/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { OwnerDashboard, MiembrosResponse } from '../../types';

export default function AdminDashboardScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  // Dashboard KPIs — estructura anidada del owner_gym
  const { data: dash, loading: loadingK, refetch } = useFetch<OwnerDashboard>(ENDPOINTS.ADMIN_KPIS);
  // Miembros paginados — extraemos el array del wrapper
  const { data: miembrosData, loading: loadingM } = useFetch<MiembrosResponse>(ENDPOINTS.MIEMBROS);

  const loading = loadingK || loadingM;
  if (loading) return <LoadingSpinner fullScreen message="Cargando panel…" />;

  const nombre    = toFirstName(user?.nombre, 'Admin');
  const miembros  = toArray(miembrosData?.miembros);
  const recientes = miembros.slice(0, 5);

  // KPIs extraídos de la estructura anidada
  const totalMiembros = dash?.miembros?.total ?? 0;
  const nuevosMes     = dash?.miembros?.nuevos_mes ?? 0;
  const porVencer     = dash?.miembros?.por_vencer ?? 0;
  const ingresosMes   = dash?.ingresos?.mes_actual ?? 0;
  const variacion     = dash?.ingresos?.variacion_pct ?? 0;
  const entrenadores  = dash?.staff?.entrenadores ?? 0;

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
          <Text style={styles.title} accessibilityRole="header">Panel de control</Text>
          <Text style={styles.sub}>Hola, {nombre}</Text>
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

      {/* Hero banner (sin LinearGradient — falla en Fabric antes de registrarse) */}
      <View style={styles.heroBanner}>
        <View style={styles.heroIcon}>
          <Ionicons name="business-outline" size={28} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>GymPro</Text>
          <Text style={styles.heroSub}>Gestión del gimnasio</Text>
        </View>
        <Badge label={user?.role === 'owner_gym' ? 'Owner' : 'Admin'} color="accent" />
      </View>

      {/* KPIs — mapeados desde la estructura real de /owner_gym/dashboard */}
      <View style={styles.kpiGrid}>
        <StatCard
          label="Total miembros"
          value={totalMiembros}
          icon={<Ionicons name="people-outline" size={20} color={colors.accent} />}
          color={colors.accent}
        />
        <StatCard
          label="Nuevos este mes"
          value={nuevosMes}
          icon={<Ionicons name="person-add-outline" size={20} color={colors.success} />}
          color={colors.success}
        />
        <StatCard
          label="Ingresos mes"
          value={ingresosMes > 0 ? `$${Math.round(ingresosMes).toLocaleString()}` : '$0'}
          icon={<Ionicons name="cash-outline" size={20} color={colors.warning} />}
          color={colors.warning}
          trend={variacion !== 0 ? variacion : undefined}
        />
        <StatCard
          label="Por vencer"
          value={porVencer}
          icon={<Ionicons name="warning-outline" size={20} color={colors.error} />}
          color={colors.error}
        />
        <StatCard
          label="Entrenadores"
          value={entrenadores}
          icon={<Ionicons name="barbell-outline" size={20} color={colors.info} />}
          color={colors.info}
        />
        <StatCard
          label="Activos"
          value={dash?.miembros?.activos ?? 0}
          icon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.purple} />}
          color={colors.purple}
        />
      </View>

      {/* Miembros recientes */}
      <Card>
        <Text style={styles.sectionTitle}>Miembros recientes</Text>
        {recientes.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay miembros registrados.</Text>
          </View>
        ) : (
          recientes.map((m, i) => (
            <View key={m._id ?? String(i)} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>{toInitial(m.nombre)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{toStr(m.nombre)}</Text>
                <Text style={styles.memberEmail}>{toStr(m.email)}</Text>
              </View>
              <Badge
                label={toStr(m.estado, 'Activo')}
                color={m.estado === 'Activo' ? 'success' : 'warning'}
              />
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
  content:  { padding: 20, gap: 16, paddingBottom: 32 },
  topBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:    { color: colors.text, fontSize: 22 * fs, fontWeight: '700' },
  sub:      { color: colors.textSecondary, fontSize: 13 * fs },
  logoutBtn:{ padding: 8 },
  heroBanner: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 18,
    padding: 16, gap: 12, backgroundColor: colors.heroTop,
  },
  heroIcon: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: 'rgba(108,99,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  heroTitle:    { color: '#fff', fontSize: 16 * fs, fontWeight: '700' },
  heroSub:      { color: 'rgba(255,255,255,0.6)', fontSize: 12 * fs },
  kpiGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 16 * fs, fontWeight: '700', marginBottom: 12 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  memberAvatar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(108,99,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  memberInitial: { color: colors.accent, fontSize: 15 * fs, fontWeight: '700' },
  memberName:    { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  memberEmail:   { color: colors.textSecondary, fontSize: 12 * fs },
  empty:         { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText:     { color: colors.textMuted, fontSize: 13 * fs },
});
}
