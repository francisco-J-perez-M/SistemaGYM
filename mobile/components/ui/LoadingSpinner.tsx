import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';

interface Props { message?: string; fullScreen?: boolean }

export default function LoadingSpinner({ message, fullScreen = false }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.container, fullScreen && { flex: 1, backgroundColor: colors.background }]}
          accessible accessibilityLiveRegion="polite" accessibilityLabel={message ?? 'Cargando…'}>
      <ActivityIndicator size="large" color={colors.accent} />
      {message && <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  text:      { fontSize: 14 },
});
