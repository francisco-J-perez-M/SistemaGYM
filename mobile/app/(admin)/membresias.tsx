/**
 * Gestión de Membresías — Owner Gym
 *
 * Mismas operaciones que la web:
 *   GET    /api/owner_gym/membresias              catálogo del gimnasio
 *   POST   /api/owner_gym/membresias              alta
 *   PUT    /api/owner_gym/membresias/<id>         edición
 *   PATCH  /api/owner_gym/membresias/<id>/toggle  activar / desactivar
 *   DELETE /api/owner_gym/membresias/<id>         baja
 *
 * Los beneficios se editan como lista (uno por renglón) porque desde la
 * migración 013 la columna es JSON, no texto. Los combos se administran desde
 * el portal web: su formulario necesita elegir productos del catálogo.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Modal, ScrollView, TextInput, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray } from '../../utils/format';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import SelectorFecha from '../../components/ui/SelectorFecha';

interface ItemCombo {
  nombre?:   string;
  cantidad?: number;
}

interface TipoMembresia {
  id?:            number;
  id_membresia?:  number;
  nombre:         string;
  precio:         number;
  duracion_dias?:  number;
  duracion_meses?: number;
  descripcion?:   string;
  /** Desde la migración 013 la API lo devuelve como lista. */
  beneficios?:    string[] | string | null;
  es_combo?:      boolean;
  items_combo?:   ItemCombo[] | null;
  fecha_fin_promo?: string | null;
  dias_restantes_promo?: number | null;
  activo?:        boolean;
}

function duracionLabel(m: TipoMembresia): string | null {
  if (m.duracion_meses) return `${m.duracion_meses} ${m.duracion_meses === 1 ? 'mes' : 'meses'}`;
  if (m.duracion_dias)  return `${m.duracion_dias} días`;
  return null;
}

/**
 * Beneficios de la membresía.
 *
 * La migración 013 cambió la columna de texto a JSON, así que la API devuelve
 * una lista. Se sigue aceptando el texto separado por comas o saltos de línea
 * para no romper con gimnasios cuyos registros son anteriores a la migración.
 */
function beneficiosList(m: TipoMembresia, limite?: number): string[] {
  const b = m.beneficios;
  if (!b) return [];
  const lista = Array.isArray(b)
    ? b.map((x) => String(x).trim())
    : String(b).split(/[\n,•·]/).map((x) => x.trim());
  const limpia = lista.filter(Boolean);
  // Sin límite se devuelven todos: al editar hay que conservarlos, recortar
  // aquí borraría los beneficios que no caben en la tarjeta.
  return limite ? limpia.slice(0, limite) : limpia;
}

/**
 * Promoción vigente. El backend ya calcula los días restantes
 * (TipoMembresia.dias_restantes_promo), así que no se recalcula aquí: basta
 * con que tenga fecha de fin y que aún no haya pasado.
 */
function esPromocion(m: TipoMembresia): boolean {
  if (!m.fecha_fin_promo) return false;
  if (typeof m.dias_restantes_promo === 'number') return m.dias_restantes_promo >= 0;
  return new Date(m.fecha_fin_promo) >= new Date(new Date().toDateString());
}

/** Campos del formulario. Se guardan como texto y se convierten al enviar. */
interface FormMembresia {
  nombre:         string;
  precio:         string;
  duracion_meses: string;
  descripcion:    string;
  /** Un beneficio por renglón. */
  beneficios:     string;
  esPromocion:    boolean;
  fechaFinPromo:  string;   // dd/mm/aaaa
}

const FORM_VACIO: FormMembresia = {
  nombre: '', precio: '', duracion_meses: '1', descripcion: '',
  beneficios: '', esPromocion: false, fechaFinPromo: '',
};

