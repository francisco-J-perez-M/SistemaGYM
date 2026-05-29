import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { toStr } from '../../utils/format';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function AdminProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const nombre    = toStr(user?.nombre, 'Administrador');
  const initials  = nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  const roleLabel = user?.role === 'owner_gym'   ? 'Owner / Propietario'
                  : user?.role === 'superadmin'  ? 'Super Admin'
                  : 'Administrador';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Hero — sin LinearGradient */}
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.name}>{nombre}</Text>
        <Badge label={roleLabel} color="accent" />
        <Text style={styles.email}>{toStr(user?.email)}</Text>
      </View>

      <View style={styles.body}>
        <Card>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={Colors.accent} />
            <View>
              <Text style={styles.infoLabel}>Correo</Text>
              <Text style={styles.infoValue}>{toStr(user?.email)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-outline" size={16} color={Colors.accent} />
            <View>
              <Text style={styles.infoLabel}>Rol</Text>
              <Text style={styles.infoValue}>{roleLabel}</Text>
            </View>
          </View>
          {user?.plan ? (
            <View style={styles.infoRow}>
              <Ionicons name="ribbon-outline" size={16} color={Colors.accent} />
              <View>
                <Text style={styles.infoLabel}>Plan GymPro</Text>
                <Text style={styles.infoValue}>{user.plan}</Text>
              </View>
            </View>
          ) : null}
        </Card>

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
  screen:   { flex: 1, backgroundColor: Colors.background },
  hero:     {
    alignItems: 'center', paddingBottom: 32, paddingHorizontal: 24, gap: 8,
    backgroundColor: '#1e1b4b',
  },
  avatar:   {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  initials: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name:     { color: Colors.text, fontSize: 22, fontWeight: '700' },
  email:    { color: Colors.textSecondary, fontSize: 13 },
  body:     { padding: 20, gap: 16 },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel:{ color: Colors.textSecondary, fontSize: 11 },
  infoValue:{ color: Colors.text, fontSize: 14, fontWeight: '600' },
  actionRow:{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  actionIcon:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel:{ flex: 1, fontSize: 15, fontWeight: '600' },
  version:  { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
});
