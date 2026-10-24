/**
 * Mi Perfil — Owner Gym.
 *
 * Esta pantalla es la ficha de LA PERSONA que administra el gimnasio. Los datos
 * del negocio (nombre comercial, contacto, tipo de establecimiento) se ven y se
 * editan en 'Perfil del Gym'; aquí solo hay un acceso directo.
 *
 *   GET /api/owner_gym/perfil → datos del gimnasio + bloque 'propietario'
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Image, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toDateStr } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { router } from 'expo-router';
import api from '../../services/api';
import { elegirFoto } from '../../services/media';
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

  // ── Edición de la persona ─────────────────────────────────────────────────
  const [editando,  setEditando]  = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendo,  setSubiendo]  = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '' });

  useEffect(() => {
    const p = gymData?.propietario;
    if (p) {
      setForm({
        nombre:   toStr(p.nombre),
        email:    toStr(p.email),
        telefono: toStr(p.telefono),
      });
    }
  }, [gymData]);

  const guardar = async () => {
    if (!form.nombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe tu nombre.');
      return;
    }
    if (!form.email.includes('@')) {
      Alert.alert('Correo inválido', 'Revisa tu correo de acceso.');
      return;
    }
    setGuardando(true);
    try {
      await api.put(ENDPOINTS.OWNER_PERFIL_PROPIETARIO, {
        nombre:   form.nombre.trim(),
        email:    form.email.trim().toLowerCase(),
        telefono: form.telefono.trim(),
      });
      setEditando(false);
      refetchGym();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e?.response?.data?.msg ?? 'Revisa tu conexión.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarFoto = async () => {
    const r = await elegirFoto();
    if (!r.ok) {
      if (r.error) Alert.alert('No se pudo usar la imagen', r.error);
      return;   // error null = el usuario canceló, no hay nada que avisar
    }
    setSubiendo(true);
    try {
      await api.put(ENDPOINTS.OWNER_PERFIL_PROPIETARIO, { foto_perfil: r.dataUrl });
      refetchGym();
    } catch (e: any) {
      Alert.alert('No se pudo guardar la foto', e?.response?.data?.msg ?? 'Revisa tu conexión.');
    } finally {
      setSubiendo(false);
    }
  };

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
        <TouchableOpacity
          onPress={cambiarFoto}
          disabled={subiendo}
          accessibilityRole="button"
          accessibilityLabel="Cambiar mi foto de perfil"
        >
          {fotoPerfil && fotoPerfil.startsWith('data:image') ? (
            <Image source={{ uri: fotoPerfil }} style={styles.avatarImg} resizeMode="cover" />
          ) : (
            <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
          )}
          <View style={styles.camaraBadge}>
            <Ionicons
              name={subiendo ? 'hourglass-outline' : 'camera'}
              size={14} color={colors.onAccent}
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{displayNombre}</Text>
        {/* alignSelf center: la insignia mide lo que su texto, sin esto se
            alineaba a la izquierda mientras el nombre iba centrado. */}
        <View style={styles.rolCentrado}>
          <Badge label={roleLabel} color="accent" />
        </View>
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
          <View style={styles.tituloFila}>
            <Text style={styles.sectionTitle}>Mis datos</Text>
            {editando ? (
              <View style={styles.accionesEdicion}>
                <TouchableOpacity onPress={() => { setEditando(false); refetchGym(); }}
                                  accessibilityRole="button" accessibilityLabel="Cancelar">
                  <Text style={styles.cancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={guardar} disabled={guardando}
                                  accessibilityRole="button" accessibilityLabel="Guardar cambios">
                  <Text style={styles.guardarText}>{guardando ? 'Guardando…' : 'Guardar'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditando(true)}
                                accessibilityRole="button" accessibilityLabel="Editar mis datos">
                <Text style={styles.editarText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {editando ? (
            <>
              <Text style={styles.campoLabel}>Nombre</Text>
              <TextInput
                style={styles.campo}
                value={form.nombre}
                onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                placeholder="Tu nombre"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Nombre"
              />
              <Text style={styles.campoLabel}>Correo de acceso</Text>
              <TextInput
                style={styles.campo}
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Correo de acceso"
              />
              <Text style={styles.campoAyuda}>
                Con este correo entras a la aplicación. Si lo cambias, usa el nuevo
                la próxima vez.
              </Text>
              <Text style={styles.campoLabel}>Teléfono</Text>
              <TextInput
                style={styles.campo}
                value={form.telefono}
                onChangeText={(v) => setForm((f) => ({ ...f, telefono: v }))}
                placeholder="7191055865"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                accessibilityLabel="Teléfono"
              />
            </>
          ) : (
            <>
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
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>
                    {toStr(propietario?.telefono, 'Sin registrar')}
                  </Text>
                </View>
              </View>
            </>
          )}

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
  // Insignia de la cámara sobre el avatar, para que se vea que es tocable
  camaraBadge: {
    position: 'absolute', right: -2, bottom: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.heroTop,
  },
  name:    { color: colors.text, fontSize: 22 * fs, fontWeight: '700', textAlign: 'center' },
  // La insignia de rol mide lo que su texto; sin este contenedor se pegaba a
  // la izquierda mientras el nombre iba centrado.
  rolCentrado: { alignSelf: 'center' },
  email:   { color: colors.textSecondary, fontSize: 13 * fs, textAlign: 'center' },
  plan:    { color: colors.accent, fontSize: 12 * fs, textAlign: 'center' },
  body:    { padding: 20, gap: 16 },
  editBar: { flexDirection: 'row', gap: 10 },

  // ── Edición de los datos de la persona ──────────────────────────────────
  tituloFila: { flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 4 },
  accionesEdicion: { flexDirection: 'row', gap: 16 },
  editarText:   { color: colors.accent, fontSize: 13 * fs, fontWeight: '700' },
  guardarText:  { color: colors.accent, fontSize: 13 * fs, fontWeight: '700' },
  cancelarText: { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
  campoLabel: { color: colors.textSecondary, fontSize: 11.5 * fs, fontWeight: '700',
                marginTop: 12, marginBottom: 5 },
  campoAyuda: { color: colors.textMuted, fontSize: 11 * fs, marginTop: 5 },
  campo: {
    backgroundColor: colors.inputBg, borderRadius: 10,
    paddingHorizontal: 13, paddingVertical: 10,
    color: colors.text, fontSize: 14 * fs,
    borderWidth: 1, borderColor: colors.border,
  },
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
