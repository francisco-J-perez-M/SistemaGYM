/**
 * Pantalla Perfil del Miembro — datos personales y cierre de sesión.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, RefreshControl, Image, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// LinearGradient eliminado — puede fallar en Fabric (new arch) antes de registrarse
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS, API_BASE_URL } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import AccessibilityPanel from '../../components/settings/AccessibilityPanel';
import * as Haptics from 'expo-haptics';

/**
 * Contrato real de GET /api/user/profile (claves exactas del backend).
 * Antes la app leía estatura/peso_actual/nivel_experiencia, que NO existen en
 * la respuesta → por eso salían en "—". El backend devuelve altura/peso como
 * strings ya formateados ("1.70 m", "70 kg") y nivelExperiencia en camelCase.
 */
interface ProfileData {
  nombre:              string;
  email:               string;
  telefono?:           string;
  fechaNacimiento?:    string;
  genero?:             string;
  objetivo?:           string;
  altura?:             string;   // "1.70 m" | "No registrado"
  peso?:               string;   // "70 kg"  | "No registrado"
  nivelExperiencia?:   string;
  nivelActividad?:     string;
  mesesActivo?:        number;
  totalEntrenamientos?: number;
  fotoPerfil?:         string | null;   // nombre de archivo o data URI
}

/** Normaliza valores vacíos/placeholder del backend a un guion. */
function val(v?: string | number | null): string {
  if (v === undefined || v === null) return '—';
  const s = String(v).trim();
  if (!s || s.toLowerCase() === 'no registrado') return '—';
  return s;
}

/** Extrae el número de un string como "1.70 m" o "70 kg". '' si no hay. */
function num(v?: string | null): string {
  if (!v) return '';
  const m = String(v).match(/[\d.]+/);
  return m ? m[0] : '';
}

const GENERO_OPTS    = ['Masculino', 'Femenino', 'Otro'];
const OBJETIVO_OPTS  = ['Pérdida de peso', 'Tonificación muscular', 'Ganancia muscular', 'Resistencia', 'Mantenimiento'];
const EXP_OPTS       = ['Principiante', 'Intermedio', 'Avanzado'];
const ACTIVIDAD_OPTS = ['Sedentario', 'Ligero', 'Moderado', 'Activo', 'Muy activo'];

