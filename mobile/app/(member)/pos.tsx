/**
 * Punto de Venta — Miembro
 * Tabs: Productos (ver + comprar) | Mi historial de compras
 *
 * Backend espera en POST /api/ventas:
 *   items: [{ id, nombre, precio, qty, categoria }]   ← id es el _id string de Mongo
 *   total: float
 *   metodo_pago: "Efectivo" | "Tarjeta" | "Transferencia"
 *   numero_tarjeta?: string  (últimos 4 dígitos, solo Tarjeta)
 *   referencia?: string      (solo Transferencia)
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  Alert, Modal, ScrollView, Image, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray, toDateStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import * as Haptics from 'expo-haptics';

type Tab     = 'productos' | 'historial';
type Metodo  = 'Efectivo' | 'Tarjeta' | 'Transferencia';

interface Producto {
  _id:         string;
  id?:         string;
  nombre:      string;
  precio:      number;
  stock?:      number;
  categoria?:  string;
  descripcion?: string;
  activo?:     boolean;
  imagenes?:   string[];
}

interface Compra {
  _id?:    string;
  fecha?:  string;
  total?:  number;
  metodo_pago?: string;
  items?:  { nombre: string; cantidad?: number; qty?: number; precio_unitario?: number; precio?: number }[];
}

interface Cart { [id: string]: { producto: Producto; cantidad: number } }

// ── Imagen con fallback ───────────────────────────────────────────────────────
function ProductImage({ uri, size, colors }: { uri?: string; size: number; colors: any }) {
  const [err, setErr] = useState(false);
  if (!uri || err) {
    return (
      <View style={{ width: size, height: size, borderRadius: 12,
        backgroundColor: 'rgba(108,99,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="cube-outline" size={size * 0.45} color={colors.accent} />
      </View>
    );
  }
  const source = uri.startsWith('data:') || uri.startsWith('http')
    ? { uri }
    : { uri: `data:image/jpeg;base64,${uri}` };
  return (
    <Image source={source} style={{ width: size, height: size, borderRadius: 12 }}
      resizeMode="cover" onError={() => setErr(true)} />
  );
}

export default function MemberPOSScreen() {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { user } = useAuth();
  const [tab,     setTab]     = useState<Tab>('productos');
  const [cart,    setCart]    = useState<Cart>({});
  const [buying,  setBuying]  = useState(false);

  // Detalle de producto
  const [detailProd, setDetailProd] = useState<Producto | null>(null);
  const [detailImg,  setDetailImg]  = useState(0);

  // Checkout
  const [showCheckout, setShowCheckout] = useState(false);
  const [metodo,       setMetodo]       = useState<Metodo>('Efectivo');
  const [tarjeta,      setTarjeta]      = useState('');
  const [referencia,   setReferencia]   = useState('');

  const { data: prodData, loading: loadingP, refetch: refetchP } =
    useFetch<{ productos?: Producto[] }>(ENDPOINTS.USER_PRODUCTOS);
  const { data: histData, loading: loadingH, refetch: refetchH } =
    useFetch<{ ventas?: Compra[]; compras?: Compra[] }>(ENDPOINTS.USER_VENTAS);

  const productos = toArray(prodData?.productos ?? []);
  const historial = toArray(histData?.ventas ?? histData?.compras ?? []);

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((s, { producto, cantidad }) => s + producto.precio * cantidad, 0);
  const cartCount = cartItems.reduce((s, { cantidad }) => s + cantidad, 0);

  const addToCart = (p: Producto) => {
    const pid = p.id ?? p._id;
    setCart(prev => {
      const ex = prev[pid];
      if (ex && (p.stock == null || ex.cantidad < p.stock))
        return { ...prev, [pid]: { producto: p, cantidad: ex.cantidad + 1 } };
      if (!ex) return { ...prev, [pid]: { producto: p, cantidad: 1 } };
      return prev;
    });
  };

  const removeFromCart = (id: string) =>
    setCart(prev => {
      const ex = prev[id];
      if (!ex) return prev;
      if (ex.cantidad <= 1) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: { ...ex, cantidad: ex.cantidad - 1 } };
    });

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (metodo === 'Tarjeta' && tarjeta.replace(/\s/g,'').length < 4) {
      Alert.alert('Datos incompletos', 'Ingresa los últimos 4 dígitos de tu tarjeta.');
      return;
    }
    if (metodo === 'Transferencia' && !referencia.trim()) {
      Alert.alert('Datos incompletos', 'Ingresa el número de referencia de la transferencia.');
      return;
    }
    setBuying(true);
    try {
      const payload: Record<string, any> = {
        items: cartItems.map(({ producto, cantidad }) => ({
          id:        producto.id ?? producto._id,
          nombre:    producto.nombre,
          precio:    producto.precio,
          qty:       cantidad,
          categoria: producto.categoria ?? 'General',
        })),
        total:       cartTotal,
        metodo_pago: metodo,
      };
      if (metodo === 'Tarjeta')         payload.numero_tarjeta = tarjeta.slice(-4);
      if (metodo === 'Transferencia')   payload.referencia      = referencia.trim();
      if (user?.id)    payload.id_miembro     = Number(user.id);
      if (user?.nombre) payload.nombre_miembro = user.nombre;

      await api.post(ENDPOINTS.USER_COMPRAR, payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCart({});
      setShowCheckout(false);
      setTarjeta('');
      setReferencia('');
      setMetodo('Efectivo');
      setTab('historial');
      refetchH();
      Alert.alert('¡Compra exitosa!', 'Tu compra fue registrada correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo procesar la compra');
    } finally {
      setBuying(false);
    }
  };

  if ((tab === 'productos' ? loadingP : loadingH) &&
      (tab === 'productos' ? productos.length === 0 : historial.length === 0)) {
    return <LoadingSpinner fullScreen message="Cargando…" />;
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['productos', 'historial'] as Tab[]).map((t) => (
          <TouchableOpacity key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)} accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}>
            <Ionicons name={t === 'productos' ? 'cube-outline' : 'receipt-outline'}
              size={16} color={tab === t ? colors.accent : colors.textSecondary} />
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

      {/* ── PRODUCTOS ─────────────────────────────────────────────── */}
      {tab === 'productos' && (
        <>
          <FlatList
            data={productos.filter(p => p.activo !== false)}
            keyExtractor={(p, i) => p.id ?? p._id ?? String(i)}
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
              const pid = p.id ?? p._id;
              const inCart    = cart[pid]?.cantidad ?? 0;
              const outOfStock = p.stock != null && p.stock <= 0;
              const thumb     = p.imagenes?.[0];
              return (
                <TouchableOpacity
                  style={[styles.productCard, outOfStock && styles.productCardDisabled]}
                  onPress={() => { setDetailProd(p); setDetailImg(0); }}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalle de ${p.nombre}`}
                  activeOpacity={0.85}
                >
                  <ProductImage uri={thumb} size={64} colors={colors} />
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
                    <TouchableOpacity style={styles.addBtn}
                      onPress={() => { addToCart(p); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      accessibilityLabel={`Agregar ${p.nombre} al carrito`}>
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text style={styles.addBtnText}>Agregar</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.qtyRow}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(pid)}>
                        <Ionicons name="remove" size={16} color={colors.accent} />
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{inCart}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(p)}>
                        <Ionicons name="add" size={16} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {cartCount > 0 && (
            <TouchableOpacity style={styles.checkoutBtn}
              onPress={() => setShowCheckout(true)}
              accessibilityLabel={`Finalizar compra, total $${cartTotal.toFixed(2)}`}>
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.checkoutText}>
                Comprar ({cartCount}) — ${cartTotal.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* ── HISTORIAL ─────────────────────────────────────────────── */}
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
                {c.metodo_pago && (
                  <Text style={styles.compraMetodo}>{c.metodo_pago}</Text>
                )}
                {toArray(c.items).map((it, i) => (
                  <Text key={i} style={styles.compraItem}>
                    · {it.nombre} ×{it.cantidad ?? it.qty ?? 1}
                  </Text>
                ))}
              </View>
              <Text style={styles.compraTotal}>${(c.total ?? 0).toFixed(2)}</Text>
            </View>
          )}
        />
      )}

      {/* ── MODAL DETALLE PRODUCTO ─────────────────────────────────── */}
      <Modal visible={!!detailProd} animationType="slide" transparent onRequestClose={() => setDetailProd(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setDetailProd(null)} />
          {detailProd && (
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.modalHandle} />
              {/* Imagen grande */}
              {(detailProd.imagenes?.length ?? 0) > 0 ? (
                <>
                  <ProductImage uri={detailProd.imagenes![detailImg]} size={260} colors={colors} />
                  {detailProd.imagenes!.length > 1 && (
                    <View style={styles.imgDots}>
                      {detailProd.imagenes!.map((_, i) => (
                        <TouchableOpacity key={i} onPress={() => setDetailImg(i)}>
                          <View style={[styles.imgDot, i === detailImg && styles.imgDotActive]} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noImgPlaceholder}>
                  <Ionicons name="cube-outline" size={60} color={colors.accent} />
                </View>
              )}

              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                <Text style={styles.detailName}>{detailProd.nombre}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <Text style={styles.detailPrice}>${detailProd.precio}</Text>
                  {detailProd.categoria && <Badge label={detailProd.categoria} color="accent" />}
                  {detailProd.stock != null && (
                    <Text style={styles.detailStock}>Stock: {detailProd.stock}</Text>
                  )}
                </View>
                {detailProd.descripcion ? (
                  <Text style={styles.detailDesc}>{detailProd.descripcion}</Text>
                ) : null}

                {detailProd.stock === 0 ? (
                  <Badge label="Sin stock" color="error" />
                ) : cart[detailProd._id]?.cantidad ? (
                  <View style={[styles.qtyRow, { marginTop: 12 }]}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(detailProd.id ?? detailProd._id)}>
                      <Ionicons name="remove" size={20} color={colors.accent} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyNum, { fontSize: 18 * fs }]}>{cart[detailProd._id].cantidad}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(detailProd)}>
                      <Ionicons name="add" size={20} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={[styles.addBtn, { marginTop: 12 }]}
                    onPress={() => { addToCart(detailProd); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDetailProd(null); }}>
                    <Ionicons name="cart-outline" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Agregar al carrito</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* ── MODAL CHECKOUT / MÉTODO DE PAGO ───────────────────────── */}
      <Modal visible={showCheckout} animationType="slide" transparent onRequestClose={() => setShowCheckout(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowCheckout(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.checkoutTitle}>Confirmar compra</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Resumen */}
              <View style={styles.summaryBox}>
                {cartItems.map(({ producto, cantidad }) => (
                  <View key={producto.id ?? producto._id} style={styles.summaryRow}>
                    <Text style={styles.summaryItem} numberOfLines={1}>
                      {producto.nombre} ×{cantidad}
                    </Text>
                    <Text style={styles.summaryPrice}>
                      ${(producto.precio * cantidad).toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>${cartTotal.toFixed(2)}</Text>
                </View>
              </View>

              {/* Método de pago */}
              <Text style={styles.payLabel}>Método de pago</Text>
              <View style={styles.metodosRow}>
                {(['Efectivo', 'Tarjeta', 'Transferencia'] as Metodo[]).map((m) => (
                  <TouchableOpacity key={m}
                    style={[styles.metodoChip, metodo === m && styles.metodoChipActive]}
                    onPress={() => setMetodo(m)}
                    accessibilityRole="radio" accessibilityState={{ checked: metodo === m }}>
                    <Ionicons
                      name={m === 'Efectivo' ? 'cash-outline' : m === 'Tarjeta' ? 'card-outline' : 'swap-horizontal-outline'}
                      size={16} color={metodo === m ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.metodoText, metodo === m && { color: '#fff' }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Datos extra */}
              {metodo === 'Tarjeta' && (
                <View style={styles.payField}>
                  <Text style={styles.payFieldLabel}>Últimos 4 dígitos de la tarjeta</Text>
                  <TextInput
                    style={styles.payInput}
                    value={tarjeta}
                    onChangeText={t => setTarjeta(t.replace(/\D/g,'').slice(0,4))}
                    placeholder="1234"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={4}
                    accessibilityLabel="Últimos 4 dígitos"
                  />
                </View>
              )}
              {metodo === 'Transferencia' && (
                <View style={styles.payField}>
                  <Text style={styles.payFieldLabel}>Número de referencia</Text>
                  <TextInput
                    style={styles.payInput}
                    value={referencia}
                    onChangeText={setReferencia}
                    placeholder="Ej: REF-123456"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel="Referencia de transferencia"
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.confirmBtn, buying && { opacity: 0.6 }]}
                onPress={handleCheckout}
                disabled={buying}
                accessibilityLabel="Confirmar y pagar"
                accessibilityRole="button">
                <Ionicons name={buying ? 'hourglass-outline' : 'checkmark-circle-outline'} size={20} color="#fff" />
                <Text style={styles.confirmBtnText}>{buying ? 'Procesando…' : 'Confirmar pago'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  tabBar:  { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  tabBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
             gap: 6, paddingVertical: 10, borderRadius: 12, position: 'relative',
             backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabBtnActive:  { backgroundColor: 'rgba(108,99,255,0.15)', borderColor: colors.accent },
  tabLabel:      { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
  tabLabelActive:{ color: colors.accent },
  cartBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.error,
               borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center',
               justifyContent: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: '#fff', fontSize: 11 * fs, fontWeight: '800' },
  grid: { padding: 16, gap: 12, paddingBottom: 110 },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  productCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16,
                 padding: 12, gap: 6, borderWidth: 1, borderColor: colors.border,
                 alignItems: 'center' },
  productCardDisabled: { opacity: 0.5 },
  productName:  { color: colors.text, fontSize: 13 * fs, fontWeight: '600', textAlign: 'center' },
  productPrice: { color: colors.accent, fontSize: 17 * fs, fontWeight: '800' },
  productStock: { color: colors.textMuted, fontSize: 11 * fs },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
            backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 8, width: '100%' },
  addBtnText: { color: '#fff', fontSize: 13 * fs, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: 'rgba(108,99,255,0.1)', borderRadius: 10,
            paddingHorizontal: 4, paddingVertical: 4, width: '100%' },
  qtyBtn: { padding: 6 },
  qtyNum: { color: colors.accent, fontSize: 16 * fs, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  checkoutBtn: { position: 'absolute', bottom: 20, left: 20, right: 20,
                 flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                 backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 16,
                 shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  checkoutText: { color: '#fff', fontSize: 16 * fs, fontWeight: '700' },
  compraCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                   backgroundColor: colors.card, borderRadius: 14, padding: 14,
                   borderWidth: 1, borderColor: colors.border },
  compraIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(108,99,255,0.1)',
                   alignItems: 'center', justifyContent: 'center' },
  compraFecha:   { color: colors.textSecondary, fontSize: 12 * fs, marginBottom: 2 },
  compraMetodo:  { color: colors.accent, fontSize: 11 * fs, marginBottom: 4 },
  compraItem:    { color: colors.text, fontSize: 13 * fs },
  compraTotal:   { color: colors.accent, fontSize: 18 * fs, fontWeight: '800' },
  empty:         { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:     { color: colors.textMuted, fontSize: 14 * fs, fontWeight: '600', textAlign: 'center' },
  // Modal
  modalOverlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalSheet:    { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                   padding: 20, maxHeight: '90%' },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
                   alignSelf: 'center', marginBottom: 16 },
  noImgPlaceholder: { width: 260, height: 260, borderRadius: 16, alignSelf: 'center',
                      backgroundColor: 'rgba(108,99,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  imgDots:       { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  imgDot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  imgDotActive:  { backgroundColor: colors.accent, width: 16 },
  detailName:    { color: colors.text, fontSize: 20 * fs, fontWeight: '700', marginBottom: 8 },
  detailPrice:   { color: colors.accent, fontSize: 24 * fs, fontWeight: '800' },
  detailStock:   { color: colors.textMuted, fontSize: 13 * fs },
  detailDesc:    { color: colors.textSecondary, fontSize: 14 * fs, lineHeight: 20, marginBottom: 12 },
  // Checkout
  checkoutTitle: { color: colors.text, fontSize: 20 * fs, fontWeight: '700', marginBottom: 16 },
  summaryBox:    { backgroundColor: colors.card, borderRadius: 14, padding: 14,
                   borderWidth: 1, borderColor: colors.border, marginBottom: 16, gap: 8 },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItem:   { color: colors.text, fontSize: 14 * fs, flex: 1 },
  summaryPrice:  { color: colors.textSecondary, fontSize: 14 * fs },
  summaryTotal:  { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  summaryTotalLabel: { color: colors.text, fontSize: 16 * fs, fontWeight: '700' },
  summaryTotalValue: { color: colors.accent, fontSize: 20 * fs, fontWeight: '800' },
  payLabel:      { color: colors.text, fontSize: 14 * fs, fontWeight: '700', marginBottom: 10 },
  metodosRow:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  metodoChip:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   gap: 6, paddingVertical: 10, borderRadius: 12,
                   backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  metodoChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  metodoText:    { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600' },
  payField:      { marginBottom: 16 },
  payFieldLabel: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600', marginBottom: 6 },
  payInput:      { backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 14,
                   paddingVertical: 10, color: colors.text, fontSize: 14 * fs,
                   borderWidth: 1, borderColor: colors.border },
  confirmBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                   backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  confirmBtnText:{ color: '#fff', fontSize: 16 * fs, fontWeight: '700' },
});
}
