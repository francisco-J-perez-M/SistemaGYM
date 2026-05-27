import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';

export default function TrainerProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const nombre   = user?.nombre ?? 'Entrenador';
  const initials = nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#1e1b4b', '#312e81', Colors.background]} style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <LinearGradient colors={Colors.gradientAccent} style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </LinearGradient>
        <Text style={styles.name}>{nombre}</Text>
        <Text style={styles.role}>Entrenador Personal</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <Card>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogout}
            accessibilityLabel="Cerrar sesión"
            accessibilityRole="button"
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.errorBg }]}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            </View>
            <Text style={[styles.actionLabel, { color: Colors.error }]}>Cerrar sesión</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.error} />
          </TouchableOpacity>
        </Card>
        <Text style={styles.version}>GymPro Mobile v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  hero:   { alignItems: 'center', paddingBottom: 32, paddingHorizontal: 24, gap: 8 },
  avatar: { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name:     { color: Colors.text, fontSize: 22, fontWeight: '700' },
  role:     { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  email:    { color: Colors.textSecondary, fontSize: 13 },
  body:     { padding: 20, gap: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  version: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
});