export default function ProfileScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data, loading, refetch } = useFetch<ProfileData>(ENDPOINTS.USER_PROFILE);

  const [editing, setEditing]     = useState(false);
  const [showA11y, setShowA11y]   = useState(false);
  const [saving,  setSaving]      = useState(false);
  const [photoError, setPhotoError] = useState(false);

  // Campos editables del perfil
  const [nombre,   setNombre]   = useState('');
  const [email,    setEmail]    = useState('');
  const [telefono, setTelefono] = useState('');
  const [genero,   setGenero]   = useState('');
  const [fechaNac, setFechaNac] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [actividad, setActividad] = useState('');
  const [estatura, setEstatura] = useState('');

  // Resuelve la foto: data URI tal cual, URL absoluta tal cual, o nombre de
  // archivo → lo sirve el backend en /api/uploads/<archivo>.
  const photoUri = (() => {
    const f = data?.fotoPerfil;
    if (!f) return null;
    if (f.startsWith('data:image') || f.startsWith('http')) return f;
    return `${API_BASE_URL}/uploads/${f}`;
  })();

  const startEdit = () => {
    setNombre(data?.nombre ?? user?.nombre ?? '');
    setEmail(data?.email ?? user?.email ?? '');
    setTelefono(data?.telefono ?? '');
    setGenero(data?.genero ?? '');
    setFechaNac(data?.fechaNacimiento ?? '');
    setObjetivo(data?.objetivo ?? '');
    setExperiencia(data?.nivelExperiencia ?? '');
    setActividad(data?.nivelActividad ?? '');
    setEstatura(num(data?.altura));
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!nombre.trim()) { Alert.alert('Falta el nombre', 'El nombre no puede estar vacío.'); return; }
    setSaving(true);
    try {
      await api.put(ENDPOINTS.USER_PROFILE, {
        nombre:           nombre.trim(),
        email:            email.trim(),
        telefono:         telefono.trim(),
        genero,
        fechaNacimiento:  fechaNac.trim(),   // dd/mm/yyyy
        objetivo,
        nivelExperiencia: experiencia,
        nivelActividad:   actividad,
        altura:           estatura.trim(),   // el backend quita la 'm'
      });
      await refetch();
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
          {photoUri && !photoError ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImg} resizeMode="cover"
              onError={() => setPhotoError(true)} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
        </View>
        <Text style={styles.heroName}>{displayNombre}</Text>
        <Text style={styles.heroEmail}>{data?.email ?? user?.email ?? ''}</Text>

        <View style={styles.statsRow}>
          <StatPill label="Objetivo" value={val(data?.objetivo)} icon="flag-outline"
              styles={styles} colors={colors} />
          <StatPill label="Nivel" value={val(data?.nivelExperiencia)} icon="bar-chart-outline"
              styles={styles} colors={colors} />
          <StatPill label="Altura" value={val(data?.altura)} icon="resize-outline"
              styles={styles} colors={colors} />
        </View>
      </View>

      <View style={styles.body}>
        {/* Info card */}
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Información personal</Text>
            <TouchableOpacity
              onPress={startEdit}
              style={styles.editBtn}
              accessibilityLabel="Editar perfil"
              accessibilityRole="button"
            >
              <Ionicons name="pencil-outline" size={16} color={colors.accent} />
              <Text style={styles.editBtnText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <InfoRow icon="mail-outline"     label="Correo"             value={val(data?.email ?? user?.email)}
            styles={styles} colors={colors} />
          <InfoRow icon="call-outline"     label="Teléfono"           value={val(data?.telefono)}
            styles={styles} colors={colors} />
          <InfoRow icon="person-outline"   label="Género"             value={val(data?.genero)}
            styles={styles} colors={colors} />
          <InfoRow icon="calendar-outline" label="Fecha de nacimiento" value={val(data?.fechaNacimiento)}
            styles={styles} colors={colors} />
        </Card>

        {/* Physical data */}
        <Card>
          <Text style={styles.sectionTitle}>Datos físicos</Text>
          <InfoRow icon="scale-outline"     label="Peso actual"        value={val(data?.peso)}
              styles={styles} colors={colors} />
          <InfoRow icon="resize-outline"    label="Estatura"           value={val(data?.altura)}
              styles={styles} colors={colors} />
          <InfoRow icon="flag-outline"      label="Objetivo"           value={val(data?.objetivo)}
              styles={styles} colors={colors} />
          <InfoRow icon="bar-chart-outline" label="Nivel de experiencia" value={val(data?.nivelExperiencia)}
              styles={styles} colors={colors} />
          <InfoRow icon="pulse-outline"     label="Nivel de actividad"   value={val(data?.nivelActividad)}
              styles={styles} colors={colors} />
        </Card>

        {/* Actividad en el gimnasio */}
        <Card>
          <Text style={styles.sectionTitle}>Actividad</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{data?.totalEntrenamientos ?? 0}</Text>
              <Text style={styles.statBoxLabel}>Entrenamientos</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{data?.mesesActivo ?? 0}</Text>
              <Text style={styles.statBoxLabel}>Meses activo</Text>
            </View>
          </View>
        </Card>

        {/* Accesibilidad */}
        <Card>
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowA11y(true)}
            accessibilityRole="button" accessibilityLabel="Ajustes de accesibilidad">
            <View style={[styles.actionIcon, { backgroundColor: colors.accent + '18' }]}>
              <Ionicons name="accessibility-outline" size={20} color={colors.accent} />
            </View>
            <Text style={styles.actionLabel}>Accesibilidad</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Cuenta */}
        <Card>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogout}
            accessibilityLabel="Cerrar sesión"
            accessibilityRole="button"
            accessibilityHint="Cierra tu sesión actual y vuelve a la pantalla de inicio"
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

      {/* ── Modal: editar perfil ──────────────────────────────────────────── */}
      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar perfil</Text>
              <TouchableOpacity onPress={() => setEditing(false)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput style={styles.input} value={nombre} onChangeText={setNombre}
                placeholder="Tu nombre" placeholderTextColor={colors.textMuted} accessibilityLabel="Nombre completo" />

              <Text style={styles.inputLabel}>Correo</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none"
                placeholder="correo@ejemplo.com" placeholderTextColor={colors.textMuted} accessibilityLabel="Correo electrónico" />

              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput style={styles.input} value={telefono} onChangeText={setTelefono}
                keyboardType="phone-pad" placeholder="+52 ..." placeholderTextColor={colors.textMuted} accessibilityLabel="Teléfono" />

              <Text style={styles.inputLabel}>Fecha de nacimiento</Text>
              <TextInput style={styles.input} value={fechaNac} onChangeText={setFechaNac}
                placeholder="dd/mm/aaaa" placeholderTextColor={colors.textMuted} accessibilityLabel="Fecha de nacimiento" />

              <Text style={styles.inputLabel}>Estatura (m)</Text>
              <TextInput style={styles.input} value={estatura} onChangeText={setEstatura}
                keyboardType="decimal-pad" placeholder="1.70" placeholderTextColor={colors.textMuted} accessibilityLabel="Estatura en metros" />

              <Selector label="Género"   options={GENERO_OPTS}    value={genero}      onChange={setGenero}      styles={styles} colors={colors} />
              <Selector label="Objetivo" options={OBJETIVO_OPTS}  value={objetivo}    onChange={setObjetivo}    styles={styles} colors={colors} />
              <Selector label="Nivel de experiencia" options={EXP_OPTS} value={experiencia} onChange={setExperiencia} styles={styles} colors={colors} />
              <Selector label="Nivel de actividad"   options={ACTIVIDAD_OPTS} value={actividad} onChange={setActividad} styles={styles} colors={colors} />
            </ScrollView>
            <View style={styles.editActions}>
              <Button label="Cancelar" variant="secondary" onPress={() => setEditing(false)} style={{ flex: 1 }} />
              <Button label="Guardar" onPress={saveProfile} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <AccessibilityPanel visible={showA11y} onClose={() => setShowA11y(false)} />
    </ScrollView>
  );
}

