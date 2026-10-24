// LinearGradient eliminado: requireNativeViewManager falla en RN 0.85 new arch (Fabric)
// antes de que el módulo nativo se registre → "undefined is not a function".
// Se usa View + backgroundColor con el primer color del gradiente.
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColors } from '../../hooks/useColors';

interface Props {
  label:     string;
  value:     string | number;
  unit?:     string;
  icon:      React.ReactNode;
  gradient?: readonly [string, string];
}

export default function KPICard({ label, value, unit, icon, gradient }: Props) {
  const colors = useColors();
  const styles = useMemo(() => make_styles(colors), [colors]);
  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, gradient ? { backgroundColor: gradient[0] } : styles.plain]}>
        <View style={styles.iconBox}>{icon}</View>
        <Text style={styles.value} accessibilityRole="text" adjustsFontSizeToFit>
          {value}
          {unit ? <Text style={styles.unit}> {unit}</Text> : null}
        </Text>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
      </View>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  wrapper: { flex: 1, minWidth: 140 },
  card: {
    borderRadius: 16,
    padding:      16,
    gap:          6,
  },
  plain: {
    backgroundColor: colors.card,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  iconBox: {
    width:           40,
    height:          40,
    borderRadius:    12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  value: {
    color:      '#fff',
    fontSize:   26,
    fontWeight: '700',
    lineHeight: 30,
  },
  unit:  { fontSize: 14, fontWeight: '500' },
  label: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
});
}
