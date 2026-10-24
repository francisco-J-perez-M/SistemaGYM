/**
 * Pantalla Reportes (dueño) — resumen financiero, tendencia de ingresos y actividad.
 * Contratos reales (api/app/routes/owner_gym/owner_dashboard.py):
 *   GET /api/owner_gym/dashboard               → KPIs (OwnerDashboard)
 *   GET /api/owner_gym/dashboard/ingresos?meses=6 → [{ label, pagos, ventas, total }]
 *   GET /api/owner_gym/dashboard/actividad?limit=20 → [{ tipo, titulo, sub, monto?, fecha }]
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, Share,
  TouchableOpacity, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { conAlfa } from '../../constants/themes';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray, toDateStr } from '../../utils/format';
import { downloadAndShare } from '../../services/download';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { MESES_CORTOS } from '../../components/ui/SelectorPeriodo';
import type { OwnerDashboard, IngresoMes, ActividadItem } from '../../types';

/** Sección que el dueño puede incluir o quitar del reporte. */
interface SeccionReporte { id: string; label: string; descripcion: string }
interface OpcionesReporte { anios?: number[]; secciones?: SeccionReporte[] }

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

  /**
   * Mes de mayor y de menor ingreso de la serie.
   *
   * Se rotulan solo esos dos puntos con el importe exacto: el eje de la
   * gráfica va redondeado y la cifra del pico es justo la que se busca. Los
   * meses en cero quedan fuera —son ausencia de cobros, no el mínimo— y si la
   * serie es plana se rotula únicamente el máximo, para no superponer dos
   * etiquetas idénticas.
   */
  const extremosIngreso = useMemo(() => {
    const puntos = serie
      .map((s, i) => ({ v: Number(s?.total) || 0, i }))
      .filter((p) => p.v !== 0);

    if (puntos.length === 0) return { max: -1, min: -1 };

    let alto = puntos[0];
    let bajo = puntos[0];
    for (const p of puntos) {
      if (p.v > alto.v) alto = p;
      if (p.v < bajo.v) bajo = p;
    }
    return {
      max: alto.i,
      min: bajo.i === alto.i || bajo.v === alto.v ? -1 : bajo.i,
    };
  }, [serie]);

  // 'mes_actual' ya es el TOTAL (membresías + punto de venta). Antes se le
  // volvía a sumar 'ventas_pos', así que el total del mes salía con el importe
  // del POS contado dos veces.
  const totalMes    = kpis?.ingresos?.mes_actual ?? 0;
  const porMembresias = kpis?.ingresos?.membresias ?? 0;
  const ventas      = kpis?.ingresos?.punto_de_venta ?? kpis?.ventas_pos?.total_mes ?? 0;
  const sinComparativa = kpis?.ingresos?.sin_comparativa ?? false;
  const variacion   = sinComparativa ? 0 : (kpis?.ingresos?.variacion_pct ?? 0);

  const [downloading, setDownloading] = useState(false);
  const [showConfig, setShowConfig]   = useState(false);

  // ── Configuración del reporte ─────────────────────────────────────────────
  const { data: opciones } = useFetch<OpcionesReporte>(ENDPOINTS.REPORTES_OPCIONES);
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes,  setMes]  = useState(hoy.getMonth() + 1);
  const [comparar, setComparar] = useState(true);
  const [secciones, setSecciones] = useState<string[]>(
    ['resumen', 'ingresos', 'membresias', 'pos', 'asistencias', 'miembros'],
  );

  const alternarSeccion = (id: string) =>
    setSecciones((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const generarPdf = async () => {
    if (secciones.length === 0) {
      Alert.alert('Elige al menos una sección', 'El reporte no puede ir vacío.');
      return;
    }
    setDownloading(true);
    try {
      const consulta =
        `${ENDPOINTS.REPORTES_PDF}?anio=${anio}&mes=${mes}` +
        `&secciones=${secciones.join(',')}` +
        (comparar ? '&comparar=1' : '');
      const nombre = `Reporte_${anio}-${String(mes).padStart(2, '0')}.pdf`;
      const r = await downloadAndShare(consulta, nombre);
      if (!r.ok) Alert.alert('No se pudo descargar', r.reason ?? 'Intenta de nuevo.');
      else setShowConfig(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo generar el reporte.');
    } finally {
      setDownloading(false);
    }
  };

  const shareSummary = async () => {
    const lines = [
      'GymPro — Resumen del mes',
      `Ingresos totales: ${money(totalMes)}${sinComparativa ? '' : ` (${variacion >= 0 ? '+' : ''}${variacion}% vs mes anterior)`}`,
      `  Membresías: ${money(porMembresias)}`,
      `  Punto de venta: ${money(ventas)} (${kpis?.ventas_pos?.transacciones ?? 0} transacciones)`,
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
          <TouchableOpacity style={styles.pdfBtn} onPress={() => setShowConfig(true)} disabled={downloading}
            accessibilityRole="button" accessibilityLabel="Generar reporte en PDF">
            <Ionicons name={downloading ? 'hourglass-outline' : 'document-text-outline'} size={16} color={colors.onAccent} />
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
            <Text style={styles.splitValue}>{money(porMembresias)}</Text>
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
              color:      (o = 1) => conAlfa(colors.dataActividad, o),
              labelColor: () => colors.textSecondary,
              propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accentLight },
            }}
            bezier
            style={{ borderRadius: 12 }}
            withInnerLines={false}
            renderDotContent={({ x, y, index }) => {
              if (index !== extremosIngreso.max && index !== extremosIngreso.min) return null;
              const esMaximo = index === extremosIngreso.max;
              return (
                <Text
                  key={`importe-${index}`}
                  style={[
                    styles.importeExtremo,
                    // El ancho de la etiqueta es fijo y va centrada en el punto.
                    { left: x - 36, top: esMaximo ? y - 20 : y + 8 },
                  ]}
                  numberOfLines={1}
                >
                  {money(serie[index]?.total ?? 0)}
                </Text>
              );
            }}
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

      {/* ── Generador de reportes ─────────────────────────────────────────── */}
      <Modal visible={showConfig} transparent animationType="slide"
             onRequestClose={() => setShowConfig(false)}>
        <View style={styles.overlay}>
          <View style={[styles.hoja, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.hojaHeader}>
              <Text style={styles.hojaTitulo}>Armar reporte</Text>
              <TouchableOpacity onPress={() => setShowConfig(false)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Periodo */}
              <Text style={styles.campoLabel}>Año</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.chipFila}>
                {toArray<number>(opciones?.anios).map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.chip, anio === a && styles.chipActivo]}
                    onPress={() => setAnio(a)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: anio === a }}
                    accessibilityLabel={`Año ${a}`}
                  >
                    <Text style={[styles.chipText, anio === a && styles.chipTextActivo]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.campoLabel}>Mes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.chipFila}>
                <TouchableOpacity
                  style={[styles.chip, mes === 0 && styles.chipActivo]}
                  onPress={() => setMes(0)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mes === 0 }}
                  accessibilityLabel="Año completo"
                >
                  <Text style={[styles.chipText, mes === 0 && styles.chipTextActivo]}>Año</Text>
                </TouchableOpacity>
                {MESES_CORTOS.map((etiqueta, i) => (
                  <TouchableOpacity
                    key={etiqueta}
                    style={[styles.chip, mes === i + 1 && styles.chipActivo]}
                    onPress={() => setMes(i + 1)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: mes === i + 1 }}
                    accessibilityLabel={`Mes de ${etiqueta}`}
                  >
                    <Text style={[styles.chipText, mes === i + 1 && styles.chipTextActivo]}>
                      {etiqueta}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Secciones */}
              <Text style={styles.campoLabel}>Qué incluir</Text>
              <View style={{ gap: 8 }}>
                {toArray<SeccionReporte>(opciones?.secciones).map((s) => {
                  const activa = secciones.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.seccionFila, activa && styles.seccionActiva]}
                      onPress={() => alternarSeccion(s.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: activa }}
                      accessibilityLabel={s.label}
                    >
                      <Ionicons
                        name={activa ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={activa ? colors.accent : colors.textMuted}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.seccionTitulo}>{s.label}</Text>
                        <Text style={styles.seccionDesc}>{s.descripcion}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Comparativa */}
              <TouchableOpacity
                style={styles.compararFila}
                onPress={() => setComparar((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: comparar }}
                accessibilityLabel="Comparar con el periodo anterior"
              >
                <Ionicons
                  name={comparar ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={comparar ? colors.accent : colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.seccionTitulo}>Comparar con el periodo anterior</Text>
                  <Text style={styles.seccionDesc}>
                    Añade la variación de ingresos, asistencias y altas.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.generarBtn, downloading && { opacity: 0.6 }]}
                onPress={generarPdf}
                disabled={downloading}
                accessibilityRole="button"
                accessibilityLabel="Generar el reporte"
              >
                <Ionicons name={downloading ? 'hourglass-outline' : 'document-text-outline'}
                          size={19} color={colors.onAccent} />
                <Text style={styles.generarText}>
                  {downloading ? 'Generando…' : 'Generar reporte'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    pdfText:  { color: colors.onAccent, fontSize: 13 * fs, fontWeight: '700' },

    // ── Generador de reportes ───────────────────────────────────────────────
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    hoja: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingTop: 18, maxHeight: '90%',
    },
    hojaHeader: { flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 6 },
    hojaTitulo: { color: colors.text, fontSize: 18 * fs, fontWeight: '800' },

    campoLabel: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '700',
                  marginTop: 16, marginBottom: 8 },
    chipFila:   { gap: 6, paddingRight: 8 },
    chip: {
      paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      minWidth: 46, alignItems: 'center',
    },
    chipActivo:     { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText:       { color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '600' },
    chipTextActivo: { color: colors.onAccent, fontWeight: '700' },

    seccionFila: {
      flexDirection: 'row', alignItems: 'center', gap: 11,
      backgroundColor: colors.card, borderRadius: 12, padding: 13,
      borderWidth: 1, borderColor: colors.border,
    },
    seccionActiva:  { borderColor: colors.accent },
    seccionTitulo:  { color: colors.text, fontSize: 13.5 * fs, fontWeight: '700' },
    seccionDesc:    { color: colors.textSecondary, fontSize: 11.5 * fs, marginTop: 1 },

    compararFila: {
      flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 18,
      backgroundColor: colors.surface, borderRadius: 12, padding: 13,
    },
    generarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
      backgroundColor: colors.accent, borderRadius: 13, paddingVertical: 15,
      marginTop: 22, marginBottom: 8,
    },
    generarText: { color: colors.onAccent, fontSize: 15 * fs, fontWeight: '700' },

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
    importeExtremo: {
      position: 'absolute',
      width: 72,
      textAlign: 'center',
      fontSize: 10 * fs,
      fontWeight: '700',
      color: colors.text,
    },
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
