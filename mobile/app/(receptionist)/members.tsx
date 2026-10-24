/**
 * Miembros (recepcionista) — búsqueda y estado de membresía.
 * Contrato real: GET /api/recepcionista/members?q= → { miembros: [...] }
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray, toDateStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { ReceptionistMember } from '../../types';

const STATUS: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' }> = {
  activa:        { label: 'Activa',        color: 'success' },
  por_vencer:    { label: 'Por vencer',    color: 'warning' },
  vencida:       { label: 'Vencida',       color: 'error'   },
  sin_membresia: { label: 'Sin membresía', color: 'info'    },
};

export default function ReceptionistMembersScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const { data, loading, refetch } =
    useFetch<{ miembros: ReceptionistMember[] }>(`${ENDPOINTS.RECEP_MEMBERS}?q=${encodeURIComponent(search)}`);
  const members = toArray<ReceptionistMember>(data?.miembros);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title} accessibilityRole="header">Miembros</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre o email…"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
          />
        </View>
      </View>

      {loading && members.length === 0 ? (
        <LoadingSpinner fullScreen message="Cargando miembros…" />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyText}>Sin resultados.</Text>
            </View>
          }
          renderItem={({ item: m }) => {
            const st = STATUS[m.mem_status] ?? STATUS.sin_membresia;
            return (
              <Card style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.initial}>{m.nombre.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{m.nombre}</Text>
                    <Text style={styles.sub} numberOfLines={1}>{m.email}</Text>
                    {m.tipo_membresia ? (
                      <Text style={styles.plan}>
                        {m.tipo_membresia}{m.fecha_fin ? ` · vence ${toDateStr(m.fecha_fin)}` : ''}
                      </Text>
                    ) : null}
                  </View>
                  <Badge label={st.label} color={st.color} />
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    header:  { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
    title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.inputBg,
                 borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
    searchInput: { flex: 1, color: colors.text, paddingVertical: 12, fontSize: 15 * fs },
    content: { paddingHorizontal: 20, paddingBottom: 32 },
    empty:     { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: colors.textMuted, fontSize: 14 * fs },
    row:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar:  { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.accent,
               alignItems: 'center', justifyContent: 'center' },
    initial: { color: colors.onAccent, fontSize: 18 * fs, fontWeight: '800' },
    name:    { color: colors.text, fontSize: 15 * fs, fontWeight: '600' },
    sub:     { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
    plan:    { color: colors.accent, fontSize: 11 * fs, marginTop: 2 },
  });
}
