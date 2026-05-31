/**
 * Perfil del Propietario — visualización + edición.
 * GET /api/owner_gym/perfil → Gimnasio.to_dict() (nombre, email_contacto, telefono, tipo_gimnasio)
 * PUT /api/owner_gym/perfil → { nombre, email_contacto, telefono, tipo_gimnasio }
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';

interface OwnerGym {
  nombre?:          string;
  email_contacto?:  string;
  telefono?:        string;
  tipo_gimnasio?:   string;
  plan?:            string;
  fecha_creacion?:  string;
}

function Field({ label, value, onChangeText, editing, keyboardType, multiline, fieldS, colors }: {
  label: string; value: string; onChangeText: (v: string) => void;
  editing: boolean; keyboardType?: any; multiline?: boolean;
  fieldS: ReturnType<typeof make_fieldS>;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={fieldS.row}>
      <Text style={fieldS.label}>{label}</Text>
      {editing ? (
        <TextInput
          style={[fieldS.input, multiline && fieldS.inputMulti]}
          value={value} onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          multiline={multiline} numberOfLines={multiline ? 3 : 1}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
        />
      ) : (
        <Text style={fieldS.value}>{value || '—'}</Text>
      )}
    </View>
  );
}

export default function AdminProfileScreen() {
  const colors = useColors();
  const fieldS = useMemo(() => make_fieldS(colors), [colors]);
  const styles = useMemo(() => make_styles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  // Datos del gimnasio (GET /api/owner_gym/perfil)
  const { data: gymData, loading: loadingGym, refetch: refetchGym } =
    useFetch<OwnerGym>(ENDPOINTS.OWNER_GYM_PROFILE);

  const [editing,      setEditing]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [nombre,       setNombre]       = useState('');
  const [emailContact, setEmailContact] = useState('');
  const [telefono,     setTelefono]     = useState('');
  const [tipoGym,      setTipoGym]      = useState('');

  useEffect(() => {
    if (gymData) {
      setNombre(toStr(gymData.nombre));
      setEmailContact(toStr(gymData.email_contacto));
      setTelefono(toStr(gymData.telefono));
      setTipoGym(toStr(gymData.tipo_gimnasio));
    }
  }, [gymData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(ENDPOINTS.OWNER_GYM_PROFILE, {
        nombre, email_contacto: emailContact, telefono, tipo_gimnasio: tipoGym,
      });
      setEditing(false);
      refetchGym();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.msg ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () =>
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);

  if (loadingGym) return <LoadingSpinner fullScreen message="Cargando perfil…" />;

  const displayNombre = toStr(gymData?.nombre ?? user?.nombre, 'Propietario');
  const initials      = displayNombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const roleLabel     = user?.role === 'owner_gym' ? 'Owner / Propietario' : 'Administrador';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loadingGym} onRefresh={refetchGym} tintColor={colors.accent} />}
    >
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
        <Text style={styles.name}>{displayNombre}</Text>
        <Badge label={roleLabel} color="accent" />
        <Text style={styles.email}>{toStr(user?.email)}</Text>
        {gymData?.plan ? <Text style={styles.plan}>Plan GymPro: {gymData.plan}</Text> : null}
      </View>

      <View style={styles.body}>
        {/* Editar */}
        <View style={styles.editBar}>
          {editing ? (
            <>
              <Button label="Guardar" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
              <Button label="Cancelar" variant="secondary" onPress={() => setEditing(false)} style={{ flex: 1 }} />
            </>
          ) : (
            <Button
              label="Editar perfil del Gym"
              variant="secondary"
              onPress={() => setEditing(true)}
              icon={<Ionicons name="pencil-outline" size={16} color={colors.accent} />}
              style={{ flex: 1 }}
            />
          )}
        </View>

        {/* Datos del gym */}
        <Card>
          <Text style={styles.sectionTitle}>Datos del gimnasio</Text>
          <Field label="Nombre"           value={nombre}       onChangeText={setNombre}       editing={editing}
              fieldS={fieldS} colors={colors} />
          <Field label="Email de contacto" value={emailContact} onChangeText={setEmailContact} editing={editing} keyboardType="email-address"
              fieldS={fieldS} colors={colors} />
          <Field label="Teléfono"         value={telefono}     onChangeText={setTelefono}     editing={editing} keyboardType="phone-pad"
              fieldS={fieldS} colors={colors} />
          <Field label="Tipo de gimnasio" value={tipoGym}      onChangeText={setTipoGym}      editing={editing}
              fieldS={fieldS} colors={colors} />
        </Card>

        {/* Datos del usuario propietario (solo lectura) */}
        <Card>
          <Text style={styles.sectionTitle}>Cuenta del propietario</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={colors.accent} />
            <View>
              <Text style={styles.infoLabel}>Correo de acceso</Text>
              <Text style={styles.infoValue}>{toStr(user?.email)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-outline" size={16} color={colors.accent} />
            <View>
              <Text style={styles.infoLabel}>Rol</Text>
              <Text style={styles.infoValue}>{roleLabel}</Text>
            </View>
          </View>
        </Card>

        {/* Cerrar sesión */}
        <Card>
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} accessibilityRole="button">
            <View style={styles.logoutIcon}><Ionicons name="log-out-outline" size={20} color={colors.error} /></View>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.error} />
          </TouchableOpacity>
        </Card>
        <Text style={styles.version}>GymPro Mobile v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

function make_fieldS(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  row:        { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  label:      { color: colors.textSecondary, fontSize: 11, marginBottom: 4 },
  value:      { color: colors.text, fontSize: 14, fontWeight: '600' },
  input:      { color: colors.text, fontSize: 14, backgroundColor: 'rgba(108,99,255,0.06)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.border },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
});
}

function make_styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  hero:    { alignItems: 'center', paddingBottom: 28, paddingHorizontal: 24, gap: 6, backgroundColor: colors.heroTop },
  avatar:  { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  initials:{ color: '#fff', fontSize: 32, fontWeight: '800' },
  name:    { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  email:   { color: colors.textSecondary, fontSize: 13 },
  plan:    { color: colors.accent, fontSize: 12 },
  body:    { padding: 20, gap: 16 },
  editBar: { flexDirection: 'row', gap: 10 },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:{ color: colors.textSecondary, fontSize: 11 },
  infoValue:{ color: colors.text, fontSize: 14, fontWeight: '600' },
  logoutRow:{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  logoutIcon:{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.errorBg, alignItems: 'center', justifyContent: 'center' },
  logoutText:{ flex: 1, color: colors.error, fontSize: 15, fontWeight: '600' },
  version:  { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
}
