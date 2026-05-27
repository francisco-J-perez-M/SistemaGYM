import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface Props {
  children:  React.ReactNode;
  style?:    ViewStyle;
  padding?:  number;
  elevated?: boolean;
}

export default function Card({ children, style, padding = 16, elevated = false }: Props) {
  return (
    <View
      style={[
        styles.card,
        { padding },
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
  card: {
    backgroundColor: Colors.card,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  elevated: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius:  8,
    elevation:     6,
  },
});
