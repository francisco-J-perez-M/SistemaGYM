/**
 * Perfil del Gimnasio — Owner Gym
 * GET /api/owner_gym/gym-profile → datos del gimnasio
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toDateStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

interface GymProfile {
  nombre?:          string;
  email_contacto?:  string;   // campo real: email_contacto
  email?:           string;   // alias por compatibilidad
  telefono?:        string;
  tipo_gimnasio?:   string;   // campo real: tipo_gimnasio
  descripcion?:     string;
  plan_gymPro?:     string;
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
  const styles = useMemo(() => make_styles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { data, loading, refetch } = useFetch<GymProfile>(ENDPOINTS.OWNER_GYM_PROFILE);

  if (loading) return <LoadingSpinner fullScreen message="Cargando perfil del gym…" />;

  const gym = data ?? {};
  const nombre   = toStr(gym.nombre, 'Mi Gimnasio');
  const initials = nombre.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

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
          <Ionicons name="business" size={36} color="#fff" />
        </View>
        <Text style={styles.gymName}>{nombre}</Text>
        {gym.plan_gymPro && <Badge label={`Plan ${gym.plan_gymPro}`} color="accent" />}
        {gym.fecha_creacion && (
          <Text style={styles.heroSub}>Miembro desde {toDateStr(gym.fecha_creacion, 7)}</Text>
        )}
      </View>

      <View style={styles.body}>
        {/* Información general */}
        <Card>
          <Text style={styles.sectionTitle}>Información general</Text>
          {gym.direccion    && <InfoRow icon="location-outline"  label="Dirección"  value={toStr(gym.direccion)}
              styles={styles} colors={colors} />}
          {gym.telefono     && <InfoRow icon="call-outline"       label="Teléfono"   value={toStr(gym.telefono)}
              styles={styles} colors={colors} />}
          {(gym.email_contacto ?? gym.email) && <InfoRow icon="mail-outline" label="Correo" value={toStr(gym.email_contacto ?? gym.email)}
              styles={styles} colors={colors} />}
          {gym.capacidad    && <InfoRow icon="people-outline"     label="Capacidad"  value={`${gym.capacidad} personas`}
              styles={styles} colors={colors} />}
          {(gym.descripcion ?? gym.tipo_gimnasio) && (
            <View style={styles.descBox}>
              <Text style={styles.descLabel}>Descripción</Text>
              <Text style={styles.descText}>{gym.descripcion}</Text>
            </View>
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

function make_styles(colors: ReturnType<typeof useColors>) {
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
  gymName:  { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  heroSub:  { color: colors.textSecondary, fontSize: 12 },
  body:     { padding: 20, gap: 16 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.textSecondary, fontSize: 11 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  descBox:  { paddingTop: 10 },
  descLabel:{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 },
  descText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  scheduleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 8,
  },
  scheduleBox:  { alignItems: 'center', gap: 6, flex: 1 },
  scheduleDivider: { width: 1, height: 60, backgroundColor: colors.border },
  scheduleLabel:{ color: colors.textSecondary, fontSize: 12 },
  scheduleTime: { color: colors.text, fontSize: 22, fontWeight: '700' },
});
}
