/**
 * Solicitudes PT — Entrenador
 * GET /api/trainer/pt-requests → solicitudes de entrenamiento personal
 * POST /api/trainer/pt-requests/:id/accept|reject
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toDateStr, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

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
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('todas');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { data, loading, refetch } = useFetch<PTRequest[]>(ENDPOINTS.TRAINER_PT_REQUESTS);

  const requests = toArray(data).filter(
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
              await api.post(`${ENDPOINTS.TRAINER_PT_REQUESTS}/${id}/${action}`);
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
        <Text style={styles.sub}>{toArray(data).filter((r) => r.estado === 'pendiente').length} pendientes</Text>
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
        keyExtractor={(r) => r._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="hand-left-outline" size={44} color={Colors.textMuted} />
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
                  <Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondary} />
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
                    <Ionicons name="checkmark-outline" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Aceptar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleAction(r._id, 'reject')}
                    disabled={actionLoading === r._id}
                    accessibilityLabel="Rechazar solicitud"
                  >
                    <Ionicons name="close-outline" size={16} color={Colors.error} />
                    <Text style={[styles.actionBtnText, { color: Colors.error }]}>Rechazar</Text>
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

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.background },
  header:  { paddingHorizontal: 20, gap: 2, paddingBottom: 12 },
  title:   { color: Colors.text, fontSize: 26, fontWeight: '700' },
  sub:     { color: Colors.textSecondary, fontSize: 13 },
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive:  { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterText:        { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filterTextActive:  { color: '#fff' },
  list:   { paddingHorizontal: 20, gap: 12, paddingBottom: 32 },
  empty:  { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  card:    { gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatarBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: '#fff', fontSize: 18, fontWeight: '800' },
  memberName:  { color: Colors.text, fontSize: 15, fontWeight: '700' },
  memberEmail: { color: Colors.textSecondary, fontSize: 12 },
  dateText:    { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  msgBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.backgroundAlt ?? Colors.card,
    borderRadius: 10, padding: 10,
  },
  msgText: { color: Colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
  },
  acceptBtn: { backgroundColor: Colors.accent },
  rejectBtn: { backgroundColor: Colors.errorBg, borderWidth: 1, borderColor: Colors.error },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
