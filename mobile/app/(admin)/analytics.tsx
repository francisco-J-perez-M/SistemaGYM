/**
 * Pantalla Analítica IA (dueño) — vistas read-only de los modelos Spark.
 * Contratos reales (api/app/routes/ia/*):
 *   GET /api/analytics/kmeans?k=3   → { silhouette, resumen_clusters: [...] }
 *   GET /api/analytics/cancelaciones → { predicciones: [...], resumen, metricas }
 *
 * Nota: el primer GET puede entrenar el modelo en el backend (puede tardar).
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type {
  KMeansResponse, ClusterResumen, CancelacionesResponse, PrediccionCancelacion,
} from '../../types';

type Tab = 'segmentos' | 'cancelacion';

const CLUSTER_COLORS = ['#6c63ff', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899'];

function riesgoColor(r: string): 'error' | 'warning' | 'success' {
  if (r === 'alto')  return 'error';
  if (r === 'medio') return 'warning';
  return 'success';
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('segmentos');

  const { data: km, loading: loadingK, refetch: refetchK } =
    useFetch<KMeansResponse>(`${ENDPOINTS.ANALYTICS_KMEANS}?k=3`);
  const { data: canc, loading: loadingC, refetch: refetchC } =
    useFetch<CancelacionesResponse>(ENDPOINTS.ANALYTICS_CANCELACIONES);

  const clusters    = toArray<ClusterResumen>(km?.resumen_clusters);
  const predicciones = toArray<PrediccionCancelacion>(canc?.predicciones);
  const loading     = tab === 'segmentos' ? loadingK : loadingC;
  const refetch     = tab === 'segmentos' ? refetchK : refetchC;

  return (
    <View style={styles.screen}>
      <View style={[styles.tabRow, { marginTop: insets.top + 12 }]}>
        {([['segmentos', 'Segmentos', 'people-outline'], ['cancelacion', 'Riesgo', 'warning-outline']] as const).map(
          ([t, label, icon]) => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
              <Ionicons name={icon} size={16} color={tab === t ? colors.accent : colors.textSecondary} />
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
      >
        {loading && (
          <LoadingSpinner message="Ejecutando modelo… (puede tardar la primera vez)" />
        )}

        {/* ── SEGMENTACIÓN K-MEANS ─────────────────────────────── */}
        {tab === 'segmentos' && !loading && (
          km?.error ? (
            <Card><Text style={styles.errText}>{km.error}</Text></Card>
          ) : (
            <>
              <Card elevated>
                <Text style={styles.cardLabel}>Calidad del agrupamiento (silhouette)</Text>
                <Text style={styles.bigValue}>{(km?.silhouette ?? 0).toFixed(3)}</Text>
                <Text style={styles.hint}>
                  Más cercano a 1 = grupos mejor separados. {clusters.length} segmentos por composición corporal.
                </Text>
              </Card>

              {clusters.map((c, i) => (
                <Card key={c.cluster_id ?? i}>
                  <View style={styles.clusterHead}>
                    <View style={[styles.clusterDot, { backgroundColor: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }]} />
                    <Text style={styles.clusterName}>{c.etiqueta ?? `Grupo ${i + 1}`}</Text>
                    <Badge label={`${c.num_miembros ?? 0} miembros`} color="accent" />
                  </View>
                  <View style={styles.metricsRow}>
                    <Metric label="IMC prom" value={c.imc_promedio?.toFixed(1) ?? '—'} styles={styles} />
                    <Metric label="Peso prom" value={c.peso_promedio != null ? `${c.peso_promedio.toFixed(1)} kg` : '—'} styles={styles} />
                    <Metric label="Grasa prom" value={c.grasa_promedio != null ? `${c.grasa_promedio.toFixed(1)}%` : '—'} styles={styles} />
                  </View>
                </Card>
              ))}

              {clusters.length === 0 && (
                <Card><Text style={styles.errText}>Sin datos suficientes para segmentar miembros.</Text></Card>
              )}
            </>
          )
        )}

        {/* ── RIESGO DE CANCELACIÓN ────────────────────────────── */}
        {tab === 'cancelacion' && !loading && (
          canc?.error ? (
            <Card><Text style={styles.errText}>{canc.error}</Text></Card>
          ) : (
            <>
              <View style={styles.miniRow}>
                <Card style={styles.miniCard} padding={14}>
                  <Text style={[styles.miniValue, { color: colors.error }]}>{canc?.resumen?.riesgo_alto ?? 0}</Text>
                  <Text style={styles.miniLabel}>Riesgo alto</Text>
                </Card>
                <Card style={styles.miniCard} padding={14}>
                  <Text style={[styles.miniValue, { color: colors.warning }]}>{canc?.resumen?.riesgo_medio ?? 0}</Text>
                  <Text style={styles.miniLabel}>Riesgo medio</Text>
                </Card>
                <Card style={styles.miniCard} padding={14}>
                  <Text style={[styles.miniValue, { color: colors.success }]}>{canc?.resumen?.activos ?? 0}</Text>
                  <Text style={styles.miniLabel}>Estables</Text>
                </Card>
              </View>

              <Card>
                <Text style={styles.sectionTitle}>Miembros en riesgo</Text>
                {predicciones.length === 0 ? (
                  <Text style={styles.errText}>Sin predicciones disponibles.</Text>
                ) : (
                  predicciones
                    .filter((p) => p.riesgo !== 'bajo')
                    .slice(0, 25)
                    .map((p) => (
                      <View key={p.id_miembro} style={styles.riskRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.riskName} numberOfLines={1}>{p.nombre}</Text>
                          <Text style={styles.riskSub}>
                            {p.dias_sin_asistir} días sin asistir · {p.membresia_activa ? 'Membresía activa' : 'Sin membresía'}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <Text style={styles.riskPct}>{Math.round(p.probabilidad * 100)}%</Text>
                          <Badge label={p.riesgo} color={riesgoColor(p.riesgo)} />
                        </View>
                      </View>
                    ))
                )}
              </Card>

              {canc?.metricas?.accuracy != null && (
                <Text style={styles.modelInfo}>
                  Modelo Random Forest · precisión {(canc.metricas.accuracy * 100).toFixed(0)}%
                </Text>
              )}
            </>
          )
        )}
      </ScrollView>
    </View>
  );
}

