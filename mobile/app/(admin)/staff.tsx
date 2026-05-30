/**
 * Staff del Gimnasio — Owner Gym
 * GET /api/owner_gym/staff → lista de entrenadores y recepcionistas
 */
import React from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
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
}

interface StaffResponse {
  staff?: StaffMember[];
  entrenadores?: StaffMember[];
  recepcionistas?: StaffMember[];
}

export default function StaffScreen() {
  const insets = useSafeAreaInsets();
  const { data, loading, refetch } = useFetch<StaffResponse>(ENDPOINTS.OWNER_STAFF);

  if (loading) return <LoadingSpinner fullScreen message="Cargando staff…" />;

  // La API puede devolver { staff: [...] } o listas separadas por rol
  const staff: StaffMember[] = toArray(
    data?.staff ??
    [...toArray(data?.entrenadores), ...toArray(data?.recepcionistas)]
  );

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <FlatList
        data={staff}
        keyExtractor={(s, i) => String(s.id ?? i)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.count}>{staff.length} miembros del staff</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No hay staff registrado.</Text>
          </View>
        }
        renderItem={({ item: s }) => (
          <View style={styles.card} accessible accessibilityLabel={`${s.nombre}, ${s.rol ?? 'Staff'}`}>
            <View style={styles.avatar}>
              <Text style={styles.initial}>{toInitial(s.nombre)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{toStr(s.nombre)}</Text>
              {s.email ? <Text style={styles.email}>{s.email}</Text> : null}
              {s.especializacion ? (
                <Text style={styles.especializacion}>{s.especializacion}</Text>
              ) : null}
              {s.telefono ? (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={12} color={Colors.textMuted} />
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

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.background },
  list:    { padding: 16, gap: 10, paddingBottom: 32 },
  header:  { marginBottom: 4 },
  count:   { color: Colors.textSecondary, fontSize: 13 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  initial:         { color: Colors.accent, fontSize: 18, fontWeight: '700' },
  nombre:          { color: Colors.text, fontSize: 15, fontWeight: '600' },
  email:           { color: Colors.textSecondary, fontSize: 12, marginTop: 1 },
  especializacion: { color: Colors.accent, fontSize: 12, marginTop: 2 },
  phoneRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  phone:           { color: Colors.textMuted, fontSize: 11 },
  badges:          { gap: 4, alignItems: 'flex-end' },
  empty:           { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:       { color: Colors.textMuted, fontSize: 14 },
});
