/**
 * Pantalla Perfil del Miembro — datos personales y cierre de sesión.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// LinearGradient eliminado — puede fallar en Fabric (new arch) antes de registrarse
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';

interface ProfileData {
  nombre:      string;
  email:       string;
  telefono?:   string;
  genero?:     string;
  objetivo?:   string;
  estatura?:   number;
  peso_actual?: number;
  nivel_experiencia?: string;
}

export default function ProfileScreen() {
  const colors = useColors();
  const styles = useMemo(() => make_styles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data, loading, refetch } = useFetch<ProfileData>(ENDPOINTS.USER_PROFILE);

  const [editing, setEditing]     = useState(false);
  const [saving,  setSaving]      = useState(false);
  const [nombre,  setNombre]      = useState('');
  const [telefono,setTelefono]    = useState('');

  const startEdit = () => {
    setNombre(data?.nombre ?? user?.nombre ?? '');
    setTelefono(data?.telefono ?? '');
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put(ENDPOINTS.USER_PROFILE, { nombre, telefono });
      await refetch();
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando perfil…" />;

  const displayNombre = data?.nombre ?? user?.nombre ?? '';
  const initials      = displayNombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      {/* Hero banner — sin LinearGradient */}
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <View style={styles.avatarWrap} accessibilityLabel={`Avatar de ${displayNombre}`}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.heroName}>{displayNombre}</Text>
        <Text style={styles.heroEmail}>{data?.email ?? user?.email ?? ''}</Text>

        <View style={styles.statsRow}>
          <StatPill label="Objetivo" value={data?.objetivo ?? '—'} icon="flag-outline" />
          <StatPill label="Nivel" value={data?.nivel_experiencia ?? '—'} icon="bar-chart-outline" />
          <StatPill label="Altura" value={data?.estatura ? `${data.estatura}m` : '—'} icon="resize-outline" />
        </View>
      </View>

      <View style={styles.body}>
        {/* Info card */}
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Información personal</Text>
            {!editing && (
              <TouchableOpacity
                onPress={startEdit}
                style={styles.editBtn}
                accessibilityLabel="Editar perfil"
                accessibilityRole="button"
              >
                <Ionicons name="pencil-outline" size={16} color={colors.accent} />
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Nombre completo"
              />
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Número de teléfono"
              />
              <View style={styles.editActions}>
                <Button label="Cancelar" variant="secondary" size="sm" onPress={() => setEditing(false)} style={{ flex: 1 }} />
                <Button label="Guardar" size="sm" onPress={saveProfile} loading={saving} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <InfoRow icon="mail-outline"   label="Correo"   value={data?.email ?? user?.email ?? '—'} />
              <InfoRow icon="call-outline"   label="Teléfono" value={data?.telefono ?? '—'} />
              <InfoRow icon="person-outline" label="Género"   value={data?.genero ?? '—'} />
            </>
          )}
        </Card>

        {/* Physical data */}
        <Card>
          <Text style={styles.sectionTitle}>Datos físicos</Text>
          <InfoRow icon="scale-outline"       label="Peso actual"  value={data?.peso_actual ? `${data.peso_actual} kg` : '—'} />
          <InfoRow icon="resize-outline"      label="Estatura"     value={data?.estatura ? `${data.estatura} m` : '—'} />
          <InfoRow icon="fitness-outline"     label="Objetivo"     value={data?.objetivo ?? '—'} />
          <InfoRow icon="bar-chart-outline"   label="Experiencia"  value={data?.nivel_experiencia ?? '—'} />
        </Card>

        {/* Actions */}
        <Card>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogout}
            accessibilityLabel="Cerrar sesión"
            accessibilityRole="button"
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.errorBg }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.error }]}>Cerrar sesión</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.error} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.version}>GymPro Mobile v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon as any} size={16} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon as any} size={14} color={colors.accent} />
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: {
    alignItems:    'center',
    paddingBottom: 32,
    paddingHorizontal: 24,
    gap:           10,
    backgroundColor: '#1e1b4b',
  },
  avatarWrap: { marginBottom: 4 },
  avatar: {
    width:           90,
    height:          90,
    borderRadius:    28,
    backgroundColor: colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  initials:  { color: '#fff', fontSize: 32, fontWeight: '800' },
  heroName:  { color: colors.text, fontSize: 22, fontWeight: '700' },
  heroEmail: { color: colors.textSecondary, fontSize: 13 },
  statsRow:  { flexDirection: 'row', gap: 10, marginTop: 8 },
  statPill: {
    alignItems:      'center',
    backgroundColor: 'rgba(108,99,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderRadius:    14,
    gap:             2,
  },
  statVal:   { color: colors.text, fontSize: 12, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 10 },
  body: { padding: 20, gap: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  inputLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, color: colors.text, padding: 12, fontSize: 15,
  },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoIconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(108,99,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { color: colors.textSecondary, fontSize: 11 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
  },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  version: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
}
