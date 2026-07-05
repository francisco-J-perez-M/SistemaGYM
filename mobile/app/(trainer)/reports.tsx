/**
 * Reportes del Entrenador — KPIs, métricas de desempeño, evolución mensual,
 * top de clientes y opción de compartir un resumen.
 * Consume GET /api/trainer/reports?range=week|month|quarter.
 * Espeja el reporte del portal web (sin la exportación PDF de escritorio).
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';

const RANGOS: { id: string; label: string }[] = [
  { id: 'week',    label: 'Semana' },
  { id: 'month',   label: 'Mes' },
  { id: 'quarter', label: 'Trimestre' },
];

export default function TrainerReportsScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const [range, setRange]     = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [data, setData]       = useState<any>(null);

  const cargar = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`${ENDPOINTS.TRAINER_REPORTS}?range=${range}`);
      setData(res.data ?? null);
    } catch {
      setError('No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { cargar(); }, [cargar]);

  const stats    = data?.stats ?? {};
  const metrics  = data?.metrics ?? {};
  const monthly  = data?.monthlyData ?? [];
  const top      = data?.clientProgress ?? [];

  const compartir = useCallback(async () => {
    const rl = RANGOS.find((r) => r.id === range)?.label ?? range;
    const msg =
      `📊 Reporte GYM PRO (${rl})\n` +
      `Sesiones completadas: ${stats.sessions ?? 0}\n` +
      `Clientes activos: ${stats.clients ?? 0}\n` +
      `Calificación promedio: ${(stats.avgRating ?? 0).toFixed?.(1) ?? stats.avgRating ?? 0}\n` +
      `Asistencia: ${metrics.attendanceRate ?? 0}%  ·  Cancelación: ${metrics.cancellationRate ?? 0}%\n` +
      `Sesiones por cliente: ${metrics.sessionsPerClient ?? 0}`;
    try { await Share.share({ message: msg }); } catch { /* cancelado */ }
  }, [range, stats, metrics]);

  if (loading) return <LoadingSpinner fullScreen message="Cargando reporte…" />;

  const width = Dimensions.get('window').width - 40;
  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo:   colors.card,
    decimalPlaces: 0,
    color:      (o = 1) => `rgba(108, 99, 255, ${o})`,
    labelColor: () => colors.textSecondary,
    propsForBackgroundLines: { stroke: colors.border },
    barPercentage: 0.6,
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={cargar} tintColor={colors.accent} />}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">Reportes</Text>
          <Text style={styles.subtitle}>Tu desempeño y el de tus clientes.</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={compartir} accessibilityLabel="Compartir resumen">
          <Ionicons name="share-outline" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Rango */}
      <View style={styles.rangeRow}>
        {RANGOS.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.rangeChip, range === r.id && styles.rangeChipActive]}
            onPress={() => setRange(r.id)}
          >
            <Text style={[styles.rangeText, range === r.id && styles.rangeTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <Card style={styles.infoCard}>
          <Ionicons name="alert-circle-outline" size={28} color={colors.error} />
          <Text style={styles.infoText}>{error}</Text>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <View style={styles.kpiGrid}>
            <Kpi styles={styles} colors={colors} icon="checkmark-done-outline" label="Sesiones" value={stats.sessions ?? 0} tint={colors.accent} />
            <Kpi styles={styles} colors={colors} icon="people-outline" label="Clientes" value={stats.clients ?? 0} tint={colors.info} />
            <Kpi styles={styles} colors={colors} icon="star-outline" label="Calificación" value={(stats.avgRating ?? 0).toFixed?.(1) ?? stats.avgRating ?? 0} tint={colors.warning} />
            <Kpi styles={styles} colors={colors} icon="trending-up-outline" label="Crec. sesiones" value={`${stats.growth?.sessions ?? 0}%`} tint={colors.success} />
          </View>

          {/* Métricas de desempeño */}
          <Card>
            <Text style={styles.sectionTitle}>Métricas de desempeño</Text>
            <Metric styles={styles} label="Tasa de asistencia" value={`${metrics.attendanceRate ?? 0}%`} />
            <Metric styles={styles} label="Tasa de cancelación" value={`${metrics.cancellationRate ?? 0}%`} />
            <Metric styles={styles} label="Sesiones por cliente" value={`${metrics.sessionsPerClient ?? 0}`} />
            <Metric styles={styles} label="Sesiones agendadas" value={`${metrics.totalScheduled ?? 0}`} last />
          </Card>

          {/* Evolución mensual */}
          {monthly.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Sesiones por mes</Text>
              <BarChart
                data={{
                  labels: monthly.map((m: any) => m.month),
                  datasets: [{ data: monthly.map((m: any) => Number(m.sessions ?? 0)) }],
                }}
                width={width - 24}
                height={220}
                chartConfig={chartConfig}
                fromZero
                showValuesOnTopOfBars
                yAxisLabel=""
                yAxisSuffix=""
                style={{ borderRadius: 12, marginLeft: -8 }}
              />
            </Card>
          )}

          {/* Top clientes */}
          <Card>
            <Text style={styles.sectionTitle}>Top clientes</Text>
            {top.length === 0 ? (
              <Text style={styles.emptyText}>Sin sesiones completadas en este periodo.</Text>
            ) : (
              top.map((c: any, i: number) => (
                <View key={i} style={styles.topRow}>
                  <View style={[styles.rank, { backgroundColor: colors.accent + '22' }]}>
                    <Text style={styles.rankText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.topName} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.topSessions}>{c.sessions} ses.</Text>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function Kpi({ styles, colors, icon, label, value, tint }: any) {
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiIcon, { backgroundColor: tint + '22' }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Metric({ styles, label, value, last }: any) {
  return (
    <View style={[styles.metricRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 14, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
    subtitle:{ color: colors.textSecondary, fontSize: 13 * fs },
    shareBtn: {
      width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    rangeRow: { flexDirection: 'row', gap: 8 },
    rangeChip: {
      flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 12,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    rangeChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    rangeText:       { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
    rangeTextActive: { color: '#fff' },
    infoCard: { alignItems: 'center', gap: 10, paddingVertical: 24 },
    infoText: { color: colors.textSecondary, fontSize: 13 * fs, textAlign: 'center' },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    kpi: {
      width: '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.border, gap: 6,
    },
    kpiIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    kpiValue: { color: colors.text, fontSize: 20 * fs, fontWeight: '800' },
    kpiLabel: { color: colors.textSecondary, fontSize: 12 * fs },
    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 10 },
    metricRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    metricLabel: { color: colors.textSecondary, fontSize: 13 * fs },
    metricValue: { color: colors.text, fontSize: 14 * fs, fontWeight: '700' },
    emptyText: { color: colors.textMuted, fontSize: 13 * fs },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    rank:     { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    rankText: { color: colors.accent, fontSize: 12 * fs, fontWeight: '800' },
    topName:  { flex: 1, color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
    topSessions: { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
  });
}
