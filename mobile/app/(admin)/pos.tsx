/**
 * Punto de Venta — Owner Gym
 * Productos disponibles + historial de ventas del gimnasio.
 * GET /api/owner_gym/productos  → lista de productos
 * GET /api/ventas               → historial de ventas (paginado)
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray, toDateStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

type Tab = 'productos' | 'ventas';

interface Producto {
  _id: string;
  nombre: string;
  precio: number;
  stock?: number;
  categoria?: string;
  activo?: boolean;
}

interface VentaItem {
  _id?: string;
  nombre_miembro?: string;
  total?: number;
  fecha?: string;
  items?: { nombre: string; cantidad: number; precio_unitario: number }[];
}

interface VentasResponse {
  ventas?: VentaItem[];
  total?: number;
}

interface ProductosResponse {
  productos?: Producto[];
  total?: number;
}

export default function POSScreen() {
  const colors = useColors();
  const styles = useMemo(() => make_styles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('productos');

  const { data: prodData, loading: loadingP, refetch: refetchP } =
    useFetch<ProductosResponse>(ENDPOINTS.OWNER_PRODUCTOS);

  const { data: ventasData, loading: loadingV, refetch: refetchV } =
    useFetch<VentasResponse>(ENDPOINTS.OWNER_VENTAS);

  const loading   = tab === 'productos' ? loadingP : loadingV;
  const productos = toArray(prodData?.productos ?? (Array.isArray(prodData) ? prodData : []));
  const ventas    = toArray(ventasData?.ventas   ?? (Array.isArray(ventasData) ? ventasData : []));

  const handleRefresh = () => { tab === 'productos' ? refetchP() : refetchV(); };

  if (loading) return <LoadingSpinner fullScreen message="Cargando…" />;

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      {/* Selector de tab */}
      <View style={styles.tabBar}>
        {(['productos', 'ventas'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
          >
            <Ionicons
              name={t === 'productos' ? 'cube-outline' : 'receipt-outline'}
              size={16}
              color={tab === t ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'productos' ? 'Productos' : 'Historial Ventas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Productos */}
      {tab === 'productos' && (
        <FlatList
          data={productos}
          keyExtractor={(p, i) => p._id ?? String(i)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={loadingP} onRefresh={refetchP} tintColor={colors.accent} />}
          ListEmptyComponent={<EmptyState icon="cube-outline" msg="No hay productos registrados." />}
          renderItem={({ item: p }) => (
            <View style={styles.productCard} accessible accessibilityLabel={`${p.nombre}, $${p.precio}`}>
              <View style={styles.productIconBox}>
                <Ionicons name="cube-outline" size={28} color={colors.accent} />
              </View>
              <Text style={styles.productName} numberOfLines={2}>{toStr(p.nombre)}</Text>
              <Text style={styles.productPrice}>${p.precio}</Text>
              <View style={styles.productFooter}>
                {p.stock != null && (
                  <Text style={styles.productStock}>Stock: {p.stock}</Text>
                )}
                <Badge
                  label={p.activo !== false ? 'Activo' : 'Inactivo'}
                  color={p.activo !== false ? 'success' : 'error'}
                />
              </View>
            </View>
          )}
        />
      )}

      {/* Historial de ventas */}
      {tab === 'ventas' && (
        <FlatList
          data={ventas}
          keyExtractor={(v, i) => v._id ?? String(i)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loadingV} onRefresh={refetchV} tintColor={colors.accent} />}
          ListHeaderComponent={
            <Card style={{ marginBottom: 12 }} padding={14}>
              <Text style={styles.totalLabel}>Total ventas</Text>
              <Text style={styles.totalValue}>{ventasData?.total ?? ventas.length} transacciones</Text>
            </Card>
          }
          ListEmptyComponent={<EmptyState icon="receipt-outline" msg="No hay ventas registradas." />}
          renderItem={({ item: v }) => (
            <View style={styles.ventaCard} accessible>
              <View style={styles.ventaIconBox}>
                <Ionicons name="receipt-outline" size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ventaCliente}>{toStr(v.nombre_miembro, 'Cliente general')}</Text>
                <Text style={styles.ventaFecha}>{toDateStr(v.fecha)}</Text>
                {toArray(v.items).slice(0, 2).map((it, i) => (
                  <Text key={i} style={styles.ventaItem}>· {it.nombre} ×{it.cantidad}</Text>
                ))}
              </View>
              <Text style={styles.ventaTotal}>${v.total ?? 0}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function EmptyState({ icon, msg }: { icon: string; msg: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon as any} size={44} color={colors.textMuted} />
      <Text style={styles.emptyText}>{msg}</Text>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  screen:     { flex: 1, backgroundColor: colors.background },
  tabBar:     { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  tabBtnActive:  { backgroundColor: 'rgba(108,99,255,0.15)', borderColor: colors.accent },
  tabLabel:      { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabLabelActive:{ color: colors.accent },
  grid:   { padding: 16, gap: 12 },
  list:   { padding: 16, gap: 10, paddingBottom: 32 },
  productCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 16,
    padding: 14, gap: 6, borderWidth: 1, borderColor: colors.border,
  },
  productIconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  productName:    { color: colors.text, fontSize: 14, fontWeight: '600' },
  productPrice:   { color: colors.accent, fontSize: 18, fontWeight: '800' },
  productFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  productStock:   { color: colors.textMuted, fontSize: 11 },
  ventaCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  ventaIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.warningBg,
    alignItems: 'center', justifyContent: 'center',
  },
  ventaCliente: { color: colors.text, fontSize: 14, fontWeight: '600' },
  ventaFecha:   { color: colors.textMuted, fontSize: 11, marginBottom: 2 },
  ventaItem:    { color: colors.textSecondary, fontSize: 12 },
  ventaTotal:   { color: colors.warning, fontSize: 18, fontWeight: '800', marginLeft: 'auto' },
  totalLabel:   { color: colors.textSecondary, fontSize: 12 },
  totalValue:   { color: colors.text, fontSize: 20, fontWeight: '700' },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { color: colors.textMuted, fontSize: 14 },
});
}
