/**
 * Punto de Venta — Owner Gym
 * Productos disponibles + historial de ventas del gimnasio.
 * GET /api/owner_gym/productos  → lista de productos
 * GET /api/ventas               → historial de ventas (paginado)
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  Image, Modal, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors, useFontScale } from '../../hooks/useColors';
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
  descripcion?: string;
  imagenes?: string[];
}

const IMG_W = Dimensions.get('window').width - 88;

function resolveUri(uri?: string): string | null {
  if (!uri) return null;
  if (uri.startsWith('data:') || uri.startsWith('http')) return uri;
  return `data:image/jpeg;base64,${uri}`;
}

// Imagen de producto con fallback a icono.
function ProductImage({ uri, size, radius, colors }: { uri?: string; size: number; radius: number; colors: any }) {
  const [err, setErr] = useState(false);
  const src = resolveUri(uri);
  if (!src || err) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius,
        backgroundColor: 'rgba(108,99,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="cube-outline" size={size * 0.4} color={colors.accent} />
      </View>
    );
  }
  return <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: radius }}
    resizeMode="cover" onError={() => setErr(true)} />;
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
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('productos');
  const [detail, setDetail] = useState<Producto | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

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
          ListEmptyComponent={<EmptyState icon="cube-outline" msg="No hay productos registrados."
              styles={styles} colors={colors} />}
          renderItem={({ item: p }) => (
            <TouchableOpacity style={styles.productCard} activeOpacity={0.85}
              onPress={() => { setDetail(p); setImgIdx(0); }}
              accessibilityRole="button" accessibilityLabel={`Ver detalle de ${p.nombre}, $${p.precio}`}>
              <ProductImage uri={p.imagenes?.[0]} size={64} radius={14} colors={colors} />
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
            </TouchableOpacity>
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
          ListEmptyComponent={<EmptyState icon="receipt-outline" msg="No hay ventas registradas."
              styles={styles} colors={colors} />}
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

      {/* Modal detalle de producto */}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={styles.overlay}>
          <View style={styles.detailBox}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle} numberOfLines={1}>{toStr(detail?.nombre)}</Text>
              <TouchableOpacity onPress={() => setDetail(null)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Carrusel de imágenes */}
              {detail?.imagenes && detail.imagenes.length > 0 ? (
                <>
                  <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / IMG_W))}>
                    {detail.imagenes.map((img, i) => (
                      <ProductImage key={i} uri={img} size={IMG_W} radius={16} colors={colors} />
                    ))}
                  </ScrollView>
                  {detail.imagenes.length > 1 && (
                    <View style={styles.dots}>
                      {detail.imagenes.map((_, i) => (
                        <View key={i} style={[styles.dot, i === imgIdx && styles.dotActive]} />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <ProductImage uri={undefined} size={IMG_W} radius={16} colors={colors} />
              )}

              <View style={styles.detailPriceRow}>
                <Text style={styles.detailPrice}>${detail?.precio}</Text>
                <Badge label={detail?.activo !== false ? 'Activo' : 'Inactivo'}
                  color={detail?.activo !== false ? 'success' : 'error'} />
              </View>

              <View style={styles.detailMetaRow}>
                {detail?.categoria ? (
                  <View style={styles.metaPill}>
                    <Ionicons name="pricetag-outline" size={13} color={colors.accent} />
                    <Text style={styles.metaPillText}>{detail.categoria}</Text>
                  </View>
                ) : null}
                {detail?.stock != null ? (
                  <View style={styles.metaPill}>
                    <Ionicons name="cube-outline" size={13} color={colors.accent} />
                    <Text style={styles.metaPillText}>Stock: {detail.stock}</Text>
                  </View>
                ) : null}
              </View>

              {detail?.descripcion ? (
                <>
                  <Text style={styles.detailLabel}>Descripción</Text>
                  <Text style={styles.detailDesc}>{detail.descripcion}</Text>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function EmptyState({ icon, msg, styles, colors }: { icon: string; msg: string; styles: ReturnType<typeof make_styles>; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon as any} size={44} color={colors.textMuted} />
      <Text style={styles.emptyText}>{msg}</Text>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:     { flex: 1, backgroundColor: colors.background },
  tabBar:     { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  tabBtnActive:  { backgroundColor: 'rgba(108,99,255,0.15)', borderColor: colors.accent },
  tabLabel:      { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
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
  productName:    { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  productPrice:   { color: colors.accent, fontSize: 18 * fs, fontWeight: '800' },
  productFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  productStock:   { color: colors.textMuted, fontSize: 11 * fs },
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
  ventaCliente: { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  ventaFecha:   { color: colors.textMuted, fontSize: 11 * fs, marginBottom: 2 },
  ventaItem:    { color: colors.textSecondary, fontSize: 12 * fs },
  ventaTotal:   { color: colors.warning, fontSize: 18 * fs, fontWeight: '800', marginLeft: 'auto' },
  totalLabel:   { color: colors.textSecondary, fontSize: 12 * fs },
  totalValue:   { color: colors.text, fontSize: 20 * fs, fontWeight: '700' },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { color: colors.textMuted, fontSize: 14 * fs },

  overlay:    { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  detailBox:  { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                padding: 20, maxHeight: '85%', borderWidth: 1, borderColor: colors.border },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  detailTitle:  { color: colors.text, fontSize: 18 * fs, fontWeight: '700', flex: 1, marginRight: 8 },
  dots:       { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotActive:  { backgroundColor: colors.accent, width: 18 },
  detailPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  detailPrice: { color: colors.accent, fontSize: 28 * fs, fontWeight: '800' },
  detailMetaRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  metaPill:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.accent + '14',
                borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  metaPillText: { color: colors.accent, fontSize: 12 * fs, fontWeight: '600' },
  detailLabel:  { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '700', marginTop: 16, marginBottom: 6 },
  detailDesc:   { color: colors.text, fontSize: 14 * fs, lineHeight: 20 },
});
}
