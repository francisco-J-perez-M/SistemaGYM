/**
 * Mi Suscripción — Owner Gym (móvil)
 *
 * Equivalente de web/src/pages/owner_gym/OwnerSubscription.jsx:
 *   GET  /api/billing/suscripcion            estado del plan contratado
 *   GET  /api/billing/planes                 catálogo de planes de la plataforma
 *   GET  /api/billing/facturas?limit=10      historial de cobros
 *   POST /api/billing/suscripcion/renovar    { id_plan? } renovar o mejorar
 *
 * Cargo recurrente (el dueño autoriza una vez y la pasarela cobra sola):
 *   GET    /api/billing/suscripcion/recurrente               estado del acuerdo
 *   POST   /api/billing/suscripcion/recurrente               crear -> url de autorización
 *   POST   /api/billing/suscripcion/recurrente/sincronizar   reconciliar al volver
 *   DELETE /api/billing/suscripcion/recurrente               dar de baja
 *
 * Los planes se recorren en carrusel horizontal, con el mismo formato que las
 * membresías del miembro. El cobro real lo hace la plataforma (no el gimnasio),
 * por eso BotonesPago usa el contexto 'suscripcion': el backend resuelve las
 * credenciales de la plataforma y no las del gimnasio (ver factory.py).
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Alert, Dimensions, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { toStr, toArray, toDateStr } from '../../utils/format';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BotonesPago from '../../components/BotonesPago';

/** Método con el que la plataforma puede cobrar de forma recurrente. */
interface MetodoRecurrente {
  proveedor: string;          // 'paypal' | 'mercadopago'
  nombre:    string;
  modo:      string;          // 'sandbox' | 'live'
}

/** Estado del acuerdo de cobro recurrente y métodos disponibles. */
interface AcuerdoRecurrente {
  acuerdo: {
    pasarela:      string | null;
    estado:        string | null;   // pendiente | activo | pausado | cancelado | vencido
    /** Solo es true si el dueño lo pidió Y la pasarela confirma el acuerdo. */
    activo:        boolean;
    auto_renovar:  boolean;
    proximo_cobro: string | null;
  } | null;
  metodos: MetodoRecurrente[];
}

const SCREEN_W = Dimensions.get('window').width;
const CARD_W   = Math.min(300, SCREEN_W * 0.78);
const CARD_GAP = 12;

interface Plan {
  id:                 number;
  nombre:             string;
  titulo_comercial?:  string | null;
  descripcion?:       string | null;
  precio_mensual_mxn: number;      // en centavos
  precio_mxn?:        number;      // ya en pesos
  precio_display?:    string;
  max_miembros?:      number | null;
  caracteristicas?:   string[];
  destacado?:         boolean;
  orden?:             number;
  activo?:            boolean;
}

interface Suscripcion {
  id:                    number;
  estado:                string;
  auto_renovar?:         boolean;
  fecha_proximo_cobro?:  string | null;
  plan?:                 Plan | null;
}

interface Factura {
  id:      number;
  /** En centavos, como se guarda. Para mostrar se usa monto_mxn. */
  monto?:      number;
  monto_mxn?:  number;
  estado?:     string;
  plan?:       string | null;
  concepto?:   string | null;
  fecha_emision?: string | null;
  fecha_pago?:    string | null;
  fecha_vencimiento?: string | null;
}

/** Cómo se llama y se pinta cada estado de la suscripción. */
const ESTADOS: Record<string, { label: string; tono: 'ok' | 'aviso' | 'error' | 'neutro' }> = {
  active:    { label: 'Activa',            tono: 'ok'     },
  trialing:  { label: 'Período de prueba', tono: 'neutro' },
  past_due:  { label: 'Pago pendiente',    tono: 'aviso'  },
  unpaid:    { label: 'Sin pagar',         tono: 'error'  },
  cancelled: { label: 'Cancelada',         tono: 'error'  },
  paused:    { label: 'Pausada',           tono: 'neutro' },
};

const diasRestantes = (iso?: string | null): number | null => {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
};