/** Selector de opción única en forma de chips. */
function Selector({ label, options, value, onChange, styles, colors }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
  styles: ReturnType<typeof make_styles>; colors: ReturnType<typeof useColors>;
}) {
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.optsRow}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onChange(opt)}
              style={[styles.optChip, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label}: ${opt}`}
            >
              <Text style={[styles.optChipText, active && { color: '#fff' }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value, styles, colors }: { icon: string; label: string; value: string; styles: ReturnType<typeof make_styles>; colors: ReturnType<typeof useColors> }) {
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

function StatPill({ icon, label, value, styles, colors }: { icon: string; label: string; value: string; styles: ReturnType<typeof make_styles>; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon as any} size={14} color={colors.accent} />
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: {
    alignItems:    'center',
    paddingBottom: 32,
    paddingHorizontal: 24,
    gap:           10,
    backgroundColor: colors.heroTop,
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
  avatarImg: { width: 90, height: 90, borderRadius: 28, backgroundColor: colors.surface },
  initials:  { color: '#fff', fontSize: 32 * fs, fontWeight: '800' },
  heroName:  { color: colors.text, fontSize: 22 * fs, fontWeight: '700' },
  heroEmail: { color: colors.textSecondary, fontSize: 13 * fs },
  statsRow:  { flexDirection: 'row', gap: 10, marginTop: 8 },
  statPill: {
    alignItems:      'center',
    backgroundColor: 'rgba(108,99,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderRadius:    14,
    gap:             2,
  },
  statVal:   { color: colors.text, fontSize: 12 * fs, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 10 * fs },
  body: { padding: 20, gap: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 16 * fs, fontWeight: '700' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { color: colors.accent, fontSize: 13 * fs, fontWeight: '600' },
  inputLabel: { color: colors.textSecondary, fontSize: 12 * fs, marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, color: colors.text, padding: 12, fontSize: 15 * fs,
  },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  overlay:  { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 24, borderWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle:  { color: colors.text, fontSize: 18 * fs, fontWeight: '700' },
  optsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  optChip:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
               borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  optChipText: { color: colors.text, fontSize: 13 * fs, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoIconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(108,99,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { color: colors.textSecondary, fontSize: 11 * fs },
  infoValue: { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  statBoxValue: { color: colors.accent, fontSize: 24 * fs, fontWeight: '800' },
  statBoxLabel: { color: colors.textSecondary, fontSize: 11 * fs, marginTop: 2 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
  },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 15 * fs, fontWeight: '600' },
  version: { color: colors.textMuted, fontSize: 12 * fs, textAlign: 'center', marginTop: 8 },
});
}
