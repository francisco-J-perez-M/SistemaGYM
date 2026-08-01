/**
 * Pantalla Mis Clientes — lista de clientes del entrenador.
 *
 * GET /api/trainer/clients → {clients:[{id,name,goal,sessionsTotal,attendance,streak,status}], pagination}
 * Campos reales: id (no _id), name (no nombre), goal (no objetivo), attendance (% asistencia)
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toInitial, toStr, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import DetalleUsuario, { fechaFicha, UsuarioDetalle } from '../../components/usuarios/DetalleUsuario';
import type { TrainerClientsResponse, TrainerClientAPI } from '../../types';

const ESTADO_TEXTO: Record<string, string> = {
  active:  'Activo',
  at_risk: 'En riesgo',
};

/** Traduce un cliente del entrenador a la ficha genérica del detalle. */
function aDetalle(c: TrainerClientAPI): UsuarioDetalle {
  const anyC = c as any;
  return {
    nombre:    c.name,
    email:     anyC.email,
    telefono:  anyC.telefono ?? anyC.phone,
    foto:      anyC.foto_perfil ?? anyC.profilePhoto,
    activo:    c.status === 'active',
    subtitulo: c.goal ?? null,
    datos: [
      { icono: 'flag-outline',       etiqueta: 'Objetivo',        valor: c.goal },
      { icono: 'pulse-outline',      etiqueta: 'Estado',          valor: ESTADO_TEXTO[String(c.status)] ?? 'Inactivo' },
      { icono: 'barbell-outline',    etiqueta: 'Sesiones',        valor: c.sessionsTotal },
      { icono: 'trending-up-outline', etiqueta: 'Asistencia',     valor: c.attendance != null ? `${c.attendance}%` : null },
      { icono: 'flame-outline',      etiqueta: 'Racha',           valor: c.streak != null ? `${c.streak} días` : null },
      { icono: 'scale-outline',      etiqueta: 'Peso actual',     valor: anyC.currentWeight ? `${anyC.currentWeight} kg` : null },
      { icono: 'resize-outline',     etiqueta: 'Estatura',        valor: anyC.height ? `${anyC.height} m` : null },
      { icono: 'calendar-outline',   etiqueta: 'Última sesión',   valor: fechaFicha(anyC.ultima_sesion ?? anyC.lastSession) },
      { icono: 'mail-outline',       etiqueta: 'Correo',          valor: anyC.email },
    ],
  };
}

export default function TrainerMembersScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  // API devuelve {clients:[{id,name,goal,...}], pagination}
  const { data, loading, refetch } = useFetch<TrainerClientsResponse>(ENDPOINTS.TRAINER_CLIENTS);
  const [search, setSearch] = useState('');
  const [detalle, setDetalle] = useState<UsuarioDetalle | null>(null);

  const allClients = toArray<TrainerClientAPI>(data?.clients);
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
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre u objetivo…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            accessibilityLabel="Campo de búsqueda"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Limpiar búsqueda">
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {search ? 'Sin resultados' : 'No tienes clientes asignados.'}
            </Text>
          </View>
        }
        renderItem={({ item: c }: { item: TrainerClientAPI }) => (
          <TouchableOpacity
            style={styles.clientCard}
            activeOpacity={0.85}
            onPress={() => setDetalle(aDetalle(c))}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalle de ${toStr(c.name)}`}
          >
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
            <View style={styles.clientDerecha}>
              <Badge
                label={c.status === 'active' ? 'Activo' : c.status === 'at_risk' ? 'En riesgo' : 'Inactivo'}
                color={c.status === 'active' ? 'success' : c.status === 'at_risk' ? 'warning' : 'error'}
              />
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}
      />

      <DetalleUsuario
        usuario={detalle}
        onClose={() => setDetalle(null)}
        titulo="Detalle del cliente"
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
  list: { padding: 20, gap: 10, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 14 * fs },
  clientDerecha: { alignItems: 'flex-end', gap: 4 },
  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  clientAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center',
  },
  clientInitial: { color: colors.accent, fontSize: 18 * fs, fontWeight: '700' },
  clientName:    { color: colors.text, fontSize: 15 * fs, fontWeight: '600' },
  clientGoal:    { color: colors.accent, fontSize: 11 * fs, marginTop: 1 },
  clientStats:   { color: colors.textSecondary, fontSize: 11 * fs, marginTop: 2 },
});
}
