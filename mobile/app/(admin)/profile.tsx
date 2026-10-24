/**
 * Mi Perfil — Owner Gym.
 *
 * Esta pantalla es la ficha de LA PERSONA que administra el gimnasio. Los datos
 * del negocio (nombre comercial, contacto, tipo de establecimiento) se ven y se
 * editan en 'Perfil del Gym'; aquí solo hay un acceso directo.
 *
 *   GET /api/owner_gym/perfil → datos del gimnasio + bloque 'propietario'
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toDateStr } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { router } from 'expo-router';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import AccessibilityPanel from '../../components/settings/AccessibilityPanel';
import * as Haptics from 'expo-haptics';
import Badge from '../../components/ui/Badge';

/** Persona propietaria, tal como la devuelve el endpoint. */
interface Propietario {
  id?:          number;
  nombre?:      string;
  email?:       string;
  telefono?:    string | null;
  rol?:         string;
  activo?:      boolean;
  foto_perfil?: string | null;
  created_at?:  string | null;
}

interface OwnerGym {
  nombre?:              string;
  email_contacto?:      string;
  telefono?:            string;
  tipo_gimnasio?:       string;
  tipo_gimnasio_label?: string;
  plan?:                string;
  fecha_creacion?:      string;
  propietario?:         Propietario | null;
  owner_foto?:          string | null;   // compatibilidad
  owner_nombre?:        string;
}

// El formulario de campos editables se movió a 'Perfil del Gym', que es donde
// se administran los datos del negocio.

export default function AdminProfileScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  // Datos del gimnasio (GET /api/owner_gym/perfil)
  const { data: gymData, loading: loadingGym, refetch: refetchGym } =
    useFetch<OwnerGym>(ENDPOINTS.OWNER_GYM_PROFILE);

  // La edición de los datos del gimnasio vive en la pantalla 'Perfil del Gym';
  // aquí solo se consulta el nombre del negocio para el acceso directo.
  const [showA11y, setShowA11y] = useState(false);

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  if (loadingGym) return <LoadingSpinner fullScreen message="Cargando perfil…" />;

  // 'Mi Perfil' es la ficha de LA PERSONA. Antes encabezaba con el nombre del
  // gimnasio, así que el dueño veía el negocio donde esperaba verse a sí mismo;
  // los datos del gimnasio viven en la pantalla 'Perfil del Gym'.
  const propietario   = gymData?.propietario ?? null;
  const displayNombre = toStr(propietario?.nombre ?? user?.nombre, 'Propietario');
  const displayEmail  = toStr(propietario?.email ?? user?.email);
  const fotoPerfil    = propietario?.foto_perfil ?? gymData?.owner_foto ?? null;
  const initials      = displayNombre.trim().split(/\s+/).slice(0, 2)
                          .map((n) => n[0]).join('').toUpperCase();
  const roleLabel     = user?.role === 'owner_gym' ? 'Owner / Propietario' : 'Administrador';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loadingGym} onRefresh={refetchGym} tintColor={colors.accent} />}
    >
      {/* Hero: la persona, no el negocio */}
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        {fotoPerfil && fotoPerfil.startsWith('data:image') ? (
          <Image source={{ uri: fotoPerfil }} style={styles.avatarImg} resizeMode="cover" />
        ) : (
          <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
        )}
        <Text style={styles.name}>{displayNombre}</Text>
        <Badge label={roleLabel} color="accent" />
        <Text style={styles.email}>{displayEmail}</Text>
        {gymData?.nombre ? (
          <Text style={styles.plan}>
            {toStr(gymData.nombre)}
            {gymData.plan ? `  ·  Plan ${gymData.plan}` : ''}
          </Text>
        ) : null}
      </View>

      <View style={styles.body}>
        {/* Ficha del propietario */}
        <Card>
          <Text style={styles.sectionTitle}>Mis datos</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{displayNombre}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Correo de acceso</Text>
              <Text style={styles.infoValue}>{displayEmail}</Text>
            </View>
          </View>
          {propietario?.telefono ? (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{toStr(propietario.telefono)}</Text>
              </View>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Ionicons name="shield-outline" size={16} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Rol</Text>
              <Text style={styles.infoValue}>{roleLabel}</Text>
            </View>
          </View>
          {propietario?.created_at ? (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Cuenta creada</Text>
                <Text style={styles.infoValue}>{toDateStr(propietario.created_at)}</Text>
              </View>
            </View>
          ) : null}
        </Card>

        {/* Acceso al negocio: los datos del gimnasio viven en su propia pantalla */}
        <Card>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={() => router.push('/(admin)/gym-profile')}
            accessibilityRole="button"
            accessibilityLabel="Ver el perfil del gimnasio"
          >
            <View style={styles.logoutIcon}>
              <Ionicons name="business-outline" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.logoutText, { color: colors.text }]}>
                {toStr(gymData?.nombre, 'Mi gimnasio')}
              </Text>
              <Text style={styles.infoLabel}>
                {toStr(gymData?.tipo_gimnasio_label, 'Ver datos del negocio')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Accesibilidad */}
        <Card>
          <TouchableOpacity style={styles.logoutRow} onPress={() => setShowA11y(true)}
            accessibilityRole="button" accessibilityLabel="Ajustes de accesibilidad">
            <View style={styles.logoutIcon}><Ionicons name="accessibility-outline" size={20} color={colors.accent} /></View>
            <Text style={[styles.logoutText, { color: colors.text }]}>Accesibilidad</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Cerrar sesión */}
        <Card>
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            accessibilityHint="Cierra tu sesión actual y vuelve a la pantalla de inicio">
            <View style={styles.logoutIcon}><Ionicons name="log-out-outline" size={20} color={colors.error} /></View>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.error} />
          </TouchableOpacity>
        </Card>
        <Text style={styles.version}>GymPro Mobile v1.0.0</Text>
      </View>
      <AccessibilityPanel visible={showA11y} onClose={() => setShowA11y(false)} />
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  hero:    { alignItems: 'center', paddingBottom: 28, paddingHorizontal: 24, gap: 6, backgroundColor: colors.heroTop },
  avatar:  { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarImg: { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.surface, marginBottom: 4 },
  initials:{ color: colors.onAccent, fontSize: 32 * fs, fontWeight: '800' },
  name:    { color: colors.text, fontSize: 22 * fs, fontWeight: '700', textAlign: 'center' },
  email:   { color: colors.textSecondary, fontSize: 13 * fs },
  plan:    { color: colors.accent, fontSize: 12 * fs },
  body:    { padding: 20, gap: 16 },
  editBar: { flexDirection: 'row', gap: 10 },
  sectionTitle: { color: colors.text, fontSize: 14 * fs, fontWeight: '700', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:{ color: colors.textSecondary, fontSize: 11 * fs },
  infoValue:{ color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  logoutRow:{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  logoutIcon:{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.errorBg, alignItems: 'center', justifyContent: 'center' },
  logoutText:{ flex: 1, color: colors.error, fontSize: 15 * fs, fontWeight: '600' },
  version:  { color: colors.textMuted, fontSize: 12 * fs, textAlign: 'center' },
});
}
