/**
 * MuscleMap2D.tsx — Mapa muscular 2D (SCRUM-101 + retro de Miguel 13/oct),
 * versión móvil.
 *
 * Silueta: v3 (13/oct) — reemplaza el SVG hecho a mano (óvalos/paths
 * genéricos por grupo) por `BodySilhouette`, una silueta anatómica real de
 * 317 fragmentos / 23 músculos, incorporada al código fuente del proyecto en
 * `./body-anatomy` (adaptación de la librería de código abierto
 * react-native-body-parts-anatomy — ver NOTICE.md en esa carpeta). No es una
 * dependencia externa: el código vive dentro de GymPro y no depende de
 * ninguna librería de terceros fuera de las que ya usa el proyecto
 * (react-native-svg, react-native-gesture-handler, react-native-reanimated).
 *
 * `BodySilhouette` se usa en modo `selectByGroup`, que agrupa sus 23 slugs
 * anatómicos; GROUP_SLUG_MAP los reduce a los 6 grupos canónicos del
 * backend (Piernas, Pecho, Espalda, Hombros, Brazos, Core) y `colorForSlug`
 * les asigna el color de intensidad de su grupo. La silueta no tiene campo
 * de género en el perfil del socio todavía, así que se usa "male" por
 * defecto (la librería soporta "female" si en el futuro se agrega ese dato).
 *
 * Dos escalas distintas, a propósito (igual que en v1/v2):
 * - Color de la región = intensidad RELATIVA (0..1 contra el grupo más
 *   trabajado del periodo) — "qué tan iluminado se ve ahora mismo".
 * - Rango/medalla (chip debajo de la silueta) = volumen ABSOLUTO
 *   acumulado en el periodo — "cuánto has entrenado este músculo en
 *   total". Umbrales de arranque (ver RANGOS), sin calibrar aún con datos
 *   reales de uso del gimnasio piloto.
 */
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { BodySilhouette, type BodySlugInput } from './body-anatomy';
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

// Exportados (además de usarse aquí) porque components/routines/MuscleDistribution.tsx
// -- la distribución muscular planeada de UNA rutina/día en el Paso B del flujo de
// Entrenamiento -- reutiliza el mismo mapa de slugs anatómicos y la misma escala de
// color en vez de duplicarlos: son dos métricas distintas (histórico real vs. plan
// de una rutina) que comparten la silueta y la paleta.
export const GRUPOS_CON_REGION = ['Piernas', 'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Core'] as const;

// Mapa de los 6 grupos canónicos del backend a los slugs anatómicos de
// `body-anatomy` (23 grupos musculares). Slugs no listados aquí (cabeza,
// cabello, cuello, manos, pies, tobillos, rodillas) quedan sin color propio
// —decorativos, color base de la silueta—.
export const GROUP_SLUG_MAP: Record<string, BodySlugInput[]> = {
  Piernas: ['quadriceps', 'hamstring', 'calves', 'gluteal', 'adductors', 'tibialis'],
  Pecho: ['chest'],
  Espalda: ['trapezius', 'upper-back', 'lower-back'],
  Hombros: ['deltoids'],
  Brazos: ['biceps', 'triceps', 'forearm'],
  Core: ['abs', 'obliques'],
};

// Lookup inverso (slug anatómico -> grupo canónico), construido una sola vez.
export const SLUG_A_GRUPO: Record<string, string> = Object.fromEntries(
  Object.entries(GROUP_SLUG_MAP).flatMap(([grupo, slugs]) => slugs.map((slug) => [slug, grupo])),
);

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

  // Estable mientras no cambien las intensidades: `BodySilhouette` lo llama
  // una vez por fragmento (hasta 317) en cada render, así que no conviene
  // recrearlo en cada pasada de render.
  const colorForSlug = useCallback(
    (slug: string) => {
      const grupo = SLUG_A_GRUPO[slug];
      return grupo ? colorPorIntensidad(intensidades[grupo] || 0) : undefined;
    },
    [intensidades],
  );

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
              <View style={{ width: 130 }}>
                <BodySilhouette
                  gender="male"
                  view="front"
                  selectByGroup
                  selectedSlugs={[]}
                  colorForSlug={colorForSlug}
                  zoomable={false}
                  outlineColor="rgba(0,0,0,0.28)"
                  unselectedFragmentColor="#475569"
                  accessibilityLabel="Mapa muscular, vista frontal"
                />
              </View>
            </View>
            <View style={styles.siluetaCol}>
              <Text style={styles.vistaLabel}>POSTERIOR</Text>
              <View style={{ width: 130 }}>
                <BodySilhouette
                  gender="male"
                  view="back"
                  selectByGroup
                  selectedSlugs={[]}
                  colorForSlug={colorForSlug}
                  zoomable={false}
                  outlineColor="rgba(0,0,0,0.28)"
                  unselectedFragmentColor="#475569"
                  accessibilityLabel="Mapa muscular, vista posterior"
                />
              </View>
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
