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

interface TipoMembresia {
  id?:            number;
  id_membresia?:  number;
  nombre:         string;
  precio:         number;
  duracion_dias?:  number;
  duracion_meses?: number;
  descripcion?:   string;
  beneficios?:    string;
  activo?:        boolean;
}

function duracionLabel(m: TipoMembresia): string | null {
  if (m.duracion_meses) return `${m.duracion_meses} ${m.duracion_meses === 1 ? 'mes' : 'meses'}`;
  if (m.duracion_dias)  return `${m.duracion_dias} días`;
  return null;
}

function beneficiosList(m: TipoMembresia): string[] {
  if (!m.beneficios) return [];
  return m.beneficios.split(/[\n,•·]/).map((b) => b.trim()).filter(Boolean).slice(0, 5);
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
          const dur = duracionLabel(m);
          const beneficios = beneficiosList(m);
          const activa = m.activo !== false;
          return (
            <View style={styles.card}>
              {/* Encabezado: superficie neutra; el precio es el protagonista */}
              <View style={styles.head}>
                <View style={styles.headTop}>
                  <View style={styles.planIcon}>
                    <Ionicons name="card" size={18} color={colors.accent} />
                  </View>
                  <Badge label={activa ? 'Activa' : 'Inactiva'} color={activa ? 'success' : 'error'} />
                </View>
                <Text style={styles.planName} numberOfLines={1}>{toStr(m.nombre)}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>${m.precio}</Text>
                  {dur ? <Text style={styles.priceDur}>/ {dur}</Text> : null}
                </View>
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
                        <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                        <Text style={styles.benefitText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {!m.descripcion && beneficios.length === 0 ? (
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
    head:     { padding: 18, gap: 6, backgroundColor: colors.cardAlt,
                borderBottomWidth: 1, borderBottomColor: colors.border },
    headTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.accentBg,
                alignItems: 'center', justifyContent: 'center' },
    planName: { color: colors.text, fontSize: 18 * fs, fontWeight: '800', marginTop: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    price:    { color: colors.accent, fontSize: 28 * fs, fontWeight: '900', letterSpacing: -0.5 },
    priceDur: { color: colors.textSecondary, fontSize: 14 * fs, fontWeight: '600' },
    body:     { padding: 16, gap: 10 },
    descripcion: { color: colors.textSecondary, fontSize: 13 * fs, lineHeight: 19 },
    benefitsList: { gap: 7 },
    benefitRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    benefitText:  { color: colors.text, fontSize: 13 * fs, flex: 1 },
    noInfo:   { color: colors.textMuted, fontSize: 12 * fs, fontStyle: 'italic' },
    empty:    { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyText:{ color: colors.textMuted, fontSize: 14 * fs },
  });
}
