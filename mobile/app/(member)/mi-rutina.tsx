/**
 * Mi Rutina — el miembro crea, edita y guarda sus propias rutinas.
 * Consume /api/user/routines (GET lista, POST crear, PUT editar, DELETE borrar)
 * y /api/user/routines/<id> (GET detalle). Espeja el creador del portal web.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import type { Palette } from '../../constants/themes';
import { useFetch } from '../../hooks/useFetch';
import { ENDPOINTS } from '../../constants/Api';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import RoutineDetailModal, { type RoutineForModal } from '../../components/routines/RoutineDetailModal';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * Grupos musculares. No llevan color propio: son una serie categórica, así que
 * toman su color de `colors.chartSeries` por POSICIÓN. Al cambiar de paleta,
 * los siete grupos se repintan solos y mantienen su orden.
 */
const GRUPOS: { id: string; label: string }[] = [
  { id: 'pecho',    label: 'Pecho'    },
  { id: 'espalda',  label: 'Espalda'  },
  { id: 'piernas',  label: 'Piernas'  },
  { id: 'hombros',  label: 'Hombros'  },
  { id: 'brazos',   label: 'Brazos'   },
  { id: 'core',     label: 'Core'     },
  { id: 'cardio',   label: 'Cardio'   },
  { id: 'descanso', label: 'Descanso' },
];

/** Color de un grupo dentro de la paleta activa. 'descanso' va siempre en gris. */
const grupoColor = (id: string, colors: Palette) => {
  if (id === 'descanso') return colors.textMuted;
  const i = GRUPOS.findIndex((g) => g.id === id);
  return colors.chartSeries[(i < 0 ? 0 : i) % colors.chartSeries.length];
};

type Ej    = { nombre: string; series: string; reps: string; peso: string; unidad: string };
type Dia   = { dia: string; grupo: string; ejercicios: Ej[] };
type Rutina = { id?: string; nombre: string; dias: Dia[] };

const nuevoEj = (): Ej => ({ nombre: '', series: '4', reps: '12', peso: '', unidad: 'kg' });
const nuevoDia = (): Dia => ({ dia: 'Lunes', grupo: 'pecho', ejercicios: [nuevoEj()] });
const rutinaVacia = (): Rutina => ({ nombre: '', dias: [nuevoDia()] });

