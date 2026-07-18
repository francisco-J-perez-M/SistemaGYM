import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '../../hooks/useColors';

interface Props {
  children:  React.ReactNode;
  style?:    ViewStyle;
  padding?:  number;
  elevated?: boolean;
}

export default function Card({ children, style, padding = 16, elevated = false }: Props) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor:     colors.border,
          padding,
        },
        elevated && styles.elevated,
        style,
      ]}
      accessible={false}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth:  1,
  },
  elevated: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius:  8,
    elevation:     6,
  },
});