/** El precio viaja en centavos; se muestra en pesos. */
const enPesos = (p: Plan): number =>
  p.precio_mxn ?? Number(((p.precio_mensual_mxn ?? 0) / 100).toFixed(2));

export default function SuscripcionScreen() {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const [sub, setSub]           = useState<Suscripcion | null>(null);
  const [planes, setPlanes]     = useState<Plan[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [renovando, setRenovando]     = useState(false);
  const [idxPlan, setIdxPlan]         = useState(0);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const [s, p, f] = await Promise.all([
        api.get(ENDPOINTS.BILLING_SUSCRIPCION),
        api.get(ENDPOINTS.BILLING_PLANES),
        api.get(`${ENDPOINTS.BILLING_FACTURAS}?limit=10`),
      ]);
      setSub(s.data?.suscripcion ?? null);
      const lista = Array.isArray(p.data) ? p.data : toArray(p.data?.planes);
      setPlanes(lista.filter((x: Plan) => x.activo !== false)
                     .sort((a: Plan, b: Plan) => (a.orden ?? 0) - (b.orden ?? 0)));
      setFacturas(toArray(f.data?.facturas));
    } catch {
      if (!silencioso) Alert.alert('Error', 'No se pudo cargar tu suscripción.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);


  // ── Cargo recurrente ──────────────────────────────────────────────────────
  //
  // Ya no es un interruptor. GymPro no cobra ni guarda tarjetas: el dueño
  // autoriza una vez en PayPal o Mercado Pago y la pasarela cobra sola cada 30
  // días. Autorizar implica salir de la app hacia la pasarela y volver, así que
  // al regresar hay que preguntar cómo quedó el acuerdo: en desarrollo los
  // webhooks no llegan a localhost.
  const [recurrente, setRecurrente] = useState<AcuerdoRecurrente | null>(null);
  const [procesando, setProcesando] = useState(false);

  const cargarRecurrente = useCallback(async () => {
    try {
      const r = await api.get(ENDPOINTS.BILLING_RECURRENTE);
      setRecurrente(r.data ?? null);
    } catch { /* la pantalla funciona sin esto */ }
  }, []);

  const sincronizarRecurrente = useCallback(async (silencioso = false) => {
    setProcesando(true);
    try {
      const r = await api.post(ENDPOINTS.BILLING_RECURRENTE_SYNC);
      await Promise.all([cargarRecurrente(), cargar(true)]);
      if (!silencioso) {
        Alert.alert(
          r.data?.activo ? 'Cargo recurrente activo' : 'Todavía no cobra',
          r.data?.activo
            ? 'Tu plan se renovará solo cada 30 días.'
            : `La pasarela reporta el acuerdo como "${r.data?.estado}".`,
        );
      }
    } catch (e: any) {
      if (!silencioso) {
        Alert.alert('Error', e?.response?.data?.msg ?? 'No se pudo consultar la pasarela.');
      }
    } finally {
      setProcesando(false);
    }
  }, [cargarRecurrente, cargar]);

  // Al volver de la pasarela conviene releer: el pago pudo acreditarse fuera.
  // También se reconcilia el acuerdo recurrente en silencio, porque autorizar
  // implica salir de la app y en desarrollo el webhook no llega a localhost:
  // sin esto el acuerdo se quedaría "pendiente" para siempre.
  //
  // Va aquí, después de declarar las dos funciones que usa: en JavaScript las
  // constantes no se elevan, así que arriba estarían sin asignar.
  useFocusEffect(useCallback(() => {
    cargar(true);
    cargarRecurrente().then(() => sincronizarRecurrente(true).catch(() => {}));
  }, [cargar, cargarRecurrente, sincronizarRecurrente]));

  const autorizarRecurrente = async (proveedor: string) => {
    setProcesando(true);
    try {
      const r = await api.post(ENDPOINTS.BILLING_RECURRENTE, { proveedor, origen: 'mobile' });
      const url = r.data?.url_autorizacion;
      if (!url) throw new Error('La pasarela no devolvió la URL de autorización.');
      await Linking.openURL(url);
      // Al volver, useFocusEffect dispara la sincronización y confirma el estado.
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.msg ?? e?.message ?? 'No se pudo iniciar la autorización.');
    } finally {
      setProcesando(false);
    }
  };

  const elegirPasarela = () => {
    const metodos = toArray<MetodoRecurrente>(recurrente?.metodos);
    if (metodos.length === 0) {
      Alert.alert(
        'Sin métodos disponibles',
        'La plataforma todavía no tiene configurada ninguna pasarela para cobros recurrentes.',
      );
      return;
    }
    Alert.alert(
      'Activar cargo recurrente',
      'Te llevaremos a la pasarela para que autorices el cobro. No guardamos tu tarjeta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        ...metodos.map((m) => ({
          text: m.modo === 'sandbox' ? `${m.nombre} (pruebas)` : m.nombre,
          onPress: () => autorizarRecurrente(m.proveedor),
        })),
      ],
    );
  };

  const cancelarRecurrente = () => {
    Alert.alert(
      '¿Cancelar el cargo recurrente?',
      'Tu plan seguirá activo hasta la fecha ya pagada, pero después tendrás que renovarlo a mano.',
      [
        { text: 'Conservarlo', style: 'cancel' },
        {
          text: 'Cancelar cargo',
          style: 'destructive',
          onPress: async () => {
            setProcesando(true);
            try {
              const r = await api.delete(ENDPOINTS.BILLING_RECURRENTE);
              await Promise.all([cargarRecurrente(), cargar(true)]);
              Alert.alert('Listo', r.data?.msg ?? 'Cargo recurrente cancelado.');
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.msg ?? 'No se pudo cancelar.');
            } finally {
              setProcesando(false);
            }
          },
        },
      ],
    );
  };

  /** Renovación sin pasarela: la plataforma la registra como pago manual. */
  const renovar = (plan?: Plan) => {
    const mejora = plan && plan.id !== sub?.plan?.id;
    Alert.alert(
      mejora ? 'Cambiar de plan' : 'Renovar suscripción',
      mejora
        ? `¿Cambiar al plan ${toStr(plan?.titulo_comercial ?? plan?.nombre)}? Se registrará el cobro correspondiente.`
        : '¿Registrar la renovación de tu plan actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: mejora ? 'Cambiar' : 'Renovar',
          onPress: async () => {
            setRenovando(true);
            try {
              await api.post(ENDPOINTS.BILLING_RENOVAR, mejora ? { id_plan: plan!.id } : {});
              await cargar(true);
              Alert.alert('Listo', 'Tu suscripción quedó al corriente.');
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.msg ?? 'No se pudo completar la operación.');
            } finally {
              setRenovando(false);
            }
          },
        },
      ],
    );
  };

  if (cargando) return <LoadingSpinner fullScreen message="Cargando tu suscripción…" />;

  const meta  = ESTADOS[toStr(sub?.estado)] ?? ESTADOS.cancelled;
  const dias  = diasRestantes(sub?.fecha_proximo_cobro);
  const urge  = dias !== null && dias <= 7;
  const colorEstado =
    meta.tono === 'ok'    ? colors.dataProgreso :
    meta.tono === 'aviso' ? colors.dataAtencion :
    meta.tono === 'error' ? colors.dataRiesgo   : colors.textSecondary;
  const fondoEstado =
    meta.tono === 'ok'    ? colors.dataProgresoBg :
    meta.tono === 'aviso' ? colors.dataAtencionBg :
    meta.tono === 'error' ? colors.dataRiesgoBg   : colors.surface;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => { setRefrescando(true); cargar(true); }}
          tintColor={colors.accent}
        />
      }
    >
      <Text style={styles.titulo} accessibilityRole="header">Mi Suscripción</Text>
      <Text style={styles.subtitulo}>
        Tu plan con la plataforma: estado, vencimiento y renovación.
      </Text>

      {/* ── Estado actual ────────────────────────────────────────────────── */}
      <View style={styles.tarjetaEstado}>
        <View style={styles.estadoTop}>
          <View style={styles.iconoPlan}>
            <Ionicons name="diamond-outline" size={19} color={colors.accent} />
          </View>
          <View style={[styles.pastilla, { backgroundColor: fondoEstado }]}>
            <View style={[styles.punto, { backgroundColor: colorEstado }]} />
            <Text style={[styles.pastillaText, { color: colorEstado }]}>{meta.label}</Text>
          </View>
        </View>

        <Text style={styles.planNombre}>
          {toStr(sub?.plan?.titulo_comercial ?? sub?.plan?.nombre, 'Sin plan contratado')}
        </Text>

        {sub?.plan ? (
          <View style={styles.precioRow}>
            <Text style={styles.precio}>${enPesos(sub.plan)}</Text>
            <Text style={styles.precioMes}>MXN / mes</Text>
          </View>
        ) : null}

        <View style={styles.divisor} />

        <View style={styles.datosRow}>
          <View style={styles.dato}>
            <Text style={styles.datoLabel}>Próximo cobro</Text>
            <Text style={styles.datoValor}>
              {sub?.fecha_proximo_cobro ? toDateStr(sub.fecha_proximo_cobro) : '—'}
            </Text>
          </View>
          <View style={[styles.dato, { alignItems: 'flex-end' }]}>
            <Text style={styles.datoLabel}>Días restantes</Text>
            <Text style={[
              styles.datoDias,
              { color: dias === null ? colors.textMuted : urge ? colors.dataAtencion : colors.dataProgreso },
            ]}>
              {dias === null ? '—' : dias < 0 ? 'Vencida' : dias}
            </Text>
          </View>
        </View>

        {/* Cargo recurrente */}
        {sub ? (() => {
          const ac      = recurrente?.acuerdo;
          const activo  = !!ac?.activo;
          // Acuerdo creado pero sin terminar de autorizar: es el caso que más
          // confunde, porque el dueño cree haberlo dejado listo.
          const aMedias = !!ac?.pasarela && !activo;

          return (
            <View style={[
              styles.recurrente,
              { flexDirection: 'column', alignItems: 'stretch', gap: 10,
                borderWidth: 1,
                borderColor: activo ? colors.success : aMedias ? colors.warning : colors.border },
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons
                  name={activo ? 'sync-circle' : 'sync-circle-outline'}
                  size={22}
                  color={activo ? colors.success : colors.accent}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recurrenteTitulo}>Cargo recurrente</Text>
                  <Text style={styles.recurrenteTexto}>
                    {activo
                      ? `Activo con ${ac!.pasarela === 'paypal' ? 'PayPal' : 'Mercado Pago'}. Se cobra solo.`
                      : aMedias
                        ? `El acuerdo está en "${ac!.estado}": aún no cobra nada.`
                        : 'La renovación es manual.'}
                  </Text>
                </View>
              </View>

              {!ac?.pasarela ? (
                <TouchableOpacity
                  style={[styles.accionRecurrente, procesando && { opacity: 0.6 }]}
                  onPress={elegirPasarela}
                  disabled={procesando}
                  accessibilityRole="button"
                  accessibilityLabel="Activar el cargo recurrente"
                >
                  <Ionicons name="repeat" size={16} color={colors.onAccent} />
                  <Text style={styles.accionRecurrenteTxt}>Activar cargo recurrente</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <TouchableOpacity
                    style={[styles.accionSecundaria, procesando && { opacity: 0.6 }]}
                    onPress={() => sincronizarRecurrente()}
                    disabled={procesando}
                    accessibilityRole="button"
                    accessibilityLabel="Comprobar el estado del acuerdo"
                  >
                    <Ionicons name="refresh" size={15} color={colors.textSecondary} />
                    <Text style={styles.accionSecundariaTxt}>
                      {procesando ? 'Consultando…' : 'Comprobar estado'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.accionSecundaria, procesando && { opacity: 0.6 }]}
                    onPress={cancelarRecurrente}
                    disabled={procesando}
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar el cargo recurrente"
                  >
                    <Text style={styles.accionSecundariaTxt}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })() : null}

        {/* Renovar el plan actual */}
        {sub?.plan ? (
          <TouchableOpacity
            style={[styles.renovarBtn, renovando && { opacity: 0.6 }]}
            onPress={() => renovar()}
            disabled={renovando}
            accessibilityRole="button" accessibilityLabel="Renovar el plan actual"
          >
            <Ionicons name={renovando ? 'hourglass-outline' : 'refresh-outline'}
                      size={18} color={colors.onAccent} />
            <Text style={styles.renovarText}>
              {renovando ? 'Procesando…' : 'Renovar plan actual'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Pago en línea del plan vigente */}
        {sub?.plan && enPesos(sub.plan) > 0 ? (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.pagoLabel}>Pagar en línea</Text>
            <BotonesPago
              contexto="suscripcion"
              monto={enPesos(sub.plan)}
              descripcion={`Suscripción GymPro — plan ${toStr(sub.plan.nombre)}`}
              referenciaLocal={sub.id}
              onPagado={() => cargar(true)}
            />
          </View>
        ) : null}
      </View>

      {/* ── Planes disponibles (carrusel) ─────────────────────────────────── */}
      <Text style={styles.seccion}>Planes disponibles</Text>
      <Text style={styles.seccionSub}>Desliza para comparar</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.carrusel}
        onMomentumScrollEnd={(e) =>
          setIdxPlan(Math.round(e.nativeEvent.contentOffset.x / (CARD_W + CARD_GAP)))
        }
      >
        {planes.map((p) => {
          const actual  = p.id === sub?.plan?.id;
          const precio  = enPesos(p);
          const rasgos  = toArray(p.caracteristicas);
          return (
            <View
              key={p.id}
              style={[
                styles.planCard,
                { width: CARD_W },
                p.destacado && styles.planDestacado,
                actual && styles.planActual,
              ]}
            >
              {p.destacado && !actual ? (
                <View style={styles.cinta}>
                  <Text style={styles.cintaText}>RECOMENDADO</Text>
                </View>
              ) : null}
              {actual ? (
                <View style={[styles.cinta, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.cintaText, { color: colors.onAccent }]}>TU PLAN</Text>
                </View>
              ) : null}

              <Text style={styles.planTitulo} numberOfLines={1}>
                {toStr(p.titulo_comercial ?? p.nombre)}
              </Text>

              <View style={styles.precioRow}>
                <Text style={[styles.planPrecio, p.destacado && { color: colors.promo }]}>
                  ${precio}
                </Text>
                <Text style={styles.precioMes}>MXN / mes</Text>
              </View>

              {p.max_miembros ? (
                <View style={styles.limite}>
                  <Ionicons name="people-outline" size={13} color={colors.dataActividad} />
                  <Text style={styles.limiteText}>Hasta {p.max_miembros} miembros</Text>
                </View>
              ) : null}

              {p.descripcion ? (
                <Text style={styles.planDesc} numberOfLines={2}>{p.descripcion}</Text>
              ) : null}

              {rasgos.length > 0 ? (
                <View style={styles.rasgos}>
                  {rasgos.slice(0, 6).map((c, i) => (
                    <View key={i} style={styles.rasgoRow}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.dataProgreso} />
                      <Text style={styles.rasgoText} numberOfLines={2}>{String(c)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {actual ? (
                <View style={styles.planActualNota}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.accent} />
                  <Text style={styles.planActualTexto}>Plan contratado</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.cambiarBtn}
                    onPress={() => renovar(p)}
                    disabled={renovando}
                    accessibilityRole="button"
                    accessibilityLabel={`Cambiar al plan ${toStr(p.nombre)}`}
                  >
                    <Text style={styles.cambiarText}>Cambiar a este plan</Text>
                  </TouchableOpacity>

                  {precio > 0 ? (
                    <View style={{ marginTop: 8 }}>
                      <BotonesPago
                        contexto="suscripcion"
                        monto={precio}
                        descripcion={`Suscripción GymPro — plan ${toStr(p.nombre)}`}
                        referenciaLocal={sub?.id ?? null}
                        onPagado={() => cargar(true)}
                      />
                    </View>
                  ) : null}
                </>
              )}
            </View>
          );
        })}
      </ScrollView>

      {planes.length > 1 ? (
        <View style={styles.puntos}>
          {planes.map((_, i) => (
            <View key={i} style={[styles.puntoCarrusel, i === idxPlan && styles.puntoActivo]} />
          ))}
        </View>
      ) : null}

      {/* ── Facturas ──────────────────────────────────────────────────────── */}
      <Text style={styles.seccion}>Historial de cobros</Text>
      <Text style={styles.seccionSub}>Renovaciones y cambios de plan</Text>
      {facturas.length === 0 ? (
        <Text style={styles.vacio}>Aún no hay cobros registrados.</Text>
      ) : (
        <View style={styles.facturas}>
          {facturas.map((f) => {
            const pagada = f.estado === 'pagada';
            // El importe se toma de monto_mxn (pesos). El campo 'monto' está en
            // centavos y pintarlo tal cual mostraba $49,900 por una factura de $499.
            const importe = f.monto_mxn ?? (f.monto ? f.monto / 100 : 0);
            // La fecha del cobro es cuando se pagó; si sigue pendiente, cuándo se emitió.
            const fecha = f.fecha_pago ?? f.fecha_emision;
            return (
              <View key={f.id} style={styles.factura}>
                <View style={[
                  styles.facturaIcono,
                  { backgroundColor: pagada ? colors.dataProgresoBg : colors.dataAtencionBg },
                ]}>
                  <Ionicons
                    name={pagada ? 'checkmark-circle-outline' : 'time-outline'}
                    size={16}
                    color={pagada ? colors.dataProgreso : colors.dataAtencion}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.facturaConcepto} numberOfLines={1}>
                    {toStr(f.concepto ?? (f.plan ? `Suscripción ${f.plan}` : null), 'Suscripción')}
                  </Text>
                  <Text style={styles.facturaFecha}>
                    {toDateStr(fecha)}
                    {!pagada ? '  ·  Pendiente' : ''}
                    {f.fecha_vencimiento ? `  ·  vigente hasta ${toDateStr(f.fecha_vencimiento)}` : ''}
                  </Text>
                </View>
                <Text style={[
                  styles.facturaMonto,
                  !pagada && { color: colors.dataAtencion },
                ]}>
                  ${importe.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 4 },

    titulo:    { color: colors.text, fontSize: 24 * fs, fontWeight: '800' },
    subtitulo: { color: colors.textSecondary, fontSize: 13 * fs, marginBottom: 18 },

    // ── Estado actual ───────────────────────────────────────────────────
    tarjetaEstado: {
      backgroundColor: colors.card, borderRadius: 18, padding: 18,
      borderWidth: 1, borderColor: colors.border,
    },
    estadoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    iconoPlan: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center',
    },
    pastilla: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20,
    },
    punto:        { width: 7, height: 7, borderRadius: 4 },
    pastillaText: { fontSize: 12 * fs, fontWeight: '700' },

    planNombre: { color: colors.text, fontSize: 20 * fs, fontWeight: '800', marginTop: 12 },
    precioRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
    precio:     { color: colors.accent, fontSize: 30 * fs, fontWeight: '900', letterSpacing: -1 },
    precioMes:  { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600' },

    divisor:   { height: 1, backgroundColor: colors.border, marginVertical: 16 },
    datosRow:  { flexDirection: 'row', justifyContent: 'space-between' },
    dato:      { gap: 3 },
    datoLabel: { color: colors.textMuted, fontSize: 11 * fs },
    datoValor: { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
    datoDias:  { fontSize: 22 * fs, fontWeight: '800', letterSpacing: -0.5 },

    recurrente: {
      flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18,
      backgroundColor: colors.surface, borderRadius: 12, padding: 13,
    },
    recurrenteTitulo: { color: colors.text, fontSize: 13.5 * fs, fontWeight: '700' },
    recurrenteTexto:  { color: colors.textSecondary, fontSize: 11.5 * fs, marginTop: 2 },

    // Acción principal del bloque de cargo recurrente
    accionRecurrente: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.accent, paddingVertical: 12, borderRadius: 11,
    },
    accionRecurrenteTxt: { color: colors.onAccent, fontSize: 14 * fs, fontWeight: '700' },
    // Acciones sobre un acuerdo ya creado: no compiten con "Renovar plan"
    accionSecundaria: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      flexGrow: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 11,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
    },
    accionSecundariaTxt: { color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '600' },

    renovarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
      backgroundColor: colors.accent, borderRadius: 13, paddingVertical: 14, marginTop: 14,
    },
    renovarText: { color: colors.onAccent, fontSize: 14.5 * fs, fontWeight: '700' },
    pagoLabel:   { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '700', marginBottom: 8 },

    // ── Carrusel de planes ──────────────────────────────────────────────
    seccion:    { color: colors.text, fontSize: 17 * fs, fontWeight: '800', marginTop: 28 },
    seccionSub: { color: colors.textMuted, fontSize: 12 * fs, marginBottom: 12 },
    carrusel:   { gap: CARD_GAP, paddingRight: 20, paddingVertical: 4 },

    planCard: {
      backgroundColor: colors.card, borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: colors.border, paddingTop: 22,
    },
    planDestacado: {
      borderColor: colors.promo,
      shadowColor: colors.promo, shadowOpacity: 0.3, shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 }, elevation: 6,
    },
    planActual: { borderColor: colors.accent },
    cinta: {
      position: 'absolute', top: 0, alignSelf: 'center',
      backgroundColor: colors.promo, paddingHorizontal: 12, paddingVertical: 3,
      borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    },
    cintaText: { color: colors.background, fontSize: 9.5 * fs, fontWeight: '800', letterSpacing: 0.6 },

    planTitulo: { color: colors.text, fontSize: 16 * fs, fontWeight: '700' },
    planPrecio: { color: colors.accent, fontSize: 26 * fs, fontWeight: '900', letterSpacing: -0.8 },
    planDesc:   { color: colors.textSecondary, fontSize: 12 * fs, lineHeight: 17, marginTop: 8 },

    limite: {
      flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9,
      backgroundColor: colors.dataActividadBg, alignSelf: 'flex-start',
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7,
    },
    limiteText: { color: colors.dataActividad, fontSize: 11 * fs, fontWeight: '700' },

    rasgos:    { marginTop: 12, gap: 6 },
    rasgoRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
    rasgoText: { color: colors.text, fontSize: 12.5 * fs, flex: 1, lineHeight: 17 },

    cambiarBtn: {
      marginTop: 14, borderRadius: 11, paddingVertical: 11, alignItems: 'center',
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    cambiarText: { color: colors.text, fontSize: 13 * fs, fontWeight: '700' },

    planActualNota: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      marginTop: 14, paddingVertical: 11,
      backgroundColor: colors.accentBg, borderRadius: 11,
    },
    planActualTexto: { color: colors.accent, fontSize: 13 * fs, fontWeight: '700' },

    puntos:        { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
    puntoCarrusel: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    puntoActivo:   { backgroundColor: colors.accent, width: 18 },

    // ── Facturas ────────────────────────────────────────────────────────
    vacio:    { color: colors.textMuted, fontSize: 13 * fs },
    facturas: { gap: 8 },
    factura: {
      flexDirection: 'row', alignItems: 'center', gap: 11,
      backgroundColor: colors.card, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    facturaIcono: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    facturaConcepto: { color: colors.text, fontSize: 13.5 * fs, fontWeight: '600' },
    facturaFecha:    { color: colors.textMuted, fontSize: 11 * fs, marginTop: 1 },
    facturaMonto:    { color: colors.text, fontSize: 14 * fs, fontWeight: '700' },
  });
}
