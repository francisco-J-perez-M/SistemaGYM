/**
 * Pantalla Cobros — lista de pagos del gimnasio.
 *
 * API: GET /api/pagos → { pagos: [...], total: N, pages: N, page: N }
 * Campos reales de cada pago: nombre_miembro, fecha_pago, metodo_pago (no miembro_nombre/fecha)
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toDateStr, toStr, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { PagosResponse, PagoAPI } from '../../types';

export default function AdminPaymentsScreen() {
  const insets = useSafeAreaInsets();
  // API devuelve { pagos: [...], total: N, pages: N, page: N }
  const { data, loading, refetch } = useFetch<PagosResponse>(ENDPOINTS.PAGOS);

  const pagos = toArray(data?.pagos);
  const total = pagos.reduce((sum, p) => sum + (p.monto ?? 0), 0);

  if (loading) return <LoadingSpinner fullScreen message="Cargando cobros…" />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Cobros</Text>
        <Text style={styles.sub}>{data?.total ?? pagos.length} registros</Text>
      </View>

      {/* Total banner */}
      <View style={styles.totalBanner} accessible accessibilityLabel={`Total recaudado: $${total.toLocaleString()}`}>
        <View style={styles.totalIcon}>
          <Ionicons name="cash-outline" size={22} color={Colors.warning} />
        </View>
        <View>
          <Text style={styles.totalLabel}>Total recaudado</Text>
          <Text style={styles.totalValue}>${Math.round(total).toLocaleString()}</Text>
        </View>
      </View>

      <FlatList
        data={pagos}
        keyExtractor={(p, i) => p.id_pago ?? String(i)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cash-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No hay cobros registrados.</Text>
          </View>
        }
        renderItem={({ item: p }: { item: PagoAPI }) => (
          <View style={styles.pagoCard} accessible accessibilityLabel={`Pago de ${p.nombre_miembro}: $${p.monto}`}>
            <View style={styles.pagoIcon}>
              <Ionicons name="receipt-outline" size={18} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              {/* Campos reales: nombre_miembro, fecha_pago, metodo_pago */}
              <Text style={styles.pagoNombre}>{toStr(p.nombre_miembro)}</Text>
              <Text style={styles.pagoConcepto}>{toStr(p.concepto)}</Text>
              <Text style={styles.pagoFecha}>
                {toDateStr(p.fecha_pago)}{p.metodo_pago ? `  ·  ${p.metodo_pago}` : ''}
              </Text>
            </View>
            <Text style={styles.pagoMonto}>${p.monto}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.background },
  header:  { paddingHorizontal: 20, gap: 4, paddingBottom: 12 },
  title:   { color: Colors.text, fontSize: 26, fontWeight: '700' },
  sub:     { color: Colors.textSecondary, fontSize: 13 },
  totalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  totalIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.warningBg, alignItems: 'center', justifyContent: 'center',
  },
  totalLabel: { color: Colors.textSecondary, fontSize: 12 },
  totalValue: { color: Colors.text, fontSize: 24, fontWeight: '800' },
  list:    { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  empty:   { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  pagoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  pagoIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.warningBg, alignItems: 'center', justifyContent: 'center',
  },
  pagoNombre:  { color: Colors.text, fontSize: 14, fontWeight: '600' },
  pagoConcepto:{ color: Colors.textSecondary, fontSize: 12 },
  pagoFecha:   { color: Colors.textMuted, fontSize: 11 },
  pagoMonto:   { color: Colors.warning, fontSize: 18, fontWeight: '700' },
});
