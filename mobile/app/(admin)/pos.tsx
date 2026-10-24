/**
 * Punto de Venta — Owner Gym
 *
 * Catálogo editable del gimnasio e historial de ventas, con las mismas
 * operaciones que la web:
 *   GET    /api/owner_gym/productos            lista
 *   POST   /api/owner_gym/productos            alta
 *   PUT    /api/owner_gym/productos/<id>       edición
 *   PATCH  /api/owner_gym/productos/<id>/toggle  activar / desactivar
 *   DELETE /api/owner_gym/productos/<id>       baja
 *   GET    /api/ventas                          historial (paginado)
 *
 * Los combos se muestran pero se editan desde la web: su formulario necesita
 * elegir componentes del catálogo, algo poco manejable en una pantalla pequeña.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  Image, Modal, ScrollView, Dimensions, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray, toDateStr } from '../../utils/format';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SelectorPeriodo, { etiquetaPeriodo } from '../../components/ui/SelectorPeriodo';
import Paginador from '../../components/ui/Paginador';

type Tab = 'productos' | 'ventas';

interface Producto {
  _id: string;
  /** La API serializa el _id de Mongo como 'id'; se acepta cualquiera. */
  id?: string;
  nombre: string;
  precio: number;
  stock?: number;
  categoria?: string;
  activo?: boolean;
  descripcion?: string;
  imagenes?: string[];
  es_combo?: boolean;
  items_combo?: { id_producto?: string; nombre?: string; cantidad?: number }[];
}

/** Identificador utilizable del producto, venga como venga de la API. */
const idDe = (p?: Producto | null) => String(p?.id ?? p?._id ?? '');

/** Campos editables del formulario. Se guardan como texto y se convierten al enviar. */
interface FormProducto {
  nombre:      string;
  precio:      string;
  stock:       string;
  categoria:   string;
  descripcion: string;
}

const FORM_VACIO: FormProducto = {
  nombre: '', precio: '', stock: '0', categoria: 'General', descripcion: '',
};

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
        backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="cube-outline" size={size * 0.4} color={colors.accent} />
      </View>
    );
  }
  return <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: radius }}
    resizeMode="cover" onError={() => setErr(true)} />;
}

interface VentaItem {
  _id?: string;
  id?: string;
  nombre_miembro?: string;
  total?: number;
  fecha?: string;
  metodo_pago?: string;
  items?: { nombre: string; cantidad?: number; qty?: number; precio_unitario?: number }[];
}

interface VentasResponse {
  ventas?: VentaItem[];
  total?: number;
  pages?: number;
  page?: number;
  /** Importe de todo el periodo filtrado, no solo de la página. */
  monto_total?: number;
  /** Años con ventas; alimenta el selector de periodo. */
  anios?: number[];
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

  // Periodo y página del historial de ventas
  const [anio,   setAnio]   = useState(0);   // 0 = histórico completo
  const [mes,    setMes]    = useState(0);   // 0 = año completo
  const [pagina, setPagina] = useState(1);

  const { data: prodData, loading: loadingP, refetch: refetchP } =
    useFetch<ProductosResponse>(ENDPOINTS.OWNER_PRODUCTOS);

  const consultaVentas =
    `${ENDPOINTS.OWNER_VENTAS}?page=${pagina}&per_page=10` +
    (anio ? `&anio=${anio}` : '') +
    (anio && mes ? `&mes=${mes}` : '');

  const { data: ventasData, loading: loadingV, refetch: refetchV } =
    useFetch<VentasResponse>(consultaVentas);

  const loading   = tab === 'productos' ? loadingP : loadingV;
  const productos = toArray<Producto>(prodData?.productos ?? (Array.isArray(prodData) ? prodData : []));
  const ventas    = toArray<VentaItem>(ventasData?.ventas ?? (Array.isArray(ventasData) ? ventasData : []));

  const handleRefresh = () => { tab === 'productos' ? refetchP() : refetchV(); };

