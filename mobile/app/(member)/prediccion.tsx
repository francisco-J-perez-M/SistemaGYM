/**
 * Predicción de Peso (IA) — proyecta el peso corporal del miembro a futuro
 * usando la regresión del backend: GET /api/analytics/regresion/predecir/<userId>?dias=N
 * Respuesta: { historial_peso: [...], predicciones_futuras: [...] }.
 * Espeja la vista del portal web.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { conAlfa } from '../../constants/themes';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';

const RANGOS = [30, 60, 90];

/** Extrae el valor de peso de un item, tolerando varias formas del backend. */
function pesoVal(item: any): number | null {
  if (item == null) return null;
  if (typeof item === 'number') return item;
  const v = item.peso_predicho_kg ?? item.peso ?? item.valor;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

export default function PrediccionScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [dias, setDias]       = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [hist, setHist]       = useState<number[]>([]);
  const [pred, setPred]       = useState<number[]>([]);
  /** Rango de peso saludable (criterio OMS) que devuelve el backend. */
  const [rango, setRango]     = useState<any>(null);

  const cargar = useCallback(async () => {
    if (!user?.id) { setLoading(false); setError('Sesión no disponible.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/analytics/regresion/predecir/${user.id}?dias=${dias}`);
      const d = res.data ?? {};
      const h = (d.historial_peso ?? []).map(pesoVal).filter((x: any): x is number => x != null);
      const p = (d.predicciones_futuras ?? []).map(pesoVal).filter((x: any): x is number => x != null);
      if (h.length < 3) {
        setError('Necesitas al menos 3 registros de peso en Progreso Físico para generar la predicción.');
      }
      setHist(h); setPred(p);
      setRango(d.rango_saludable ?? null);
    } catch {
      setError('No se pudo calcular la predicción. Registra tu peso y vuelve a intentar.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, dias]);

  useEffect(() => { cargar(); }, [cargar]);

  const pesoActual  = hist.length ? hist[hist.length - 1] : null;
  const pesoInicial = hist.length ? hist[0] : null;
  const pesoMeta    = pred.length ? pred[pred.length - 1] : null;
  const cambioReal     = (pesoActual != null && pesoInicial != null) ? pesoActual - pesoInicial : null;
  const cambioEstimado = (pesoMeta != null && pesoActual != null) ? pesoMeta - pesoActual : null;

  const width = Dimensions.get('window').width - 40;
  const combinado = [...hist, ...pred];
  const idxCorte  = hist.length;

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo:   colors.card,
    decimalPlaces: 1,
    color:      (o = 1) => conAlfa(colors.dataIa, o),
    labelColor: (o = 1) => colors.textSecondary,
    propsForDots: { r: '3' },
    propsForBackgroundLines: { stroke: colors.border },
  };

  if (loading) return <LoadingSpinner fullScreen message="Calculando tu predicción…" />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={cargar} tintColor={colors.accent} />}
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Predicción de Peso</Text>
        <Text style={styles.subtitle}>Proyección de tu peso a partir de tu historial (IA).</Text>
      </View>

      {/* Rango de días */}
      <View style={styles.rangeRow}>
        {RANGOS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeChip, dias === r && styles.rangeChipActive]}
            onPress={() => setDias(r)}
          >
            <Text style={[styles.rangeText, dias === r && styles.rangeTextActive]}>{r} días</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={28} color={colors.info} />
          <Text style={styles.infoText}>{error}</Text>
        </Card>
      ) : (
        <>
          {/* Resumen */}
          <View style={styles.kpiRow}>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Peso actual</Text>
              <Text style={styles.kpiValue}>{pesoActual != null ? pesoActual.toFixed(1) : '—'} <Text style={styles.kpiUnit}>kg</Text></Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Cambio real</Text>
              <Text style={[styles.kpiValue, cambioReal != null && { color: cambioReal <= 0 ? colors.success : colors.warning }]}>
                {cambioReal != null ? `${cambioReal > 0 ? '+' : ''}${cambioReal.toFixed(1)}` : '—'} <Text style={styles.kpiUnit}>kg</Text>
              </Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Proyección</Text>
              <Text style={[styles.kpiValue, cambioEstimado != null && { color: cambioEstimado <= 0 ? colors.success : colors.warning }]}>
                {pesoMeta != null ? pesoMeta.toFixed(1) : '—'} <Text style={styles.kpiUnit}>kg</Text>
              </Text>
            </View>
          </View>

          {/* Peso saludable segun la OMS.
              Da una referencia con criterio clinico frente a la que leer la
              proyeccion. Es un RANGO, no un "peso ideal": el IMC es cribado
              poblacional y no distingue musculo de grasa. */}
          {rango && (
            <Card>
              <Text style={styles.sectionTitle}>Peso saludable para tu estatura</Text>
              <Text style={styles.rangoValor}>
                {rango.peso_min_kg} – {rango.peso_max_kg} <Text style={styles.kpiUnit}>kg</Text>
              </Text>
              <Text style={styles.rangoMeta}>
                Criterio OMS · IMC {rango.imc_min}–{rango.imc_max} · {rango.estatura_m} m
              </Text>
              {rango.imc_actual != null && (
                <Text style={styles.rangoTexto}>
                  Tu IMC es {rango.imc_actual} ({rango.categoria}).{' '}
                  {rango.dentro_del_rango
                    ? 'Estás dentro del rango.'
                    : `Te separan ${rango.diferencia_kg} kg del límite ${rango.direccion === 'bajar' ? 'superior' : 'inferior'}.`}
                </Text>
              )}
              <Text style={styles.rangoNota}>{rango.advertencia}</Text>
            </Card>
          )}

          {/* Gráfica */}
          {combinado.length >= 2 && (
            <Card>
              <Text style={styles.sectionTitle}>Tendencia y proyección</Text>
              <LineChart
                data={{
                  labels: combinado.map((_, i) => (i === 0 ? 'inicio' : i === idxCorte - 1 ? 'hoy' : i === combinado.length - 1 ? `+${dias}d` : '')),
                  datasets: [
                    { data: combinado, color: (o = 1) => conAlfa(colors.dataIa, o), strokeWidth: 2 },
                  ],
                }}
                width={width - 24}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 12, marginLeft: -8 }}
                fromZero={false}
              />
            </Card>
          )}

          {/* Detalle de predicción */}
          {pred.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Puntos proyectados</Text>
              {pred.map((v, i) => (
                <View key={i} style={styles.predRow}>
                  <Text style={styles.predLabel}>Semana {i + 1}</Text>
                  <Text style={styles.predVal}>{v.toFixed(1)} kg</Text>
                </View>
              ))}
              <Text style={styles.disclaimer}>
                Estimación basada en tu tendencia actual; no sustituye la valoración de un profesional.
              </Text>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 14, paddingBottom: 40 },
    header:  { gap: 4 },
    title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
    subtitle:{ color: colors.textSecondary, fontSize: 13 * fs },
    rangeRow: { flexDirection: 'row', gap: 8 },
    rangeChip: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    rangeChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    rangeText:       { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
    rangeTextActive: { color: colors.onAccent },
    infoCard: { alignItems: 'center', gap: 10, paddingVertical: 24 },
    infoText: { color: colors.textSecondary, fontSize: 13 * fs, textAlign: 'center', lineHeight: 20 },
    kpiRow: { flexDirection: 'row', gap: 12 },
    kpi: {
      flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 12,
      borderWidth: 1, borderColor: colors.border, gap: 4,
    },
    kpiLabel: { color: colors.textSecondary, fontSize: 11 * fs },
    kpiValue: { color: colors.text, fontSize: 18 * fs, fontWeight: '800' },
    kpiUnit:  { color: colors.textMuted, fontSize: 11 * fs, fontWeight: '600' },
    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 10 },
    rangoValor:   { color: colors.accent, fontSize: 24 * fs, fontWeight: '800' },
    rangoMeta:    { color: colors.textSecondary, fontSize: 11 * fs, marginTop: 2 },
    rangoTexto:   { color: colors.text, fontSize: 13 * fs, marginTop: 8, lineHeight: 19 * fs },
    rangoNota:    { color: colors.textSecondary, fontSize: 11 * fs, marginTop: 8, lineHeight: 16 * fs },
    predRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    predLabel: { color: colors.textSecondary, fontSize: 13 * fs },
    predVal:   { color: colors.text, fontSize: 14 * fs, fontWeight: '700' },
    disclaimer:{ color: colors.textMuted, fontSize: 11 * fs, fontStyle: 'italic', marginTop: 10, lineHeight: 16 },
  });
}