/** 'dd/mm/aaaa' → 'aaaa-mm-dd', que es lo que espera la API. */
function aISO(fecha: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** 'aaaa-mm-dd' → 'dd/mm/aaaa', para precargar el selector de fecha. */
function aLocal(iso?: string | null): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

export default function MembresiasScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { data, loading, refetch } = useFetch<TipoMembresia[]>(ENDPOINTS.OWNER_MEMBRESIAS);

  const [editando,  setEditando]  = useState<TipoMembresia | null>(null);  // null = alta
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState<FormMembresia>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const idDe = (m: TipoMembresia) => m.id ?? m.id_membresia;

  const abrirAlta = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setShowForm(true);
  };

  const abrirEdicion = (m: TipoMembresia) => {
    if (m.es_combo) {
      Alert.alert(
        'Combo',
        'Los combos se editan desde el portal web, donde se pueden elegir los productos que incluyen.',
      );
      return;
    }
    setEditando(m);
    setForm({
      nombre:         toStr(m.nombre),
      precio:         String(m.precio ?? ''),
      duracion_meses: String(m.duracion_meses ?? 1),
      descripcion:    toStr(m.descripcion),
      beneficios:     beneficiosList(m).join('\n'),
      esPromocion:    !!m.fecha_fin_promo,
      fechaFinPromo:  aLocal(m.fecha_fin_promo),
    });
    setShowForm(true);
  };

  const guardar = async () => {
    const nombre = form.nombre.trim();
    if (!nombre) {
      Alert.alert('Falta el nombre', 'La membresía necesita un nombre.');
      return;
    }
    const precio = Number(form.precio.replace(',', '.'));
    if (!Number.isFinite(precio) || precio < 0) {
      Alert.alert('Precio inválido', 'Escribe un precio mayor o igual a cero.');
      return;
    }
    const duracion = Number.parseInt(form.duracion_meses || '1', 10);
    if (!Number.isFinite(duracion) || duracion < 1) {
      Alert.alert('Duración inválida', 'La duración debe ser de al menos un mes.');
      return;
    }
    if (form.esPromocion && !aISO(form.fechaFinPromo)) {
      Alert.alert('Falta la fecha', 'Una promoción necesita su fecha de término.');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        nombre,
        precio,
        duracion_meses: duracion,
        descripcion:    form.descripcion.trim(),
        // La API normaliza la lista: quita vacíos y duplicados.
        beneficios:     form.beneficios.split('\n').map((b) => b.trim()).filter(Boolean),
        tipo:           form.esPromocion ? 'promocion' : 'estandar',
        fecha_fin_promo: form.esPromocion ? aISO(form.fechaFinPromo) : null,
      };
      if (editando) {
        await api.put(`${ENDPOINTS.OWNER_MEMBRESIAS}/${idDe(editando)}`, payload);
      } else {
        await api.post(ENDPOINTS.OWNER_MEMBRESIAS, payload);
      }
      setShowForm(false);
      refetch();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e?.response?.data?.msg ?? 'Revisa tu conexión.');
    } finally {
      setGuardando(false);
    }
  };

  const alternarActivo = async (m: TipoMembresia) => {
    try {
      await api.patch(`${ENDPOINTS.OWNER_MEMBRESIAS}/${idDe(m)}/toggle`);
      refetch();
    } catch (e: any) {
      Alert.alert('No se pudo cambiar el estado', e?.response?.data?.msg ?? 'Revisa tu conexión.');
    }
  };

  const eliminar = (m: TipoMembresia) => {
    Alert.alert(
      'Eliminar membresía',
      `¿Eliminar "${toStr(m.nombre)}"? Los miembros que ya la tienen conservan su vigencia.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`${ENDPOINTS.OWNER_MEMBRESIAS}/${idDe(m)}`);
              refetch();
            } catch (e: any) {
              Alert.alert('No se pudo eliminar', e?.response?.data?.msg ?? 'Revisa tu conexión.');
            }
          },
        },
      ],
    );
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando membresías…" />;

  const membresias = toArray<TipoMembresia>(data);

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <FlatList
        data={membresias}
        keyExtractor={(m, i) => String(m.id ?? m.id_membresia ?? i)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
        ListHeaderComponent={
          <Text style={styles.count}>{membresias.length} tipos de membresía</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay membresías configuradas.</Text>
          </View>
        }
        renderItem={({ item: m }) => {
          const dur        = duracionLabel(m);
          const beneficios = beneficiosList(m, 6);   // la tarjeta muestra hasta 6
          const combo      = Array.isArray(m.items_combo) ? m.items_combo : [];
          const activa     = m.activo !== false;
          const promo      = esPromocion(m);
          return (
            <View style={[styles.card, promo && styles.cardPromo]}>
              {/* Encabezado: superficie neutra; el precio es el protagonista */}
              <View style={styles.head}>
                <View style={styles.headTop}>
                  <View style={styles.planIcon}>
                    <Ionicons name={m.es_combo ? 'gift' : 'card'} size={18} color={colors.accent} />
                  </View>
                  <Badge label={activa ? 'Activa' : 'Inactiva'} color={activa ? 'success' : 'error'} />
                </View>
                <Text style={styles.planName} numberOfLines={1}>{toStr(m.nombre)}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, promo && { color: colors.promo }]}>${m.precio}</Text>
                  {dur ? <Text style={styles.priceDur}>/ {dur}</Text> : null}
                </View>

                {/* Etiquetas: promoción vigente y combo */}
                {(promo || m.es_combo) && (
                  <View style={styles.tagRow}>
                    {promo && (
                      <View style={styles.tagPromo}>
                        <Ionicons name="flame" size={11} color={colors.promo} />
                        <Text style={styles.tagPromoText}>
                          {m.dias_restantes_promo == null
                            ? 'Promoción'
                            : `Termina en ${m.dias_restantes_promo} d`}
                        </Text>
                      </View>
                    )}
                    {m.es_combo && (
                      <View style={styles.tagCombo}>
                        <Text style={styles.tagComboText}>Combo</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Cuerpo */}
              <View style={styles.body}>
                {m.descripcion ? (
                  <Text style={styles.descripcion}>{m.descripcion}</Text>
                ) : null}

                {beneficios.length > 0 ? (
                  <View style={styles.benefitsList}>
                    {beneficios.map((b, i) => (
                      <View key={i} style={styles.benefitRow}>
                        <Ionicons name="checkmark-circle" size={15} color={colors.dataProgreso} />
                        <Text style={styles.benefitText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {combo.length > 0 ? (
                  <View style={styles.comboBox}>
                    <Text style={styles.comboTitle}>Incluye</Text>
                    {combo.map((it, i) => (
                      <Text key={i} style={styles.comboItem}>
                        {it.cantidad && it.cantidad > 1 ? `${it.cantidad} x ` : ''}
                        {toStr(it.nombre)}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {!m.descripcion && beneficios.length === 0 && combo.length === 0 ? (
                  <Text style={styles.noInfo}>Sin descripción configurada.</Text>
                ) : null}

                {/* Acciones */}
                <View style={styles.accionesRow}>
                  <TouchableOpacity
                    style={[styles.accionBtn, styles.accionPrimaria]}
                    onPress={() => abrirEdicion(m)}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${toStr(m.nombre)}`}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.onAccent} />
                    <Text style={styles.accionPrimariaText}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.accionBtn}
                    onPress={() => alternarActivo(m)}
                    accessibilityRole="button"
                    accessibilityLabel={activa ? 'Desactivar membresía' : 'Activar membresía'}
                  >
                    <Ionicons
                      name={activa ? 'eye-off-outline' : 'eye-outline'}
                      size={16} color={colors.text}
                    />
                    <Text style={styles.accionText}>{activa ? 'Ocultar' : 'Activar'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.accionBtn}
                    onPress={() => eliminar(m)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${toStr(m.nombre)}`}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.dataRiesgo} />
                    <Text style={[styles.accionText, { color: colors.dataRiesgo }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Alta de membresía */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={abrirAlta}
        accessibilityRole="button"
        accessibilityLabel="Crear membresía"
      >
        <Ionicons name="add" size={26} color={colors.onAccent} />
      </TouchableOpacity>

      {/* Formulario */}
      <Modal visible={showForm} transparent animationType="slide"
             onRequestClose={() => setShowForm(false)}>
        <View style={styles.overlay}>
          <View style={[styles.hoja, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.hojaHeader}>
              <Text style={styles.hojaTitulo}>
                {editando ? 'Editar membresía' : 'Nueva membresía'}
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
                placeholder="Mensual Plus"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Nombre de la membresía"
              />

              <View style={styles.campoFila}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.campoLabel}>Precio</Text>
                  <TextInput
                    style={styles.campo}
                    value={form.precio}
                    onChangeText={(v) => setForm((f) => ({ ...f, precio: v.replace(/[^\d.,]/g, '') }))}
                    placeholder="500"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Precio"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.campoLabel}>Duración (meses)</Text>
                  <TextInput
                    style={styles.campo}
                    value={form.duracion_meses}
                    onChangeText={(v) => setForm((f) => ({ ...f, duracion_meses: v.replace(/\D/g, '') }))}
                    placeholder="1"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    accessibilityLabel="Duración en meses"
                  />
                </View>
              </View>

              <Text style={styles.campoLabel}>Descripción</Text>
              <TextInput
                style={[styles.campo, styles.campoArea]}
                value={form.descripcion}
                onChangeText={(v) => setForm((f) => ({ ...f, descripcion: v }))}
                placeholder="Qué incluye esta membresía"
                placeholderTextColor={colors.textMuted}
                multiline
                accessibilityLabel="Descripción"
              />

              <Text style={styles.campoLabel}>Beneficios</Text>
              <Text style={styles.campoAyuda}>Uno por renglón. Aparecen con palomita en la tarjeta.</Text>
              <TextInput
                style={[styles.campo, styles.campoArea]}
                value={form.beneficios}
                onChangeText={(v) => setForm((f) => ({ ...f, beneficios: v }))}
                placeholder={'Acceso ilimitado\nClases grupales\nAsesoría nutricional'}
                placeholderTextColor={colors.textMuted}
                multiline
                accessibilityLabel="Beneficios, uno por renglón"
              />

              {/* Promoción */}
              <View style={styles.promoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoTitulo}>Es una promoción</Text>
                  <Text style={styles.campoAyuda}>
                    Se destaca en la app y deja de ofrecerse al llegar su fecha de término.
                  </Text>
                </View>
                <Switch
                  value={form.esPromocion}
                  onValueChange={(v) => setForm((f) => ({ ...f, esPromocion: v }))}
                  trackColor={{ false: colors.border, true: colors.promo }}
                  thumbColor={form.esPromocion ? colors.onAccent : colors.textMuted}
                  accessibilityLabel="Marcar como promoción"
                />
              </View>

              {form.esPromocion ? (
                <SelectorFecha
                  label="Termina el"
                  value={form.fechaFinPromo}
                  onChange={(v) => setForm((f) => ({ ...f, fechaFinPromo: v }))}
                  anioMinimo={new Date().getFullYear()}
                  anioMaximo={new Date().getFullYear() + 3}
                  accessibilityLabel="Fecha de término de la promoción"
                />
              ) : null}

              <TouchableOpacity
                style={[styles.guardarBtn, guardando && { opacity: 0.6 }]}
                onPress={guardar}
                disabled={guardando}
                accessibilityRole="button"
                accessibilityLabel="Guardar membresía"
              >
                <Ionicons name={guardando ? 'hourglass-outline' : 'checkmark-circle-outline'}
                          size={19} color={colors.onAccent} />
                <Text style={styles.guardarText}>{guardando ? 'Guardando…' : 'Guardar'}</Text>
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
    list:    { padding: 16, gap: 14, paddingBottom: 32 },
    count:   { color: colors.textSecondary, fontSize: 13 * fs, marginBottom: 2 },
    card: {
      backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden',
    },
    // Halo comercial de las promociones vigentes, igual que en la web
    cardPromo: {
      borderColor: colors.promo,
      shadowColor: colors.promo, shadowOpacity: 0.3, shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 }, elevation: 6,
    },
    head:     { padding: 18, gap: 6, backgroundColor: colors.cardAlt,
                borderBottomWidth: 1, borderBottomColor: colors.border },
    headTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.accentBg,
                alignItems: 'center', justifyContent: 'center' },
    planName: { color: colors.text, fontSize: 18 * fs, fontWeight: '800', marginTop: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    price:    { color: colors.accent, fontSize: 28 * fs, fontWeight: '900', letterSpacing: -0.5 },
    priceDur: { color: colors.textSecondary, fontSize: 14 * fs, fontWeight: '600' },
    tagRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tagPromo: { flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: colors.promoBg, borderRadius: 7,
                paddingHorizontal: 8, paddingVertical: 3 },
    tagPromoText: { color: colors.promo, fontSize: 11 * fs, fontWeight: '700' },
    tagCombo: { backgroundColor: colors.accentBg, borderRadius: 7,
                paddingHorizontal: 8, paddingVertical: 3 },
    tagComboText: { color: colors.accent, fontSize: 11 * fs, fontWeight: '700' },

    body:     { padding: 16, gap: 10 },
    comboBox: { backgroundColor: colors.surface, borderRadius: 10, padding: 10, gap: 3 },
    comboTitle: { color: colors.textSecondary, fontSize: 11 * fs, fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: 0.4 },
    comboItem:  { color: colors.text, fontSize: 13 * fs },
    descripcion: { color: colors.textSecondary, fontSize: 13 * fs, lineHeight: 19 },
    benefitsList: { gap: 7 },
    benefitRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    benefitText:  { color: colors.text, fontSize: 13 * fs, flex: 1 },
    noInfo:   { color: colors.textMuted, fontSize: 12 * fs, fontStyle: 'italic' },
    empty:    { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyText:{ color: colors.textMuted, fontSize: 14 * fs },

    // ── Acciones de cada tarjeta ────────────────────────────────────────────
    accionesRow: {
      flexDirection: 'row', gap: 7, marginTop: 6,
      borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12,
    },
    accionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
      paddingVertical: 10, borderRadius: 10,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    accionPrimaria:     { backgroundColor: colors.accent, borderColor: colors.accent },
    accionPrimariaText: { color: colors.onAccent, fontSize: 12.5 * fs, fontWeight: '700' },
    accionText:         { color: colors.text, fontSize: 12.5 * fs, fontWeight: '600' },

    // ── Alta y edición ──────────────────────────────────────────────────────
    fab: {
      position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
      backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
      shadowColor: colors.shadow, shadowOpacity: 0.3, shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    hoja: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingTop: 18, maxHeight: '92%',
    },
    hojaHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 6,
    },
    hojaTitulo: { color: colors.text, fontSize: 18 * fs, fontWeight: '800' },

    campoLabel: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '700',
                  marginTop: 14, marginBottom: 6 },
    campoAyuda: { color: colors.textMuted, fontSize: 11 * fs, marginBottom: 6, marginTop: -2 },
    campoFila:  { flexDirection: 'row', gap: 12 },
    campo: {
      backgroundColor: colors.inputBg, borderRadius: 11, paddingHorizontal: 14,
      paddingVertical: 11, color: colors.text, fontSize: 14 * fs,
      borderWidth: 1, borderColor: colors.border,
    },
    campoArea: { minHeight: 84, textAlignVertical: 'top' },

    promoRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18,
      backgroundColor: colors.surface, borderRadius: 12, padding: 13,
    },
    promoTitulo: { color: colors.text, fontSize: 13.5 * fs, fontWeight: '700' },

    guardarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
      backgroundColor: colors.accent, borderRadius: 13, paddingVertical: 15,
      marginTop: 22, marginBottom: 8,
    },
    guardarText: { color: colors.onAccent, fontSize: 15 * fs, fontWeight: '700' },
  });
}
