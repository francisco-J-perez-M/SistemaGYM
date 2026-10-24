/**
 * Perfil del Gimnasio — Owner Gym
 *
 * Ficha completa del negocio y su edición.
 *   GET /api/owner_gym/perfil → datos + tipo_gimnasio_label + tipos_disponibles
 *   PUT /api/owner_gym/perfil → { nombre, email_contacto, telefono, tipo_gimnasio }
 *
 * El tipo de establecimiento no es texto libre: se elige del catálogo del SaaS
 * (utils/gym_types.py), del que dependen las etiquetas y los módulos activos.
 * En pantalla se muestra siempre su nombre legible, nunca la clave interna.
 */
import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toDateStr, toArray } from '../../utils/format';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

interface TipoGimnasio { value: string; label: string }

interface GymProfile {
  nombre?:          string;
  direccion?:       string;   // dirección física del gimnasio
  email_contacto?:  string;   // campo real: email_contacto
  email?:           string;   // alias por compatibilidad
  telefono?:        string;
  tipo_gimnasio?:   string;   // clave interna
  tipo_gimnasio_label?: string;  // nombre legible
  tipos_disponibles?: TipoGimnasio[];
  descripcion?:     string;
  plan?:            string;
  plan_gymPro?:     string;
  created_at?:      string;
  fecha_creacion?:  string;
  capacidad?:       number;
  horario_apertura?: string;
  horario_cierre?:   string;
  redes_sociales?: {
    instagram?: string;
    facebook?:  string;
    web?:       string;
  };
}

