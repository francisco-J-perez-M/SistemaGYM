/**
 * Perfil del Entrenador — visualización + edición inline.
 * GET /api/trainer/profile  → { success, profile: { name, email, phone, address,
 *                              specialization, experience, certifications, bio, stats, achievements } }
 * PUT /api/trainer/profile  → { name, email, phone, address, specialization, bio, certifications }
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AccessibilityPanel from '../../components/settings/AccessibilityPanel';
import * as Haptics from 'expo-haptics';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';

/** Certificación tal como la guarda y devuelve la API. */
interface Certificacion {
  id?:     string;
  nombre?: string;
  emisor?: string;
  anio?:   string | number;
  url_archivo?: string;
}

interface TrainerProfile {
  name:           string;
  email:          string;
  photo?:         string | null;   // base64 data URI
  phone?:         string;
  address?:       string;
  specialization?: string;
  experience?:    string;
  /**
   * La API devuelve un ARREGLO de objetos, no texto. Tratarlo como cadena era
   * la razón de que las certificaciones aparecieran vacías en el perfil.
   */
  certifications?: Certificacion[];
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
  const colors = useColors();
  const fs = useFontScale();
  const fieldStyles = useMemo(() => make_fieldStyles(colors, fs), [colors, fs]);
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data, loading, refetch } = useFetch<{ success: boolean; profile: TrainerProfile }>(ENDPOINTS.TRAINER_PROFILE);

  const profile = data?.profile;

  const [editing,        setEditing]        = useState(false);
  const [showA11y, setShowA11y] = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [name,           setName]           = useState('');
  const [email,          setEmail]          = useState('');
  const [phone,          setPhone]          = useState('');
  const [address,        setAddress]        = useState('');
  const [specialization, setSpecialization] = useState('');
  const [bio,            setBio]            = useState('');
  const [certifications, setCertifications] = useState<Certificacion[]>([]);

  useEffect(() => {
    if (profile) {
      setName(toStr(profile.name));
      setEmail(toStr(profile.email));
      setPhone(toStr(profile.phone));
      setAddress(toStr(profile.address));
      setSpecialization(toStr(profile.specialization));
      setBio(toStr(profile.bio));
      setCertifications(toArray<Certificacion>(profile.certifications));
    }
  }, [profile]);

  // ── Certificaciones ───────────────────────────────────────────────────────
  const agregarCert = () =>
    setCertifications((prev) => [...prev, { nombre: '', emisor: '', anio: '' }]);

  const editarCert = (i: number, campo: keyof Certificacion, valor: string) =>
    setCertifications((prev) =>
      prev.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)));

  const quitarCert = (i: number) =>
    setCertifications((prev) => prev.filter((_, j) => j !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Se descartan las filas sin nombre: el backend las ignoraría igual y
      // así no se guardan certificaciones en blanco.
      const certs = certifications
        .filter((c) => toStr(c.nombre).trim())
        .map((c) => ({
          nombre: toStr(c.nombre).trim(),
          emisor: toStr(c.emisor).trim(),
          anio:   toStr(c.anio).trim(),
        }));
      await api.put(ENDPOINTS.TRAINER_PROFILE, {
        name, email, phone, address, specialization, bio, certifications: certs,
      });
      setEditing(false);
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando perfil…" />;

  const displayName = toStr(profile?.name ?? user?.nombre, 'Entrenador');
  const initials    = displayName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        {profile?.photo && profile.photo.startsWith('data:image') ? (
          <Image source={{ uri: profile.photo }} style={styles.avatarImg} resizeMode="cover" />
        ) : (
          <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
        )}
        <Text style={styles.name}>{displayName}</Text>
        <Badge label="Entrenador Personal" color="accent" />
        {profile?.specialization ? <Text style={styles.heroSub}>{profile.specialization}</Text> : null}
        {profile?.experience ? <Text style={styles.heroMeta}>{profile.experience} de experiencia</Text> : null}
      </View>

      {/* Stats */}
      {profile?.stats && (
        <View style={styles.statsRow}>
          <StatBox label="Clientes"  value={String(profile.stats.totalClients)}
              styles={styles} />
          <StatBox label="Sesiones"  value={String(profile.stats.totalSessions)}
              styles={styles} />
          <StatBox label="Rating"    value={`${profile.stats.avgRating}★`}
              styles={styles} />
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
              icon={<Ionicons name="pencil-outline" size={16} color={colors.accent} />}
              style={{ flex: 1 }}
            />
          )}
        </View>

        {/* Datos personales */}
        <Card>
          <Text style={styles.sectionTitle}>Información personal</Text>
          <Field label="Nombre"   value={name}           onChangeText={setName}           editing={editing}
              fieldStyles={fieldStyles} colors={colors} />
          <Field label="Email"    value={email}          onChangeText={setEmail}          editing={editing} keyboardType="email-address"
              fieldStyles={fieldStyles} colors={colors} />
          <Field label="Teléfono" value={phone}          onChangeText={setPhone}          editing={editing} keyboardType="phone-pad"
              fieldStyles={fieldStyles} colors={colors} />
          <Field label="Dirección" value={address}       onChangeText={setAddress}        editing={editing}
              fieldStyles={fieldStyles} colors={colors} />
          <Field label="Especialización" value={specialization} onChangeText={setSpecialization} editing={editing}
              fieldStyles={fieldStyles} colors={colors} />
          {/* Certificaciones: lista estructurada, igual que en la web */}
          <View style={styles.certSeccion}>
            <View style={styles.certCabecera}>
              <Text style={styles.certTitulo}>Certificaciones</Text>
              {editing ? (
                <TouchableOpacity onPress={agregarCert} accessibilityRole="button"
                                  accessibilityLabel="Agregar certificación">
                  <Text style={styles.certAgregar}>+ Agregar</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {certifications.length === 0 ? (
              <Text style={styles.certVacio}>
                {editing ? 'Agrega tus certificaciones con el botón de arriba.'
                         : 'Sin certificaciones registradas.'}
              </Text>
            ) : (
              certifications.map((c, i) => (
                editing ? (
                  <View key={i} style={styles.certEditor}>
                    <View style={styles.certEditorTop}>
                      <TextInput
                        style={[styles.certInput, { flex: 1 }]}
                        value={toStr(c.nombre)}
                        onChangeText={(v) => editarCert(i, 'nombre', v)}
                        placeholder="Nombre de la certificación"
                        placeholderTextColor={colors.textMuted}
                        accessibilityLabel={`Nombre de la certificación ${i + 1}`}
                      />
                      <TouchableOpacity onPress={() => quitarCert(i)} hitSlop={8}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Quitar certificación ${i + 1}`}>
                        <Ionicons name="close-circle" size={22} color={colors.dataRiesgo} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.certEditorFila}>
                      <TextInput
                        style={[styles.certInput, { flex: 2 }]}
                        value={toStr(c.emisor)}
                        onChangeText={(v) => editarCert(i, 'emisor', v)}
                        placeholder="Emisor"
                        placeholderTextColor={colors.textMuted}
                        accessibilityLabel="Emisor"
                      />
                      <TextInput
                        style={[styles.certInput, { flex: 1 }]}
                        value={toStr(c.anio)}
                        onChangeText={(v) => editarCert(i, 'anio', v.replace(/\D/g, '').slice(0, 4))}
                        placeholder="Año"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        accessibilityLabel="Año"
                      />
                    </View>
                  </View>
                ) : (
                  <View key={i} style={styles.certFila}>
                    <View style={styles.certIcono}>
                      <Ionicons name="ribbon-outline" size={16} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.certNombre}>{toStr(c.nombre)}</Text>
                      <Text style={styles.certMeta}>
                        {[toStr(c.emisor), toStr(c.anio)].filter(Boolean).join(' · ') || '—'}
                      </Text>
                    </View>
                  </View>
                )
              ))
            )}
          </View>

          <Field label="Biografía" value={bio}           onChangeText={setBio}            editing={editing} multiline
              fieldStyles={fieldStyles} colors={colors} />
        </Card>

        {/* Logros */}
        {profile?.achievements && profile.achievements.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Logros</Text>
            {profile.achievements.map((a, i) => (
              <View key={i} style={styles.achieveRow}>
                <View style={styles.achieveIcon}>
                  <Ionicons name="trophy-outline" size={16} color={colors.warning} />
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

        {/* Accesibilidad */}
        <Card>
          <TouchableOpacity style={styles.logoutRow} onPress={() => setShowA11y(true)}
            accessibilityRole="button" accessibilityLabel="Ajustes de accesibilidad">
            <View style={styles.a11yIcon}><Ionicons name="accessibility-outline" size={20} color={colors.accent} /></View>
            <Text style={styles.a11yText}>Accesibilidad</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Cerrar sesión */}
        <Card>
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Cerrar sesión"
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

// ── Subcomponentes ─────────────────────────────────────────────────────────────
function StatBox({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof make_styles> }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, editing, keyboardType, multiline, fieldStyles, colors }: {
  label: string; value: string; onChangeText: (v: string) => void;
  editing: boolean; keyboardType?: any; multiline?: boolean;
  fieldStyles: ReturnType<typeof make_fieldStyles>;
  colors: ReturnType<typeof useColors>;
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
          placeholderTextColor={colors.textMuted}
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

function make_fieldStyles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  row:        { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  label:      { color: colors.textSecondary, fontSize: 11 * fs, marginBottom: 4 },
  value:      { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  input:      { color: colors.text, fontSize: 14 * fs, backgroundColor: colors.accentBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.border },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
});
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },

  // ── Certificaciones ───────────────────────────────────────────────────────
  certSeccion:  { marginTop: 14, gap: 8 },
  certCabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  certTitulo:   { color: colors.textSecondary, fontSize: 11 * fs, fontWeight: '700' },
  certAgregar:  { color: colors.accent, fontSize: 12.5 * fs, fontWeight: '700' },
  certVacio:    { color: colors.textMuted, fontSize: 12 * fs },
  certFila: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 11, padding: 11,
  },
  certIcono: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: colors.accentBg,
    alignItems: 'center', justifyContent: 'center',
  },
  certNombre: { color: colors.text, fontSize: 13 * fs, fontWeight: '700' },
  certMeta:   { color: colors.textSecondary, fontSize: 11 * fs, marginTop: 1 },
  certEditor: {
    gap: 8, backgroundColor: colors.surface, borderRadius: 11, padding: 11,
  },
  certEditorTop:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  certEditorFila: { flexDirection: 'row', gap: 8 },
  certInput: {
    backgroundColor: colors.inputBg, borderRadius: 9,
    paddingHorizontal: 11, paddingVertical: 9,
    color: colors.text, fontSize: 13 * fs,
    borderWidth: 1, borderColor: colors.border,
  },

  hero:    { alignItems: 'center', paddingBottom: 24, paddingHorizontal: 24, gap: 6, backgroundColor: colors.heroTop },
  avatar:  { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarImg: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.surface, marginBottom: 4 },
  initials:{ color: colors.onAccent, fontSize: 30 * fs, fontWeight: '800' },
  name:    { color: colors.text, fontSize: 22 * fs, fontWeight: '700', textAlign: 'center' },
  heroSub: { color: colors.accent, fontSize: 13 * fs },
  heroMeta:{ color: colors.textSecondary, fontSize: 12 * fs },
  statsRow:{ flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statVal: { color: colors.text, fontSize: 20 * fs, fontWeight: '800' },
  statLabel:{ color: colors.textSecondary, fontSize: 11 * fs },
  body:    { padding: 20, gap: 16 },
  editBar: { flexDirection: 'row', gap: 10 },
  sectionTitle: { color: colors.text, fontSize: 14 * fs, fontWeight: '700', marginBottom: 4 },
  achieveRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  achieveIcon:  { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center' },
  achieveTitle: { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  achieveDate:  { color: colors.textMuted, fontSize: 11 * fs },
  achieveDesc:  { color: colors.textSecondary, fontSize: 12 * fs },
  a11yIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent + '18', alignItems: 'center', justifyContent: 'center' },
  a11yText:   { flex: 1, color: colors.text, fontSize: 15 * fs, fontWeight: '600' },
  logoutRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  logoutIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.errorBg, alignItems: 'center', justifyContent: 'center' },
  logoutText:   { flex: 1, color: colors.error, fontSize: 15 * fs, fontWeight: '600' },
  version:      { color: colors.textMuted, fontSize: 12 * fs, textAlign: 'center' },
});
}
