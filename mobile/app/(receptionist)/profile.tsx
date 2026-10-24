/**
 * Perfil del Recepcionista — datos de cuenta + cerrar sesión.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { useAuth } from '../../hooks/useAuth';
import { toStr } from '../../utils/format';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function ReceptionistProfileScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const nombre   = toStr(user?.nombre, 'Recepcionista');
  const initials = nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
        <Text style={styles.name}>{nombre}</Text>
        <Badge label="Recepcionista" color="accent" />
      </View>

      <View style={styles.body}>
        <Card>
          <Text style={styles.sectionTitle}>Información de cuenta</Text>
          <Row label="Nombre" value={nombre} styles={styles} />
          <Row label="Email" value={toStr(user?.email, '—')} styles={styles} />
        </Card>

        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}
          accessibilityRole="button" accessibilityLabel="Cerrar sesión">
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof make_styles> }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    hero:   { alignItems: 'center', paddingBottom: 28, gap: 8, backgroundColor: colors.heroTop },
    avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.accent,
              alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    initials: { color: colors.onAccent, fontSize: 30 * fs, fontWeight: '800' },
    name:   { color: colors.text, fontSize: 22 * fs, fontWeight: '700' },
    body:   { padding: 20, gap: 16 },
    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 12 },
    row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { color: colors.textSecondary, fontSize: 13 * fs },
    rowValue: { color: colors.text, fontSize: 14 * fs, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
    logoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                 backgroundColor: colors.errorBg, borderRadius: 14, padding: 16 },
    logoutText: { color: colors.error, fontSize: 15 * fs, fontWeight: '700' },
  });
}
