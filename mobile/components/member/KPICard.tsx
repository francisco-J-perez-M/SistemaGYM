import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

interface Props {
  label:    string;
  value:    string | number;
  unit?:    string;
  icon:     React.ReactNode;
  gradient?: readonly [string, string];
}

export default function KPICard({ label, value, unit, icon, gradient }: Props) {
  return (
    <View style={styles.wrapper}>
      {gradient ? (
        <LinearGradient colors={gradient} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Content label={label} value={value} unit={unit} icon={icon} />
        </LinearGradient>
      ) : (
        <View style={[styles.card, styles.plain]}>
          <Content label={label} value={value} unit={unit} icon={icon} />
        </View>
      )}
    </View>
  );
}

function Content({ label, value, unit, icon }: Omit<Props, 'gradient'>) {
  return (
    <>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.value} accessibilityRole="text" adjustsFontSizeToFit>
        {value}
        {unit && <Text style={styles.unit}> {unit}</Text>}
      </Text>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, minWidth: 140 },
  card: {
    borderRadius: 16,
    padding:      16,
    gap:          6,
  },
  plain: {
    backgroundColor: Colors.card,
    borderWidth:     1,
    borderColor:     Colors.border,
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
  unit: {
    fontSize:   14,
    fontWeight: '500',
  },
  label: {
    color:    'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
});
