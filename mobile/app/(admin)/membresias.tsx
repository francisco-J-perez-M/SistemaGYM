/**
 * Gestión de Membresías — Owner Gym
 * GET /api/owner_gym/membresias → tipos de membresía del gimnasio
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';

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
function beneficiosList(m: TipoMembresia): string[] {
  const b = m.beneficios;
  if (!b) return [];
  if (Array.isArray(b)) {
    return b.map((x) => String(x).trim()).filter(Boolean).slice(0, 6);
  }
  return String(b).split(/[\n,•·]/).map((x) => x.trim()).filter(Boolean).slice(0, 6);
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

export default function MembresiasScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { data, loading, refetch } = useFetch<TipoMembresia[]>(ENDPOINTS.OWNER_MEMBRESIAS);

  if (loading) return <LoadingSpinner fullScreen message="Cargando membresías…" />;

  const membresias = toArray(data);

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
          const beneficios = beneficiosList(m);
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
              </View>
            </View>
          );
        }}
      />
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
  });
}
