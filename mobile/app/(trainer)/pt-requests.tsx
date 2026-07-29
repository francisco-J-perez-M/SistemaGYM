/**
 * Solicitudes PT — Entrenador
 * GET /api/trainer/pt-requests → solicitudes de entrenamiento personal
 * POST /api/trainer/pt-requests/:id/accept|reject
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toDateStr, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import * as Haptics from 'expo-haptics';

type Estado = 'pendiente' | 'aceptada' | 'rechazada';
type Filter  = 'todas' | Estado;

interface PTRequest {
  _id:          string;
  nombre_miembro?: string;
  email_miembro?:  string;
  fecha?:          string;
  mensaje?:        string;
  estado?:         Estado;
}

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: 'todas',     label: 'Todas'     },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aceptada',  label: 'Aceptadas'  },
  { key: 'rechazada', label: 'Rechazadas' },
];

const BADGE_COLOR: Record<Estado, 'warning' | 'success' | 'error'> = {
  pendiente: 'warning',
  aceptada:  'success',
  rechazada: 'error',
};

export default function PTRequestsScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('todas');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { data, loading, refetch } = useFetch<{ solicitudes: PTRequest[] }>(ENDPOINTS.TRAINER_PT_REQUESTS);

  const requests = toArray(data?.solicitudes).filter(
    (r) => filter === 'todas' || r.estado === filter,
  );

  const handleAction = (id: string, action: 'accept' | 'reject') => {
    const verb = action === 'accept' ? 'aceptar' : 'rechazar';
    Alert.alert(
      `Confirmar`,
      `¿Deseas ${verb} esta solicitud?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action === 'accept' ? 'Aceptar' : 'Rechazar',
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(id);
            try {
              await api.patch(`${ENDPOINTS.TRAINER_PT_REQUESTS}/${id}`, {
                accion: action === 'accept' ? 'aceptar' : 'rechazar',
              });
              refetch();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo procesar');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando solicitudes…" />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Solicitudes PT</Text>
        <Text style={styles.sub}>{toArray(data?.solicitudes).filter((r) => r.estado === 'pendiente').length} pendientes</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {FILTER_LABELS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterChip, filter === key && styles.filterChipActive]}
            onPress={() => setFilter(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === key }}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
        keyExtractor={(r, i) => r._id ?? String(i)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="hand-left-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyText}>Sin solicitudes {filter !== 'todas' ? `"${filter}"` : ''}.</Text>
          </View>
        }
        renderItem={({ item: r }) => {
          const estado = (r.estado ?? 'pendiente') as Estado;
          const isPending = estado === 'pendiente';
          return (
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarInitials}>
                    {toStr(r.nombre_miembro, '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{toStr(r.nombre_miembro, 'Miembro')}</Text>
                  {r.email_miembro && (
                    <Text style={styles.memberEmail}>{r.email_miembro}</Text>
                  )}
                  <Text style={styles.dateText}>{toDateStr(r.fecha)}</Text>
                </View>
                <Badge label={estado} color={BADGE_COLOR[estado]} />
              </View>

              {r.mensaje ? (
                <View style={styles.msgBox}>
                  <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.msgText} numberOfLines={3}>{r.mensaje}</Text>
                </View>
              ) : null}

              {isPending && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleAction(r._id, 'accept')}
                    disabled={actionLoading === r._id}
                    accessibilityLabel="Aceptar solicitud"
                  >
                    <Ionicons name="checkmark-outline" size={16} color={colors.onAccent} />
                    <Text style={styles.actionBtnText}>Aceptar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleAction(r._id, 'reject')}
                    disabled={actionLoading === r._id}
                    accessibilityLabel="Rechazar solicitud"
                    accessibilityHint="Rechaza permanentemente esta solicitud de entrenamiento"
                  >
                    <Ionicons name="close-outline" size={16} color={colors.error} />
                    <Text style={[styles.actionBtnText, { color: colors.error }]}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          );
        }}
      />
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  header:  { paddingHorizontal: 20, gap: 2, paddingBottom: 12 },
  title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
  sub:     { color: colors.textSecondary, fontSize: 13 * fs },
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive:  { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText:        { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
  filterTextActive:  { color: colors.onAccent },
  list:   { paddingHorizontal: 20, gap: 12, paddingBottom: 32 },
  empty:  { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 14 * fs, fontWeight: '600' },
  card:    { gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatarBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: colors.onAccent, fontSize: 18 * fs, fontWeight: '800' },
  memberName:  { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },
  memberEmail: { color: colors.textSecondary, fontSize: 12 * fs },
  dateText:    { color: colors.textMuted, fontSize: 11 * fs, marginTop: 2 },
  msgBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.cardAlt,
    borderRadius: 10, padding: 10,
  },
  msgText: { color: colors.textSecondary, fontSize: 13 * fs, flex: 1, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
  },
  acceptBtn: { backgroundColor: colors.accent },
  rejectBtn: { backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.error },
  actionBtnText: { color: colors.onAccent, fontSize: 14 * fs, fontWeight: '700' },
});
}
