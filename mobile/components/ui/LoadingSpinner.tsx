import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface Props {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ message, fullScreen = false }: Props) {
  return (
    <View
      style={[styles.container, fullScreen && styles.fullScreen]}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={message ?? 'Cargando…'}
    >
      <ActivityIndicator size="large" color={Colors.accent} />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
    padding:        32,
    gap:            12,
  },
  fullScreen: {
    flex:            1,
    backgroundColor: Colors.background,
  },
  text: {
    color:    Colors.textSecondary,
    fontSize: 14,
  },
});