function Metric({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof make_styles> }) {
  return (
    <View style={styles.metricCol}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    tabRow:  { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.card,
               borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border },
    tabBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
               paddingVertical: 9, borderRadius: 10 },
    tabBtnActive:  { backgroundColor: 'rgba(108,99,255,0.15)' },
    tabLabel:      { color: colors.textSecondary, fontSize: 14 * fs, fontWeight: '600' },
    tabLabelActive:{ color: colors.accent },
    content: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },

    cardLabel:{ color: colors.textSecondary, fontSize: 13 * fs },
    bigValue: { color: colors.text, fontSize: 34 * fs, fontWeight: '800', marginTop: 4 },
    hint:     { color: colors.textMuted, fontSize: 12 * fs, marginTop: 6, lineHeight: 17 },
    errText:  { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center', paddingVertical: 8 },

    clusterHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    clusterDot:  { width: 12, height: 12, borderRadius: 6 },
    clusterName: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', flex: 1 },
    metricsRow:  { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
    metricCol:   { flex: 1, alignItems: 'center' },
    metricValue: { color: colors.text, fontSize: 16 * fs, fontWeight: '700' },
    metricLabel: { color: colors.textSecondary, fontSize: 11 * fs, marginTop: 2 },

    miniRow:   { flexDirection: 'row', gap: 10 },
    miniCard:  { flex: 1, alignItems: 'center' },
    miniValue: { fontSize: 24 * fs, fontWeight: '800' },
    miniLabel: { color: colors.textSecondary, fontSize: 11 * fs, marginTop: 2 },

    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 12 },
    riskRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
                borderBottomWidth: 1, borderBottomColor: colors.border },
    riskName: { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
    riskSub:  { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
    riskPct:  { color: colors.text, fontSize: 15 * fs, fontWeight: '800' },
    modelInfo:{ color: colors.textMuted, fontSize: 11 * fs, textAlign: 'center' },
  });
}
