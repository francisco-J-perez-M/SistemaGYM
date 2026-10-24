/**
 * Centro de notificaciones — ruta compartida por todos los roles.
 * Contrato real (api/app/routes/compartido/notificaciones.py):
 *   GET   /api/notificaciones                 → { notificaciones, no_leidas }
 *   PATCH /api/notificaciones/leer-todas      → marca todas como leídas
 *   PATCH /api/notificaciones/<id>/leer       → marca una como leída
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useFontScale } from '../hooks/useColors';
import { ENDPOINTS } from '../constants/Api';
import { useFetch } from '../hooks/useFetch';
import { toArray, toDateStr } from '../utils/format';
import ScreenHeader from '../components/ui/ScreenHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../services/api';
import type { NotificacionesResponse, Notificacion } from '../types';

function tipoIcon(tipo: string): React.ComponentProps<typeof Ionicons>['name'] {
  if (tipo?.startsWith('cita'))      return 'calendar-outline';
  if (tipo?.includes('membresia'))   return 'card-outline';
  if (tipo?.includes('pago'))        return 'cash-outline';
  if (tipo?.includes('rutina'))      return 'barbell-outline';
  return 'notifications-outline';
}

export default function NotificationsScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  const { data, loading, refetch } = useFetch<NotificacionesResponse>(ENDPOINTS.NOTIFICACIONES);
  const [items, setItems] = useState<Notificacion[] | null>(null);

  const lista = items ?? toArray<Notificacion>(data?.notificaciones);
  const noLeidas = lista.filter((n) => !n.leida).length;

  const markOne = async (n: Notificacion) => {
    if (n.leida) return;
    setItems(lista.map((x) => (x._id === n._id ? { ...x, leida: true } : x)));
    try { await api.patch(`${ENDPOINTS.NOTIFICACIONES}/${n._id}/leer`); }
    catch { /* silencioso: el optimismo de UI ya marcó leída */ }
  };

  const markAll = async () => {
    setItems(lista.map((x) => ({ ...x, leida: true })));
    try { await api.patch(ENDPOINTS.NOTIFICACIONES_LEER_TODAS); refetch(); }
    catch { /* silencioso */ }
  };

  if (loading && !data) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Notificaciones" showBack />
        <LoadingSpinner fullScreen message="Cargando notificaciones…" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Notificaciones"
        subtitle={noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
        showBack
        rightElement={
          noLeidas > 0 ? (
            <TouchableOpacity onPress={markAll} accessibilityRole="button" accessibilityLabel="Marcar todas como leídas">
              <Text style={styles.markAll}>Leer todas</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <FlatList
        data={lista}
        keyExtractor={(n) => n._id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setItems(null); refetch(); }} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No tienes notificaciones.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, !item.leida && styles.rowUnread]}
            onPress={() => markOne(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.titulo}. ${item.leida ? 'Leída' : 'No leída'}`}
          >
            <View style={[styles.iconBox, !item.leida && { backgroundColor: colors.accent + '1A' }]}>
              <Ionicons name={tipoIcon(item.tipo)} size={18} color={item.leida ? colors.textMuted : colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, !item.leida && { fontWeight: '700' }]} numberOfLines={1}>
                {item.titulo}
              </Text>
              <Text style={styles.rowMsg} numberOfLines={2}>{item.mensaje}</Text>
              <Text style={styles.rowDate}>{toDateStr(item.creado_en)}</Text>
            </View>
            {!item.leida && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, gap: 10, flexGrow: 1 },
    markAll: { color: colors.accent, fontSize: 13 * fs, fontWeight: '600' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
           backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
    rowUnread: { borderColor: colors.accent + '55' },
    iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.cardAlt,
               alignItems: 'center', justifyContent: 'center' },
    rowTitle: { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
    rowMsg:   { color: colors.textSecondary, fontSize: 13 * fs, marginTop: 2, lineHeight: 18 },
    rowDate:  { color: colors.textMuted, fontSize: 11 * fs, marginTop: 4 },
    dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
    empty:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
    emptyText:{ color: colors.textMuted, fontSize: 14 * fs },
  });
}
