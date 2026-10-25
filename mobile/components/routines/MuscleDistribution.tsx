/**
 * MuscleDistribution — distribución muscular PLANEADA de un día de rutina
 * (Paso B del flujo de Entrenamiento: ej. "Hombros 27%, Espalda 20%, Pecho
 * 13%"), calculada ANTES de entrenar a partir de los ejercicios del día.
 *
 * No confundir con components/progress/MuscleMap2D.tsx: ese es el mapa
 * HISTÓRICO real (volumen ya entrenado en los últimos 90 días, vía
 * GET /api/user/workouts/muscle-groups). Este componente no llama a ningún
 * endpoint -- todo el cálculo es local, con los datos de la rutina que ya
 * están cargados en pantalla. Comparte con MuscleMap2D la silueta anatómica
 * y la escala de color (colorPorIntensidad) para que ambas se vean como un
 * solo sistema visual, no dos widgets distintos.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BodySilhouette } from '../progress/body-anatomy';
import {
  colorPorIntensidad, SLUG_A_GRUPO,
} from '../progress/MuscleMap2D';
import { useColors, useFontScale } from '../../hooks/useColors';
import { toArray, toStr } from '../../utils/format';

export interface EjercicioParaDistribucion {
  grupo?:  string;
  series?: string | number;
}

interface GrupoPct { grupo: string; porcentaje: number }

/**
 * Palabras clave para reconocer cada grupo canónico (los 6 que tienen
 * región propia en la silueta) dentro de texto libre: lo que escribe el
 * entrenador en el portal web (ej. "Pecho y Espalda", "PIERNAS") o los ids
 * en minúscula del creador de rutinas propias del socio (ver GRUPOS en
 * app/(member)/mi-rutina.tsx).
 */
const PALABRAS_CLAVE: Record<string, string[]> = {
  Pecho:   ['pecho', 'chest'],
  Espalda: ['espalda', 'back'],
  Piernas: ['pierna', 'leg', 'cuadricep', 'cuádricep', 'gluteo', 'glúteo'],
  Hombros: ['hombro', 'shoulder', 'deltoide'],
  Brazos:  ['brazo', 'arm', 'bicep', 'bícep', 'tricep', 'trícep'],
  Core:    ['core', 'abdomen', 'abdominales', 'abs'],
};

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function gruposEnTexto(texto: string): string[] {
  const t = normalizar(texto);
  if (!t) return [];
  return Object.entries(PALABRAS_CLAVE)
    .filter(([, palabras]) => palabras.some((p) => t.includes(normalizar(p))))
    .map(([grupo]) => grupo);
}

/**
 * % de cada grupo muscular canónico para un día de rutina.
 *
 * Por ejercicio, en orden de prioridad: su propio `grupo` si lo trae (las
 * rutinas propias cargadas por mi-rutina.tsx sí lo traen) -> si no, los
 * grupos detectados en el texto del DÍA (un día "Pecho y Espalda" reparte
 * 50/50 entre esos dos para cada ejercicio que no diga el suyo) -> si no se
 * reconoce ninguno, va a "otros" (cardio, descanso, categorías libres).
 *
 * El peso de cada ejercicio es su número de SERIES, no "1 ejercicio = 1
 * voto": una rutina con 4 series de press de pecho y 2 de remo pesa más
 * hacia Pecho que hacia Espalda, igual que el volumen real de la sesión.
 */
