/**
 * PerfilCompletoBadge.tsx — Indicador circular de pendientes (SCRUM-102).
 *
 * Vive en la barra de navegación (headerRight del Drawer de (member),
 * ver app/(member)/_layout.tsx), así que es visible desde cualquier
 * pantalla del rol Miembro. El cálculo del porcentaje NO vive aquí: viene
 * de GET /user/profile-completion (api/app/routes/miembro/user_profile.py),
 * el mismo endpoint que consume el portal web, para que el % sea idéntico
 * en ambas plataformas por construcción.
 *
 * Al tocarlo se abre la lista de pendientes agrupada en los 4 bloques del
 * ticket; cada pendiente navega en un toque a la pantalla donde se
 * captura (RUTA_POR_CAMPO). El bloque médico es opcional —nunca bloquea
 * el 100%— y se distingue visualmente del resto.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useColors } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';

type Pendiente = { campo: string; label: string };
type Bloque = {
  id: string;
  nombre: string;
  obligatorio: boolean;
  requiereConsentimiento?: boolean;
  consentimientoOtorgado?: boolean;
  pendientes: Pendiente[];
};
type ProfileCompletion = { porcentaje: number; completo: boolean; bloques: Bloque[] };

// A qué pantalla del rol Miembro lleva cada campo pendiente. Varias claves
// comparten destino porque se editan en la misma pantalla (p. ej. Salud
// agrupa medidas + información médica en un solo lugar).
const RUTA_POR_CAMPO: Record<string, string> = {
  nombre: '/(member)/profile', telefono: '/(member)/profile',
  fecha_nacimiento: '/(member)/profile', foto: '/(member)/profile',
  objetivo: '/(member)/profile', disponibilidad: '/(member)/profile',
  unidad_medida: '/(member)/profile',
  peso: '/(member)/health', estatura: '/(member)/health', medidas: '/(member)/health',
  condiciones: '/(member)/health', lesiones: '/(member)/health',
  contacto_emergencia: '/(member)/health',
};

const RADIO = 16;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

export default function PerfilCompletoBadge() {
  const colors = useColors();
  const [abierto, setAbierto] = useState(false);
  const { data, refetch } = useFetch<ProfileCompletion>(ENDPOINTS.PROFILE_COMPLETION);

  // Bug reportado: el % se quedaba "pegado" al valor con el que se montó
  // por primera vez cada pantalla (headerRight se evalúa una vez por cada
  // Drawer.Screen visitada, y los screens del Drawer no se desmontan al
  // navegar fuera) — así que capturar/editar datos de perfil en otra
  // pantalla nunca se reflejaba aquí, y volver a una pantalla visitada
  // hace rato podía incluso "retroceder" el % a su valor viejo. Se
  // refresca en cada enfoque (mismo patrón ya usado en
  // app/(admin)/suscripcion.tsx) para que siempre muestre el valor real.
  useFocusEffect(useCallback(() => {
    refetch();
  }, [refetch]));

  // Sin datos aún (cargando o error): no mostrar un anillo a medio llenar
  // que podría confundirse con "50% de progreso real".
  if (!data) return null;
  // El indicador desaparece al llegar al 100% de lo obligatorio (el
  // bloque médico, opcional, nunca lo mantiene visible).
  if (data.completo) return null;

  const pct = Math.max(0, Math.min(100, data.porcentaje));
  const offset = CIRCUNFERENCIA * (1 - pct / 100);

  const irA = (campo: string) => {
    setAbierto(false);
    router.push((RUTA_POR_CAMPO[campo] ?? '/(member)/profile') as any);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setAbierto(true)}
        accessibilityLabel={`Perfil ${pct}% completo. Toca para ver qué falta.`}
        style={{ marginRight: 14, padding: 2 }}
      >
        <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={36} height={36} viewBox="0 0 36 36">
            <Circle cx={18} cy={18} r={RADIO} stroke={colors.border} strokeWidth={3} fill="none" />
            <Circle
              cx={18} cy={18} r={RADIO}
              stroke={colors.accent} strokeWidth={3} fill="none"
              strokeDasharray={`${CIRCUNFERENCIA}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation={-90}
              origin="18, 18"
            />
          </Svg>
          <Text style={{ position: 'absolute', fontSize: 9, fontWeight: '700', color: colors.text }}>
            {pct}%
          </Text>
        </View>
      </TouchableOpacity>

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
        <View style={[styles_overlay.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles_overlay.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles_overlay.header}>
              <View>
                <Text style={[styles_overlay.title, { color: colors.text }]}>Completa tu perfil</Text>
                <Text style={[styles_overlay.subtitle, { color: colors.textSecondary }]}>
                  {pct}% completo
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAbierto(false)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {data.bloques.map((bloque) => (
                <View key={bloque.id} style={{ marginBottom: 16 }}>
                  <View style={styles_overlay.bloqueHeader}>
                    <Text style={[styles_overlay.bloqueTitulo, { color: colors.text }]}>{bloque.nombre}</Text>
                    {!bloque.obligatorio && (
                      <View style={[styles_overlay.chipOpcional, { backgroundColor: colors.inputBg }]}>
                        <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>OPCIONAL</Text>
                      </View>
                    )}
                  </View>

                  {bloque.pendientes.length === 0 ? (
                    <View style={styles_overlay.pendienteRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 8 }}>
                        {bloque.id === 'medico' && !bloque.consentimientoOtorgado
                          ? 'Sin registrar — puedes omitirlo'
                          : 'Completo'}
                      </Text>
                    </View>
                  ) : (
                    bloque.pendientes.map((p) => (
                      <TouchableOpacity
                        key={p.campo}
                        style={[styles_overlay.pendienteRow, { borderBottomColor: colors.border }]}
                        onPress={() => irA(p.campo)}
                        accessibilityRole="button"
                        accessibilityLabel={`Completar ${p.label}`}
                      >
                        <Ionicons name="ellipse-outline" size={16} color={colors.textMuted} />
                        <Text style={{ color: colors.text, fontSize: 13.5, marginLeft: 8, flex: 1 }}>
                          {p.label}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles_overlay = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  box: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, borderWidth: 1, borderBottomWidth: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  bloqueHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  bloqueTitulo: { fontSize: 14, fontWeight: '700' },
  chipOpcional: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pendienteRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
