/**
 * Pantalla Membresía — estado actual, historial y renovación.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toDateStr, toStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import MembershipCard from '../../components/member/MembershipCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import type { Membership, MembershipPlan } from '../../types';

interface MembershipData {
  membresia_activa:  Membership | null;
  historial?:        any[];
}

export default function MembershipScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { data,  loading,  refetch  } = useFetch<MembershipData>(ENDPOINTS.USER_MEMBERSHIP);
  const { data: plans, loading: loadingPlans } = useFetch<MembershipPlan[]>(ENDPOINTS.MEMBERSHIP_PLANS);

  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [showRenew, setShowRenew] = useState(false);

  const handleRenew = async () => {
    if (!selectedPlan) return;
    Alert.alert(
      'Confirmar renovación',
      `¿Renovar el plan "${selectedPlan.nombre}" por $${selectedPlan.precio}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setRenewing(true);
            try {
              await api.post(ENDPOINTS.MEMBERSHIP_RENEW, {
                id_membresia:   selectedPlan.id_membresia,
                metodo_pago:    'efectivo',
                monto:          selectedPlan.precio,
              });
              setShowRenew(false);
              refetch();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo renovar');
            } finally {
              setRenewing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando membresía…" />;

  const membership = data?.membresia_activa;
  const historial  = data?.historial ?? [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text style={styles.title} accessibilityRole="header">Membresía</Text>

      {/* Estado actual */}
      {membership ? (
        <MembershipCard membership={membership} />
      ) : (
        <Card>
          <View style={styles.noMem}>
            <Ionicons name="card-outline" size={40} color={colors.textMuted} />
            <Text style={styles.noMemText}>No tienes una membresía activa.</Text>
            <Text style={styles.noMemSub}>Renueva o contrata un plan para seguir entrenando.</Text>
          </View>
        </Card>
      )}

      {/* Botón renovar */}
      <Button
        label={showRenew ? 'Cancelar' : 'Renovar membresía'}
        variant={showRenew ? 'secondary' : 'primary'}
        onPress={() => setShowRenew(!showRenew)}
        icon={<Ionicons name={showRenew ? 'close' : 'refresh-outline'} size={18} color="#fff" />}
      />

      {/* Planes disponibles */}
      {showRenew && (
        <Card>
          <Text style={styles.sectionTitle}>Planes disponibles</Text>
          {loadingPlans ? (
            <LoadingSpinner message="Cargando planes…" />
          ) : (
            (plans ?? []).map((plan) => {
              const isSelected = selectedPlan?.id_membresia === plan.id_membresia;
              return (
                <TouchableOpacity
                  key={plan.id_membresia}
                  style={[styles.planRow, isSelected && styles.planRowActive]}
                  onPress={() => setSelectedPlan(isSelected ? null : plan)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`${plan.nombre}, $${plan.precio}, ${plan.duracion_dias} días`}
                >
                  <View style={[styles.planRadio, isSelected && styles.planRadioActive]}>
                    {isSelected && <View style={styles.planRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.nombre}</Text>
                    <Text style={styles.planDuration}>{plan.duracion_dias} días</Text>
                    {plan.descripcion && (
                      <Text style={styles.planDesc}>{plan.descripcion}</Text>
                    )}
                  </View>
                  <Text style={styles.planPrice}>${plan.precio}</Text>
                </TouchableOpacity>
              );
            })
          )}
          {selectedPlan && (
            <Button
              label={`Renovar con ${selectedPlan.nombre}`}
              onPress={handleRenew}
              loading={renewing}
              style={{ marginTop: 12 }}
            />
          )}
        </Card>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Historial de membresías</Text>
          {historial.map((h: any, i: number) => (
            <View key={i} style={styles.histRow}>
              <View>
                <Text style={styles.histPlan}>{toStr(h.plan ?? h.nombre_plan, 'Plan')}</Text>
                <Text style={styles.histDates}>
                  {toDateStr(h.fecha_inicio)} → {toDateStr(h.fecha_fin)}
                </Text>
              </View>
              <Badge
                label={h.estado ?? 'Inactiva'}
                color={h.estado === 'Activa' ? 'success' : 'warning'}
              />
            </View>
          ))}
        </Card>
      )}

      {/* Info accesibilidad */}
      <View style={styles.infoRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
        <Text style={styles.infoText}>
          Tus datos de membresía están protegidos y cifrados.
        </Text>
      </View>
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
  noMem:   { alignItems: 'center', paddingVertical: 24, gap: 8 },
  noMemText: { color: colors.text, fontSize: 16 * fs, fontWeight: '600' },
  noMemSub:  { color: colors.textSecondary, fontSize: 13 * fs, textAlign: 'center' },
  sectionTitle: { color: colors.text, fontSize: 16 * fs, fontWeight: '700', marginBottom: 12 },
  planRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  planRowActive: { backgroundColor: 'rgba(108,99,255,0.08)', borderRadius: 12, paddingHorizontal: 8 },
  planRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  planRadioActive: { borderColor: colors.accent },
  planRadioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  planName:     { color: colors.text, fontSize: 15 * fs, fontWeight: '600' },
  planDuration: { color: colors.textSecondary, fontSize: 12 * fs },
  planDesc:     { color: colors.textMuted, fontSize: 12 * fs, marginTop: 2 },
  planPrice:    { color: colors.accent, fontSize: 18 * fs, fontWeight: '700' },
  histRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  histPlan:  { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  histDates: { color: colors.textSecondary, fontSize: 12 * fs },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  infoText:  { color: colors.textMuted, fontSize: 12 * fs },
});
}
