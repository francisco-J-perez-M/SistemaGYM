/**
 * Pantalla Pagos (miembro) — historial y resumen.
 *
 * Contrato: GET /api/user/payments
 *   → { stats: { totalPaid, totalMembresias, totalCompras, lastPayment,
 *                nextPayment, status },
 *       payments: [{ id, date, concept, amount, method, status, type, items? }] }
 *
 * El historial mezcla dos orígenes y `type` los distingue: 'membresia' son los
 * pagos del plan y 'producto' las compras del punto de venta. Se muestran
 * juntos porque para el miembro es un solo gasto en el gimnasio, pero cada uno
 * lleva su etiqueta para que no se confundan.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
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

type Filtro = 'todos' | 'membresia' | 'producto';

function methodIcon(method: string): React.ComponentProps<typeof Ionicons>['name'] {
  const m = (method || '').toLowerCase();
  if (m.includes('paypal'))   return 'logo-paypal';
  if (m.includes('mercado'))  return 'wallet-outline';
  if (m.includes('tarjeta'))  return 'card-outline';
  if (m.includes('transfer')) return 'swap-horizontal-outline';
  return 'cash-outline';
}

export default function PaymentsScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data, loading, refetch } = useFetch<PaymentsResponse>(ENDPOINTS.USER_PAYMENTS);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  if (loading) return <LoadingSpinner fullScreen message="Cargando pagos…" />;

  const stats    = data?.stats;
  const todos    = toArray<PaymentItem>(data?.payments);
  const payments = filtro === 'todos' ? todos : todos.filter((p) => p.type === filtro);

  const hayCompras = todos.some((p) => p.type === 'producto');

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

            {/* Desglose: aclara de dónde sale el total */}
            {(stats.totalCompras ?? 0) > 0 && (
              <View style={styles.desglose}>
                <View style={styles.desgloseItem}>
                  <View style={[styles.desglosePunto, { backgroundColor: colors.dataProgreso }]} />
                  <Text style={styles.desgloseText}>
                    Membresías ${Number(stats.totalMembresias ?? 0).toLocaleString('es-MX')}
                  </Text>
                </View>
                <View style={styles.desgloseItem}>
                  <View style={[styles.desglosePunto, { backgroundColor: colors.dataActividad }]} />
                  <Text style={styles.desgloseText}>
                    Compras ${Number(stats.totalCompras ?? 0).toLocaleString('es-MX')}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.statusRow}>
              <Badge
                label={stats.status}
                color={stats.status === 'Al día' ? 'success' : 'warning'}
              />
            </View>
          </Card>

          <View style={styles.miniRow}>
            <Card style={styles.miniCard} padding={14}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.dataProgreso} />
              <Text style={styles.miniLabel}>Último pago</Text>
              <Text style={styles.miniValue}>{stats.lastPayment}</Text>
            </Card>
            <Card style={styles.miniCard} padding={14}>
              <Ionicons name="calendar-outline" size={18} color={colors.dataAtencion} />
              <Text style={styles.miniLabel}>Próximo pago</Text>
              <Text style={styles.miniValue}>{stats.nextPayment}</Text>
            </Card>
          </View>
        </>
      )}

      {/* Historial */}
      <Card>
        <Text style={styles.sectionTitle}>Historial</Text>

        {/* El filtro solo aparece si hay algo que separar */}
        {hayCompras && (
          <View style={styles.filtros}>
            {([
              { id: 'todos',      etiqueta: 'Todo'        },
              { id: 'membresia',  etiqueta: 'Membresías'  },
              { id: 'producto',   etiqueta: 'Compras'     },
            ] as { id: Filtro; etiqueta: string }[]).map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filtroChip, filtro === f.id && styles.filtroActivo]}
                onPress={() => setFiltro(f.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: filtro === f.id }}
                accessibilityLabel={`Ver ${f.etiqueta}`}
              >
                <Text style={[styles.filtroText, filtro === f.id && styles.filtroTextActivo]}>
                  {f.etiqueta}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {payments.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {filtro === 'producto'  ? 'Aún no has comprado nada en el gimnasio.'
               : filtro === 'membresia' ? 'Aún no tienes pagos de membresía.'
               : 'Aún no tienes pagos registrados.'}
            </Text>
          </View>
        ) : (
          payments.map((p) => {
            const esCompra = p.type === 'producto';
            return (
              <View key={p.id} style={styles.payRow}>
                <View style={[
                  styles.payIcon,
                  { backgroundColor: esCompra ? colors.dataActividadBg : colors.dataProgresoBg },
                ]}>
                  <Ionicons
                    name={methodIcon(p.method)}
                    size={18}
                    color={esCompra ? colors.dataActividad : colors.dataProgreso}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.conceptoRow}>
                    <Text style={styles.payConcept} numberOfLines={1}>{p.concept}</Text>
                    <View style={[
                      styles.tipoPill,
                      { backgroundColor: esCompra ? colors.dataActividadBg : colors.dataProgresoBg },
                    ]}>
                      <Text style={[
                        styles.tipoText,
                        { color: esCompra ? colors.dataActividad : colors.dataProgreso },
                      ]}>
                        {esCompra ? 'Compra' : 'Membresía'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.payMeta}>
                    {p.date}  ·  {p.method}
                    {esCompra && p.items ? `  ·  ${p.items} art.` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.payAmount}>${p.amount.toLocaleString('es-MX')}</Text>
                  <Text style={styles.payStatus}>{p.status}</Text>
                </View>
              </View>
            );
          })
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
    totalValue: { color: colors.text, fontSize: 34 * fs, fontWeight: '800', marginTop: 4,
                  letterSpacing: -1 },
    statusRow:  { marginTop: 10 },

    desglose:      { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 },
    desgloseItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
    desglosePunto: { width: 7, height: 7, borderRadius: 4 },
    desgloseText:  { color: colors.textSecondary, fontSize: 12 * fs },

    filtros:    { flexDirection: 'row', gap: 8, marginBottom: 14 },
    filtroChip: {
      paddingHorizontal: 13, paddingVertical: 6, borderRadius: 20,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    filtroActivo:     { backgroundColor: colors.accentBg, borderColor: colors.accent },
    filtroText:       { color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '600' },
    filtroTextActivo: { color: colors.accent, fontWeight: '700' },

    conceptoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    tipoPill:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    tipoText:    { fontSize: 10 * fs, fontWeight: '700' },

    miniRow:   { flexDirection: 'row', gap: 10 },
    miniCard:  { flex: 1, gap: 4 },
    miniLabel: { color: colors.textSecondary, fontSize: 11 * fs, marginTop: 4 },
    miniValue: { color: colors.text, fontSize: 14 * fs, fontWeight: '700' },

    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 12 },
    empty:     { alignItems: 'center', paddingVertical: 24, gap: 10 },
    emptyText: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center' },

    payRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
              borderBottomWidth: 1, borderBottomColor: colors.border },
    // El fondo del icono lo pone el tipo de pago (membresía o compra).
    payIcon: { width: 38, height: 38, borderRadius: 12,
               alignItems: 'center', justifyContent: 'center' },
    payConcept: { color: colors.text, fontSize: 14 * fs, fontWeight: '600', flexShrink: 1 },
    payMeta:    { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
    payAmount:  { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },
    payStatus:  { color: colors.dataProgreso, fontSize: 11 * fs, marginTop: 2 },
  });
}
