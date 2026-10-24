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
import type { TrainerClient } from '../../types';

export default function TrainerMembersScreen() {
  const insets = useSafeAreaInsets();
  const { data: clients, loading, refetch } = useFetch<TrainerClient[]>(ENDPOINTS.TRAINER_CLIENTS);
  const [search, setSearch] = useState('');

  const filtered = (clients ?? []).filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner fullScreen message="Cargando clientes…" />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Mis Clientes</Text>
        <Text style={styles.sub}>{(clients ?? []).length} clientes asignados</Text>

        <View style={styles.searchBox} accessibilityLabel="Buscar cliente">
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o correo…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            accessibilityLabel="Campo de búsqueda"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Limpiar búsqueda">
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>{search ? 'Sin resultados' : 'No tienes clientes asignados.'}</Text>
          </View>
        }
        renderItem={({ item: c }) => (
          <View style={styles.clientCard} accessible accessibilityLabel={`Cliente: ${c.nombre}`}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientInitial}>{c.nombre.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{c.nombre}</Text>
              <Text style={styles.clientEmail}>{c.email}</Text>
              {c.objetivo && <Text style={styles.clientGoal}>{c.objetivo}</Text>}
            </View>
            {c.progreso !== undefined && (
              <View style={styles.progressWrap}>
                <Text style={styles.progressPct}>{c.progreso}%</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${c.progreso}%` as any }]} />
                </View>
              </View>
            )}
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
  list: { padding: 20, gap: 10, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  clientAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  clientInitial: { color: Colors.accent, fontSize: 18, fontWeight: '700' },
  clientName:    { color: Colors.text, fontSize: 15, fontWeight: '600' },
  clientEmail:   { color: Colors.textSecondary, fontSize: 12 },
  clientGoal:    { color: Colors.accent, fontSize: 11, marginTop: 2 },
  progressWrap:  { alignItems: 'flex-end', gap: 4 },
  progressPct:   { color: Colors.accent, fontSize: 13, fontWeight: '700' },
  progressBar:   { width: 60, height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
});