  /** Cambiar de periodo vuelve a la primera página. */
  const cambiarPeriodo = (a: number, m: number) => { setAnio(a); setMes(m); setPagina(1); };

  // ── Alta y edición de productos ───────────────────────────────────────────
  const [editando, setEditando] = useState<Producto | null>(null);  // null = alta
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<FormProducto>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const abrirAlta = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setShowForm(true);
  };

  const abrirEdicion = (p: Producto) => {
    if (p.es_combo) {
      Alert.alert(
        'Combo',
        'Los combos se editan desde el portal web, donde se pueden elegir los productos que incluyen.',
      );
      return;
    }
    setEditando(p);
    setForm({
      nombre:      toStr(p.nombre),
      precio:      String(p.precio ?? ''),
      stock:       String(p.stock ?? 0),
      categoria:   toStr(p.categoria, 'General'),
      descripcion: toStr(p.descripcion),
    });
    setShowForm(true);
  };

  const guardar = async () => {
    const nombre = form.nombre.trim();
    if (!nombre) {
      Alert.alert('Falta el nombre', 'El producto necesita un nombre.');
      return;
    }
    const precio = Number(form.precio.replace(',', '.'));
    if (!Number.isFinite(precio) || precio < 0) {
      Alert.alert('Precio inválido', 'Escribe un precio mayor o igual a cero.');
      return;
    }
    const stock = Number.parseInt(form.stock || '0', 10);
    if (!Number.isFinite(stock) || stock < 0) {
      Alert.alert('Stock inválido', 'El stock debe ser un número entero positivo.');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        nombre,
        precio,
        stock,
        categoria:   form.categoria.trim() || 'General',
        descripcion: form.descripcion.trim(),
      };
      if (editando) {
        await api.put(`${ENDPOINTS.OWNER_PRODUCTOS}/${idDe(editando)}`, payload);
      } else {
        await api.post(ENDPOINTS.OWNER_PRODUCTOS, payload);
      }
      setShowForm(false);
      setDetail(null);
      refetchP();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e?.response?.data?.error ?? 'Revisa tu conexión.');
    } finally {
      setGuardando(false);
    }
  };

  const alternarActivo = async (p: Producto) => {
    try {
      await api.patch(`${ENDPOINTS.OWNER_PRODUCTOS}/${idDe(p)}/toggle`);
      setDetail(null);
      refetchP();
    } catch (e: any) {
      Alert.alert('No se pudo cambiar el estado', e?.response?.data?.error ?? 'Revisa tu conexión.');
    }
  };

  const eliminar = (p: Producto) => {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${toStr(p.nombre)}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`${ENDPOINTS.OWNER_PRODUCTOS}/${idDe(p)}`);
              setDetail(null);
              refetchP();
            } catch (e: any) {
              Alert.alert('No se pudo eliminar', e?.response?.data?.error ?? 'Revisa tu conexión.');
            }
          },
        },
      ],
    );
  };

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
                {p.es_combo
                  ? <Text style={styles.productStock}>Combo</Text>
                  : p.stock != null && (
                      <Text style={[styles.productStock,
                                    p.stock === 0 && { color: colors.dataRiesgo },
                                    p.stock > 0 && p.stock <= 5 && { color: colors.dataAtencion }]}>
                        Stock: {p.stock}
                      </Text>
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

      {/* Alta de producto: solo tiene sentido sobre el catálogo */}
      {tab === 'productos' && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={abrirAlta}
          accessibilityRole="button"
          accessibilityLabel="Agregar producto"
        >
          <Ionicons name="add" size={26} color={colors.onAccent} />
        </TouchableOpacity>
      )}

      {/* Historial de ventas */}
      {tab === 'ventas' && (
        <>
          <SelectorPeriodo
            anio={anio} mes={mes}
            anios={toArray<number>(ventasData?.anios)}
            onChange={cambiarPeriodo}
          />

          <FlatList
            data={ventas}
            keyExtractor={(v, i) => v._id ?? String(i)}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={loadingV} onRefresh={refetchV} tintColor={colors.accent} />
            }
            ListHeaderComponent={
              <Card style={{ marginBottom: 12 }} padding={14}>
                <Text style={styles.totalLabel}>
                  Ventas · {etiquetaPeriodo(anio, mes)}
                </Text>
                <Text style={styles.totalValue}>
                  ${Math.round(ventasData?.monto_total ?? 0).toLocaleString('es-MX')}
                </Text>
                <Text style={styles.totalSub}>
                  {ventasData?.total ?? ventas.length} transacciones
                </Text>
              </Card>
            }
            ListEmptyComponent={
              <EmptyState
                icon="receipt-outline"
                msg={anio
                  ? `Sin ventas en ${etiquetaPeriodo(anio, mes)}.`
                  : 'No hay ventas registradas.'}
                styles={styles} colors={colors}
              />
            }
            ListFooterComponent={
              <Paginador
                pagina={ventasData?.page ?? pagina}
                paginas={ventasData?.pages ?? 0}
                total={ventasData?.total}
                etiquetaTotal="ventas"
                onCambio={setPagina}
              />
            }
            renderItem={({ item: v }) => (
              <View style={styles.ventaCard} accessible>
                <View style={styles.ventaIconBox}>
                  <Ionicons name="receipt-outline" size={18} color={colors.dataAtencion} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ventaCliente}>{toStr(v.nombre_miembro, 'Cliente general')}</Text>
                  <Text style={styles.ventaFecha}>
                    {toDateStr(v.fecha)}{v.metodo_pago ? `  ·  ${v.metodo_pago}` : ''}
                  </Text>
                  {toArray(v.items).slice(0, 2).map((it, i) => (
                    <Text key={i} style={styles.ventaItem}>
                      · {it.nombre} ×{it.cantidad ?? (it as any).qty ?? 1}
                    </Text>
                  ))}
                </View>
                <Text style={styles.ventaTotal}>
                  ${Math.round(v.total ?? 0).toLocaleString('es-MX')}
                </Text>
              </View>
            )}
          />
        </>
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

              {detail?.es_combo && toArray(detail.items_combo).length > 0 ? (
                <>
                  <Text style={styles.detailLabel}>Incluye</Text>
                  {toArray(detail.items_combo).map((it, i) => (
                    <Text key={i} style={styles.detailDesc}>
                      {it.cantidad && it.cantidad > 1 ? `${it.cantidad} x ` : ''}{toStr(it.nombre)}
                    </Text>
                  ))}
                </>
              ) : null}

              {/* Acciones del catálogo */}
              <View style={styles.accionesRow}>
                <TouchableOpacity
                  style={[styles.accionBtn, styles.accionPrimaria]}
                  onPress={() => detail && abrirEdicion(detail)}
                  accessibilityRole="button" accessibilityLabel="Editar producto"
                >
                  <Ionicons name="create-outline" size={17} color={colors.onAccent} />
                  <Text style={styles.accionPrimariaText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.accionBtn}
                  onPress={() => detail && alternarActivo(detail)}
                  accessibilityRole="button"
                  accessibilityLabel={detail?.activo !== false ? 'Desactivar producto' : 'Activar producto'}
                >
                  <Ionicons
                    name={detail?.activo !== false ? 'eye-off-outline' : 'eye-outline'}
                    size={17} color={colors.text}
                  />
                  <Text style={styles.accionText}>
                    {detail?.activo !== false ? 'Desactivar' : 'Activar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.accionBtn}
                  onPress={() => detail && eliminar(detail)}
                  accessibilityRole="button" accessibilityLabel="Eliminar producto"
                >
                  <Ionicons name="trash-outline" size={17} color={colors.dataRiesgo} />
                  <Text style={[styles.accionText, { color: colors.dataRiesgo }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Formulario de alta y edición */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={styles.overlay}>
          <View style={styles.detailBox}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>
                {editando ? 'Editar producto' : 'Nuevo producto'}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.campoLabel}>Nombre</Text>
              <TextInput
                style={styles.campo}
                value={form.nombre}
                onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                placeholder="Proteína de suero 1 kg"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Nombre del producto"
              />

              <View style={styles.campoFila}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.campoLabel}>Precio</Text>
                  <TextInput
                    style={styles.campo}
                    value={form.precio}
                    onChangeText={(v) => setForm((f) => ({ ...f, precio: v.replace(/[^\d.,]/g, '') }))}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Precio"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.campoLabel}>Stock</Text>
                  <TextInput
                    style={styles.campo}
                    value={form.stock}
                    onChangeText={(v) => setForm((f) => ({ ...f, stock: v.replace(/\D/g, '') }))}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    accessibilityLabel="Existencias"
                  />
                </View>
              </View>

              <Text style={styles.campoLabel}>Categoría</Text>
              <TextInput
                style={styles.campo}
                value={form.categoria}
                onChangeText={(v) => setForm((f) => ({ ...f, categoria: v }))}
                placeholder="Suplementos"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Categoría"
              />

              <Text style={styles.campoLabel}>Descripción</Text>
              <TextInput
                style={[styles.campo, styles.campoArea]}
                value={form.descripcion}
                onChangeText={(v) => setForm((f) => ({ ...f, descripcion: v }))}
                placeholder="Detalles que verá el miembro"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                accessibilityLabel="Descripción"
              />

              <TouchableOpacity
                style={[styles.guardarBtn, guardando && { opacity: 0.6 }]}
                onPress={guardar}
                disabled={guardando}
                accessibilityRole="button" accessibilityLabel="Guardar producto"
              >
                <Ionicons name={guardando ? 'hourglass-outline' : 'checkmark-circle-outline'}
                          size={19} color={colors.onAccent} />
                <Text style={styles.guardarText}>{guardando ? 'Guardando…' : 'Guardar'}</Text>
              </TouchableOpacity>

              {editando ? (
                <Text style={styles.nota}>
                  Las imágenes del producto se administran desde el portal web.
                </Text>
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
  tabBtnActive:  { backgroundColor: colors.accentBg, borderColor: colors.accent },
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
    backgroundColor: colors.accentBg,
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
  totalValue:   { color: colors.text, fontSize: 24 * fs, fontWeight: '800',
                  letterSpacing: -0.5, marginTop: 2 },
  totalSub:     { color: colors.textMuted, fontSize: 11.5 * fs, marginTop: 2 },
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

  // ── Edición del catálogo ────────────────────────────────────────────────
  fab: {
    position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.shadow, shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  accionesRow: {
    flexDirection: 'row', gap: 8, marginTop: 22,
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16,
  },
  accionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 11, borderRadius: 11,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  accionPrimaria:     { backgroundColor: colors.accent, borderColor: colors.accent },
  accionPrimariaText: { color: colors.onAccent, fontSize: 13 * fs, fontWeight: '700' },
  accionText:         { color: colors.text, fontSize: 13 * fs, fontWeight: '600' },

  campoLabel: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '700',
                marginTop: 14, marginBottom: 6 },
  campoFila:  { flexDirection: 'row', gap: 12 },
  campo: {
    backgroundColor: colors.inputBg, borderRadius: 11, paddingHorizontal: 14,
    paddingVertical: 11, color: colors.text, fontSize: 14 * fs,
    borderWidth: 1, borderColor: colors.border,
  },
  campoArea:  { minHeight: 78, textAlignVertical: 'top' },
  guardarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    backgroundColor: colors.accent, borderRadius: 13, paddingVertical: 15, marginTop: 22,
  },
  guardarText: { color: colors.onAccent, fontSize: 15 * fs, fontWeight: '700' },
  nota:        { color: colors.textMuted, fontSize: 11.5 * fs, textAlign: 'center', marginTop: 12 },
});
}
