/**
 * Reportes del Entrenador — KPIs, métricas de desempeño, evolución mensual,
 * top de clientes, resumen para compartir y descarga del reporte en PDF.
 *
 *   GET /api/trainer/reports?range=…       cifras en pantalla
 *   GET /api/trainer/reportes/opciones     años con sesiones y secciones
 *   GET /api/trainer/reportes/pdf          documento con los filtros elegidos
 *
 * El PDF lo arma el backend, el mismo que sirve al portal web: así el reporte
 * que el entrenador descarga del teléfono y el que baja del navegador son el
 * mismo documento, no dos maquetas parecidas.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
  RefreshControl, Share, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { conAlfa } from '../../constants/themes';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray } from '../../utils/format';
import api from '../../services/api';
import { downloadAndShare } from '../../services/download';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';

const RANGOS: { id: string; label: string }[] = [
  { id: 'week',    label: 'Semana' },
  { id: 'month',   label: 'Mes' },
  { id: 'quarter', label: 'Trimestre' },
];

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
               'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface SeccionReporte { id: string; label: string; descripcion: string }
interface OpcionesReporte { anios: number[]; secciones: SeccionReporte[] }

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

  // ── Descarga del PDF ──────────────────────────────────────────────────────
  const { data: opciones } = useFetch<OpcionesReporte>(ENDPOINTS.TRAINER_REP_OPCIONES);
  const hoy = new Date();
  const [config,     setConfig]     = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [anioPdf,    setAnioPdf]    = useState(hoy.getFullYear());
  const [mesPdf,     setMesPdf]     = useState(hoy.getMonth() + 1); // 0 = año completo
  const [secciones,  setSecciones]  = useState<string[]>(
    ['resumen', 'sesiones', 'clientes', 'tipos'],
  );

  const catalogo = toArray<SeccionReporte>(opciones?.secciones);
  const aniosPdf = toArray<number>(opciones?.anios);

  const alternarSeccion = (id: string) =>
    setSecciones((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const descargarPdf = async () => {
    if (secciones.length === 0) {
      Alert.alert('Elige al menos una sección', 'El reporte no puede ir vacío.');
      return;
    }
    setDescargando(true);
    try {
      const consulta =
        `${ENDPOINTS.TRAINER_REP_PDF}?anio=${anioPdf}&mes=${mesPdf}` +
        `&secciones=${secciones.join(',')}`;
      const nombre = `Reporte_entrenador_${anioPdf}-${String(mesPdf).padStart(2, '0')}.pdf`;
      const r = await downloadAndShare(consulta, nombre);
      if (!r.ok) {
        // `reason` vacío significa que el usuario canceló el guardado.
        if (r.reason) Alert.alert('No se pudo descargar', r.reason);
      } else {
        setConfig(false);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo generar el reporte.');
    } finally {
      setDescargando(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando reporte…" />;

  const width = Dimensions.get('window').width - 40;
  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo:   colors.card,
    decimalPlaces: 0,
    color:      (o = 1) => conAlfa(colors.dataActividad, o),
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
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => setConfig(true)}
          accessibilityLabel="Descargar reporte en PDF"
          accessibilityRole="button"
        >
          <Ionicons name="download-outline" size={20} color={colors.accent} />
        </TouchableOpacity>
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

      {/* Configuración de la descarga */}
      <Modal
        visible={config}
        transparent
        animationType="slide"
        onRequestClose={() => setConfig(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.hoja, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.hojaHeader}>
              <Text style={styles.hojaTitulo}>Descargar reporte</Text>
              <TouchableOpacity
                onPress={() => setConfig(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Cerrar"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              <Text style={styles.campoLabel}>Año</Text>
              <View style={styles.chipsFila}>
                {(aniosPdf.length ? aniosPdf : [hoy.getFullYear()]).map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.rangeChip, anioPdf === a && styles.rangeChipActive]}
                    onPress={() => setAnioPdf(a)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: anioPdf === a }}
                  >
                    <Text style={[styles.rangeText, anioPdf === a && styles.rangeTextActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.campoLabel}>Mes</Text>
              <View style={styles.chipsFila}>
                <TouchableOpacity
                  style={[styles.rangeChip, mesPdf === 0 && styles.rangeChipActive]}
                  onPress={() => setMesPdf(0)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mesPdf === 0 }}
                >
                  <Text style={[styles.rangeText, mesPdf === 0 && styles.rangeTextActive]}>Todo el año</Text>
                </TouchableOpacity>
                {MESES.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.rangeChip, mesPdf === i + 1 && styles.rangeChipActive]}
                    onPress={() => setMesPdf(i + 1)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: mesPdf === i + 1 }}
                  >
                    <Text style={[styles.rangeText, mesPdf === i + 1 && styles.rangeTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.campoLabel}>Qué incluir</Text>
              {catalogo.map((s) => {
                const activa = secciones.includes(s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.seccionRow, activa && styles.seccionRowActiva]}
                    onPress={() => alternarSeccion(s.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: activa }}
                    accessibilityLabel={s.label}
                  >
                    <Ionicons
                      name={activa ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={activa ? colors.accent : colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.seccionLabel}>{s.label}</Text>
                      <Text style={styles.seccionDesc}>{s.descripcion}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.descargarBtn, descargando && { opacity: 0.6 }]}
              onPress={descargarPdf}
              disabled={descargando}
              accessibilityRole="button"
              accessibilityLabel="Generar y descargar el PDF"
            >
              {descargando
                ? <ActivityIndicator color={colors.onAccent} />
                : <>
                    <Ionicons name="download-outline" size={18} color={colors.onAccent} />
                    <Text style={styles.descargarTxt}>Descargar PDF</Text>
                  </>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    // Hoja de configuración de la descarga
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.6)', justifyContent: 'flex-end' },
    hoja: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      paddingHorizontal: 18, paddingTop: 16, gap: 10,
    },
    hojaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    hojaTitulo: { color: colors.text, fontSize: 17 * fs, fontWeight: '700' },
    campoLabel: {
      color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '700',
      marginTop: 14, marginBottom: 7,
    },
    chipsFila: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    seccionRow: {
      flexDirection: 'row', alignItems: 'center', gap: 11,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 12, marginBottom: 8,
    },
    seccionRowActiva: { borderColor: colors.accent },
    seccionLabel: { color: colors.text, fontSize: 13.5 * fs, fontWeight: '700' },
    seccionDesc:  { color: colors.textSecondary, fontSize: 11.5 * fs, marginTop: 2, lineHeight: 16 },
    descargarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.accent, paddingVertical: 14, borderRadius: 13, marginTop: 6,
    },
    descargarTxt: { color: colors.onAccent, fontSize: 15 * fs, fontWeight: '700' },
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
    rangeTextActive: { color: colors.onAccent },
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
