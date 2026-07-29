/**
 * Pantalla Membresía — estado actual y apartado de renovación.
 *
 * Contratos reales del backend (api/app/routes/miembro/user_membership.py):
 *   GET  /api/user/membership        → { tieneMembresia, membresia?, mensaje? }
 *   GET  /api/user/membership/plans  → { planes: [...] }
 *   POST /api/user/membership/renew  → body { id_membresia, metodo_pago }
 *                                       metodo_pago ∈ Efectivo | PayPal | Mercado Pago
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
  Dimensions,
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
import {
  getMetodosPago, pagarEnApp, mensajePorEstado,
  type MetodoPago as MetodoPagoDisponible, type ProveedorPago,
} from '../../services/pagos';
import type {
  MembershipResponse, PlansResponse, MembershipPlan, MetodoPago,
} from '../../types';

// Carrusel de planes: la tarjeta no ocupa todo el ancho para que asome la
// siguiente y se entienda que el listado se desliza en horizontal.
const SCREEN_W  = Dimensions.get('window').width;
const CARD_GAP  = 12;
const CARD_W    = Math.min(300, SCREEN_W * 0.76);

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
  const [pagando, setPagando] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);   // posición en el carrusel
  // Efectivo + las pasarelas activas del gimnasio (PayPal / Mercado Pago)
  const [pasarelas, setPasarelas] = useState<MetodoPagoDisponible[]>([]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const lista = await getMetodosPago();
        if (vivo) setPasarelas(lista);
      } catch {
        if (vivo) setPasarelas([]);
      }
    })();
    return () => { vivo = false; };
  }, []);

  const metodosPago = useMemo(() => ([
    { id: 'Efectivo', label: 'Efectivo', esPasarela: false, proveedor: null as ProveedorPago | null },
    ...pasarelas.map((p) => ({
      id: p.proveedor as string,
      label: p.nombre,
      esPasarela: true,
      proveedor: p.proveedor,
    })),
  ]), [pasarelas]);

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

  /** Cobro en línea: abre la pasarela y confirma el resultado al volver. */
  const pagarEnLinea = async (proveedor: ProveedorPago) => {
    if (!selectedPlan) return;
    setPagando(true);
    try {
      const res = await pagarEnApp({
        proveedor,
        contexto: 'membresia',
        monto: Number(selectedPlan.precio),
        descripcion: `Membresía ${selectedPlan.nombre}`,
        referenciaLocal: selectedPlan.id_membresia,
      });
      const info = mensajePorEstado(res.estado);
      Alert.alert(info.titulo, res.mensaje ?? info.texto);
      if (res.estado === 'aprobado' || res.estado === 'pendiente') {
        setShowRenew(false);
        setSelectedPlan(null);
        refetch();
      }
    } catch (e: any) {
      Alert.alert('No se pudo iniciar el pago',
        e?.response?.data?.msg ?? 'Intenta de nuevo más tarde.');
    } finally {
      setPagando(false);
    }
  };

  const confirmRenew = () => {
    if (!selectedPlan) return;

    // Con PayPal o Mercado Pago el cobro ocurre en la pasarela
    const metodoSel = metodosPago.find((m) => m.id === metodo);
    if (metodoSel?.esPasarela && metodoSel.proveedor) {
      pagarEnLinea(metodoSel.proveedor);
      return;
    }

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
            <>
            {/* Carrusel horizontal: se desliza de izquierda a derecha y se
                detiene centrado en cada plan (snapToInterval). */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={CARD_W + CARD_GAP}
              snapToAlignment="start"
              contentContainerStyle={styles.carruselContent}
              onScroll={(e) => {
                const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + CARD_GAP));
                if (i !== indiceActivo) setIndiceActivo(i);
              }}
              scrollEventThrottle={16}
            >
            {planes.map((plan) => {
              const isSel   = selectedPlan?.id_membresia === plan.id_membresia;
              const esPromo = plan.tipo === 'promocion';
              return (
                <TouchableOpacity
                  key={plan.id_membresia}
                  activeOpacity={0.85}
                  style={[
                    styles.planCard,
                    esPromo && styles.planCardPromo,
                    isSel && styles.planCardActive,
                  ]}
                  onPress={() => setSelectedPlan(isSel ? null : plan)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSel }}
                  accessibilityLabel={`${plan.nombre}, $${plan.precio}, ${plan.duracion_meses} meses`}
                >
                  {/* Cinta de promoción, igual que en la web */}
                  {esPromo && (
                    <View style={styles.cintaPromo}>
                      <Text style={styles.cintaPromoText}>PROMOCIÓN</Text>
                    </View>
                  )}

                  {/* Encabezado: selector + nombre */}
                  <View style={styles.planHeader}>
                    <View style={styles.planHeaderLeft}>
                      <View style={[styles.radio, isSel && styles.radioActive]}>
                        {isSel && <View style={styles.radioDot} />}
                      </View>
                      <Text style={styles.planName}>{plan.nombre}</Text>
                    </View>
                  </View>

                  {/* Precio protagonista */}
                  <View style={styles.precioRow}>
                    <Text style={[styles.planPrice, esPromo && { color: '#f59e0b' }]}>
                      ${plan.precio}
                    </Text>
                    <Text style={styles.precioMoneda}>MXN</Text>
                  </View>

                  {/* Duración como chip */}
                  <View style={styles.chipDuracion}>
                    <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.chipDuracionText}>
                      {plan.duracion_meses} {plan.duracion_meses === 1 ? 'mes' : 'meses'}
                      {plan.duracion_meses > 1 &&
                        ` · $${Math.round(plan.precio / plan.duracion_meses)}/mes`}
                    </Text>
                  </View>

                  {/* Etiquetas: ahorro y vigencia de la promoción */}
                  <View style={styles.planTags}>
                    {!!plan.ahorro && plan.ahorro > 0 && (
                      <View style={styles.tagSave}>
                        <Text style={styles.tagSaveText}>Ahorras ${plan.ahorro.toFixed(0)}</Text>
                      </View>
                    )}
                    {esPromo && (
                      <View style={styles.tagPromo}>
                        <Ionicons name="flame" size={11} color="#f59e0b" />
                        <Text style={styles.tagPromoText}>
                          {plan.dias_restantes_promo == null
                            ? 'Promoción'
                            : plan.dias_restantes_promo === 0
                              ? 'Último día'
                              : `Solo ${plan.dias_restantes_promo} día${plan.dias_restantes_promo === 1 ? '' : 's'}`}
                        </Text>
                      </View>
                    )}
                  </View>

                  {!!plan.descripcion && (
                    <Text style={styles.planDesc}>{plan.descripcion}</Text>
                  )}

                  {/* Beneficios definidos por el gimnasio */}
                  {Array.isArray(plan.beneficios) && plan.beneficios.length > 0 && (
                    <View style={styles.beneficios}>
                      {plan.beneficios.map((b, i) => (
                        <View key={i} style={styles.beneficioRow}>
                          <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                          <Text style={styles.beneficioText}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Qué incluye el combo */}
                  {plan.es_combo && !!plan.items_combo?.length && (
                    <View style={styles.comboBox}>
                      <Text style={styles.comboTitle}>COMBO INCLUYE</Text>
                      {plan.items_combo.map((it, i) => (
                        <Text key={i} style={styles.comboItem}>
                          {it.cantidad}× {it.nombre}
                        </Text>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            </ScrollView>

            {/* Indicadores de posición del carrusel */}
            {planes.length > 1 && (
              <View style={styles.dots}>
                {planes.map((p, i) => (
                  <View
                    key={p.id_membresia}
                    style={[styles.dot, i === indiceActivo && styles.dotActivo]}
                  />
                ))}
              </View>
            )}
            </>
          )}

          {selectedPlan && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>2. Método de pago</Text>
              {/* Efectivo + las pasarelas que el gimnasio tenga activas */}
              <View style={styles.metodosRow}>
                {metodosPago.map((m) => {
                  const active = metodo === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.metodoChip, active && styles.metodoChipActive]}
                      onPress={() => setMetodo(m.id as MetodoPago)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={m.label}
                    >
                      <Ionicons
                        name={m.id === 'Efectivo' ? 'cash-outline' : 'card-outline'}
                        size={16}
                        color={active ? '#fff' : colors.textSecondary}
                      />
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
                label={
                  metodosPago.find((m) => m.id === metodo)?.esPasarela
                    ? `Pagar con ${metodosPago.find((m) => m.id === metodo)?.label}`
                    : `Renovar con ${selectedPlan.nombre}`
                }
                onPress={confirmRenew}
                loading={renewing || pagando}
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

    // ── Carrusel de planes ───────────────────────────────────────────────
    carruselContent: { paddingVertical: 4, paddingRight: 4 },
    dots:     { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
    dot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
    dotActivo:{ backgroundColor: colors.accent, width: 18 },

    // ── Tarjetas de plan ─────────────────────────────────────────────────
    planCard: {
      width: CARD_W, marginRight: CARD_GAP,
      borderWidth: 1, borderColor: colors.border, borderRadius: 14,
      padding: 14, backgroundColor: colors.inputBg,
    },
    planCardActive: {
      borderColor: colors.accent, borderWidth: 2,
      backgroundColor: colors.accent + '12',
    },
    // Las promociones se destacan con un halo ámbar, como en la web
    planCardPromo: {
      borderColor: 'rgba(245,158,11,0.55)',
      shadowColor: '#f59e0b', shadowOpacity: 0.35, shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 }, elevation: 6,
    },
    planHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    planHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },

    // Cinta superior de las promociones
    cintaPromo: {
      position: 'absolute', top: 0, alignSelf: 'center',
      backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 3,
      borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    },
    cintaPromoText: { color: '#fff', fontSize: 9.5 * fs, fontWeight: '800', letterSpacing: 0.6 },

    precioRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 10 },
    precioMoneda: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600' },

    chipDuracion: {
      flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
      backgroundColor: colors.card, borderRadius: 8,
      paddingHorizontal: 9, paddingVertical: 5, marginTop: 8,
    },
    chipDuracionText: { color: colors.textSecondary, fontSize: 11.5 * fs, fontWeight: '600' },

    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border,
             alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: colors.accent },
    radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },

    planName:     { color: colors.text, fontSize: 16 * fs, fontWeight: '700' },
    planDuration: { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
    planPrice:    { color: colors.accent, fontSize: 22 * fs, fontWeight: '800' },
    planDesc:     { color: colors.textSecondary, fontSize: 12.5 * fs, lineHeight: 18 * fs, marginTop: 10 },

    planTags:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    tagSave:      { backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
    tagSaveText:  { color: '#22c55e', fontSize: 11 * fs, fontWeight: '700' },
    tagPromo:     { flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: 'rgba(245,158,11,0.16)', borderRadius: 7,
                    paddingHorizontal: 8, paddingVertical: 3 },
    tagPromoText: { color: '#f59e0b', fontSize: 11 * fs, fontWeight: '700' },

    beneficios:    { marginTop: 12, gap: 6 },
    beneficioRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    beneficioText: { color: colors.text, fontSize: 12.5 * fs, lineHeight: 17 * fs, flex: 1 },

    comboBox:   { marginTop: 12, backgroundColor: colors.card, borderRadius: 10, padding: 10 },
    comboTitle: { color: colors.accent, fontSize: 10 * fs, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
    comboItem:  { color: colors.textSecondary, fontSize: 12 * fs, lineHeight: 18 * fs },

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
