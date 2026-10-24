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
import { Colors } from '../../constants/Colors';
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
  duracion_dias?: number;
  descripcion?:   string;
  beneficios?:    string;
  activo?:        boolean;
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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.count}>{membresias.length} tipos de membresía</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay membresías configuradas.</Text>
          </View>
        }
        renderItem={({ item: m }) => (
          <View style={styles.card} accessible accessibilityLabel={`${m.nombre}, $${m.precio}`}>
            {/* Banner de precio */}
            <View style={styles.priceBox}>
              <Text style={styles.priceAmount}>${m.precio}</Text>
              {m.duracion_dias ? (
                <Text style={styles.priceDuration}>{m.duracion_dias} días</Text>
              ) : null}
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.nombre}>{toStr(m.nombre)}</Text>
                <Badge
                  label={m.activo !== false ? 'Activa' : 'Inactiva'}
                  color={m.activo !== false ? 'success' : 'error'}
                />
              </View>
              {m.descripcion ? (
                <Text style={styles.descripcion} numberOfLines={2}>{m.descripcion}</Text>
              ) : null}
              {m.beneficios ? (
                <Text style={styles.beneficios} numberOfLines={3}>{m.beneficios}</Text>
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:   { flex: 1, backgroundColor: colors.background },
  list:     { padding: 16, gap: 12, paddingBottom: 32 },
  headerRow:{ marginBottom: 4 },
  count:    { color: colors.textSecondary, fontSize: 13 * fs },
  card: {
    backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  priceBox: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'baseline', gap: 8,
  },
  priceAmount:   { color: '#fff', fontSize: 28 * fs, fontWeight: '800' },
  priceDuration: { color: 'rgba(255,255,255,0.75)', fontSize: 14 * fs },
  nameRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  nombre:      { color: colors.text, fontSize: 16 * fs, fontWeight: '700', flex: 1, marginRight: 8 },
  descripcion: { color: colors.textSecondary, fontSize: 13 * fs, marginTop: 2, padding: 16, paddingTop: 0 },
  beneficios:  { color: colors.textMuted, fontSize: 12 * fs, padding: 16, paddingTop: 4 },
  empty:       { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:   { color: colors.textMuted, fontSize: 14 * fs },
});
}

// Patch: renderItem accede al padding en nameRow dentro del card body
