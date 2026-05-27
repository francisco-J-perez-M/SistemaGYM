import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import type { MiembroAdmin } from '../../types';

export default function AdminMembersScreen() {
  const insets = useSafeAreaInsets();
  const { data, loading, refetch } = useFetch<MiembroAdmin[]>(ENDPOINTS.MIEMBROS);
  const [search, setSearch] = useState('');

  const filtered = (data ?? []).filter(
    (m) =>
      m.nombre.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner fullScreen message="Cargando miembros…" />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Miembros</Text>
        <Text style={styles.sub}>{(data ?? []).length} miembros registrados</Text>

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
        keyExtractor={(m) => m._id}
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
              <Text style={styles.initial}>{m.nombre.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{m.nombre}</Text>
              <Text style={styles.email}>{m.email}</Text>
              {m.membresia && <Text style={styles.membresia}>{m.membresia}</Text>}
              {m.fecha_ingreso && <Text style={styles.fecha}>Ingreso: {m.fecha_ingreso.slice(0, 10)}</Text>}
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
