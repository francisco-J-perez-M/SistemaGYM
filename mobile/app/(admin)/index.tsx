/**
 * Dashboard del Owner Gym / Admin — KPIs del gimnasio, alertas, actividad
 * reciente y miembros recientes.
 *
 * Muestra exactamente las mismas cifras que el dashboard de la web
 * (web/src/pages/owner_gym/OwnerDashboard.jsx) y desde las mismas fuentes, para
 * que el dueño no vea dos números distintos según el dispositivo:
 *
 *   GET /api/owner_gym/dashboard            KPIs (estructura anidada)
 *   GET /api/owner_gym/dashboard/actividad  feed de pagos, altas y ventas
 *   GET /api/owner_gym/alertas              stock y membresías que requieren acción
 *   GET /api/miembros                       listado paginado { miembros, total, pages }
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { toArray, toFirstName, toInitial, toStr } from '../../utils/format';
import { conAlfa } from '../../constants/themes';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/admin/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type {
  OwnerDashboard, MiembrosResponse, ActividadItem, AlertasResponse,
} from '../../types';

/** Mismo formato de moneda que usa la web: entero, sin centavos. */
const money = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString('es-MX')}`;

/** Fecha corta y legible para el feed; si el backend manda basura, se omite. */
function fechaCorta(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
       + ' · ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

const ICONO_ACTIVIDAD: Record<string, keyof typeof Ionicons.glyphMap> = {
  pago:     'cash-outline',
  registro: 'person-add-outline',
  venta:    'cart-outline',
};

export default function AdminDashboardScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  // Dashboard KPIs — estructura anidada del owner_gym
  const { data: dash, loading: loadingK, refetch } = useFetch<OwnerDashboard>(ENDPOINTS.ADMIN_KPIS);
  // Miembros paginados — extraemos el array del wrapper
  const { data: miembrosData, loading: loadingM } = useFetch<MiembrosResponse>(ENDPOINTS.MIEMBROS);
  // Actividad y alertas: si fallan no se bloquea el panel, sólo no se pintan.
  const { data: actividadData, refetch: refetchAct } =
    useFetch<ActividadItem[]>(ENDPOINTS.OWNER_ACTIVIDAD, { limit: 10 });
  const { data: alertasData, refetch: refetchAlertas } =
    useFetch<AlertasResponse>(ENDPOINTS.OWNER_ALERTAS);

  const loading = loadingK || loadingM;

  const recargar = () => { refetch(); refetchAct(); refetchAlertas(); };

  if (loading) return <LoadingSpinner fullScreen message="Cargando panel…" />;

  const nombre    = toFirstName(user?.nombre, 'Admin');
  const miembros  = toArray(miembrosData?.miembros);
  const recientes = miembros.slice(0, 5);
  const actividad = toArray<ActividadItem>(actividadData).slice(0, 8);
  const alertas   = toArray<any>(alertasData?.alertas);

  // KPIs extraídos de la estructura anidada
  const totalMiembros = dash?.miembros?.total ?? 0;
  const nuevosMes     = dash?.miembros?.nuevos_mes ?? 0;
  const porVencer     = dash?.miembros?.por_vencer ?? 0;
  const entrenadores  = dash?.staff?.entrenadores ?? 0;

  // 'mes_actual' es el total de membresías + punto de venta, la misma cifra que
  // muestra Reportes. Cuando el mes anterior no tuvo ingresos no hay porcentaje
  // que calcular, así que no se pinta una flecha de caída que no significa nada.
  const ingresosMes    = dash?.ingresos?.mes_actual ?? 0;
  const sinComparativa = dash?.ingresos?.sin_comparativa ?? false;
  const variacion      = sinComparativa ? 0 : (dash?.ingresos?.variacion_pct ?? 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={recargar} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title} accessibilityRole="header">Panel de control</Text>
          <Text style={styles.sub}>Hola, {nombre}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          accessibilityLabel="Cerrar sesión"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Hero banner (sin LinearGradient — falla en Fabric antes de registrarse) */}
      <View style={styles.heroBanner}>
        <View style={styles.heroIcon}>
          <Ionicons name="business-outline" size={28} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>GymPro</Text>
          <Text style={styles.heroSub}>Gestión del gimnasio</Text>
        </View>
        <Badge label={user?.role === 'owner_gym' ? 'Owner' : 'Admin'} color="accent" />
      </View>

      {/* KPIs — mapeados desde la estructura real de /owner_gym/dashboard */}
      <View style={styles.kpiGrid}>
        {/* El `tono` dice qué significa cada cifra; la paleta pone el color. */}
        <StatCard
          label="Total miembros"
          value={totalMiembros}
          icon={<Ionicons name="people-outline" size={20} color={colors.dataActividad} />}
          tono="actividad"
        />
        <StatCard
          label="Nuevos este mes"
          value={nuevosMes}
          icon={<Ionicons name="person-add-outline" size={20} color={colors.dataProgreso} />}
          tono="progreso"
        />
        <StatCard
          label="Ingresos mes"
          value={ingresosMes > 0 ? `$${Math.round(ingresosMes).toLocaleString()}` : '$0'}
          icon={<Ionicons name="cash-outline" size={20} color={colors.dataProgreso} />}
          tono="progreso"
          trend={!sinComparativa && variacion !== 0 ? variacion : undefined}
        />
        <StatCard
          label="Por vencer"
          value={porVencer}
          icon={<Ionicons name="warning-outline" size={20} color={colors.dataAtencion} />}
          tono="atencion"
        />
        <StatCard
          label="Entrenadores"
          value={entrenadores}
          icon={<Ionicons name="barbell-outline" size={20} color={colors.dataActividad} />}
          tono="actividad"
        />
        <StatCard
          label="Activos"
          value={dash?.miembros?.activos ?? 0}
          icon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.dataProgreso} />}
          tono="progreso"
        />
        {/* El POS ya está sumado dentro de "Ingresos mes"; aquí se desglosa. */}
        <StatCard
          label={`Ventas POS · ${dash?.ventas_pos?.transacciones ?? 0} tickets`}
          value={money(dash?.ventas_pos?.total_mes ?? 0)}
          icon={<Ionicons name="cart-outline" size={20} color={colors.dataActividad} />}
          tono="actividad"
        />
        <StatCard
          label="Ingresos mes anterior"
          value={money(dash?.ingresos?.mes_anterior ?? 0)}
          icon={<Ionicons name="trending-up-outline" size={20} color={colors.textSecondary} />}
          tono="neutro"
        />
        <StatCard
          label="Tipos de membresía"
          value={dash?.tipos_membresia ?? 0}
          icon={<Ionicons name="pricetags-outline" size={20} color={colors.dataActividad} />}
          tono="actividad"
        />
        <StatCard
          label="Recepcionistas"
          value={dash?.staff?.recepcionistas ?? 0}
          icon={<Ionicons name="id-card-outline" size={20} color={colors.textSecondary} />}
          tono="neutro"
        />
      </View>

      {/* Alertas operativas — sólo aparece la tarjeta si hay algo que atender */}
      {alertas.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Requiere atención</Text>
          {alertas.slice(0, 6).map((a, i) => {
            const grave = a?.nivel === 'error';
            const tinte = grave ? colors.dataRiesgo : colors.dataAtencion;
            return (
              <View
                key={`${a?.tipo ?? 'alerta'}-${i}`}
                style={[styles.alertaRow, { backgroundColor: conAlfa(tinte, 0.08), borderLeftColor: tinte }]}
              >
                <Ionicons
                  name={grave ? 'alert-circle' : 'warning-outline'}
                  size={18}
                  color={tinte}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertaTitulo}>{toStr(a?.titulo)}</Text>
                  {!!a?.detalle && <Text style={styles.alertaDetalle}>{toStr(a.detalle)}</Text>}
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {/* Actividad reciente — pagos, altas y ventas, ya ordenados por el backend */}
      <Card>
        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        {actividad.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pulse-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>Sin movimientos recientes.</Text>
          </View>
        ) : (
          actividad.map((a, i) => (
            <View key={`${a.tipo}-${a.fecha}-${i}`} style={styles.actRow}>
              <View style={styles.actIcon}>
                <Ionicons
                  name={ICONO_ACTIVIDAD[a.tipo] ?? 'ellipse-outline'}
                  size={16}
                  color={colors.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actTitulo} numberOfLines={1}>{toStr(a.titulo)}</Text>
                <Text style={styles.actSub} numberOfLines={1}>
                  {[toStr(a.sub), fechaCorta(a.fecha)].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {typeof a.monto === 'number' && (
                <Text style={styles.actMonto}>{money(a.monto)}</Text>
              )}
            </View>
          ))
        )}
      </Card>

      {/* Miembros recientes */}
      <Card>
        <Text style={styles.sectionTitle}>Miembros recientes</Text>
        {recientes.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay miembros registrados.</Text>
          </View>
        ) : (
          recientes.map((m, i) => (
            <View key={m.id ?? m._id ?? String(i)} style={styles.memberRow}>
              {m.foto_perfil && m.foto_perfil.startsWith('data:image') ? (
                <Image source={{ uri: m.foto_perfil }} style={styles.memberAvatarImg} resizeMode="cover" />
              ) : (
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>{toInitial(m.nombre)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{toStr(m.nombre)}</Text>
                <Text style={styles.memberEmail}>{toStr(m.email)}</Text>
              </View>
              <Badge
                label={m.activo === false ? 'Inactivo' : 'Activo'}
                color={m.activo === false ? 'warning' : 'success'}
              />
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:   { flex: 1, backgroundColor: colors.background },
  content:  { padding: 20, gap: 16, paddingBottom: 32 },
  topBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:    { color: colors.text, fontSize: 22 * fs, fontWeight: '700' },
  sub:      { color: colors.textSecondary, fontSize: 13 * fs },
  logoutBtn:{ padding: 8 },
  heroBanner: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 18,
    padding: 16, gap: 12, backgroundColor: colors.heroTop,
  },
  heroIcon: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center',
  },
  heroTitle:    { color: colors.text, fontSize: 16 * fs, fontWeight: '700' },
  heroSub:      { color: colors.textSecondary, fontSize: 12 * fs },
  kpiGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 16 * fs, fontWeight: '700', marginBottom: 12 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  memberAvatar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarImg: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface },
  memberInitial: { color: colors.accent, fontSize: 15 * fs, fontWeight: '700' },
  memberName:    { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  memberEmail:   { color: colors.textSecondary, fontSize: 12 * fs },
  empty:         { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText:     { color: colors.textMuted, fontSize: 13 * fs },

  // Alertas operativas
  alertaRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 11, borderRadius: 12, borderLeftWidth: 3, marginBottom: 8,
  },
  alertaTitulo:  { color: colors.text, fontSize: 13 * fs, fontWeight: '600' },
  alertaDetalle: { color: colors.textSecondary, fontSize: 11.5 * fs, marginTop: 2 },

  // Feed de actividad
  actRow: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  actIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center',
  },
  actTitulo: { color: colors.text, fontSize: 13.5 * fs, fontWeight: '600' },
  actSub:    { color: colors.textSecondary, fontSize: 11.5 * fs, marginTop: 1 },
  actMonto:  { color: colors.dataProgreso, fontSize: 13.5 * fs, fontWeight: '700' },
});
}
