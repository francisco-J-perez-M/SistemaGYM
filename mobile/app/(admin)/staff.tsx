/**
 * Staff del Gimnasio — Owner Gym
 * GET /api/owner_gym/staff → lista de entrenadores y recepcionistas
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray, toInitial } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';

interface StaffMember {
  id?:       number;
  nombre:    string;
  email?:    string;
  rol?:      string;
  activo?:   boolean;
  telefono?: string;
  especializacion?: string;
  foto_perfil?: string | null;   // base64 data URI (Usuario.to_dict)
}

interface StaffResponse {
  staff?: StaffMember[];
  entrenadores?: StaffMember[];
  recepcionistas?: StaffMember[];
}

export default function StaffScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { data, loading, refetch } = useFetch<StaffMember[] | StaffResponse>(ENDPOINTS.OWNER_STAFF);

  if (loading) return <LoadingSpinner fullScreen message="Cargando staff…" />;

  // GET /api/owner_gym/staff → array crudo [u.to_dict(), ...]
  const raw = data as any;
  const staff: StaffMember[] = toArray(
    Array.isArray(raw)
      ? raw
      : raw?.staff ?? [...toArray(raw?.entrenadores), ...toArray(raw?.recepcionistas)]
  );

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <FlatList
        data={staff}
        keyExtractor={(s, i) => String(s.id ?? i)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.count}>{staff.length} miembros del staff</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay staff registrado.</Text>
          </View>
        }
        renderItem={({ item: s }) => (
          <View style={styles.card} accessible accessibilityLabel={`${s.nombre}, ${s.rol ?? 'Staff'}`}>
            {s.foto_perfil && s.foto_perfil.startsWith('data:image') ? (
              <Image source={{ uri: s.foto_perfil }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.initial}>{toInitial(s.nombre)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{toStr(s.nombre)}</Text>
              {s.email ? <Text style={styles.email}>{s.email}</Text> : null}
              {s.especializacion ? (
                <Text style={styles.especializacion}>{s.especializacion}</Text>
              ) : null}
              {s.telefono ? (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.phone}>{s.telefono}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.badges}>
              {s.rol ? (
                <Badge
                  label={s.rol}
                  color={s.rol.toLowerCase().includes('entren') ? 'accent' : 'info'}
                />
              ) : null}
              <Badge
                label={s.activo !== false ? 'Activo' : 'Inactivo'}
                color={s.activo !== false ? 'success' : 'error'}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  list:    { padding: 16, gap: 10, paddingBottom: 32 },
  header:  { marginBottom: 4 },
  count:   { color: colors.textSecondary, fontSize: 13 * fs },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.surface },
  initial:         { color: colors.accent, fontSize: 18 * fs, fontWeight: '700' },
  nombre:          { color: colors.text, fontSize: 15 * fs, fontWeight: '600' },
  email:           { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 1 },
  especializacion: { color: colors.accent, fontSize: 12 * fs, marginTop: 2 },
  phoneRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  phone:           { color: colors.textMuted, fontSize: 11 * fs },
  badges:          { gap: 4, alignItems: 'flex-end' },
  empty:           { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:       { color: colors.textMuted, fontSize: 14 * fs },
});
}
