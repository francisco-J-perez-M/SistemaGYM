/**
 * Pagos / Movimientos — Owner Gym.
 * Feed unificado de membresías + ventas POS.
 * Contrato real: GET /api/pagos/todos?tipo=todos|membresia|venta&page=N
 *   → { movimientos: [{ id, tipo, titulo, monto, metodo_pago, concepto, fecha, categoria }], total, pages, page }
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toDateStr, toStr, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import type { MovimientosResponse, Movimiento } from '../../types';

type Filtro = 'todos' | 'membresia' | 'venta';

export default function AdminPaymentsScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const [filtro, setFiltro] = useState<Filtro>('todos');
  const { data, loading, refetch } =
    useFetch<MovimientosResponse>(`${ENDPOINTS.PAGOS_TODOS}?tipo=${filtro}&page=1`);

  const movimientos = toArray<Movimiento>(data?.movimientos);
  const totalMonto  = movimientos.reduce((s, m) => s + (m.monto ?? 0), 0);

  const isVenta = (t: string) => t === 'venta';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Movimientos</Text>
        <Text style={styles.sub}>{data?.total ?? movimientos.length} en total</Text>
      </View>

      {/* Filtro por tipo */}
      <View style={styles.tabRow}>
        {([['todos', 'Todos'], ['membresia', 'Membresías'], ['venta', 'Ventas POS']] as const).map(([t, label]) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, filtro === t && styles.tabBtnActive]}
            onPress={() => setFiltro(t)} accessibilityRole="tab" accessibilityState={{ selected: filtro === t }}>
            <Text style={[styles.tabLabel, filtro === t && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total banner (página actual) */}
      <View style={styles.totalBanner}>
        <View style={styles.totalIcon}>
          <Ionicons name="cash-outline" size={22} color={colors.warning} />
        </View>
        <View>
          <Text style={styles.totalLabel}>Monto en esta vista</Text>
          <Text style={styles.totalValue}>${Math.round(totalMonto).toLocaleString('es-MX')}</Text>
        </View>
      </View>

      {loading && movimientos.length === 0 ? (
        <LoadingSpinner fullScreen message="Cargando movimientos…" />
      ) : (
        <FlatList
          data={movimientos}
          keyExtractor={(m, i) => m.id ?? String(i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay movimientos registrados.</Text>
            </View>
          }
          renderItem={({ item: m }) => (
            <View style={styles.card}>
              <View style={[styles.icon, { backgroundColor: (isVenta(m.tipo) ? colors.accent : colors.warning) + '1A' }]}>
                <Ionicons
                  name={isVenta(m.tipo) ? 'cart-outline' : 'card-outline'}
                  size={18}
                  color={isVenta(m.tipo) ? colors.accent : colors.warning}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.nombre} numberOfLines={1}>{toStr(m.titulo, '—')}</Text>
                  <Badge label={isVenta(m.tipo) ? 'POS' : 'Membresía'} color={isVenta(m.tipo) ? 'accent' : 'warning'} />
                </View>
                <Text style={styles.concepto} numberOfLines={1}>{toStr(m.concepto)}</Text>
                <Text style={styles.fecha}>
                  {toDateStr(m.fecha)}{m.metodo_pago ? `  ·  ${m.metodo_pago}` : ''}
                  {m.categoria ? `  ·  ${m.categoria}` : ''}
                </Text>
              </View>
              <Text style={styles.monto}>${Math.round(m.monto ?? 0).toLocaleString('es-MX')}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    header:  { paddingHorizontal: 20, gap: 4, paddingBottom: 12 },
    title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
    sub:     { color: colors.textSecondary, fontSize: 13 * fs },
    tabRow:  { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, backgroundColor: colors.card,
               borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border },
    tabBtn:  { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
    tabBtnActive:  { backgroundColor: colors.accentBg },
    tabLabel:      { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
    tabLabelActive:{ color: colors.accent },
    totalBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 20, marginBottom: 10,
                   backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
    totalIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.warningBg,
                 alignItems: 'center', justifyContent: 'center' },
    totalLabel: { color: colors.textSecondary, fontSize: 12 * fs },
    totalValue: { color: colors.text, fontSize: 24 * fs, fontWeight: '800' },
    list:    { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
    empty:   { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: colors.textMuted, fontSize: 14 * fs },
    card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
            borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
    icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
    nombre:  { color: colors.text, fontSize: 14 * fs, fontWeight: '600', flex: 1 },
    concepto:{ color: colors.textSecondary, fontSize: 12 * fs, marginTop: 1 },
    fecha:   { color: colors.textMuted, fontSize: 11 * fs, marginTop: 1 },
    monto:   { color: colors.warning, fontSize: 16 * fs, fontWeight: '800' },
  });
}
