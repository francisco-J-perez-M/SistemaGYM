/**
 * Pantalla Pagos (miembro) — historial y resumen.
 * Contrato real: GET /api/user/payments
 *   → { stats: { totalPaid, lastPayment, nextPayment, status }, payments: [...] }
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { PaymentsResponse, PaymentItem } from '../../types';

function methodIcon(method: string): React.ComponentProps<typeof Ionicons>['name'] {
  const m = (method || '').toLowerCase();
  if (m.includes('tarjeta')) return 'card-outline';
  if (m.includes('transfer')) return 'swap-horizontal-outline';
  return 'cash-outline';
}

export default function PaymentsScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data, loading, refetch } = useFetch<PaymentsResponse>(ENDPOINTS.USER_PAYMENTS);

  if (loading) return <LoadingSpinner fullScreen message="Cargando pagos…" />;

  const stats    = data?.stats;
  const payments = toArray<PaymentItem>(data?.payments);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text style={styles.title} accessibilityRole="header">Pagos</Text>

      {/* Resumen */}
      {stats && (
        <>
          <Card elevated>
            <Text style={styles.totalLabel}>Total pagado</Text>
            <Text style={styles.totalValue}>${stats.totalPaid.toLocaleString('es-MX')}</Text>
            <View style={styles.statusRow}>
              <Badge
                label={stats.status}
                color={stats.status === 'Al día' ? 'success' : 'warning'}
              />
            </View>
          </Card>

          <View style={styles.miniRow}>
            <Card style={styles.miniCard} padding={14}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
              <Text style={styles.miniLabel}>Último pago</Text>
              <Text style={styles.miniValue}>{stats.lastPayment}</Text>
            </Card>
            <Card style={styles.miniCard} padding={14}>
              <Ionicons name="calendar-outline" size={18} color={colors.warning} />
              <Text style={styles.miniLabel}>Próximo pago</Text>
              <Text style={styles.miniValue}>{stats.nextPayment}</Text>
            </Card>
          </View>
        </>
      )}

      {/* Historial */}
      <Card>
        <Text style={styles.sectionTitle}>Historial</Text>
        {payments.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aún no tienes pagos registrados.</Text>
          </View>
        ) : (
          payments.map((p) => (
            <View key={p.id} style={styles.payRow}>
              <View style={styles.payIcon}>
                <Ionicons name={methodIcon(p.method)} size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payConcept} numberOfLines={1}>{p.concept}</Text>
                <Text style={styles.payMeta}>{p.date}  ·  {p.method}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.payAmount}>${p.amount.toLocaleString('es-MX')}</Text>
                <Text style={styles.payStatus}>{p.status}</Text>
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
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 16, paddingBottom: 32 },
    title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },

    totalLabel: { color: colors.textSecondary, fontSize: 13 * fs },
    totalValue: { color: colors.text, fontSize: 34 * fs, fontWeight: '800', marginTop: 4 },
    statusRow:  { marginTop: 10 },

    miniRow:   { flexDirection: 'row', gap: 10 },
    miniCard:  { flex: 1, gap: 4 },
    miniLabel: { color: colors.textSecondary, fontSize: 11 * fs, marginTop: 4 },
    miniValue: { color: colors.text, fontSize: 14 * fs, fontWeight: '700' },

    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 12 },
    empty:     { alignItems: 'center', paddingVertical: 24, gap: 10 },
    emptyText: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center' },

    payRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
              borderBottomWidth: 1, borderBottomColor: colors.border },
    payIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.accent + '1A',
               alignItems: 'center', justifyContent: 'center' },
    payConcept: { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
    payMeta:    { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
    payAmount:  { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },
    payStatus:  { color: colors.success, fontSize: 11 * fs, marginTop: 2 },
  });
}
