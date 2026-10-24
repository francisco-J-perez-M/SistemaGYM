import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, AccessibilityRole,
} from 'react-native';
import { Colors } from '../../constants/Colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface Props {
  label:           string;
  onPress:         () => void;
  variant?:        Variant;
  size?:           Size;
  loading?:        boolean;
  disabled?:       boolean;
  style?:          ViewStyle;
  labelStyle?:     TextStyle;
  accessibilityLabel?: string;
  icon?:           React.ReactNode;
}

const variants: Record<Variant, ViewStyle> = {
  primary:   { backgroundColor: Colors.accent },
  secondary: { backgroundColor: Colors.surface,  borderWidth: 1, borderColor: Colors.border },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: Colors.error },
};

const labelColors: Record<Variant, string> = {
  primary:   '#fff',
  secondary: Colors.text,
  ghost:     Colors.accent,
  danger:    '#fff',
};

const sizes: Record<Size, ViewStyle & { paddingVertical: number; paddingHorizontal: number }> = {
  sm: { paddingVertical: 8,  paddingHorizontal: 16, borderRadius: 8  },
  md: { paddingVertical: 13, paddingHorizontal: 24, borderRadius: 12 },
  lg: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14 },
};

const fontSizes: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

export default function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, style, labelStyle, accessibilityLabel, icon,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      accessible
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        variants[variant],
        sizes[size],
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={labelColors[variant]} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              { color: labelColors[variant], fontSize: fontSizes[size] },
              icon ? { marginLeft: 8 } : undefined,
              labelStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
