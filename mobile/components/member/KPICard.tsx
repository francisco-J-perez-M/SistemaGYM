/**
 * KPICard — tarjeta de indicador.
 *
 * Estilo "datos primero": la tarjeta es neutra y el color aparece solo en el
 * icono y en la cifra, según lo que el número SIGNIFICA. No se pasa un color:
 * se pasa un `tono` (ver TonoDato en constants/themes.ts) y la paleta activa
 * decide el HEX. Cambiar de paleta no requiere tocar este archivo.
 *
 * SECCIONES QUE PINTA
 *   fondo de la tarjeta ......... colors.card
 *   borde ....................... colors.border
 *   caja del icono .............. fondo del tono (dataXBg)
 *   icono ....................... color del tono (dataX)
 *   cifra ....................... colors.text
 *   unidad y etiqueta ........... colors.textSecondary
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, useFontScale } from '../../hooks/useColors';
import { tonoDato, TonoDato } from '../../constants/themes';

interface Props {
  label:  string;
  value:  string | number;
  unit?:  string;
  icon:   React.ReactNode;
  /** Qué significa el número. Determina el color dentro de la paleta activa. */
  tono?:  TonoDato;
}

export default function KPICard({ label, value, unit, icon, tono = 'neutro' }: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const t      = tonoDato(colors, tono);
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: t.bg }]}>{icon}</View>
        <Text style={[styles.value, { color: tono === 'neutro' ? colors.text : t.color }]}
              accessibilityRole="text" adjustsFontSizeToFit numberOfLines={1}>
          {value}
          {unit ? <Text style={styles.unit}> {unit}</Text> : null}
        </Text>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
      </View>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    wrapper: { flex: 1, minWidth: 140 },
    card: {
      borderRadius:    16,
      padding:         16,
      gap:             6,
      backgroundColor: colors.card,
      borderWidth:     1,
      borderColor:     colors.border,
    },
    iconBox: {
      width:          38,
      height:         38,
      borderRadius:   11,
      alignItems:     'center',
      justifyContent: 'center',
      marginBottom:   4,
    },
    value: {
      fontSize:      26 * fs,
      fontWeight:    '800',
      lineHeight:    31 * fs,
      letterSpacing: -0.5,
    },
    unit:  { fontSize: 13 * fs, fontWeight: '600', color: colors.textSecondary },
    label: { fontSize: 12 * fs, color: colors.textSecondary },
  });
}