interface InfoRowProps { icon: string; label: string; value: string }
function InfoRow({ icon, label, value, styles, colors }: InfoRowProps & { styles: ReturnType<typeof make_styles>; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function GymProfileScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { data, loading, refetch } = useFetch<GymProfile>(ENDPOINTS.OWNER_GYM_PROFILE);

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre: '', email_contacto: '', telefono: '', tipo_gimnasio: '',
  });

  useEffect(() => {
    if (data) {
      setForm({
        nombre:         toStr(data.nombre),
        email_contacto: toStr(data.email_contacto ?? data.email),
        telefono:       toStr(data.telefono),
        tipo_gimnasio:  toStr(data.tipo_gimnasio, 'gimnasio_tradicional'),
      });
    }
  }, [data]);

  const guardar = async () => {
    if (!form.nombre.trim()) {
      Alert.alert('Falta el nombre', 'El gimnasio necesita un nombre.');
      return;
    }
    setGuardando(true);
    try {
      await api.put(ENDPOINTS.OWNER_GYM_PROFILE, {
        nombre:         form.nombre.trim(),
        email_contacto: form.email_contacto.trim(),
        telefono:       form.telefono.trim(),
        tipo_gimnasio:  form.tipo_gimnasio,
      });
      setEditando(false);
      refetch();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e?.response?.data?.msg ?? 'Revisa tu conexión.');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando perfil del gym…" />;

  const gym    = data ?? {};
  const nombre = toStr(gym.nombre, 'Mi Gimnasio');
  const tipos  = toArray<TipoGimnasio>(gym.tipos_disponibles);
  const alta   = gym.created_at ?? gym.fecha_creacion;
  const planEtiqueta = gym.plan ?? gym.plan_gymPro;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <View style={styles.avatar}>
          <Ionicons name="business" size={36} color={colors.onAccent} />
        </View>
        <Text style={styles.gymName}>{nombre}</Text>
        {gym.tipo_gimnasio_label ? (
          <Badge label={gym.tipo_gimnasio_label} color="accent" />
        ) : null}
        {planEtiqueta ? <Text style={styles.heroSub}>Plan {planEtiqueta}</Text> : null}
        {alta ? (
          <Text style={styles.heroSub}>Miembro desde {toDateStr(alta, 7)}</Text>
        ) : null}
      </View>

      <View style={styles.body}>
        {/* Editar o guardar */}
        <View style={styles.editBar}>
          {editando ? (
            <>
              <Button label="Guardar" onPress={guardar} loading={guardando} style={{ flex: 1 }} />
              <Button label="Cancelar" variant="secondary" style={{ flex: 1 }}
                      onPress={() => { setEditando(false); refetch(); }} />
            </>
          ) : (
            <Button
              label="Editar datos del gimnasio"
              variant="secondary"
              onPress={() => setEditando(true)}
              icon={<Ionicons name="pencil-outline" size={16} color={colors.accent} />}
              style={{ flex: 1 }}
            />
          )}
        </View>

        {/* Información general */}
        <Card>
          <Text style={styles.sectionTitle}>Información general</Text>

          {editando ? (
            <>
              <Text style={styles.campoLabel}>Nombre</Text>
              <TextInput
                style={styles.campo}
                value={form.nombre}
                onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                placeholder="Nombre comercial"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Nombre del gimnasio"
              />

              <Text style={styles.campoLabel}>Correo de contacto</Text>
              <TextInput
                style={styles.campo}
                value={form.email_contacto}
                onChangeText={(v) => setForm((f) => ({ ...f, email_contacto: v }))}
                placeholder="contacto@migimnasio.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Correo de contacto"
              />

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

              {/* Tipo: lista cerrada, no texto libre */}
              <Text style={styles.campoLabel}>Tipo de gimnasio</Text>
              <View style={styles.tiposGrid}>
                {tipos.map((t) => {
                  const activo = form.tipo_gimnasio === t.value;
                  return (
                    <TouchableOpacity
                      key={t.value}
                      style={[styles.tipoChip, activo && styles.tipoChipActivo]}
                      onPress={() => setForm((f) => ({ ...f, tipo_gimnasio: t.value }))}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: activo }}
                      accessibilityLabel={t.label}
                    >
                      <Text style={[styles.tipoText, activo && styles.tipoTextActivo]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <InfoRow icon="business-outline" label="Nombre" value={nombre}
                  styles={styles} colors={colors} />
              <InfoRow icon="pricetag-outline" label="Tipo de gimnasio"
                  value={toStr(gym.tipo_gimnasio_label, 'Sin definir')}
                  styles={styles} colors={colors} />
              <InfoRow icon="call-outline" label="Teléfono"
                  value={toStr(gym.telefono, 'Sin registrar')}
                  styles={styles} colors={colors} />
              <InfoRow icon="mail-outline" label="Correo de contacto"
                  value={toStr(gym.email_contacto ?? gym.email, 'Sin registrar')}
                  styles={styles} colors={colors} />
              {gym.direccion ? (
                <InfoRow icon="location-outline" label="Dirección" value={toStr(gym.direccion)}
                    styles={styles} colors={colors} />
              ) : null}
              {gym.capacidad ? (
                <InfoRow icon="people-outline" label="Capacidad" value={`${gym.capacidad} personas`}
                    styles={styles} colors={colors} />
              ) : null}
              {planEtiqueta ? (
                <InfoRow icon="diamond-outline" label="Plan contratado" value={toStr(planEtiqueta)}
                    styles={styles} colors={colors} />
              ) : null}
              {alta ? (
                <InfoRow icon="calendar-outline" label="Alta en GymPro" value={toDateStr(alta)}
                    styles={styles} colors={colors} />
              ) : null}
              {gym.descripcion ? (
                <View style={styles.descBox}>
                  <Text style={styles.descLabel}>Descripción</Text>
                  <Text style={styles.descText}>{gym.descripcion}</Text>
                </View>
              ) : null}
            </>
          )}
        </Card>

        {/* Horario */}
        {(gym.horario_apertura || gym.horario_cierre) && (
          <Card>
            <Text style={styles.sectionTitle}>Horario</Text>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleBox}>
                <Ionicons name="sunny-outline" size={22} color={colors.warning} />
                <Text style={styles.scheduleLabel}>Apertura</Text>
                <Text style={styles.scheduleTime}>{toStr(gym.horario_apertura, '--:--')}</Text>
              </View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleBox}>
                <Ionicons name="moon-outline" size={22} color={colors.accent} />
                <Text style={styles.scheduleLabel}>Cierre</Text>
                <Text style={styles.scheduleTime}>{toStr(gym.horario_cierre, '--:--')}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Redes sociales */}
        {gym.redes_sociales && (
          <Card>
            <Text style={styles.sectionTitle}>Redes sociales</Text>
            {gym.redes_sociales.instagram && (
              <InfoRow icon="logo-instagram" label="Instagram" value={toStr(gym.redes_sociales.instagram)}
              styles={styles} colors={colors} />
            )}
            {gym.redes_sociales.facebook && (
              <InfoRow icon="logo-facebook" label="Facebook" value={toStr(gym.redes_sociales.facebook)}
              styles={styles} colors={colors} />
            )}
            {gym.redes_sociales.web && (
              <InfoRow icon="globe-outline" label="Sitio web" value={toStr(gym.redes_sociales.web)}
              styles={styles} colors={colors} />
            )}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: {
    alignItems: 'center', paddingBottom: 32, paddingHorizontal: 24, gap: 8,
    backgroundColor: colors.heroTop,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  gymName:  { color: colors.text, fontSize: 22 * fs, fontWeight: '700', textAlign: 'center' },
  heroSub:  { color: colors.textSecondary, fontSize: 12 * fs },
  body:     { padding: 20, gap: 16 },
  editBar:  { flexDirection: 'row', gap: 10 },
  sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 12 },

  campoLabel: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '700',
                marginTop: 12, marginBottom: 6 },
  campo: {
    backgroundColor: colors.inputBg, borderRadius: 11, paddingHorizontal: 14,
    paddingVertical: 11, color: colors.text, fontSize: 14 * fs,
    borderWidth: 1, borderColor: colors.border,
  },
  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  tipoChip: {
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  tipoChipActivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  tipoText:       { color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '600' },
  tipoTextActivo: { color: colors.onAccent, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.textSecondary, fontSize: 11 * fs },
  infoValue: { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  descBox:  { paddingTop: 10 },
  descLabel:{ color: colors.textSecondary, fontSize: 11 * fs, marginBottom: 4 },
  descText: { color: colors.text, fontSize: 14 * fs, lineHeight: 20 },
  scheduleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 8,
  },
  scheduleBox:  { alignItems: 'center', gap: 6, flex: 1 },
  scheduleDivider: { width: 1, height: 60, backgroundColor: colors.border },
  scheduleLabel:{ color: colors.textSecondary, fontSize: 12 * fs },
  scheduleTime: { color: colors.text, fontSize: 22 * fs, fontWeight: '700' },
});
}
