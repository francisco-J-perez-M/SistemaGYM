/**
 * Pantalla Salud (miembro) — indicadores físicos + datos médicos del onboarding.
 * Contrato real: GET /api/user/health  /  POST /api/user/health (peso, cintura, cadera, …)
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Modal, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import type { HealthResponse, HealthCondition } from '../../types';

type BadgeColor = 'success' | 'warning' | 'error' | 'info';

function estadoColor(estado: string): BadgeColor {
  switch (estado) {
    case 'normal':   return 'success';
    case 'alto':     return 'warning';
    case 'muy_alto': return 'error';
    case 'bajo':     return 'info';
    default:         return 'info';
  }
}

function condIcon(estado: string): React.ComponentProps<typeof Ionicons>['name'] {
  if (estado === 'normal') return 'checkmark-circle';
  if (estado === 'bajo')   return 'information-circle';
  return 'alert-circle';
}

export default function HealthScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data, loading, refetch } = useFetch<HealthResponse>(ENDPOINTS.USER_HEALTH);

  const [modal, setModal] = useState(false);
  const [peso, setPeso]       = useState('');
  const [cintura, setCintura] = useState('');
  const [cadera, setCadera]   = useState('');
  const [notas, setNotas]     = useState('');
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    if (!peso) { Alert.alert('Falta peso', 'Ingresa al menos tu peso actual.'); return; }
    setSaving(true);
    try {
      await api.post(ENDPOINTS.USER_HEALTH, {
        peso:    parseFloat(peso),
        cintura: cintura ? parseFloat(cintura) : undefined,
        cadera:  cadera  ? parseFloat(cadera)  : undefined,
        notas:   notas || undefined,
      });
      setModal(false);
      setPeso(''); setCintura(''); setCadera(''); setNotas('');
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando salud…" />;

  const condiciones = toArray<HealthCondition>(data?.condiciones);
  const medicas     = toArray<string>(data?.condicionesMedicas);
  const alergias    = toArray<string>(data?.alergias);
  const medicamentos = toArray<string>(data?.medicamentos);
  const lesiones    = toArray<string>(data?.lesiones);

  const chipGroup = (title: string, items: string[], color: BadgeColor) => (
    <View style={styles.chipBlock}>
      <Text style={styles.chipBlockTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.chipEmpty}>Ninguna registrada</Text>
      ) : (
        <View style={styles.chipsRow}>
          {items.map((it, i) => (
            <View key={i} style={[styles.chip, { backgroundColor: colors[`${color}Bg` as keyof typeof colors] as string }]}>
              <Text style={[styles.chipText, { color: colors[color] }]}>{it}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title} accessibilityRole="header">Salud</Text>
          {data?.ultimaActualizacion && (
            <Text style={styles.subtitle}>Actualizado: {data.ultimaActualizacion}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Actualizar medidas"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Indicadores */}
      <View style={styles.grid}>
        {condiciones.map((c, i) => {
          const col = estadoColor(c.estado);
          return (
            <Card key={i} style={styles.indCard} padding={14}>
              <View style={styles.indHead}>
                <Ionicons name={condIcon(c.estado)} size={18} color={colors[col]} />
              </View>
              <Text style={styles.indValue}>{c.valor}</Text>
              <Text style={styles.indLabel} numberOfLines={2}>{c.nombre}</Text>
            </Card>
          );
        })}
      </View>

      {/* Datos del perfil */}
      {(data?.objetivo || data?.nivelActividad || data?.nivelExperiencia) && (
        <Card>
          <Text style={styles.sectionTitle}>Perfil de entrenamiento</Text>
          {!!data?.objetivo && <Row label="Objetivo" value={data.objetivo} styles={styles} />}
          {!!data?.nivelActividad && <Row label="Nivel de actividad" value={data.nivelActividad} styles={styles} />}
          {!!data?.nivelExperiencia && <Row label="Experiencia" value={data.nivelExperiencia} styles={styles} />}
          {!!data?.horasSueno && <Row label="Horas de sueño" value={String(data.horasSueno)} styles={styles} />}
        </Card>
      )}

      {/* Datos médicos — siempre visibles (placeholder si no hay datos) */}
      <Card>
        <Text style={styles.sectionTitle}>Información médica</Text>
        {chipGroup('Condiciones médicas', medicas, 'warning')}
        {chipGroup('Alergias', alergias, 'error')}
        {chipGroup('Medicamentos', medicamentos, 'info')}
        {chipGroup('Lesiones previas', lesiones, 'warning')}
      </Card>

      {condiciones.length === 0 && (
        <Card>
          <View style={styles.empty}>
            <Ionicons name="pulse-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aún no hay datos de salud. Registra tus medidas para empezar.</Text>
          </View>
        </Card>
      )}

      {/* Modal actualizar medidas */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Actualizar medidas</Text>
              <TouchableOpacity onPress={() => setModal(false)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Peso (kg) *</Text>
            <TextInput style={styles.input} value={peso} onChangeText={setPeso}
              keyboardType="decimal-pad" placeholder="72.5" placeholderTextColor={colors.textMuted} />
            <Text style={styles.inputLabel}>Cintura (cm)</Text>
            <TextInput style={styles.input} value={cintura} onChangeText={setCintura}
              keyboardType="decimal-pad" placeholder="80" placeholderTextColor={colors.textMuted} />
            <Text style={styles.inputLabel}>Cadera (cm)</Text>
            <TextInput style={styles.input} value={cadera} onChangeText={setCadera}
              keyboardType="decimal-pad" placeholder="95" placeholderTextColor={colors.textMuted} />
            <Text style={styles.inputLabel}>Notas</Text>
            <TextInput style={[styles.input, { height: 70 }]} value={notas} onChangeText={setNotas}
              multiline placeholder="Cómo te sientes…" placeholderTextColor={colors.textMuted} />
            <Button label="Guardar" onPress={save} loading={saving} disabled={!peso} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Row({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof make_styles> }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 16, paddingBottom: 32 },
    topRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
    subtitle:{ color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
    addBtn:  { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.accent,
               alignItems: 'center', justifyContent: 'center' },

    grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    indCard: { width: '47%', gap: 4 },
    indHead: { flexDirection: 'row' },
    indValue:{ color: colors.text, fontSize: 20 * fs, fontWeight: '800', marginTop: 4 },
    indLabel:{ color: colors.textSecondary, fontSize: 11 * fs },

    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 12 },
    row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { color: colors.textSecondary, fontSize: 13 * fs },
    rowValue: { color: colors.text, fontSize: 14 * fs, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

    chipBlock:      { marginBottom: 12 },
    chipBlockTitle: { color: colors.textSecondary, fontSize: 12 * fs, marginBottom: 6 },
    chipsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip:           { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
    chipText:       { fontSize: 12 * fs, fontWeight: '600' },
    chipEmpty:      { color: colors.textMuted, fontSize: 12 * fs, fontStyle: 'italic' },

    empty:     { alignItems: 'center', paddingVertical: 24, gap: 10 },
    emptyText: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center', lineHeight: 20 },

    overlay:  { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalBox: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                padding: 24, borderWidth: 1, borderColor: colors.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle:  { color: colors.text, fontSize: 18 * fs, fontWeight: '700' },
    inputLabel:  { color: colors.textSecondary, fontSize: 13 * fs, marginBottom: 4, marginTop: 10 },
    input:       { backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
                   color: colors.text, padding: 14, fontSize: 15 * fs },
  });
}
