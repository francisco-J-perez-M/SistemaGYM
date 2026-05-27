import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

type Color = 'success' | 'warning' | 'error' | 'info' | 'accent' | 'purple';

const colorMap: Record<Color, { bg: string; text: string }> = {
  success: { bg: Colors.successBg, text: Colors.success },
  warning: { bg: Colors.warningBg, text: Colors.warning },
  error:   { bg: Colors.errorBg,   text: Colors.error   },
  info:    { bg: Colors.infoBg,    text: Colors.info    },
  accent:  { bg: 'rgba(108,99,255,0.15)', text: Colors.accent },
  purple:  { bg: Colors.purpleBg,  text: Colors.purple  },
};

interface Props {
  label:  string;
  color?: Color;
  style?: ViewStyle;
}

export default function Badge({ label, color = 'accent', style }: Props) {
  const { bg, text } = colorMap[color];
  return (
    <View
      style={[styles.badge, { backgroundColor: bg }, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      20,
    alignSelf:         'flex-start',
  },
  label: {
    fontSize:   12,
    fontWeight: '600',
  },
});
