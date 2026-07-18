/**
 * Pantalla Reportes (dueño) — resumen financiero, tendencia de ingresos y actividad.
 * Contratos reales (api/app/routes/owner_gym/owner_dashboard.py):
 *   GET /api/owner_gym/dashboard               → KPIs (OwnerDashboard)
 *   GET /api/owner_gym/dashboard/ingresos?meses=6 → [{ label, pagos, ventas, total }]
 *   GET /api/owner_gym/dashboard/actividad?limit=20 → [{ tipo, titulo, sub, monto?, fecha }]
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, Share, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray, toDateStr } from '../../utils/format';
import { downloadAndShare } from '../../services/download';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { OwnerDashboard, IngresoMes, ActividadItem } from '../../types';

const SCREEN_W = Dimensions.get('window').width;
const money = (n: number) => `$${(n ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;

function actIcon(tipo: string): React.ComponentProps<typeof Ionicons>['name'] {
  if (tipo === 'pago')     return 'card-outline';
  if (tipo === 'venta')    return 'cart-outline';
  if (tipo === 'registro') return 'person-add-outline';
  return 'ellipse-outline';
}

export default function ReportsScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data: kpis, loading, refetch } = useFetch<OwnerDashboard>(ENDPOINTS.ADMIN_KPIS);
  const { data: ingresos } = useFetch<IngresoMes[]>(`${ENDPOINTS.OWNER_INGRESOS}?meses=6`);
  const { data: actividad } = useFetch<ActividadItem[]>(`${ENDPOINTS.OWNER_ACTIVIDAD}?limit=15`);

  const serie = toArray<IngresoMes>(ingresos);
  const feed  = toArray<ActividadItem>(actividad);

  const ingresoMes  = kpis?.ingresos?.mes_actual ?? 0;
  const variacion   = kpis?.ingresos?.variacion_pct ?? 0;
  const ventas      = kpis?.ventas_pos?.total_mes ?? 0;
  const totalMes    = ingresoMes + ventas;

  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const r = await downloadAndShare(ENDPOINTS.REPORT_INGRESOS_PDF, 'GymPro_Ingresos.pdf');
      if (!r.ok) Alert.alert('No se pudo descargar', r.reason ?? 'Intenta de nuevo.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.status === 404
        ? 'No hay datos de ingresos para exportar todavía.'
        : (e?.message ?? 'No se pudo generar el PDF.'));
    } finally {
      setDownloading(false);
    }
  };

  const shareSummary = async () => {
    const lines = [
      'GymPro — Resumen del mes',
      `Ingresos por membresías: ${money(ingresoMes)} (${variacion >= 0 ? '+' : ''}${variacion}% vs mes anterior)`,
      `Ventas POS: ${money(ventas)} (${kpis?.ventas_pos?.transacciones ?? 0} transacciones)`,
      `Total: ${money(totalMes)}`,
      `Miembros activos: ${kpis?.miembros?.activos ?? 0} · Nuevos: ${kpis?.miembros?.nuevos_mes ?? 0} · Por vencer: ${kpis?.miembros?.por_vencer ?? 0}`,
    ];
    try { await Share.share({ message: lines.join('\n') }); } catch { /* cancelado */ }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando reportes…" />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <View style={styles.topRow}>
        <Text style={styles.title} accessibilityRole="header">Reportes</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={shareSummary}
            accessibilityRole="button" accessibilityLabel="Compartir resumen">
            <Ionicons name="share-outline" size={18} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.pdfBtn} onPress={downloadPdf} disabled={downloading}
            accessibilityRole="button" accessibilityLabel="Descargar PDF de ingresos">
            <Ionicons name={downloading ? 'hourglass-outline' : 'document-text-outline'} size={16} color="#fff" />
            <Text style={styles.pdfText}>{downloading ? 'Generando…' : 'PDF'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Resumen financiero */}
      <Card elevated>
        <Text style={styles.cardLabel}>Ingresos del mes</Text>
        <Text style={styles.bigValue}>{money(totalMes)}</Text>
        <View style={styles.varRow}>
          <Ionicons
            name={variacion >= 0 ? 'trending-up' : 'trending-down'}
            size={16}
            color={variacion >= 0 ? colors.success : colors.error}
          />
          <Text style={[styles.varText, { color: variacion >= 0 ? colors.success : colors.error }]}>
            {variacion >= 0 ? '+' : ''}{variacion}% vs mes anterior
          </Text>
        </View>
        <View style={styles.splitRow}>
          <View style={styles.splitCol}>
            <Text style={styles.splitLabel}>Membresías</Text>
            <Text style={styles.splitValue}>{money(ingresoMes)}</Text>
          </View>
          <View style={styles.splitDivider} />
          <View style={styles.splitCol}>
            <Text style={styles.splitLabel}>POS ({kpis?.ventas_pos?.transacciones ?? 0})</Text>
            <Text style={styles.splitValue}>{money(ventas)}</Text>
          </View>
        </View>
      </Card>

      {/* Miembros */}
      <View style={styles.miniRow}>
        <Card style={styles.miniCard} padding={14}>
          <Ionicons name="people-outline" size={18} color={colors.accent} />
          <Text style={styles.miniValue}>{kpis?.miembros?.activos ?? 0}</Text>
          <Text style={styles.miniLabel}>Activos</Text>
        </Card>
        <Card style={styles.miniCard} padding={14}>
          <Ionicons name="person-add-outline" size={18} color={colors.success} />
          <Text style={styles.miniValue}>{kpis?.miembros?.nuevos_mes ?? 0}</Text>
          <Text style={styles.miniLabel}>Nuevos</Text>
        </Card>
        <Card style={styles.miniCard} padding={14}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
          <Text style={styles.miniValue}>{kpis?.miembros?.por_vencer ?? 0}</Text>
          <Text style={styles.miniLabel}>Por vencer</Text>
        </Card>
      </View>

      {/* Tendencia de ingresos */}
      {serie.length >= 2 ? (
        <Card padding={12}>
          <Text style={styles.sectionTitle}>Tendencia (6 meses)</Text>
          <LineChart
            data={{
              labels: serie.map((s) => s.label.split(' ')[0]),
              datasets: [{ data: serie.map((s) => s.total) }],
            }}
            width={SCREEN_W - 64}
            height={180}
            yAxisLabel="$"
            chartConfig={{
              backgroundGradientFrom: colors.card,
              backgroundGradientTo:   colors.card,
              decimalPlaces: 0,
              color:      (o = 1) => `rgba(108,99,255,${o})`,
              labelColor: () => colors.textSecondary,
              propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accentLight },
            }}
            bezier
            style={{ borderRadius: 12 }}
            withInnerLines={false}
          />
        </Card>
      ) : (
        <Card>
          <View style={styles.empty}>
            <Ionicons name="bar-chart-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aún no hay suficientes datos para la tendencia.</Text>
          </View>
        </Card>
      )}

      {/* Actividad reciente */}
      <Card>
        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        {feed.length === 0 ? (
          <Text style={styles.emptyText}>Sin actividad reciente.</Text>
        ) : (
          feed.map((a, i) => (
            <View key={i} style={styles.actRow}>
              <View style={styles.actIcon}>
                <Ionicons name={actIcon(a.tipo)} size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actTitle} numberOfLines={1}>{a.titulo}</Text>
                <Text style={styles.actSub} numberOfLines={1}>
                  {a.sub}{a.fecha ? `  ·  ${toDateStr(a.fecha)}` : ''}
                </Text>
              </View>
              {a.monto != null ? (
                <Text style={styles.actMonto}>{money(a.monto)}</Text>
              ) : (
                <Badge label="Alta" color="info" />
              )}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 16, paddingBottom: 32 },
    topRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
    actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn:  { backgroundColor: colors.accent + '1A', borderRadius: 12, padding: 9 },
    pdfBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent,
                borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
    pdfText:  { color: '#fff', fontSize: 13 * fs, fontWeight: '700' },

    cardLabel:{ color: colors.textSecondary, fontSize: 13 * fs },
    bigValue: { color: colors.text, fontSize: 34 * fs, fontWeight: '800', marginTop: 4 },
    varRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    varText:  { fontSize: 13 * fs, fontWeight: '600' },
    splitRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16,
                borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
    splitCol: { flex: 1, alignItems: 'center' },
    splitDivider: { width: 1, height: 36, backgroundColor: colors.border },
    splitLabel:{ color: colors.textSecondary, fontSize: 12 * fs },
    splitValue:{ color: colors.text, fontSize: 18 * fs, fontWeight: '700', marginTop: 4 },

    miniRow:   { flexDirection: 'row', gap: 10 },
    miniCard:  { flex: 1, alignItems: 'flex-start', gap: 4 },
    miniValue: { color: colors.text, fontSize: 20 * fs, fontWeight: '800', marginTop: 4 },
    miniLabel: { color: colors.textSecondary, fontSize: 11 * fs },

    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 12 },
    empty:     { alignItems: 'center', paddingVertical: 20, gap: 10 },
    emptyText: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center' },

    actRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
               borderBottomWidth: 1, borderBottomColor: colors.border },
    actIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.accent + '1A',
               alignItems: 'center', justifyContent: 'center' },
    actTitle:{ color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
    actSub:  { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
    actMonto:{ color: colors.success, fontSize: 14 * fs, fontWeight: '700' },
  });
}
