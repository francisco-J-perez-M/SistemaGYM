/**
 * Pantalla Salud (miembro) — rediseño por secciones.
 *
 * Contrato real:
 *   GET  /api/user/health           → indicadores + medidas + datos médicos
 *   POST /api/user/health           → registra medidas (peso, cintura, …, notas)
 *   PUT  /api/user/health/medical    → actualiza info médica (condiciones, alergias, …)
 *
 * Todas las métricas y la información médica son editables desde la app.
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

// ¿Es un indicador clave (IMC / Peso / Estatura) o una medida corporal?
function esIndicadorClave(nombre: string): boolean {
  const n = nombre.toLowerCase();
  return n.includes('imc') || n.includes('peso') || n === 'estatura';
}

// Campos de medidas que admite POST /api/user/health (label → clave backend)
const MEASURE_FIELDS: { key: string; label: string; ph: string }[] = [
  { key: 'peso',                  label: 'Peso (kg) *',            ph: '72.5' },
  { key: 'cintura',               label: 'Cintura (cm)',           ph: '80' },
  { key: 'cadera',                label: 'Cadera (cm)',            ph: '95' },
  { key: 'pecho',                 label: 'Pecho (cm)',             ph: '100' },
  { key: 'brazo_izquierdo',       label: 'Brazo izquierdo (cm)',   ph: '35' },
  { key: 'brazo_derecho',         label: 'Brazo derecho (cm)',     ph: '35' },
  { key: 'muslo_izquierdo',       label: 'Muslo izquierdo (cm)',   ph: '55' },
  { key: 'muslo_derecho',         label: 'Muslo derecho (cm)',     ph: '55' },
  { key: 'pantorrilla_izquierda', label: 'Pantorrilla izq. (cm)',  ph: '38' },
  { key: 'pantorrilla_derecha',   label: 'Pantorrilla der. (cm)',  ph: '38' },
];

type MedicalKey = 'condiciones' | 'alergias' | 'medicamentos' | 'lesiones';
const MEDICAL_GROUPS: { key: MedicalKey; title: string; color: BadgeColor }[] = [
  { key: 'condiciones',  title: 'Condiciones médicas', color: 'warning' },
  { key: 'alergias',     title: 'Alergias',            color: 'error' },
  { key: 'medicamentos', title: 'Medicamentos',        color: 'info' },
  { key: 'lesiones',     title: 'Lesiones previas',    color: 'warning' },
];

type Medical = Record<MedicalKey, string[]>;

export default function HealthScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data, loading, refetch } = useFetch<HealthResponse>(ENDPOINTS.USER_HEALTH);

  // ── Modal medidas ──────────────────────────────────────────────────────────
  const [measureModal, setMeasureModal] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [notas, setNotas] = useState('');
  const [savingMeasure, setSavingMeasure] = useState(false);
  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── Modal médico ───────────────────────────────────────────────────────────
  const [medModal, setMedModal] = useState(false);
  const [medical, setMedical] = useState<Medical>({ condiciones: [], alergias: [], medicamentos: [], lesiones: [] });
  const [savingMed, setSavingMed] = useState(false);

  const saveMeasures = async () => {
    if (!form.peso) { Alert.alert('Falta peso', 'Ingresa al menos tu peso actual.'); return; }
    setSavingMeasure(true);
    try {
      const payload: Record<string, number | string> = {};
      MEASURE_FIELDS.forEach(({ key }) => {
        const v = form[key];
        if (v && !isNaN(parseFloat(v))) payload[key] = parseFloat(v);
      });
      if (notas.trim()) payload.notas = notas.trim();
      await api.post(ENDPOINTS.USER_HEALTH, payload);
      setMeasureModal(false);
      setForm({}); setNotas('');
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar');
    } finally {
      setSavingMeasure(false);
    }
  };

  const openMedical = () => {
    setMedical({
      condiciones:  toArray<string>(data?.condicionesMedicas),
      alergias:     toArray<string>(data?.alergias),
      medicamentos: toArray<string>(data?.medicamentos),
      lesiones:     toArray<string>(data?.lesiones),
    });
    setMedModal(true);
  };

  const saveMedical = async () => {
    setSavingMed(true);
    try {
      await api.put(ENDPOINTS.USER_HEALTH_MEDICAL, {
        condicionesMedicas: medical.condiciones,
        alergias:           medical.alergias,
        medicamentos:       medical.medicamentos,
        lesiones:           medical.lesiones,
      });
      setMedModal(false);
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar');
    } finally {
      setSavingMed(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando salud…" />;

  const condiciones = toArray<HealthCondition>(data?.condiciones);
  const claves   = condiciones.filter(c => esIndicadorClave(c.nombre));
  const medidas  = condiciones.filter(c => !esIndicadorClave(c.nombre));

  const medicas      = toArray<string>(data?.condicionesMedicas);
  const alergias     = toArray<string>(data?.alergias);
  const medicamentos = toArray<string>(data?.medicamentos);
  const lesiones     = toArray<string>(data?.lesiones);
  const hayMedicos = medicas.length + alergias.length + medicamentos.length + lesiones.length > 0;

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
      {/* Header */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">Salud</Text>
          <Text style={styles.subtitle}>
            {data?.ultimaActualizacion ? `Actualizado: ${data.ultimaActualizacion}` : 'Sin registros aún'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setMeasureModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Registrar medidas"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Indicadores clave */}
      {claves.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Indicadores clave</Text>
          <View style={styles.keyRow}>
            {claves.map((c, i) => {
              const col = estadoColor(c.estado);
              return (
                <View key={i} style={[styles.keyCard, { borderColor: colors[col] }]}>
                  <Ionicons name={condIcon(c.estado)} size={18} color={colors[col]} />
                  <Text style={styles.keyValue}>{c.valor}</Text>
                  <Text style={styles.keyLabel} numberOfLines={2}>{c.nombre.replace(/\s*\(.*\)/, '')}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Medidas corporales */}
      <Card>
        <View style={styles.cardHead}>
          <Text style={styles.sectionTitle}>Medidas corporales</Text>
          <TouchableOpacity style={styles.editLink} onPress={() => setMeasureModal(true)}
            accessibilityRole="button" accessibilityLabel="Actualizar medidas">
            <Ionicons name="create-outline" size={15} color={colors.accent} />
            <Text style={styles.editLinkText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
        {medidas.length === 0 ? (
          <Text style={styles.chipEmpty}>Aún no registras medidas. Toca “Actualizar” para añadirlas.</Text>
        ) : (
          <View style={styles.grid}>
            {medidas.map((c, i) => (
              <View key={i} style={styles.measCard}>
                <Text style={styles.measValue}>{c.valor}</Text>
                <Text style={styles.measLabel} numberOfLines={2}>{c.nombre}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Perfil de entrenamiento */}
      {(data?.objetivo || data?.nivelActividad || data?.nivelExperiencia || data?.horasSueno) && (
        <Card>
          <Text style={styles.sectionTitle}>Perfil de entrenamiento</Text>
          {!!data?.objetivo && <Row label="Objetivo" value={String(data.objetivo)} styles={styles} />}
          {!!data?.nivelActividad && <Row label="Nivel de actividad" value={String(data.nivelActividad)} styles={styles} />}
          {!!data?.nivelExperiencia && <Row label="Experiencia" value={String(data.nivelExperiencia)} styles={styles} />}
          {!!data?.horasSueno && <Row label="Horas de sueño" value={String(data.horasSueno)} styles={styles} />}
        </Card>
      )}

      {/* Información médica (editable) */}
      <Card>
        <View style={styles.cardHead}>
          <Text style={styles.sectionTitle}>Información médica</Text>
          <TouchableOpacity style={styles.editLink} onPress={openMedical}
            accessibilityRole="button" accessibilityLabel="Editar información médica">
            <Ionicons name="create-outline" size={15} color={colors.accent} />
            <Text style={styles.editLinkText}>Editar</Text>
          </TouchableOpacity>
        </View>
        {chipGroup('Condiciones médicas', medicas, 'warning')}
        {chipGroup('Alergias', alergias, 'error')}
        {chipGroup('Medicamentos', medicamentos, 'info')}
        {chipGroup('Lesiones previas', lesiones, 'warning')}
        {!hayMedicos && (
          <Text style={styles.chipEmpty}>Sin información médica registrada. Toca “Editar” para añadirla.</Text>
        )}
      </Card>

      {/* ── Modal: registrar medidas ──────────────────────────────────────── */}
      <Modal visible={measureModal} transparent animationType="slide" onRequestClose={() => setMeasureModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Actualizar medidas</Text>
              <TouchableOpacity onPress={() => setMeasureModal(false)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGrid}>
                {MEASURE_FIELDS.map(({ key, label, ph }) => (
                  <View key={key} style={styles.formCol}>
                    <Text style={styles.inputLabel}>{label}</Text>
                    <TextInput
                      style={styles.input}
                      value={form[key] ?? ''}
                      onChangeText={(v) => setField(key, v)}
                      keyboardType="decimal-pad"
                      placeholder={ph}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                ))}
              </View>
              <Text style={styles.inputLabel}>Notas</Text>
              <TextInput
                style={[styles.input, { height: 64 }]}
                value={notas}
                onChangeText={setNotas}
                multiline
                placeholder="Cómo te sientes…"
                placeholderTextColor={colors.textMuted}
              />
            </ScrollView>
            <Button label="Guardar medidas" onPress={saveMeasures} loading={savingMeasure}
              disabled={!form.peso} style={{ marginTop: 14 }} />
          </View>
        </View>
      </Modal>

      {/* ── Modal: editar información médica ───────────────────────────────── */}
      <Modal visible={medModal} transparent animationType="slide" onRequestClose={() => setMedModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Información médica</Text>
              <TouchableOpacity onPress={() => setMedModal(false)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {MEDICAL_GROUPS.map(({ key, title, color }) => (
                <ChipEditor
                  key={key}
                  title={title}
                  color={color}
                  items={medical[key]}
                  onChange={(items) => setMedical(m => ({ ...m, [key]: items }))}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </ScrollView>
            <Button label="Guardar" onPress={saveMedical} loading={savingMed} style={{ marginTop: 14 }} />
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

/** Editor de etiquetas: input + botón añadir, chips removibles con la X. */
function ChipEditor({
  title, items, onChange, color, styles, colors,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  color: BadgeColor;
  styles: ReturnType<typeof make_styles>;
  colors: ReturnType<typeof useColors>;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (!items.includes(v)) onChange([...items, v]);
    setDraft('');
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <View style={styles.chipEditBlock}>
      <Text style={styles.chipBlockTitle}>{title}</Text>
      {items.length > 0 && (
        <View style={[styles.chipsRow, { marginBottom: 8 }]}>
          {items.map((it, i) => (
            <View key={i} style={[styles.chip, styles.chipEditable, { backgroundColor: colors[`${color}Bg` as keyof typeof colors] as string }]}>
              <Text style={[styles.chipText, { color: colors[color] }]}>{it}</Text>
              <TouchableOpacity onPress={() => remove(i)} accessibilityLabel={`Quitar ${it}`} hitSlop={8}>
                <Ionicons name="close-circle" size={15} color={colors[color]} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.chipInputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          returnKeyType="done"
          placeholder="Añadir…"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity style={styles.chipAddBtn} onPress={add} accessibilityLabel={`Añadir a ${title}`}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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

    section:      { gap: 10 },
    sectionLabel: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600',
                    textTransform: 'uppercase', letterSpacing: 0.5 },

    keyRow:   { flexDirection: 'row', gap: 10 },
    keyCard:  { flex: 1, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1.5,
                padding: 14, gap: 4, alignItems: 'flex-start' },
    keyValue: { color: colors.text, fontSize: 19 * fs, fontWeight: '800', marginTop: 4 },
    keyLabel: { color: colors.textSecondary, fontSize: 11 * fs },

    cardHead:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },
    editLink:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
    editLinkText: { color: colors.accent, fontSize: 13 * fs, fontWeight: '600' },

    grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    measCard: { width: '47%', backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 2 },
    measValue:{ color: colors.text, fontSize: 17 * fs, fontWeight: '700' },
    measLabel:{ color: colors.textSecondary, fontSize: 11 * fs },

    row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { color: colors.textSecondary, fontSize: 13 * fs },
    rowValue: { color: colors.text, fontSize: 14 * fs, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

    chipBlock:      { marginBottom: 12 },
    chipEditBlock:  { marginBottom: 16 },
    chipBlockTitle: { color: colors.textSecondary, fontSize: 12 * fs, marginBottom: 6, fontWeight: '600' },
    chipsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
    chipEditable:   { paddingRight: 6 },
    chipText:       { fontSize: 12 * fs, fontWeight: '600' },
    chipEmpty:      { color: colors.textMuted, fontSize: 12 * fs, fontStyle: 'italic' },
    chipInputRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    chipAddBtn:     { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent,
                      alignItems: 'center', justifyContent: 'center' },

    overlay:  { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalBox: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                padding: 24, borderWidth: 1, borderColor: colors.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle:  { color: colors.text, fontSize: 18 * fs, fontWeight: '700' },

    formGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    formCol:  { width: '48%' },
    inputLabel:  { color: colors.textSecondary, fontSize: 13 * fs, marginBottom: 4, marginTop: 10 },
    input:       { backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
                   color: colors.text, padding: 12, fontSize: 15 * fs },
  });
}
