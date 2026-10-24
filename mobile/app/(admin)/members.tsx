import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toDateStr, toInitial, toStr, matchesSearch, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import type { MiembrosResponse } from '../../types';

export default function AdminMembersScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
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
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar miembro…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Buscar miembro"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Limpiar">
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(m, i) => m.id ?? m._id ?? String(i)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>{search ? 'Sin resultados' : 'No hay miembros.'}</Text>
          </View>
        }
        renderItem={({ item: m }) => (
          <View style={styles.memberCard} accessible accessibilityLabel={`Miembro: ${m.nombre}`}>
            {m.foto_perfil && m.foto_perfil.startsWith('data:image') ? (
              <Image source={{ uri: m.foto_perfil }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.initial}>{toInitial(m.nombre)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{toStr(m.nombre)}</Text>
              <Text style={styles.email}>{toStr(m.email)}</Text>
              {m.membresia?.nombre ? <Text style={styles.membresia}>{m.membresia.nombre}</Text> : null}
              {m.fecha_ingreso ? <Text style={styles.fecha}>Ingreso: {toDateStr(m.fecha_ingreso)}</Text> : null}
            </View>
            <Badge
              label={m.activo === false ? 'Inactivo' : 'Activo'}
              color={m.activo === false ? 'warning' : 'success'}
            />
          </View>
        )}
      />
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  header:  { paddingHorizontal: 20, gap: 6, paddingBottom: 12 },
  title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
  sub:     { color: colors.textSecondary, fontSize: 13 * fs, marginBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 * fs },
  list:    { padding: 20, gap: 10, paddingBottom: 32 },
  empty:   { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 14 * fs },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface },
  initial:   { color: colors.accent, fontSize: 18 * fs, fontWeight: '700' },
  nombre:    { color: colors.text, fontSize: 15 * fs, fontWeight: '600' },
  email:     { color: colors.textSecondary, fontSize: 12 * fs },
  membresia: { color: colors.accent, fontSize: 11 * fs, marginTop: 1 },
  fecha:     { color: colors.textMuted, fontSize: 11 * fs },
});
}
