/**
 * Pantalla Membresía — estado actual y apartado de renovación.
 *
 * Contratos reales del backend (api/app/routes/miembro/user_membership.py):
 *   GET  /api/user/membership        → { tieneMembresia, membresia?, mensaje? }
 *   GET  /api/user/membership/plans  → { planes: [...] }
 *   POST /api/user/membership/renew  → body { id_membresia, metodo_pago }
 *                                       metodo_pago ∈ Efectivo | Tarjeta | Transferencia
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toDateStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import type {
  MembershipResponse, PlansResponse, MembershipPlan, MetodoPago,
} from '../../types';

const METODOS: { key: MetodoPago; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'Efectivo',      label: 'Efectivo',      icon: 'cash-outline' },
  { key: 'Tarjeta',       label: 'Tarjeta',       icon: 'card-outline' },
  { key: 'Transferencia', label: 'Transferencia', icon: 'swap-horizontal-outline' },
];

function estadoBadge(estado: string): { label: string; color: 'success' | 'warning' | 'error' } {
  if (estado === 'activa')     return { label: 'Activa',     color: 'success' };
  if (estado === 'por_vencer') return { label: 'Por vencer', color: 'warning' };
  return { label: 'Vencida', color: 'error' };
}

export default function MembershipScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data, loading, refetch } = useFetch<MembershipResponse>(ENDPOINTS.USER_MEMBERSHIP);
  const { data: plansData, loading: loadingPlans } = useFetch<PlansResponse>(ENDPOINTS.MEMBERSHIP_PLANS);

  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [metodo, setMetodo]   = useState<MetodoPago>('Efectivo');
  const [renewing, setRenewing] = useState(false);
  const [showRenew, setShowRenew] = useState(false);

  const planes = plansData?.planes ?? [];

  const doRenew = async () => {
    if (!selectedPlan) return;
    setRenewing(true);
    try {
      await api.post(ENDPOINTS.MEMBERSHIP_RENEW, {
        id_membresia: selectedPlan.id_membresia,
        metodo_pago:  metodo,
      });
      Alert.alert('¡Listo!', `Membresía "${selectedPlan.nombre}" renovada con éxito.`);
      setShowRenew(false);
      setSelectedPlan(null);
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo renovar la membresía');
    } finally {
      setRenewing(false);
    }
  };

  const confirmRenew = () => {
    if (!selectedPlan) return;
    Alert.alert(
      'Confirmar renovación',
      `${selectedPlan.nombre}\nMétodo: ${metodo}\nTotal: $${selectedPlan.precio}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: doRenew },
      ],
    );
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando membresía…" />;

  const membership = data?.tieneMembresia ? data.membresia : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text style={styles.title} accessibilityRole="header">Mi Membresía</Text>

      {/* ── Estado actual ─────────────────────────────────────── */}
      {membership ? (
        <Card elevated>
          <View style={styles.memHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.memName}>{membership.nombre}</Text>
              <Text style={styles.memPrice}>${membership.precio} <Text style={styles.memPriceUnit}>/ periodo</Text></Text>
            </View>
            <Badge {...estadoBadge(membership.estado)} />
          </View>

          <View style={styles.daysBox}>
            <Text style={styles.daysNum}>{Math.max(0, membership.diasRestantes)}</Text>
            <Text style={styles.daysLabel}>días restantes</Text>
          </View>

          <View style={styles.datesRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Inicio</Text>
              <Text style={styles.dateValue}>{toDateStr(membership.fechaInicio)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <View style={[styles.dateCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.dateLabel}>Vence</Text>
              <Text style={styles.dateValue}>{toDateStr(membership.fechaFin)}</Text>
            </View>
          </View>

          {membership.diasRestantes <= 7 && (
            <View style={styles.warnRow}>
              <Ionicons name="alert-circle" size={16} color={colors.warning} />
              <Text style={styles.warnText}>Tu membresía está por vencer. Renueva para no perder acceso.</Text>
            </View>
          )}
        </Card>
      ) : (
        <Card>
          <View style={styles.noMem}>
            <Ionicons name="card-outline" size={40} color={colors.textMuted} />
            <Text style={styles.noMemText}>No tienes una membresía activa.</Text>
            <Text style={styles.noMemSub}>{data?.mensaje ?? 'Contrata un plan para seguir entrenando.'}</Text>
          </View>
        </Card>
      )}

      {/* ── Botón abrir/cerrar apartado de renovación ─────────── */}
      <Button
        label={showRenew ? 'Cerrar' : (membership ? 'Renovar membresía' : 'Contratar plan')}
        variant={showRenew ? 'secondary' : 'primary'}
        onPress={() => setShowRenew((v) => !v)}
        icon={<Ionicons name={showRenew ? 'close' : 'refresh-outline'} size={18} color={showRenew ? colors.text : '#fff'} />}
      />

      {/* ── Apartado de renovación ────────────────────────────── */}
      {showRenew && (
        <Card>
          <Text style={styles.sectionTitle}>1. Elige un plan</Text>
          {loadingPlans ? (
            <LoadingSpinner message="Cargando planes…" />
          ) : planes.length === 0 ? (
            <Text style={styles.emptyText}>No hay planes disponibles en este gimnasio.</Text>
          ) : (
            planes.map((plan) => {
              const isSel = selectedPlan?.id_membresia === plan.id_membresia;
              return (
                <TouchableOpacity
                  key={plan.id_membresia}
                  style={[styles.planRow, isSel && styles.planRowActive]}
                  onPress={() => setSelectedPlan(isSel ? null : plan)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSel }}
                  accessibilityLabel={`${plan.nombre}, $${plan.precio}, ${plan.duracion_meses} meses`}
                >
                  <View style={[styles.radio, isSel && styles.radioActive]}>
                    {isSel && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.nombre}</Text>
                    <Text style={styles.planDuration}>
                      {plan.duracion_meses} {plan.duracion_meses === 1 ? 'mes' : 'meses'}
                    </Text>
                    {!!plan.ahorro && plan.ahorro > 0 && (
                      <Text style={styles.planSave}>Ahorras ${plan.ahorro.toFixed(0)}</Text>
                    )}
                  </View>
                  <Text style={styles.planPrice}>${plan.precio}</Text>
                </TouchableOpacity>
              );
            })
          )}

          {selectedPlan && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>2. Método de pago</Text>
              <View style={styles.metodosRow}>
                {METODOS.map((m) => {
                  const active = metodo === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.metodoChip, active && styles.metodoChipActive]}
                      onPress={() => setMetodo(m.key)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={m.label}
                    >
                      <Ionicons name={m.icon} size={16} color={active ? '#fff' : colors.textSecondary} />
                      <Text style={[styles.metodoText, active && { color: '#fff' }]}>{m.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total a pagar</Text>
                <Text style={styles.totalValue}>${selectedPlan.precio}</Text>
              </View>

              <Button
                label={`Renovar con ${selectedPlan.nombre}`}
                onPress={confirmRenew}
                loading={renewing}
                style={{ marginTop: 12 }}
              />
            </>
          )}
        </Card>
      )}

      {/* ── Acceso al historial de pagos ──────────────────────── */}
      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => router.push('/(member)/payments')}
        accessibilityRole="button"
        accessibilityLabel="Ver historial de pagos"
      >
        <Ionicons name="receipt-outline" size={18} color={colors.accent} />
        <Text style={styles.linkText}>Ver historial de pagos</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.infoRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
        <Text style={styles.infoText}>Tus datos de membresía están protegidos y cifrados.</Text>
      </View>
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 16, paddingBottom: 32 },
    title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },

    memHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    memName:   { color: colors.text, fontSize: 18 * fs, fontWeight: '700' },
    memPrice:  { color: colors.accent, fontSize: 16 * fs, fontWeight: '700', marginTop: 2 },
    memPriceUnit: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '500' },
    daysBox:   { alignItems: 'center', paddingVertical: 16 },
    daysNum:   { color: colors.text, fontSize: 44 * fs, fontWeight: '800', lineHeight: 48 * fs },
    daysLabel: { color: colors.textSecondary, fontSize: 13 * fs },
    datesRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
    dateCol:   { flex: 1 },
    dateLabel: { color: colors.textSecondary, fontSize: 11 * fs },
    dateValue: { color: colors.text, fontSize: 14 * fs, fontWeight: '600', marginTop: 2 },
    warnRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
                 backgroundColor: colors.warningBg, padding: 10, borderRadius: 10 },
    warnText:  { color: colors.warning, fontSize: 12 * fs, flex: 1 },

    noMem:    { alignItems: 'center', paddingVertical: 24, gap: 8 },
    noMemText:{ color: colors.text, fontSize: 16 * fs, fontWeight: '600' },
    noMemSub: { color: colors.textSecondary, fontSize: 13 * fs, textAlign: 'center' },

    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 12 },
    emptyText:    { color: colors.textMuted, fontSize: 13 * fs },

    planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14,
               borderBottomWidth: 1, borderBottomColor: colors.border },
    planRowActive: { backgroundColor: colors.accent + '14', borderRadius: 12, paddingHorizontal: 8 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border,
             alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: colors.accent },
    radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
    planName:     { color: colors.text, fontSize: 15 * fs, fontWeight: '600' },
    planDuration: { color: colors.textSecondary, fontSize: 12 * fs },
    planSave:     { color: colors.success, fontSize: 12 * fs, marginTop: 2, fontWeight: '600' },
    planPrice:    { color: colors.accent, fontSize: 18 * fs, fontWeight: '700' },

    metodosRow:  { flexDirection: 'row', gap: 8 },
    metodoChip:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                   paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
                   backgroundColor: colors.inputBg },
    metodoChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    metodoText:  { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600' },
    totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
    totalLabel:  { color: colors.textSecondary, fontSize: 14 * fs },
    totalValue:  { color: colors.text, fontSize: 22 * fs, fontWeight: '800' },

    linkRow:  { flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
                borderRadius: 14, padding: 16 },
    linkText: { color: colors.text, fontSize: 14 * fs, fontWeight: '600', flex: 1 },

    infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
    infoText: { color: colors.textMuted, fontSize: 12 * fs },
  });
}
