/**
 * MuscleMap2D.tsx — Mapa muscular 2D (SCRUM-101 + retro de Miguel 13/oct),
 * versión móvil.
 *
 * Mismo criterio que su equivalente web (web/src/components/miembro/MuscleMap2D.jsx):
 * colorea una silueta plana (SVG, react-native-svg) por grupo muscular según
 * el volumen de trabajo registrado en la bitácora (GET /user/workouts/muscle-groups).
 *
 * Silueta: v2 (13/oct) — una región real por grupo anatómico (trapecio,
 * dorsales, pectorales, abdomen + oblicuos, deltoides, brazo superior +
 * antebrazo, glúteos, cuádriceps/isquiotibiales, pantorrillas), cada una
 * con un degradado radial propio (claro al centro -> color de intensidad
 * al borde) en vez de los óvalos/rectángulos planos de la v1.
 *
 * Dos escalas distintas, a propósito:
 * - Color de la región = intensidad RELATIVA (0..1 contra el grupo más
 *   trabajado del periodo) — "qué tan iluminado se ve ahora mismo".
 * - Rango/medalla (chip debajo de la silueta) = volumen ABSOLUTO
 *   acumulado en el periodo — "cuánto has entrenado este músculo en
 *   total". Umbrales de arranque (ver RANGOS), sin calibrar aún con datos
 *   reales de uso del gimnasio piloto.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Ellipse, Rect, Path, G, Line } from 'react-native-svg';
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

/** Aclara un "rgb(r, g, b)" mezclándolo hacia blanco (centro del degradado). */
function aclarar(rgbStr: string, factor: number): string {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgbStr);
  if (!m) return rgbStr;
  const [r, g, b] = [+m[1], +m[2], +m[3]].map((v) => Math.round(v + (255 - v) * factor));
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

// ───────────────────────── Rangos / medallas ───────────────────────────────
// Por volumen ABSOLUTO acumulado (no relativo) — ver nota en el encabezado.
interface Rango { id: string; nombre: string; min: number; color: string }
const RANGOS: Rango[] = [
  { id: 'platino', nombre: 'Platino', min: 12000, color: '#93C5FD' },
  { id: 'oro',      nombre: 'Oro',     min: 5000,  color: '#FBBF24' },
  { id: 'plata',    nombre: 'Plata',   min: 1500,  color: '#CBD5E1' },
  { id: 'bronce',   nombre: 'Bronce',  min: 300,   color: '#D97706' },
];
function rangoDe(volumen: number): Rango | null {
  return RANGOS.find((r) => (volumen || 0) >= r.min) ?? null;
}

