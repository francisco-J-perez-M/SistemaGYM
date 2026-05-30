import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toDateStr, toInitial, toStr, matchesSearch, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import type { MiembrosResponse } from '../../types';

export default function AdminMembersScreen() {
  const insets = useSafeAreaInsets();
  // API devuelve { miembros: [...], total: N, pages: N, current_page: N }
  const { data, loading, refetch } = useFetch<MiembrosResponse>(ENDPOINTS.MIEMBROS);
  const [search, setSearch] = useState('');

  const allMembers = toArray(data?.miembros);
  const filtered   = allMembers.filter(
    (m) => matchesSearch(m, ['nombre', 'email'], search)
  );

  if (loading) return <LoadingSpinner fullScreen message="Cargando miembros…" />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Miembros</Text>
        <Text style={styles.sub}>{data?.total ?? allMembers.length} miembros registrados</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar miembro…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Buscar miembro"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Limpiar">
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(m, i) => m._id ?? String(i)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>{search ? 'Sin resultados' : 'No hay miembros.'}</Text>
          </View>
        }
        renderItem={({ item: m }) => (
          <View style={styles.memberCard} accessible accessibilityLabel={`Miembro: ${m.nombre}`}>
            <View style={styles.avatar}>
              <Text style={styles.initial}>{toInitial(m.nombre)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{toStr(m.nombre)}</Text>
              <Text style={styles.email}>{toStr(m.email)}</Text>
              {m.membresia ? <Text style={styles.membresia}>{toStr(m.membresia)}</Text> : null}
              {m.fecha_ingreso ? <Text style={styles.fecha}>Ingreso: {toDateStr(m.fecha_ingreso)}</Text> : null}
            </View>
            <Badge
              label={m.estado ?? 'Activo'}
              color={m.estado === 'Activo' || m.estado === 'activo' ? 'success' : 'warning'}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.background },
  header:  { paddingHorizontal: 20, gap: 6, paddingBottom: 12 },
  title:   { color: Colors.text, fontSize: 26, fontWeight: '700' },
  sub:     { color: Colors.textSecondary, fontSize: 13, marginBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },
  list:    { padding: 20, gap: 10, paddingBottom: 32 },
  empty:   { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  initial:   { color: Colors.accent, fontSize: 18, fontWeight: '700' },
  nombre:    { color: Colors.text, fontSize: 15, fontWeight: '600' },
  email:     { color: Colors.textSecondary, fontSize: 12 },
  membresia: { color: Colors.accent, fontSize: 11, marginTop: 1 },
  fecha:     { color: Colors.textMuted, fontSize: 11 },
});
