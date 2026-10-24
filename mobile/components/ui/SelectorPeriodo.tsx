/**
 * SelectorPeriodo — filtro de mes y año para listados históricos.
 *
 * Lo comparten Pagos y el historial del Punto de Venta. El año se elige de la
 * lista que devuelve el backend (solo años con movimientos, para no ofrecer
 * periodos vacíos) y el mes en una tira horizontal donde "Año" significa el
 * año completo.
 *
 * Convención con la API: mes = 0 equivale a "todo el año"; anio = 0 equivale a
 * "sin filtro de fecha" (histórico completo).
 *
 * SECCIONES QUE PINTA
 *   chip inactivo ..... colors.surface + colors.textSecondary
 *   chip activo ....... colors.accent + colors.onAccent
 *   etiquetas ......... colors.textMuted
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors, useFontScale } from '../../hooks/useColors';

export const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

interface Props {
  /** Año seleccionado. 0 = histórico completo. */
  anio: number;
  /** Mes seleccionado (1-12). 0 = año completo. */
  mes: number;
  /** Años con movimientos, los que devuelve el backend. */
  anios: number[];
  onChange: (anio: number, mes: number) => void;
}

export default function SelectorPeriodo({ anio, mes, anios, onChange }: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  // Si el backend aún no respondió, al menos se ofrece el año en curso.
  const listaAnios = anios.length > 0 ? anios : [new Date().getFullYear()];

  return (
    <View style={styles.contenedor}>
      {/* Años */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fila}
      >
        <TouchableOpacity
          style={[styles.chip, anio === 0 && styles.chipActivo]}
          onPress={() => onChange(0, 0)}
          accessibilityRole="button"
          accessibilityState={{ selected: anio === 0 }}
          accessibilityLabel="Ver el histórico completo"
        >
          <Text style={[styles.chipText, anio === 0 && styles.chipTextActivo]}>Todo</Text>
        </TouchableOpacity>

        {listaAnios.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.chip, anio === a && styles.chipActivo]}
            onPress={() => onChange(a, mes)}
            accessibilityRole="button"
            accessibilityState={{ selected: anio === a }}
            accessibilityLabel={`Año ${a}`}
          >
            <Text style={[styles.chipText, anio === a && styles.chipTextActivo]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Meses: solo tienen sentido con un año elegido */}
      {anio !== 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fila}
        >
          <TouchableOpacity
            style={[styles.chipMes, mes === 0 && styles.chipActivo]}
            onPress={() => onChange(anio, 0)}
            accessibilityRole="button"
            accessibilityState={{ selected: mes === 0 }}
            accessibilityLabel="Año completo"
          >
            <Text style={[styles.chipText, mes === 0 && styles.chipTextActivo]}>Año</Text>
          </TouchableOpacity>

          {MESES_CORTOS.map((etiqueta, i) => {
            const m = i + 1;
            return (
              <TouchableOpacity
                key={etiqueta}
                style={[styles.chipMes, mes === m && styles.chipActivo]}
                onPress={() => onChange(anio, m)}
                accessibilityRole="button"
                accessibilityState={{ selected: mes === m }}
                accessibilityLabel={`Mes de ${etiqueta}`}
              >
                <Text style={[styles.chipText, mes === m && styles.chipTextActivo]}>
                  {etiqueta}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

/** Texto legible del periodo, para encabezados y nombres de archivo. */
export function etiquetaPeriodo(anio: number, mes: number): string {
  if (!anio) return 'Histórico completo';
  if (!mes)  return String(anio);
  return `${MESES_CORTOS[mes - 1]} ${anio}`;
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    contenedor: { gap: 8, marginBottom: 10 },
    fila:       { gap: 6, paddingHorizontal: 20 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    chipMes: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      minWidth: 46, alignItems: 'center',
    },
    chipActivo:     { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText:       { color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '600' },
    chipTextActivo: { color: colors.onAccent, fontWeight: '700' },
  });
}
