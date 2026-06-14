/**
 * Dashboard Recepcionista — KPIs del día.
 * Contrato real: GET /api/recepcionista/dashboard
 *   → { today_checkins, active_members, pending_payments, expiring_soon, today_citas }
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { useAuth } from '../../hooks/useAuth';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toFirstName } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import type { ReceptionistDashboard } from '../../types';

export default function ReceptionistDashboardScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data, loading, refetch } = useFetch<ReceptionistDashboard>(ENDPOINTS.RECEP_DASHBOARD);

  if (loading) return <LoadingSpinner fullScreen message="Cargando…" />;

  const kpis: { label: string; value: number; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }[] = [
    { label: 'Check-ins hoy',    value: data?.today_checkins ?? 0,   icon: 'log-in-outline',    color: colors.accent  },
    { label: 'Miembros activos', value: data?.active_members ?? 0,   icon: 'people-outline',    color: colors.success },
    { label: 'Pagos pendientes', value: data?.pending_payments ?? 0, icon: 'cash-outline',      color: colors.warning },
    { label: 'Por vencer',       value: data?.expiring_soon ?? 0,    icon: 'alert-circle-outline', color: colors.error },
    { label: 'Citas hoy',        value: data?.today_citas ?? 0,      icon: 'calendar-outline',  color: colors.info    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text style={styles.greeting} accessibilityRole="header">Hola, {toFirstName(user?.nombre, 'Recepción')}</Text>
      <Text style={styles.subGreeting}>
        {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>

      <View style={styles.grid}>
        {kpis.map((k) => (
          <Card key={k.label} style={styles.kpiCard} padding={16}>
            <View style={[styles.kpiIcon, { backgroundColor: k.color + '1A' }]}>
              <Ionicons name={k.icon} size={20} color={k.color} />
            </View>
            <Text style={styles.kpiValue}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </Card>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(receptionist)/checkins')}
        accessibilityRole="button" accessibilityLabel="Registrar check-in">
        <View style={[styles.actionIcon, { backgroundColor: colors.accent + '1A' }]}>
          <Ionicons name="log-in-outline" size={20} color={colors.accent} />
        </View>
        <Text style={styles.actionText}>Registrar check-in</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(receptionist)/members')}
        accessibilityRole="button" accessibilityLabel="Buscar miembros">
        <View style={[styles.actionIcon, { backgroundColor: colors.success + '1A' }]}>
          <Ionicons name="people-outline" size={20} color={colors.success} />
        </View>
        <Text style={styles.actionText}>Buscar miembros</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 12, paddingBottom: 32 },
    greeting:    { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
    subGreeting: { color: colors.textSecondary, fontSize: 13 * fs, marginTop: 2, textTransform: 'capitalize' },
    grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
    kpiCard: { width: '47%', gap: 6 },
    kpiIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    kpiValue:{ color: colors.text, fontSize: 26 * fs, fontWeight: '800', marginTop: 4 },
    kpiLabel:{ color: colors.textSecondary, fontSize: 12 * fs },
    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginTop: 12, marginBottom: 4 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
                 borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16 },
    actionIcon:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    actionText:{ color: colors.text, fontSize: 14 * fs, fontWeight: '600', flex: 1 },
  });
}
