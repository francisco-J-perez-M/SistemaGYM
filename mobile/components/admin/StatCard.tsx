import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColors } from '../../hooks/useColors';

interface Props {
  label:   string;
  value:   string | number;
  icon:    React.ReactNode;
  color?:  string;
  trend?:  number;   // % positivo o negativo
}

export default function StatCard({ label, value, icon, color = colors.accent, trend }: Props) {
  const colors = useColors();
  const styles = useMemo(() => make_styles(colors), [colors]);
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.iconBox, { backgroundColor: `${color}22` }]}>
        {icon}
      </View>
      <Text style={styles.value} adjustsFontSizeToFit numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
      {trend !== undefined && (
        <Text style={[styles.trend, { color: trend >= 0 ? colors.success : colors.error }]}>
          {trend >= 0 ? '+' : ''}{trend}%
        </Text>
      )}
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>) {
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
    color:      colors.text,
    fontSize:   24,
    fontWeight: '700',
  },
  label: {
    color:    colors.textSecondary,
    fontSize: 12,
  },
  trend: {
    fontSize:   12,
    fontWeight: '600',
    marginTop:  2,
  },
});
}
