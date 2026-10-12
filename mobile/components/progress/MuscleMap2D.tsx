/**
 * MuscleMap2D.tsx — Mapa muscular 2D (SCRUM-101), versión móvil.
 *
 * Mismo criterio que su equivalente web (web/src/components/miembro/MuscleMap2D.jsx):
 * colorea una silueta plana (SVG, react-native-svg) por grupo muscular según
 * el volumen de trabajo registrado en la bitácora (GET /user/workouts/muscle-groups),
 * no según métricas de composición corporal. El proyecto móvil nunca tuvo el
 * modelo 3D (vivía solo en el portal web, con @react-three/fiber + three),
 * así que este componente es la primera vez que "progreso físico" tiene una
 * representación visual del cuerpo en la app — cumple el punto de la tarjeta
 * de que el mismo tipo de mapa esté disponible en web y en móvil.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Rect, Ellipse } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';

type GrupoTrabajo = {
  grupo: string;
  sesiones: number;
  series: number;
  volumen: number;
  porcentaje: number;
  ultima_fecha?: string | null;
};
type MuscleGroupWorkResponse = { grupos: GrupoTrabajo[]; resumen?: any };

// ───────────────────────── Escala de color por intensidad ─────────────────
// Idéntica a la versión web: 0 = sin trabajo (color base) → 1 = grupo más
// trabajado del periodo (color cálido), interpolando en dos tramos.
const STOP_BASE = [51, 65, 85];      // #334155 slate-700
const STOP_MID  = [245, 158, 11];    // #F59E0B amber-500
const STOP_HOT  = [220, 38, 38];     // #DC2626 red-600

function mezclar(a: number[], b: number[], t: number) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

export function colorPorIntensidad(t: number): string {
  const x = Math.max(0, Math.min(1, t || 0));
  const [r, g, b] = x <= 0.5 ? mezclar(STOP_BASE, STOP_MID, x / 0.5)
                              : mezclar(STOP_MID, STOP_HOT, (x - 0.5) / 0.5);
  return `rgb(${r}, ${g}, ${b})`;
}

const GRUPOS_CON_REGION = ['Piernas', 'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Core'] as const;

function calcularIntensidades(grupos: GrupoTrabajo[]): Record<string, number> {
  const porGrupo: Record<string, number> = {};
  let max = 0;
  for (const g of grupos || []) {
    porGrupo[g.grupo] = g.volumen || 0;
    if (g.volumen > max) max = g.volumen;
  }
  const intensidades: Record<string, number> = {};
  for (const grupo of GRUPOS_CON_REGION) {
    const vol = porGrupo[grupo] || 0;
    intensidades[grupo] = max > 0 ? vol / max : 0;
  }
  return intensidades;
}

function Silueta({ vista, intensidades }: { vista: 'frontal' | 'posterior'; intensidades: Record<string, number> }) {
  const c = (grupo: string) => colorPorIntensidad(intensidades[grupo] || 0);
  const esFrontal = vista === 'frontal';
  return (
    <Svg viewBox="0 0 200 400" width={130} height={260}>
      {/* Cabeza y cuello — decorativos */}
      <Circle cx={100} cy={28} r={20} fill="#475569" />
      <Rect x={90} y={44} width={20} height={16} fill="#475569" />

      {/* Hombros */}
      <Ellipse cx={58}  cy={76} rx={22} ry={16} fill={c('Hombros')} />
      <Ellipse cx={142} cy={76} rx={22} ry={16} fill={c('Hombros')} />

      {/* Torso: pecho (frontal) o espalda (posterior) */}
      {esFrontal ? (
        <Rect x={64} y={82} width={72} height={58} rx={16} fill={c('Pecho')} />
      ) : (
        <Rect x={64} y={82} width={72} height={120} rx={16} fill={c('Espalda')} />
      )}

      {/* Core — solo frontal */}
      {esFrontal && <Rect x={72} y={142} width={56} height={56} rx={12} fill={c('Core')} />}

      {/* Brazos */}
      <Rect x={26}  y={80} width={24} height={122} rx={12} fill={c('Brazos')} />
      <Rect x={150} y={80} width={24} height={122} rx={12} fill={c('Brazos')} />

      {/* Piernas */}
      <Rect x={66}  y={202} width={30} height={150} rx={15} fill={c('Piernas')} />
      <Rect x={104} y={202} width={30} height={150} rx={15} fill={c('Piernas')} />
    </Svg>
  );
}

export default function MuscleMap2D() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  const { data, loading, error, refetch } = useFetch<MuscleGroupWorkResponse>(
    ENDPOINTS.MUSCLE_GROUP_WORK, { dias: 90 },
  );

  const grupos = data?.grupos ?? [];
  const hayTrabajo = grupos.some((g) => (g.volumen || 0) > 0);
  const intensidades = calcularIntensidades(grupos);
  const otros = grupos.filter((g) => !GRUPOS_CON_REGION.includes(g.grupo as any) && (g.volumen || 0) > 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="body-outline" size={16} color={colors.text} />
          <Text style={styles.title}>Mapa muscular (últimos 90 días)</Text>
        </View>
        <TouchableOpacity onPress={refetch} accessibilityLabel="Actualizar mapa muscular">
          <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.vacioText}>Cargando tu mapa muscular…</Text>
      ) : error || !hayTrabajo ? (
        <View style={styles.vacioBox}>
          <Ionicons name="barbell-outline" size={28} color={colors.textMuted} />
          <Text style={styles.vacioText}>
            {error
              ? 'No se pudo cargar tu mapa muscular. Desliza para reintentar.'
              : 'Aún no hay entrenamientos registrados. El mapa se muestra en su ' +
                'color base: registra tu primer entrenamiento en la bitácora para ' +
                'empezar a verlo tomar color.'}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.siluetaRow}>
            <View style={styles.siluetaCol}>
              <Text style={styles.vistaLabel}>FRONTAL</Text>
              <Silueta vista="frontal" intensidades={intensidades} />
            </View>
            <View style={styles.siluetaCol}>
              <Text style={styles.vistaLabel}>POSTERIOR</Text>
              <Silueta vista="posterior" intensidades={intensidades} />
            </View>
          </View>
          <View style={styles.leyendaRow}>
            <Svg width={100} height={8}>
              <Rect x={0}  y={0} width={34} height={8} fill={colorPorIntensidad(0)} />
              <Rect x={34} y={0} width={33} height={8} fill={colorPorIntensidad(0.5)} />
              <Rect x={67} y={0} width={33} height={8} fill={colorPorIntensidad(1)} />
            </Svg>
            <Text style={styles.leyendaText}>Menos trabajado → Más trabajado</Text>
          </View>
          {otros.length > 0 && (
            <Text style={styles.otrosText}>
              Sin región en el mapa: {otros.map((g) => `${g.grupo} (${g.volumen} kg)`).join(' · ')}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

function make_styles(colors: any, fs: (n: number) => number) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { fontSize: fs(14), fontWeight: '700', color: colors.text },
    vacioBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
    vacioText: { fontSize: fs(13), color: colors.textMuted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
    siluetaRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginTop: 4 },
    siluetaCol: { alignItems: 'center', gap: 4 },
    vistaLabel: { fontSize: fs(10), fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
    leyendaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
    leyendaText: { fontSize: fs(11), color: colors.textMuted },
    otrosText: { fontSize: fs(11), color: colors.textMuted, marginTop: 8 },
  });
}