export function calcularDistribucion(
  dia: { grupo?: string; ejercicios: EjercicioParaDistribucion[] },
): { grupos: GrupoPct[]; otros: string[] } {
  const gruposDelDia = gruposEnTexto(toStr(dia.grupo, ''));
  const pesoPorGrupo: Record<string, number> = {};
  const otros = new Set<string>();
  let total = 0;

  for (const ej of toArray<EjercicioParaDistribucion>(dia.ejercicios)) {
    const series    = Math.max(1, Number(ej.series) || 1);
    const propios    = ej.grupo ? gruposEnTexto(toStr(ej.grupo, '')) : [];
    const candidatos = propios.length > 0 ? propios : gruposDelDia;
    total += series;

    if (candidatos.length === 0) {
      otros.add(toStr(ej.grupo || dia.grupo, 'Otro') || 'Otro');
      continue;
    }
    // Un ejercicio puede tocar varios grupos a la vez cuando el día es
    // compuesto y no hay desglose por ejercicio (ej. "Pecho y Espalda"):
    // se reparte su peso entre todos los que aplican.
    const porGrupo = series / candidatos.length;
    for (const g of candidatos) pesoPorGrupo[g] = (pesoPorGrupo[g] || 0) + porGrupo;
  }

  if (total === 0) return { grupos: [], otros: [] };

  const grupos = Object.entries(pesoPorGrupo)
    .map(([grupo, peso]) => ({ grupo, porcentaje: Math.round((peso / total) * 100) }))
    .filter((g) => g.porcentaje > 0)
    .sort((a, b) => b.porcentaje - a.porcentaje);

  return { grupos, otros: Array.from(otros) };
}

interface Props {
  dia: { grupo?: string; ejercicios: EjercicioParaDistribucion[] };
}

export default function MuscleDistribution({ dia }: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const { grupos, otros } = useMemo(() => calcularDistribucion(dia), [dia]);

  if (grupos.length === 0) return null;

  const intensidadPorGrupo: Record<string, number> = Object.fromEntries(
    grupos.map((g) => [g.grupo, g.porcentaje / 100]),
  );
  const colorForSlug = (slug: string) => {
    const grupo = SLUG_A_GRUPO[slug];
    return grupo && intensidadPorGrupo[grupo] != null
      ? colorPorIntensidad(intensidadPorGrupo[grupo])
      : undefined;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Distribución muscular</Text>
      <View style={styles.siluetaRow}>
        <View style={{ width: 104 }}>
          <BodySilhouette
            gender="male" view="front" selectByGroup selectedSlugs={[]}
            colorForSlug={colorForSlug} zoomable={false}
            outlineColor="rgba(0,0,0,0.28)"
            // Mismo tono base que MuscleMap2D.tsx (deliberadamente fijo, no
            // de la paleta): es el color "sin dato" de la silueta y debe
            // verse igual en las dos pantallas, en cualquier tema.
            unselectedFragmentColor="#475569"
            accessibilityLabel="Distribución muscular de este día, vista frontal"
          />
        </View>
        <View style={{ width: 104 }}>
          <BodySilhouette
            gender="male" view="back" selectByGroup selectedSlugs={[]}
            colorForSlug={colorForSlug} zoomable={false}
            outlineColor="rgba(0,0,0,0.28)"
            unselectedFragmentColor="#475569"
            accessibilityLabel="Distribución muscular de este día, vista posterior"
          />
        </View>
        <View style={styles.leyenda}>
          {grupos.map((g) => (
            <View key={g.grupo} style={styles.leyendaRow}>
              <View style={[styles.dot, { backgroundColor: colorPorIntensidad(g.porcentaje / 100) }]} />
              <Text style={styles.leyendaText}>
                {g.grupo} <Text style={styles.leyendaPct}>{g.porcentaje}%</Text>
              </Text>
            </View>
          ))}
        </View>
      </View>
      {otros.length > 0 && (
        <Text style={styles.otrosText}>Sin región anatómica: {otros.join(', ')}</Text>
      )}
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    card:       { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 },
    title:      { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },
    siluetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    leyenda:    { flex: 1, gap: 6, paddingLeft: 4 },
    leyendaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot:        { width: 10, height: 10, borderRadius: 5 },
    leyendaText:{ color: colors.text, fontSize: 13 * fs, fontWeight: '600' },
    leyendaPct: { color: colors.textSecondary, fontWeight: '700' },
    otrosText:  { color: colors.textMuted, fontSize: 11 * fs, marginTop: 2 },
  });
}