// ───────────────────────── Silueta anatómica (viewBox 220x460) ────────────
function Silueta({
  vista, intensidades, idBase,
}: { vista: 'frontal' | 'posterior'; intensidades: Record<string, number>; idBase: string }) {
  const esFrontal = vista === 'frontal';
  const colorDe = (grupo: string) => colorPorIntensidad(intensidades[grupo] || 0);

  const grad = (grupo: string) => {
    const base = colorDe(grupo);
    const gid = `${idBase}-${grupo}`;
    return { id: gid, url: `url(#${gid})`, centro: aclarar(base, 0.55), borde: base };
  };
  const gHombros = grad('Hombros');
  const gPecho   = grad('Pecho');
  const gCore    = grad('Core');
  const gEspalda = grad('Espalda');
  const gBrazos  = grad('Brazos');
  const gPiernas = grad('Piernas');

  const grises = '#475569';
  const trazo  = 'rgba(0,0,0,0.28)';

  return (
    <Svg viewBox="0 0 220 460" width={150} height={314}>
      <Defs>
        {[gHombros, gPecho, gCore, gEspalda, gBrazos, gPiernas].map((g) => (
          <RadialGradient key={g.id} id={g.id} cx="35%" cy="30%" r="75%">
            <Stop offset="0%" stopColor={g.centro} />
            <Stop offset="100%" stopColor={g.borde} />
          </RadialGradient>
        ))}
      </Defs>

      {/* Cabeza y cuello — decorativos */}
      <Ellipse cx={110} cy={30} rx={18} ry={20} fill={grises} />
      <Rect x={100} y={48} width={20} height={14} fill={grises} />

      {/* Hombros / deltoides */}
      <Ellipse cx={62}  cy={78} rx={18} ry={15} fill={gHombros.url} stroke={trazo} strokeWidth={1} />
      <Ellipse cx={158} cy={78} rx={18} ry={15} fill={gHombros.url} stroke={trazo} strokeWidth={1} />

      {esFrontal ? (
        <>
          {/* Pectorales */}
          <Path d="M76,66 Q110,56 144,66 L148,118 Q110,128 72,118 Z"
                fill={gPecho.url} stroke={trazo} strokeWidth={1} />

          {/* Oblicuos */}
          <Path d="M78,124 Q72,160 80,198 L88,198 L88,124 Z"
                fill={gCore.url} stroke={trazo} strokeWidth={1} />
          <Path d="M142,124 Q148,160 140,198 L132,198 L132,124 Z"
                fill={gCore.url} stroke={trazo} strokeWidth={1} />

          {/* Abdomen */}
          <Path d="M88,118 L132,118 L128,208 Q110,216 92,208 Z"
                fill={gCore.url} stroke={trazo} strokeWidth={1} />
          <G stroke="rgba(0,0,0,0.18)" strokeWidth={1}>
            <Line x1={110} y1={120} x2={110} y2={206} />
            <Line x1={93}  y1={142} x2={127} y2={142} />
            <Line x1={92}  y1={168} x2={128} y2={168} />
            <Line x1={92}  y1={192} x2={126} y2={192} />
          </G>
        </>
      ) : (
        <>
          {/* Trapecio */}
          <Path d="M92,64 L110,56 L128,64 L138,110 Q110,130 82,110 Z"
                fill={gEspalda.url} stroke={trazo} strokeWidth={1} />

          {/* Dorsales */}
          <Path d="M78,112 Q68,150 78,195 L96,195 L92,120 Z"
                fill={gEspalda.url} stroke={trazo} strokeWidth={1} />
          <Path d="M142,112 Q152,150 142,195 L124,195 L128,120 Z"
                fill={gEspalda.url} stroke={trazo} strokeWidth={1} />

          {/* Lumbar */}
          <Path d="M98,195 L122,195 L120,215 L100,215 Z"
                fill={gEspalda.url} stroke={trazo} strokeWidth={1} />

          {/* Glúteos */}
          <Path d="M84,215 Q78,245 92,252 L108,250 L106,215 Z"
                fill={gPiernas.url} stroke={trazo} strokeWidth={1} />
          <Path d="M136,215 Q142,245 128,252 L112,250 L114,215 Z"
                fill={gPiernas.url} stroke={trazo} strokeWidth={1} />
        </>
      )}

      {/* Brazo superior */}
      <Path d="M54,82 Q44,110 48,145 L66,145 Q70,110 64,82 Z"
            fill={gBrazos.url} stroke={trazo} strokeWidth={1} />
      <Path d="M166,82 Q176,110 172,145 L154,145 Q150,110 156,82 Z"
            fill={gBrazos.url} stroke={trazo} strokeWidth={1} />

      {/* Antebrazo */}
      <Path d="M48,145 Q42,175 46,205 L62,205 Q66,175 64,145 Z"
            fill={gBrazos.url} stroke={trazo} strokeWidth={1} />
      <Path d="M172,145 Q178,175 174,205 L158,205 Q154,175 156,145 Z"
            fill={gBrazos.url} stroke={trazo} strokeWidth={1} />

      {/* Manos — decorativas */}
      <Ellipse cx={52}  cy={215} rx={9} ry={12} fill={grises} />
      <Ellipse cx={168} cy={215} rx={9} ry={12} fill={grises} />

      {/* Muslos */}
      <Path d="M86,210 L108,212 L104,330 L82,328 Z"
            fill={gPiernas.url} stroke={trazo} strokeWidth={1} />
      <Path d="M134,210 L112,212 L116,330 L138,328 Z"
            fill={gPiernas.url} stroke={trazo} strokeWidth={1} />

      {/* Pantorrillas */}
      <Path d="M84,330 L104,330 L100,418 L86,418 Z"
            fill={gPiernas.url} stroke={trazo} strokeWidth={1} />
      <Path d="M136,330 L116,330 L120,418 L134,418 Z"
            fill={gPiernas.url} stroke={trazo} strokeWidth={1} />

      {/* Pies — decorativos */}
      <Ellipse cx={93}  cy={428} rx={14} ry={8} fill={grises} />
      <Ellipse cx={127} cy={428} rx={14} ry={8} fill={grises} />
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
  const volumenPorGrupo: Record<string, number> = Object.fromEntries(grupos.map((g) => [g.grupo, g.volumen || 0]));
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
              <Silueta vista="frontal" intensidades={intensidades} idBase="mm2d-mv-f" />
            </View>
            <View style={styles.siluetaCol}>
              <Text style={styles.vistaLabel}>POSTERIOR</Text>
              <Silueta vista="posterior" intensidades={intensidades} idBase="mm2d-mv-b" />
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

          {/* Rangos/medallas por grupo — ver nota de las dos escalas en el
              encabezado del archivo. */}
          <View style={styles.rangosRow}>
            {GRUPOS_CON_REGION.map((grupo) => {
              const vol = volumenPorGrupo[grupo] || 0;
              const rango = rangoDe(vol);
              return (
                <View key={grupo} style={styles.rangoChip}>
                  <View style={[styles.rangoDot, { backgroundColor: colorPorIntensidad(intensidades[grupo] || 0) }]} />
                  <Ionicons name="ribbon-outline" size={13} color={rango ? rango.color : colors.textMuted} />
                  <Text style={styles.rangoTexto}>
                    {grupo} <Text style={styles.rangoSub}>· {rango ? rango.nombre : 'Sin rango'}</Text>
                  </Text>
                </View>
              );
            })}
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

function make_styles(colors: any, fs: number) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { fontSize: 14 * fs, fontWeight: '700', color: colors.text },
    vacioBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
    vacioText: { fontSize: 13 * fs, color: colors.textMuted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
    siluetaRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginTop: 4 },
    siluetaCol: { alignItems: 'center', gap: 4 },
    vistaLabel: { fontSize: 10 * fs, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
    leyendaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
    leyendaText: { fontSize: 11 * fs, color: colors.textMuted },
    rangosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    rangoChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999,
      backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
    },
    rangoDot: { width: 8, height: 8, borderRadius: 4 },
    rangoTexto: { fontSize: 11.5 * fs, color: colors.text, fontWeight: '600' },
    rangoSub: { fontSize: 10.5 * fs, color: colors.textSecondary, fontWeight: '400' },
    otrosText: { fontSize: 11 * fs, color: colors.textMuted, marginTop: 10 },
  });
}
