/**
 * Pagos / Movimientos — Owner Gym.
 *
 * Feed unificado de membresías y ventas del punto de venta.
 *   GET /api/pagos/todos?tipo=todos|membresia|venta&anio=&mes=&page=&per_page=
 *   → { movimientos, total, pages, page, per_page, monto_total, anios }
 *
 * El importe que se muestra es `monto_total`, que el backend calcula sobre TODO
 * el filtro. Antes se sumaba en el cliente la página visible, así que el rótulo
 * "Monto en esta vista" enseñaba una cifra parcial que no cuadraba con nada.
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
import SelectorPeriodo, { etiquetaPeriodo } from '../../components/ui/SelectorPeriodo';
import Paginador from '../../components/ui/Paginador';
import type { MovimientosResponse, Movimiento } from '../../types';

type Filtro = 'todos' | 'membresia' | 'venta';

const TIPOS: [Filtro, string][] = [
  ['todos',     'Todos'],
  ['membresia', 'Membresías'],
  ['venta',     'Ventas POS'],
];

export default function AdminPaymentsScreen() {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [anio,   setAnio]   = useState(0);   // 0 = histórico completo
  const [mes,    setMes]    = useState(0);   // 0 = año completo
  const [pagina, setPagina] = useState(1);

  const consulta =
    `${ENDPOINTS.PAGOS_TODOS}?tipo=${filtro}&page=${pagina}&per_page=10` +
    (anio ? `&anio=${anio}` : '') +
    (anio && mes ? `&mes=${mes}` : '');

  const { data, loading, refetch } = useFetch<MovimientosResponse>(consulta);

  const movimientos = toArray<Movimiento>(data?.movimientos);
  const montoTotal  = data?.monto_total ?? 0;
  const anios       = toArray<number>(data?.anios);

  /** Cualquier cambio de filtro vuelve a la primera página. */
  const cambiarTipo = (t: Filtro) => { setFiltro(t); setPagina(1); };
  const cambiarPeriodo = (a: number, m: number) => { setAnio(a); setMes(m); setPagina(1); };

  const isVenta = (t: string) => t === 'venta';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Movimientos</Text>
        <Text style={styles.sub}>
          {data?.total ?? movimientos.length} en {etiquetaPeriodo(anio, mes).toLowerCase()}
        </Text>
      </View>

      {/* Tipo de movimiento */}
      <View style={styles.tabRow}>
        {TIPOS.map(([t, label]) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, filtro === t && styles.tabBtnActive]}
            onPress={() => cambiarTipo(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: filtro === t }}
          >
            <Text style={[styles.tabLabel, filtro === t && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Periodo */}
      <SelectorPeriodo anio={anio} mes={mes} anios={anios} onChange={cambiarPeriodo} />

      {/* Importe del filtro completo */}
      <View style={styles.totalBanner}>
        <View style={styles.totalIcon}>
          <Ionicons name="cash-outline" size={22} color={colors.dataProgreso} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.totalLabel}>
            {filtro === 'todos' ? 'Total' : filtro === 'venta' ? 'Total en ventas' : 'Total en membresías'}
            {' · '}{etiquetaPeriodo(anio, mes)}
          </Text>
          <Text style={styles.totalValue}>
            ${Math.round(montoTotal).toLocaleString('es-MX')}
          </Text>
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
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {anio
                  ? `Sin movimientos en ${etiquetaPeriodo(anio, mes)}.`
                  : 'No hay movimientos registrados.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            <Paginador
              pagina={data?.page ?? pagina}
              paginas={data?.pages ?? 0}
              total={data?.total}
              etiquetaTotal="movimientos"
              onCambio={setPagina}
            />
          }
          renderItem={({ item: m }) => (
            <View style={styles.card}>
              <View style={[
                styles.icon,
                { backgroundColor: isVenta(m.tipo) ? colors.accentBg : colors.dataAtencionBg },
              ]}>
                <Ionicons
                  name={isVenta(m.tipo) ? 'cart-outline' : 'card-outline'}
                  size={18}
                  color={isVenta(m.tipo) ? colors.accent : colors.dataAtencion}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.nombre} numberOfLines={1}>{toStr(m.titulo, '—')}</Text>
                  <Badge
                    label={isVenta(m.tipo) ? 'POS' : 'Membresía'}
                    color={isVenta(m.tipo) ? 'accent' : 'warning'}
                  />
                </View>
                <Text style={styles.concepto} numberOfLines={1}>{toStr(m.concepto)}</Text>
                <Text style={styles.fecha}>
                  {toDateStr(m.fecha)}{m.metodo_pago ? `  ·  ${m.metodo_pago}` : ''}
                  {m.categoria ? `  ·  ${m.categoria}` : ''}
                </Text>
              </View>
              <Text style={styles.monto}>
                ${Math.round(m.monto ?? 0).toLocaleString('es-MX')}
              </Text>
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

    tabRow:  { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10,
               backgroundColor: colors.card, borderRadius: 12, padding: 4,
               borderWidth: 1, borderColor: colors.border },
    tabBtn:  { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
    tabBtnActive:  { backgroundColor: colors.accentBg },
    tabLabel:      { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
    tabLabelActive:{ color: colors.accent },

    totalBanner: { flexDirection: 'row', alignItems: 'center', gap: 14,
                   marginHorizontal: 20, marginBottom: 10,
                   backgroundColor: colors.card, borderRadius: 16, padding: 16,
                   borderWidth: 1, borderColor: colors.border },
    totalIcon: { width: 44, height: 44, borderRadius: 14,
                 backgroundColor: colors.dataProgresoBg,
                 alignItems: 'center', justifyContent: 'center' },
    totalLabel: { color: colors.textSecondary, fontSize: 12 * fs },
    totalValue: { color: colors.text, fontSize: 24 * fs, fontWeight: '800',
                  letterSpacing: -0.5 },

    list:    { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
    empty:   { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: colors.textMuted, fontSize: 14 * fs, textAlign: 'center' },

    card: { flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: colors.card, borderRadius: 14, padding: 14,
            borderWidth: 1, borderColor: colors.border },
    icon: { width: 40, height: 40, borderRadius: 12,
            alignItems: 'center', justifyContent: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8,
               justifyContent: 'space-between' },
    nombre:  { color: colors.text, fontSize: 14 * fs, fontWeight: '600', flex: 1 },
    concepto:{ color: colors.textSecondary, fontSize: 12 * fs, marginTop: 1 },
    fecha:   { color: colors.textMuted, fontSize: 11 * fs, marginTop: 1 },
    monto:   { color: colors.dataAtencion, fontSize: 16 * fs, fontWeight: '800' },
  });
}
