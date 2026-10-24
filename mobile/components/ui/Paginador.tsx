/**
 * Paginador — navegación entre páginas de un listado.
 *
 * Se usa al pie de las listas históricas (Pagos, ventas del POS). Muestra la
 * posición actual y desactiva los extremos, para que quede claro cuándo se
 * llegó al principio o al final en vez de dejar botones que no hacen nada.
 *
 * SECCIONES QUE PINTA
 *   botones ...... colors.surface + colors.border; el icono en colors.text
 *   deshabilitado  colors.textMuted con opacidad reducida
 *   posición ..... colors.textSecondary
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useFontScale } from '../../hooks/useColors';

interface Props {
  pagina: number;
  paginas: number;
  onCambio: (pagina: number) => void;
  /** Total de elementos, para dar contexto ("120 movimientos"). */
  total?: number;
  etiquetaTotal?: string;
}

export default function Paginador({
  pagina, paginas, onCambio, total, etiquetaTotal = 'registros',
}: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  if (paginas <= 1) return null;

  const primera = pagina <= 1;
  const ultima  = pagina >= paginas;

  return (
    <View style={styles.contenedor}>
      <TouchableOpacity
        style={[styles.boton, primera && styles.botonInactivo]}
        onPress={() => !primera && onCambio(pagina - 1)}
        disabled={primera}
        accessibilityRole="button"
        accessibilityLabel="Página anterior"
        accessibilityState={{ disabled: primera }}
      >
        <Ionicons name="chevron-back" size={18}
                  color={primera ? colors.textMuted : colors.text} />
      </TouchableOpacity>

      <View style={styles.centro}>
        <Text style={styles.posicion}>Página {pagina} de {paginas}</Text>
        {typeof total === 'number' ? (
          <Text style={styles.total}>{total} {etiquetaTotal}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.boton, ultima && styles.botonInactivo]}
        onPress={() => !ultima && onCambio(pagina + 1)}
        disabled={ultima}
        accessibilityRole="button"
        accessibilityLabel="Página siguiente"
        accessibilityState={{ disabled: ultima }}
      >
        <Ionicons name="chevron-forward" size={18}
                  color={ultima ? colors.textMuted : colors.text} />
      </TouchableOpacity>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    contenedor: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 14, paddingHorizontal: 4, gap: 12,
    },
    boton: {
      width: 40, height: 40, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    botonInactivo: { opacity: 0.45 },
    centro:   { alignItems: 'center', gap: 2 },
    posicion: { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
    total:    { color: colors.textMuted, fontSize: 11 * fs },
  });
}
