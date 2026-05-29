/**
 * Pantalla Mis Clientes — lista de clientes del entrenador.
 *
 * GET /api/trainer/clients → {clients:[{id,name,goal,sessionsTotal,attendance,streak,status}], pagination}
 * Campos reales: id (no _id), name (no nombre), goal (no objetivo), attendance (% asistencia)
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toInitial, toStr, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import type { TrainerClientsResponse, TrainerClientAPI } from '../../types';

export default function TrainerMembersScreen() {
  const insets = useSafeAreaInsets();
  // API devuelve {clients:[{id,name,goal,...}], pagination}
  const { data, loading, refetch } = useFetch<TrainerClientsResponse>(ENDPOINTS.TRAINER_CLIENTS);
  const [search, setSearch] = useState('');

  const allClients = toArray(data?.clients);
  const filtered   = allClients.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return toStr(c.name).toLowerCase().includes(term) ||
           toStr(c.goal).toLowerCase().includes(term);
  });

  if (loading) return <LoadingSpinner fullScreen message="Cargando clientes…" />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Mis Clientes</Text>
        <Text style={styles.sub}>{data?.pagination?.total ?? allClients.length} clientes asignados</Text>

        <View style={styles.searchBox} accessibilityLabel="Buscar cliente">
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre u objetivo…"
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
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {search ? 'Sin resultados' : 'No tienes clientes asignados.'}
            </Text>
          </View>
        }
        renderItem={({ item: c }: { item: TrainerClientAPI }) => (
          <View style={styles.clientCard} accessible accessibilityLabel={`Cliente: ${c.name}`}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientInitial}>{toInitial(c.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{toStr(c.name)}</Text>
              {c.goal ? <Text style={styles.clientGoal}>{toStr(c.goal)}</Text> : null}
              <Text style={styles.clientStats}>
                {c.sessionsTotal} sesiones · {c.attendance ?? 0}% asist. · {c.streak ?? 0} días racha
              </Text>
            </View>
            <Badge
              label={c.status === 'active' ? 'Activo' : c.status === 'at_risk' ? 'En riesgo' : 'Inactivo'}
              color={c.status === 'active' ? 'success' : c.status === 'at_risk' ? 'warning' : 'error'}
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
  clientGoal:    { color: Colors.accent, fontSize: 11, marginTop: 1 },
  clientStats:   { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
});
