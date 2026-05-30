/**
 * Perfil del Entrenador — visualización + edición inline.
 * GET /api/trainer/profile  → { success, profile: { name, email, phone, address,
 *                              specialization, experience, certifications, bio, stats, achievements } }
 * PUT /api/trainer/profile  → { name, email, phone, address, specialization, bio, certifications }
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';

interface TrainerProfile {
  name:           string;
  email:          string;
  phone?:         string;
  address?:       string;
  specialization?: string;
  experience?:    string;
  certifications?: string;
  bio?:           string;
  stats?: {
    totalClients:   number;
    totalSessions:  number;
    avgRating:      number;
    yearsActive:    number;
    certifications: number;
  };
  achievements?: { title: string; date: string; description: string }[];
}

export default function TrainerProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data, loading, refetch } = useFetch<{ success: boolean; profile: TrainerProfile }>(ENDPOINTS.TRAINER_PROFILE);

  const profile = data?.profile;

  const [editing,        setEditing]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [name,           setName]           = useState('');
  const [email,          setEmail]          = useState('');
  const [phone,          setPhone]          = useState('');
  const [address,        setAddress]        = useState('');
  const [specialization, setSpecialization] = useState('');
  const [bio,            setBio]            = useState('');
  const [certifications, setCertifications] = useState('');

  useEffect(() => {
    if (profile) {
      setName(toStr(profile.name));
      setEmail(toStr(profile.email));
      setPhone(toStr(profile.phone));
      setAddress(toStr(profile.address));
      setSpecialization(toStr(profile.specialization));
      setBio(toStr(profile.bio));
      setCertifications(toStr(profile.certifications));
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(ENDPOINTS.TRAINER_PROFILE, { name, email, phone, address, specialization, bio, certifications });
      setEditing(false);
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () =>
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);

  if (loading) return <LoadingSpinner fullScreen message="Cargando perfil…" />;

  const displayName = toStr(profile?.name ?? user?.nombre, 'Entrenador');
  const initials    = displayName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
    >
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
        <Text style={styles.name}>{displayName}</Text>
        <Badge label="Entrenador Personal" color="accent" />
        {profile?.specialization ? <Text style={styles.heroSub}>{profile.specialization}</Text> : null}
        {profile?.experience ? <Text style={styles.heroMeta}>{profile.experience} de experiencia</Text> : null}
      </View>

      {/* Stats */}
      {profile?.stats && (
        <View style={styles.statsRow}>
          <StatBox label="Clientes"  value={String(profile.stats.totalClients)} />
          <StatBox label="Sesiones"  value={String(profile.stats.totalSessions)} />
          <StatBox label="Rating"    value={`${profile.stats.avgRating}★`} />
        </View>
      )}

      <View style={styles.body}>
        {/* Botón editar */}
        <View style={styles.editBar}>
          {editing ? (
            <>
              <Button label="Guardar" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
              <Button label="Cancelar" variant="secondary" onPress={() => setEditing(false)} style={{ flex: 1 }} />
            </>
          ) : (
            <Button
              label="Editar perfil"
              variant="secondary"
              onPress={() => setEditing(true)}
              icon={<Ionicons name="pencil-outline" size={16} color={Colors.accent} />}
              style={{ flex: 1 }}
            />
          )}
        </View>

        {/* Datos personales */}
        <Card>
          <Text style={styles.sectionTitle}>Información personal</Text>
          <Field label="Nombre"   value={name}           onChangeText={setName}           editing={editing} />
          <Field label="Email"    value={email}          onChangeText={setEmail}          editing={editing} keyboardType="email-address" />
          <Field label="Teléfono" value={phone}          onChangeText={setPhone}          editing={editing} keyboardType="phone-pad" />
          <Field label="Dirección" value={address}       onChangeText={setAddress}        editing={editing} />
          <Field label="Especialización" value={specialization} onChangeText={setSpecialization} editing={editing} />
          <Field label="Certificaciones" value={certifications} onChangeText={setCertifications} editing={editing} multiline />
          <Field label="Biografía" value={bio}           onChangeText={setBio}            editing={editing} multiline />
        </Card>

        {/* Logros */}
        {profile?.achievements && profile.achievements.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Logros</Text>
            {profile.achievements.map((a, i) => (
              <View key={i} style={styles.achieveRow}>
                <View style={styles.achieveIcon}>
                  <Ionicons name="trophy-outline" size={16} color={Colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.achieveTitle}>{a.title}</Text>
                  <Text style={styles.achieveDate}>{a.date}</Text>
                  {a.description ? <Text style={styles.achieveDesc}>{a.description}</Text> : null}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Cerrar sesión */}
        <Card>
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Cerrar sesión">
            <View style={styles.logoutIcon}><Ionicons name="log-out-outline" size={20} color={Colors.error} /></View>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.error} />
          </TouchableOpacity>
        </Card>
        <Text style={styles.version}>GymPro Mobile v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────────────────────
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, editing, keyboardType, multiline }: {
  label: string; value: string; onChangeText: (v: string) => void;
  editing: boolean; keyboardType?: any; multiline?: boolean;
}) {
  return (
    <View style={fieldStyles.row}>
      <Text style={fieldStyles.label}>{label}</Text>
      {editing ? (
        <TextInput
          style={[fieldStyles.input, multiline && fieldStyles.inputMulti]}
          value={value} onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          multiline={multiline} numberOfLines={multiline ? 3 : 1}
          placeholderTextColor={Colors.textMuted}
          accessibilityLabel={label}
        />
      ) : (
        <Text style={fieldStyles.value} numberOfLines={multiline ? 0 : 1}>
          {value || '—'}
        </Text>
      )}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  row:        { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label:      { color: Colors.textSecondary, fontSize: 11, marginBottom: 4 },
  value:      { color: Colors.text, fontSize: 14, fontWeight: '600' },
  input:      { color: Colors.text, fontSize: 14, backgroundColor: 'rgba(108,99,255,0.06)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.background },
  hero:    { alignItems: 'center', paddingBottom: 24, paddingHorizontal: 24, gap: 6, backgroundColor: '#1e1b4b' },
  avatar:  { width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  initials:{ color: '#fff', fontSize: 30, fontWeight: '800' },
  name:    { color: Colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  heroSub: { color: Colors.accent, fontSize: 13 },
  heroMeta:{ color: Colors.textSecondary, fontSize: 12 },
  statsRow:{ flexDirection: 'row', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statVal: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  statLabel:{ color: Colors.textSecondary, fontSize: 11 },
  body:    { padding: 20, gap: 16 },
  editBar: { flexDirection: 'row', gap: 10 },
  sectionTitle: { color: Colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  achieveRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  achieveIcon:  { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.warningBg, alignItems: 'center', justifyContent: 'center' },
  achieveTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  achieveDate:  { color: Colors.textMuted, fontSize: 11 },
  achieveDesc:  { color: Colors.textSecondary, fontSize: 12 },
  logoutRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  logoutIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.errorBg, alignItems: 'center', justifyContent: 'center' },
  logoutText:   { flex: 1, color: Colors.error, fontSize: 15, fontWeight: '600' },
  version:      { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
});
