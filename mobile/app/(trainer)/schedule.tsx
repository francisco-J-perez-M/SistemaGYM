/**
 * Agenda — Entrenador
 * GET /api/trainer/schedule → sesiones y citas del día/semana
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
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

type ViewMode = 'hoy' | 'semana';

interface Sesion {
  _id:           string;
  nombre_cliente?: string;
  fecha?:          string;
  hora_inicio?:    string;
  hora_fin?:       string;
  tipo?:           string;   // 'PT' | 'Grupal' | 'Evaluación'
  estado?:         string;   // 'confirmada' | 'pendiente' | 'cancelada'
  notas?:          string;
}

interface ScheduleResponse {
  sesiones?: Sesion[];
  hoy?:      Sesion[];
  semana?:   Sesion[];
}

const TIPO_ICON: Record<string, string> = {
  'PT':          'person-outline',
  'Grupal':      'people-outline',
  'Evaluación':  'clipboard-outline',
};

const ESTADO_COLOR: Record<string, 'success' | 'warning' | 'error'> = {
  confirmada: 'success',
  pendiente:  'warning',
  cancelada:  'error',
};

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<ViewMode>('hoy');
  const { data, loading, refetch } = useFetch<ScheduleResponse>(ENDPOINTS.TRAINER_SCHEDULE);

  if (loading) return <LoadingSpinner fullScreen message="Cargando agenda…" />;

  const allSesiones = toArray(data?.sesiones ?? data?.semana ?? (Array.isArray(data) ? data : []));
  const today = getToday();

  const sesiones = view === 'hoy'
    ? allSesiones.filter((s) => toDateStr(s.fecha) === today)
    : allSesiones;

  const totalHoy = allSesiones.filter((s) => toDateStr(s.fecha) === today).length;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Agenda</Text>
        <Text style={styles.sub}>{totalHoy} sesiones hoy</Text>
      </View>

      {/* Vista hoy / semana */}
      <View style={styles.viewToggle}>
        {(['hoy', 'semana'] as ViewMode[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.viewBtn, view === v && styles.viewBtnActive]}
            onPress={() => setView(v)}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === v }}
          >
            <Ionicons
              name={v === 'hoy' ? 'today-outline' : 'calendar-outline'}
              size={16}
              color={view === v ? Colors.accent : Colors.textSecondary}
            />
            <Text style={[styles.viewLabel, view === v && styles.viewLabelActive]}>
              {v === 'hoy' ? 'Hoy' : 'Esta semana'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sesiones}
        keyExtractor={(s) => s._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {view === 'hoy' ? 'Sin sesiones programadas para hoy.' : 'Sin sesiones esta semana.'}
            </Text>
          </View>
        }
        renderItem={({ item: s }) => {
          const tipo   = toStr(s.tipo, 'PT');
          const estado = (s.estado ?? 'pendiente') as keyof typeof ESTADO_COLOR;
          return (
            <Card style={styles.card}>
              {/* Franja de hora */}
              <View style={styles.timeStrip}>
                <Text style={styles.timeStart}>{toStr(s.hora_inicio, '--:--')}</Text>
                <View style={styles.timeLine} />
                <Text style={styles.timeEnd}>{toStr(s.hora_fin, '--:--')}</Text>
              </View>

              <View style={styles.cardBody}>
                {/* Icono tipo */}
                <View style={styles.typeIcon}>
                  <Ionicons name={TIPO_ICON[tipo] as any ?? 'person-outline'} size={20} color={Colors.accent} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>{toStr(s.nombre_cliente, 'Cliente')}</Text>
                  <Text style={styles.tipoText}>{tipo}</Text>
                  {view === 'semana' && s.fecha && (
                    <Text style={styles.dateText}>{toDateStr(s.fecha)}</Text>
                  )}
                  {s.notas && (
                    <Text style={styles.notas} numberOfLines={2}>{s.notas}</Text>
                  )}
                </View>

                <Badge label={estado} color={ESTADO_COLOR[estado] ?? 'warning'} />
              </View>
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
  viewToggle: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 10,
  },
  viewBtnActive: { backgroundColor: 'rgba(108,99,255,0.15)' },
  viewLabel:      { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  viewLabelActive:{ color: Colors.accent },
  list:   { paddingHorizontal: 20, gap: 10, paddingBottom: 32 },
  empty:  { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },
  card:    { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14 },
  timeStrip: { alignItems: 'center', width: 44, gap: 4 },
  timeStart: { color: Colors.accent, fontSize: 12, fontWeight: '700' },
  timeLine:  { flex: 1, minHeight: 24, width: 2, backgroundColor: Colors.border, borderRadius: 1 },
  timeEnd:   { color: Colors.textMuted, fontSize: 12 },
  cardBody:  { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  typeIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(108,99,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  clientName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  tipoText:   { color: Colors.textSecondary, fontSize: 12 },
  dateText:   { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  notas:      { color: Colors.textSecondary, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
});
