/**
 * StatCard — tarjeta de estadística para los paneles de gestión.
 *
 * Igual que KPICard, no recibe un color: recibe un `tono` que dice qué
 * significa la cifra, y la paleta activa resuelve el par de colores.
 *
 * SECCIONES QUE PINTA
 *   fondo ............. colors.card
 *   borde ............. colors.border
 *   caja del icono .... fondo del tono (dataXBg)
 *   cifra ............. colors.text
 *   etiqueta .......... colors.textSecondary
 *   tendencia ......... dataProgreso si sube, dataRiesgo si baja
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, useFontScale } from '../../hooks/useColors';
import { tonoDato, TonoDato } from '../../constants/themes';

interface Props {
  label:   string;
  value:   string | number;
  icon:    React.ReactNode;
  /** Qué significa la cifra. Determina el color dentro de la paleta activa. */
  tono?:   TonoDato;
  trend?:  number;   // % positivo o negativo
}

export default function StatCard({ label, value, icon, tono = 'neutro', trend }: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const t      = tonoDato(colors, tono);
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.iconBox, { backgroundColor: t.bg }]}>
        {icon}
      </View>
      <Text style={styles.value} adjustsFontSizeToFit numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
      {trend !== undefined && (
        <Text style={[styles.trend, { color: trend >= 0 ? colors.dataProgreso : colors.dataRiesgo }]}>
          {trend >= 0 ? '+' : ''}{trend}%
        </Text>
      )}
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    card: {
      flex:            1,
      backgroundColor: colors.card,
      borderRadius:    16,
      borderWidth:     1,
      borderColor:     colors.border,
      padding:         16,
      gap:             6,
      minWidth:        140,
    },
    iconBox: {
      width:          40,
      height:         40,
      borderRadius:   12,
      alignItems:     'center',
      justifyContent: 'center',
      marginBottom:   4,
    },
    value: {
      color:         colors.text,
      fontSize:      24 * fs,
      fontWeight:    '800',
      letterSpacing: -0.5,
    },
    label: {
      color:    colors.textSecondary,
      fontSize: 12 * fs,
    },
    trend: {
      fontSize:   12 * fs,
      fontWeight: '600',
      marginTop:  2,
    },
  });
}
