/**
 * Punto de Venta — Miembro
 * Tabs: Productos (ver + comprar) | Mi historial de compras
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
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
import api from '../../services/api';

type Tab = 'productos' | 'historial';

interface Producto {
  _id:        string;
  nombre:     string;
  precio:     number;
  stock?:     number;
  categoria?: string;
  activo?:    boolean;
}

interface Compra {
  _id?:    string;
  fecha?:  string;
  total?:  number;
  items?:  { nombre: string; cantidad: number; precio_unitario: number }[];
}

interface Cart { [id: string]: { producto: Producto; cantidad: number } }

export default function MemberPOSScreen() {
  const colors = useColors();
  const styles = useMemo(() => make_styles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('productos');
  const [cart, setCart] = useState<Cart>({});
  const [buying, setBuying] = useState(false);

  const { data: prodData, loading: loadingP, refetch: refetchP } =
    useFetch<{ productos?: Producto[]; total?: number }>(ENDPOINTS.USER_PRODUCTOS);

  const { data: histData, loading: loadingH, refetch: refetchH } =
    useFetch<{ ventas?: Compra[]; compras?: Compra[]; total?: number }>(ENDPOINTS.USER_VENTAS);

  const productos = toArray(prodData?.productos ?? []);
  const historial = toArray(histData?.ventas ?? histData?.compras ?? []);

  const cartItems    = Object.values(cart);
  const cartTotal    = cartItems.reduce((sum, { producto, cantidad }) => sum + producto.precio * cantidad, 0);
  const cartCount    = cartItems.reduce((sum, { cantidad }) => sum + cantidad, 0);

  const addToCart = (p: Producto) => {
    setCart((prev) => {
      const existing = prev[p._id];
      if (existing && (p.stock == null || existing.cantidad < p.stock)) {
        return { ...prev, [p._id]: { producto: p, cantidad: existing.cantidad + 1 } };
      }
      if (!existing) return { ...prev, [p._id]: { producto: p, cantidad: 1 } };
      return prev;
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      if (existing.cantidad <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...existing, cantidad: existing.cantidad - 1 } };
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    Alert.alert(
      'Confirmar compra',
      `Total: $${cartTotal.toFixed(2)}\n${cartItems.map(({ producto, cantidad }) => `· ${producto.nombre} ×${cantidad}`).join('\n')}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comprar',
          onPress: async () => {
            setBuying(true);
            try {
              await api.post(ENDPOINTS.USER_COMPRAR, {
                items: cartItems.map(({ producto, cantidad }) => ({
                  id_producto: producto._id,
                  cantidad,
                })),
              });
              setCart({});
              setTab('historial');
              refetchH();
              Alert.alert('¡Compra exitosa!', 'Tu compra fue registrada correctamente.');
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo procesar la compra');
            } finally {
              setBuying(false);
            }
          },
        },
      ]
    );
  };

  const loading = tab === 'productos' ? loadingP : loadingH;

  if (loading && (tab === 'productos' ? productos.length === 0 : historial.length === 0)) {
    return <LoadingSpinner fullScreen message="Cargando…" />;
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['productos', 'historial'] as Tab[]).map((t) => (
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
              {t === 'productos' ? 'Productos' : 'Mis compras'}
            </Text>
            {t === 'productos' && cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* PRODUCTOS */}
      {tab === 'productos' && (
        <>
          <FlatList
            data={productos.filter((p) => p.activo !== false)}
            keyExtractor={(p, i) => p._id ?? String(i)}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={styles.grid}
            refreshControl={<RefreshControl refreshing={loadingP} onRefresh={refetchP} tintColor={colors.accent} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="cube-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyText}>No hay productos disponibles.</Text>
              </View>
            }
            renderItem={({ item: p }) => {
              const inCart = cart[p._id]?.cantidad ?? 0;
              const outOfStock = p.stock != null && p.stock <= 0;
              return (
                <View style={[styles.productCard, outOfStock && styles.productCardDisabled]}>
                  <View style={styles.productIconBox}>
                    <Ionicons name="cube-outline" size={26} color={outOfStock ? colors.textMuted : colors.accent} />
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>{toStr(p.nombre)}</Text>
                  <Text style={[styles.productPrice, outOfStock && { color: colors.textMuted }]}>
                    ${p.precio}
                  </Text>
                  {p.stock != null && (
                    <Text style={styles.productStock}>Stock: {p.stock}</Text>
                  )}
                  {outOfStock ? (
                    <Badge label="Sin stock" color="error" />
                  ) : inCart === 0 ? (
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => addToCart(p)}
                      accessibilityLabel={`Agregar ${p.nombre} al carrito`}
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text style={styles.addBtnText}>Agregar</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => removeFromCart(p._id)}
                        accessibilityLabel="Quitar uno"
                      >
                        <Ionicons name="remove" size={16} color={colors.accent} />
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{inCart}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => addToCart(p)}
                        accessibilityLabel="Agregar uno más"
                      >
                        <Ionicons name="add" size={16} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
          />

          {/* Botón checkout flotante */}
          {cartCount > 0 && (
            <TouchableOpacity
              style={[styles.checkoutBtn, buying && { opacity: 0.7 }]}
              onPress={handleCheckout}
              disabled={buying}
              accessibilityLabel={`Finalizar compra, total $${cartTotal.toFixed(2)}`}
            >
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.checkoutText}>
                Comprar ({cartCount}) — ${cartTotal.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* HISTORIAL */}
      {tab === 'historial' && (
        <FlatList
          data={historial}
          keyExtractor={(c, i) => c._id ?? String(i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loadingH} onRefresh={refetchH} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyText}>No tienes compras registradas aún.</Text>
            </View>
          }
          renderItem={({ item: c }) => (
            <View style={styles.compraCard}>
              <View style={styles.compraIconBox}>
                <Ionicons name="receipt-outline" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.compraFecha}>{toDateStr(c.fecha)}</Text>
                {toArray(c.items).map((it, i) => (
                  <Text key={i} style={styles.compraItem}>· {it.nombre} ×{it.cantidad}</Text>
                ))}
              </View>
              <Text style={styles.compraTotal}>${c.total ?? 0}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  tabBar:  { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, position: 'relative',
  },
  tabBtnActive:  { backgroundColor: 'rgba(108,99,255,0.15)', borderColor: colors.accent },
  tabLabel:      { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabLabelActive:{ color: colors.accent },
  cartBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: colors.error, borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  grid:    { padding: 16, gap: 12, paddingBottom: 100 },
  list:    { padding: 16, gap: 10, paddingBottom: 32 },
  productCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 16,
    padding: 14, gap: 6, borderWidth: 1, borderColor: colors.border,
  },
  productCardDisabled: { opacity: 0.5 },
  productIconBox: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  productName:  { color: colors.text, fontSize: 13, fontWeight: '600' },
  productPrice: { color: colors.accent, fontSize: 17, fontWeight: '800' },
  productStock: { color: colors.textMuted, fontSize: 11 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(108,99,255,0.1)', borderRadius: 10, paddingHorizontal: 4, paddingVertical: 4,
  },
  qtyBtn:  { padding: 4 },
  qtyNum:  { color: colors.accent, fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  checkoutBtn: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 16,
    shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  compraCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  compraIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(108,99,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  compraFecha: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
  compraItem:  { color: colors.text, fontSize: 13 },
  compraTotal: { color: colors.accent, fontSize: 18, fontWeight: '800', marginLeft: 'auto' },
  empty:       { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:   { color: colors.textMuted, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
}