export default function MiRutinaScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data, loading, refetch } = useFetch<any>(ENDPOINTS.USER_ROUTINES);
  const lista: any[] =
    data?.routines ?? data?.rutinas ?? (Array.isArray(data) ? data : []);

  const [editing, setEditing] = useState<Rutina | null>(null);
  const [saving, setSaving]   = useState(false);

  // ── Ver una rutina a detalle (solo lectura) ────────────────────────────────
  // Se reutiliza RoutineDetailModal, el mismo que ve el miembro cuando su
  // entrenador le asigna una rutina, así ambas se leen igual.
  const [detalle, setDetalle] = useState<RoutineForModal | null>(null);

  const verDetalle = useCallback(async (id: string) => {
    try {
      const res = await api.get(`${ENDPOINTS.USER_ROUTINES}/${id}`);
      const r = res.data ?? {};
      setDetalle({
        id,
        nombre: r.nombre ?? 'Mi rutina',
        categoria: r.categoria,
        dias: (r.dias ?? []).map((d: any, i: number) => ({
          id:    String(d.id ?? i),
          dia:   d.dia ?? '',
          grupo: d.grupo ?? '',
          ejercicios: (d.ejercicios ?? []).map((e: any) => ({
            nombre:   e.nombre ?? '',
            series:   e.series,
            reps:     e.reps,
            peso:     e.peso,
            unidad:   e.unidad,
            grupo:    e.grupo ?? d.grupo,
            notas:    e.notas,
            imagenes: e.imagenes,
            video:    e.video,
          })),
        })),
      });
    } catch {
      Alert.alert('Error', 'No se pudo cargar el detalle de la rutina.');
    }
  }, []);

  // ── Cargar una rutina para editar ──────────────────────────────────────────
  const cargarRutina = useCallback(async (id: string) => {
    try {
      const res = await api.get(`${ENDPOINTS.USER_ROUTINES}/${id}`);
      const r = res.data ?? {};
      setEditing({
        id,
        nombre: r.nombre ?? '',
        dias: (r.dias ?? []).map((d: any) => ({
          dia: d.dia || 'Lunes',
          grupo: d.grupo || 'pecho',
          ejercicios: (d.ejercicios ?? []).map((e: any) => ({
            nombre: e.nombre ?? '',
            series: String(e.series ?? '4'),
            reps:   String(e.reps ?? '12'),
            peso:   String(e.peso ?? ''),
            unidad: e.unidad || 'kg',
          })),
        })),
      });
    } catch {
      Alert.alert('Error', 'No se pudo cargar la rutina.');
    }
  }, []);

  // ── Guardar (POST nuevo / PUT editar) ───────────────────────────────────────
  const guardar = useCallback(async () => {
    if (!editing) return;
    if (!editing.nombre.trim()) {
      Alert.alert('Falta el nombre', 'Ponle un nombre a tu rutina.');
      return;
    }
    if (editing.dias.length === 0) {
      Alert.alert('Sin días', 'Agrega al menos un día.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: editing.nombre.trim(),
        dias: editing.dias.map((d) => ({
          dia: d.dia,
          grupo: d.grupo,
          ejercicios: d.ejercicios
            .filter((e) => e.nombre.trim())
            .map((e) => ({
              nombre: e.nombre.trim(),
              series: e.series,
              reps:   e.reps,
              peso:   e.peso,
              unidad: e.unidad,
              grupo:  d.grupo,
            })),
        })),
      };
      if (editing.id) {
        await api.put(`${ENDPOINTS.USER_ROUTINES}/${editing.id}`, payload);
      } else {
        await api.post(ENDPOINTS.USER_ROUTINES, payload);
      }
      setEditing(null);
      refetch();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la rutina. Revisa tu conexión.');
    } finally {
      setSaving(false);
    }
  }, [editing, refetch]);

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const eliminar = useCallback((id: string, nombre: string) => {
    Alert.alert('Eliminar rutina', `¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`${ENDPOINTS.USER_ROUTINES}/${id}`);
            refetch();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar la rutina.');
          }
        },
      },
    ]);
  }, [refetch]);

  // ── Mutadores del editor ────────────────────────────────────────────────────
  const setNombre = (v: string) => setEditing((r) => (r ? { ...r, nombre: v } : r));
  const setDiaField = (di: number, k: 'dia' | 'grupo', v: string) =>
    setEditing((r) => (r ? { ...r, dias: r.dias.map((d, i) => (i === di ? { ...d, [k]: v } : d)) } : r));
  const addDia = () => setEditing((r) => (r ? { ...r, dias: [...r.dias, nuevoDia()] } : r));
  const removeDia = (di: number) =>
    setEditing((r) => (r ? { ...r, dias: r.dias.filter((_, i) => i !== di) } : r));
  const addEj = (di: number) =>
    setEditing((r) => (r ? { ...r, dias: r.dias.map((d, i) => (i === di ? { ...d, ejercicios: [...d.ejercicios, nuevoEj()] } : d)) } : r));
  const removeEj = (di: number, ei: number) =>
    setEditing((r) => (r ? { ...r, dias: r.dias.map((d, i) => (i === di ? { ...d, ejercicios: d.ejercicios.filter((_, j) => j !== ei) } : d)) } : r));
  const setEjField = (di: number, ei: number, k: keyof Ej, v: string) =>
    setEditing((r) => (r ? { ...r, dias: r.dias.map((d, i) => (i === di ? { ...d, ejercicios: d.ejercicios.map((e, j) => (j === ei ? { ...e, [k]: v } : e)) } : d)) } : r));

  if (loading && !editing) return <LoadingSpinner fullScreen message="Cargando tus rutinas…" />;

  // ────────────────────────────── VISTA EDITOR ──────────────────────────────
  if (editing) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{editing.id ? 'Editar rutina' : 'Nueva rutina'}</Text>
          <Text style={styles.subtitle}>Arma tu semana: días, grupo muscular y ejercicios.</Text>
        </View>

        <Card>
          <Text style={styles.label}>Nombre de la rutina</Text>
          <TextInput
            style={styles.input}
            value={editing.nombre}
            onChangeText={setNombre}
            placeholder="Ej. Push / Pull / Legs"
            placeholderTextColor={colors.textMuted}
          />
        </Card>

        {editing.dias.map((d, di) => (
          <Card key={di} style={{ gap: 10 }}>
            <View style={styles.diaHeader}>
              <Text style={styles.diaTitle}>Día {di + 1}</Text>
              {editing.dias.length > 1 && (
                <TouchableOpacity onPress={() => removeDia(di)} accessibilityLabel="Quitar día">
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>

            {/* Selector de día */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {DIAS.map((dn) => (
                <TouchableOpacity
                  key={dn}
                  style={[styles.chip, d.dia === dn && styles.chipActive]}
                  onPress={() => setDiaField(di, 'dia', dn)}
                >
                  <Text style={[styles.chipText, d.dia === dn && styles.chipTextActive]}>{dn.slice(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Selector de grupo */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {GRUPOS.map((g) => {
                const active = d.grupo === g.id;
                const gColor = grupoColor(g.id, colors);
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.chip, active && { backgroundColor: gColor, borderColor: gColor }]}
                    onPress={() => setDiaField(di, 'grupo', g.id)}
                  >
                    <View style={[styles.dot, { backgroundColor: active ? colors.background : gColor }]} />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Ejercicios del día */}
            {d.grupo === 'descanso' ? (
              <Text style={styles.restText}>Día de descanso — sin ejercicios.</Text>
            ) : (
              <>
                {d.ejercicios.map((e, ei) => (
                  <View key={ei} style={[styles.ejBox, { borderLeftColor: grupoColor(d.grupo, colors) }]}>
                    <View style={styles.ejTop}>
                      <TextInput
                        style={[styles.input, styles.ejName]}
                        value={e.nombre}
                        onChangeText={(v) => setEjField(di, ei, 'nombre', v)}
                        placeholder="Nombre del ejercicio"
                        placeholderTextColor={colors.textMuted}
                      />
                      <TouchableOpacity onPress={() => removeEj(di, ei)} accessibilityLabel="Quitar ejercicio">
                        <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.ejRow}>
                      <View style={styles.ejField}>
                        <Text style={styles.ejLabel}>Series</Text>
                        <TextInput style={styles.inputSm} value={e.series} keyboardType="numeric"
                          onChangeText={(v) => setEjField(di, ei, 'series', v)} />
                      </View>
                      <View style={styles.ejField}>
                        <Text style={styles.ejLabel}>Reps</Text>
                        <TextInput style={styles.inputSm} value={e.reps}
                          onChangeText={(v) => setEjField(di, ei, 'reps', v)} />
                      </View>
                      <View style={styles.ejField}>
                        <Text style={styles.ejLabel}>Peso</Text>
                        <TextInput style={styles.inputSm} value={e.peso} keyboardType="numeric"
                          onChangeText={(v) => setEjField(di, ei, 'peso', v)} placeholder="—"
                          placeholderTextColor={colors.textMuted} />
                      </View>
                      <View style={styles.unitToggle}>
                        {['kg', 'lb'].map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[styles.unitBtn, e.unidad === u && styles.unitBtnActive]}
                            onPress={() => setEjField(di, ei, 'unidad', u)}
                          >
                            <Text style={[styles.unitText, e.unidad === u && styles.unitTextActive]}>{u}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.addRow} onPress={() => addEj(di)}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                  <Text style={styles.addText}>Agregar ejercicio</Text>
                </TouchableOpacity>
              </>
            )}
          </Card>
        ))}

        <TouchableOpacity style={styles.addDia} onPress={addDia}>
          <Ionicons name="add" size={18} color={colors.accent} />
          <Text style={styles.addText}>Agregar día</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <Button label="Cancelar" variant="secondary" onPress={() => setEditing(null)} style={{ flex: 1 }} />
          <Button label={editing.id ? 'Guardar cambios' : 'Crear rutina'} onPress={guardar}
            loading={saving} style={{ flex: 1 }}
            icon={<Ionicons name="checkmark-circle-outline" size={18} color={colors.onAccent} />} />
        </View>
      </ScrollView>
    );
  }

  // ────────────────────────────── VISTA LISTA ──────────────────────────────
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Mi Rutina</Text>
        <Text style={styles.subtitle}>Crea y guarda tus propias rutinas de entrenamiento.</Text>
      </View>

      <Button
        label="Crear rutina nueva"
        onPress={() => setEditing(rutinaVacia())}
        icon={<Ionicons name="add-circle-outline" size={18} color={colors.onAccent} />}
      />

      {lista.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="barbell-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyText}>Aún no tienes rutinas propias.{'\n'}Crea la primera con el botón de arriba.</Text>
        </Card>
      ) : (
        lista.map((r: any) => (
          <Card key={r.id} style={styles.routineCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.routineName}>{r.nombre || 'Sin nombre'}</Text>
              <Text style={styles.routineMeta}>
                {(r.dias?.length ?? 0)} {(r.dias?.length ?? 0) === 1 ? 'día' : 'días'}
                {r.categoria ? ` · ${r.categoria}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => verDetalle(String(r.id))}
                              accessibilityLabel={`Ver ${r.nombre || 'la rutina'} a detalle`}>
              <Ionicons name="eye-outline" size={20} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => cargarRutina(String(r.id))} accessibilityLabel="Editar">
              <Ionicons name="create-outline" size={20} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => eliminar(String(r.id), r.nombre)} accessibilityLabel="Eliminar">
              <Ionicons name="trash-outline" size={20} color={colors.dataRiesgo} />
            </TouchableOpacity>
          </Card>
        ))
      )}

      {/* Detalle en solo lectura, ejercicio por ejercicio */}
      <RoutineDetailModal
        visible={!!detalle}
        routine={detalle}
        mode="member"
        onClose={() => setDetalle(null)}
      />
    </ScrollView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 14, paddingBottom: 40 },
    header:  { gap: 4 },
    title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
    subtitle:{ color: colors.textSecondary, fontSize: 13 * fs },
    label:   { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600', marginBottom: 6 },
    input: {
      backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
      color: colors.text, fontSize: 14 * fs,
    },
    // Editor — día
    diaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    diaTitle:  { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 8,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    chipActive:     { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText:       { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600' },
    // El chip activo se llena con el color del grupo (serie), no con el acento:
    // el texto usa el fondo de pantalla para contrastar en cualquier paleta.
    chipTextActive: { color: colors.background },
    dot: { width: 8, height: 8, borderRadius: 4 },
    restText: { color: colors.textMuted, fontSize: 13 * fs, fontStyle: 'italic', paddingVertical: 6 },
    // Ejercicio
    ejBox: {
      backgroundColor: colors.surface, borderRadius: 10, padding: 10, gap: 8,
      borderLeftWidth: 3,
    },
    ejTop:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ejName: { flex: 1 },
    ejRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    ejField:{ flex: 1, gap: 4 },
    ejLabel:{ color: colors.textMuted, fontSize: 10 * fs, fontWeight: '600' },
    inputSm: {
      backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8,
      color: colors.text, fontSize: 13 * fs, textAlign: 'center',
    },
    unitToggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    unitBtn:       { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.inputBg },
    unitBtnActive: { backgroundColor: colors.accent },
    unitText:      { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '700' },
    unitTextActive:{ color: colors.onAccent },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
    addText:{ color: colors.accent, fontSize: 13 * fs, fontWeight: '600' },
    addDia: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
      borderColor: colors.accent, backgroundColor: colors.accent + '10',
    },
    actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    // Lista
    emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 28 },
    emptyText: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center', lineHeight: 20 },
    routineCard: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    routineName: { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },
    routineMeta: { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
    iconBtn: {
      width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
  });
}
