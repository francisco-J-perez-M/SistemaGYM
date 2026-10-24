import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '../../hooks/useColors';

type Color = 'success' | 'warning' | 'error' | 'info' | 'accent' | 'purple';

interface Props { label: string; color?: Color; style?: ViewStyle }

export default function Badge({ label, color = 'accent', style }: Props) {
  const colors = useColors();

  const colorMap: Record<Color, { bg: string; text: string }> = {
    success: { bg: colors.successBg, text: colors.success },
    warning: { bg: colors.warningBg, text: colors.warning },
    error:   { bg: colors.errorBg,   text: colors.error   },
    info:    { bg: colors.infoBg,    text: colors.info    },
    accent:  { bg: colors.accent + '26', text: colors.accent },
    purple:  { bg: colors.purpleBg,  text: colors.purple  },
  };

  const { bg, text } = colorMap[color];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}
          accessible accessibilityRole="text" accessibilityLabel={label}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  label: { fontSize: 12, fontWeight: '600' },
});
