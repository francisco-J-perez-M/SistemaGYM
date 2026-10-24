/**
 * Pantalla Dietas (entrenador) — misma lógica que la web:
 *   1) Biblioteca de RECETAS (crear/eliminar).
 *   2) PLANES construidos a partir de esas recetas (comidas = recetas seleccionadas).
 *
 * Contratos reales (api/app/routes/entrenador/diet_routes.py):
 *   GET/POST/DELETE /api/trainer/recipes
 *   GET/POST/DELETE /api/trainer/diets            (semanas → dias → comidas → items)
 *   POST            /api/trainer/diets/<id>/assign  { id_miembro_pg }
 *   GET             /api/trainer/members?my_clients=1
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity,
  Modal, TextInput, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray, toStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import type {
  DietsResponse, DietPlan, RecipesResponse, Recipe, ComidaPlan,
  TrainerMembersResponse, TrainerMember,
} from '../../types';

type Tab = 'planes' | 'recetas';

const OBJETIVOS = ['mantenimiento', 'perder_peso', 'ganar_masa', 'definicion', 'rendimiento'];
const OBJ_LABEL: Record<string, string> = {
  mantenimiento: 'Mantenimiento', perder_peso: 'Perder peso', ganar_masa: 'Ganar masa',
  definicion: 'Definición', rendimiento: 'Rendimiento',
};

const num = (v: string) => (v ? parseInt(v, 10) : null);

export default function TrainerDietsScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('planes');

  const { data: dietData, loading: loadingD, refetch: refetchD } = useFetch<DietsResponse>(ENDPOINTS.TRAINER_DIETS);
  const { data: recData,  loading: loadingR, refetch: refetchR } = useFetch<RecipesResponse>(ENDPOINTS.TRAINER_RECIPES);
  const { data: memData } = useFetch<TrainerMembersResponse>(`${ENDPOINTS.TRAINER_MEMBERS}?my_clients=1`);

  const diets   = toArray<DietPlan>(dietData?.diets);
  const recipes = toArray<Recipe>(recData?.recipes);
  const members = toArray<TrainerMember>(memData?.members);

  // ── Ver a detalle ─────────────────────────────────────────────
  // Una hoja de solo lectura para revisar el contenido sin entrar a editar.
  const [verReceta, setVerReceta] = useState<Recipe | null>(null);
  const [verPlan,   setVerPlan]   = useState<DietPlan | null>(null);

  // ── Crear y editar receta ─────────────────────────────────────
  const [showRecipe, setShowRecipe] = useState(false);
  const emptyRecipe = { nombre: '', calorias: '', proteinas: '', carbohidratos: '', grasas: '', descripcion: '' };
  const [rForm, setRForm] = useState(emptyRecipe);
  const [savingR, setSavingR] = useState(false);
  /** Receta que se está editando; null = alta. */
  const [editandoR, setEditandoR] = useState<Recipe | null>(null);

  const abrirAltaReceta = () => {
    setEditandoR(null);
    setRForm(emptyRecipe);
    setShowRecipe(true);
  };

  const abrirEdicionReceta = (r: Recipe) => {
    setEditandoR(r);
    setRForm({
      nombre:        toStr(r.nombre),
      calorias:      r.calorias != null ? String(r.calorias) : '',
      proteinas:     r.proteinas_g != null ? String(r.proteinas_g) : '',
      carbohidratos: r.carbohidratos_g != null ? String(r.carbohidratos_g) : '',
      grasas:        r.grasas_g != null ? String(r.grasas_g) : '',
      descripcion:   toStr(r.descripcion),
    });
    setShowRecipe(true);
  };

  const createRecipe = async () => {
    if (!rForm.nombre.trim()) { Alert.alert('Falta nombre', 'La receta necesita un nombre.'); return; }
    setSavingR(true);
    try {
      const payload = {
        nombre:          rForm.nombre.trim(),
        descripcion:     rForm.descripcion,
        calorias:        num(rForm.calorias),
        proteinas_g:     num(rForm.proteinas),
        carbohidratos_g: num(rForm.carbohidratos),
        grasas_g:        num(rForm.grasas),
      };
      if (editandoR) {
        await api.put(`${ENDPOINTS.TRAINER_RECIPES}/${editandoR.id}`, payload);
      } else {
        await api.post(ENDPOINTS.TRAINER_RECIPES, payload);
      }
      setShowRecipe(false); setEditandoR(null); setRForm(emptyRecipe); refetchR();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar la receta');
    } finally { setSavingR(false); }
  };

  const deleteRecipe = (r: Recipe) =>
    Alert.alert('Eliminar receta', `¿Eliminar "${r.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await api.delete(`${ENDPOINTS.TRAINER_RECIPES}/${r.id}`); refetchR(); }
        catch (e: any) { Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo eliminar'); }
      } },
    ]);

  // ── Crear plan (a partir de recetas) ──────────────────────────
  const [showPlan, setShowPlan] = useState(false);
  const [pForm, setPForm] = useState({ nombre: '', objetivo: 'mantenimiento' });
  const [comidas, setComidas] = useState<ComidaPlan[]>([]);
  const [savingP, setSavingP] = useState(false);
  const [pickerFor, setPickerFor] = useState<number | null>(null);   // índice de comida

  const resetPlan = () => { setPForm({ nombre: '', objetivo: 'mantenimiento' }); setComidas([]); };

  const addComida = () => setComidas((c) => [...c, { nombre: `Comida ${c.length + 1}`, recetas: [] }]);
  const removeComida = (i: number) => setComidas((c) => c.filter((_, idx) => idx !== i));
  const setComidaNombre = (i: number, nombre: string) =>
    setComidas((c) => c.map((cm, idx) => (idx === i ? { ...cm, nombre } : cm)));
  const toggleRecipeInComida = (i: number, r: Recipe) =>
    setComidas((c) => c.map((cm, idx) => {
      if (idx !== i) return cm;
      const has = cm.recetas.some((x) => x.id === r.id);
      return { ...cm, recetas: has ? cm.recetas.filter((x) => x.id !== r.id) : [...cm.recetas, r] };
    }));

  const totalKcal = comidas.reduce(
    (s, c) => s + c.recetas.reduce((ss, r) => ss + (r.calorias ?? 0), 0), 0);

  /** Plan que se está editando; null = alta. */
  const [editandoP, setEditandoP] = useState<DietPlan | null>(null);

  const abrirAltaPlan = () => {
    setEditandoP(null);
    resetPlan();
    setShowPlan(true);
  };

  /**
   * Carga un plan en el formulario. Los planes se guardan en estructura v2
   * (semanas → días → comidas → items); esta pantalla trabaja con un único día
   * genérico, así que se aplanan sus comidas y cada item se vuelve a enlazar
   * con la receta de la biblioteca por id.
   */
  const abrirEdicionPlan = (d: DietPlan) => {
    setEditandoP(d);
    setPForm({ nombre: toStr(d.nombre), objetivo: toStr(d.objetivo, 'mantenimiento') });

    const dias = toArray<any>(toArray<any>((d as any).semanas)[0]?.dias);
    const comidasPlan = toArray<any>(dias[0]?.comidas).map((c: any) => ({
      nombre: toStr(c.nombre, 'Comida'),
      recetas: toArray<any>(c.items)
        .map((it: any) => recipes.find((r) => r.id === it.id_receta))
        .filter(Boolean) as Recipe[],
    }));

    setComidas(comidasPlan);
    setShowPlan(true);
  };

  const createPlan = async () => {
    if (!pForm.nombre.trim()) { Alert.alert('Falta nombre', 'El plan necesita un nombre.'); return; }
    const comidasValidas = comidas.filter((c) => c.recetas.length > 0);
    if (comidasValidas.length === 0) { Alert.alert('Sin recetas', 'Agrega al menos una comida con recetas.'); return; }
    setSavingP(true);
    try {
      // Estructura v2: una semana, un día genérico ("todos"), comidas = recetas.
      const semanas = [{
        numero: 1, notas: '',
        dias: [{
          dia: 'todos',
          comidas: comidasValidas.map((c) => ({
            nombre: c.nombre, hora: '',
            items: c.recetas.map((r) => ({
              id_receta:       r.id,
              nombre_alimento: r.nombre,
              cantidad:        '1', unidad: 'porción',
              calorias:        r.calorias,
              proteinas_g:     r.proteinas_g,
              carbohidratos_g: r.carbohidratos_g,
              grasas_g:        r.grasas_g,
            })),
          })),
        }],
      }];
      const payload = {
        nombre: pForm.nombre.trim(), objetivo: pForm.objetivo,
        calorias_meta: totalKcal || null, duracion_semanas: 1, semanas,
      };
      if (editandoP) {
        await api.put(`${ENDPOINTS.TRAINER_DIETS}/${editandoP.id}`, payload);
      } else {
        await api.post(ENDPOINTS.TRAINER_DIETS, payload);
      }
      setShowPlan(false); setEditandoP(null); resetPlan(); refetchD();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar el plan');
    } finally { setSavingP(false); }
  };

  const deletePlan = (d: DietPlan) =>
    Alert.alert('Eliminar plan', `¿Eliminar "${d.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await api.delete(`${ENDPOINTS.TRAINER_DIETS}/${d.id}`); refetchD(); }
        catch (e: any) { Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo eliminar'); }
      } },
    ]);

  // ── Asignar plan ──────────────────────────────────────────────
  const [assignFor, setAssignFor] = useState<DietPlan | null>(null);
  const [assigning, setAssigning] = useState(false);
  const assignTo = async (m: TrainerMember) => {
    if (!assignFor) return;
    setAssigning(true);
    try {
      await api.post(`${ENDPOINTS.TRAINER_DIETS}/${assignFor.id}/assign`, { id_miembro_pg: m.id_miembro_pg });
      Alert.alert('Asignado', `"${assignFor.nombre}" asignado a ${m.nombre}.`);
      setAssignFor(null); refetchD();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo asignar');
    } finally { setAssigning(false); }
  };
  const memberName = (pgId?: number | null) => members.find((m) => m.id_miembro_pg === pgId)?.nombre;

  if (loadingD && loadingR) return <LoadingSpinner fullScreen message="Cargando…" />;

  return (
    <View style={styles.screen}>
      {/* Tabs */}
      <View style={[styles.tabRow, { marginTop: insets.top + 12 }]}>
        {([['planes', 'Planes', 'list-outline'], ['recetas', 'Recetas', 'restaurant-outline']] as const).map(([t, label, icon]) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
            <Ionicons name={icon} size={16} color={tab === t ? colors.accent : colors.textSecondary} />
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── PLANES ──────────────────────────────────────────── */}
      {tab === 'planes' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loadingD} onRefresh={refetchD} tintColor={colors.accent} />}>
          <View style={styles.topRow}>
            <Text style={styles.subtitle}>{diets.length} {diets.length === 1 ? 'plan' : 'planes'}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={abrirAltaPlan}>
              <Ionicons name="add" size={18} color={colors.onAccent} />
              <Text style={styles.addBtnText}>Nuevo plan</Text>
            </TouchableOpacity>
          </View>

          {diets.length === 0 ? (
            <Card><View style={styles.empty}>
              <Ionicons name="nutrition-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Crea recetas y arma tu primer plan.</Text>
            </View></Card>
          ) : diets.map((d) => {
            const asignado = memberName(d.id_miembro_pg);
            return (
              <Card key={d.id}>
                <View style={styles.dietHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dietName}>{d.nombre}</Text>
                    <View style={styles.metaRow}>
                      <Badge label={OBJ_LABEL[d.objetivo ?? 'mantenimiento'] ?? d.objetivo ?? '—'} color="purple" />
                      {!!d.calorias_meta && <Text style={styles.metaText}>{d.calorias_meta} kcal</Text>}
                    </View>
                  </View>
                  <View style={styles.accionesFila}>
                    <TouchableOpacity onPress={() => setVerPlan(d)} hitSlop={8}
                                      accessibilityLabel={`Ver ${d.nombre}`}>
                      <Ionicons name="eye-outline" size={20} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => abrirEdicionPlan(d)} hitSlop={8}
                                      accessibilityLabel={`Editar ${d.nombre}`}>
                      <Ionicons name="create-outline" size={20} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deletePlan(d)} hitSlop={8}
                                      accessibilityLabel={`Eliminar ${d.nombre}`}>
                      <Ionicons name="trash-outline" size={20} color={colors.dataRiesgo} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.assignRow}>
                  <Ionicons name={asignado ? 'person-circle' : 'person-add-outline'} size={16}
                    color={asignado ? colors.success : colors.textSecondary} />
                  <Text style={[styles.assignText, asignado && { color: colors.success }]} numberOfLines={1}>
                    {asignado ? `Asignado a ${asignado}` : 'Sin asignar'}
                  </Text>
                  <TouchableOpacity onPress={() => setAssignFor(d)} style={styles.assignBtn}>
                    <Text style={styles.assignBtnText}>{asignado ? 'Cambiar' : 'Asignar'}</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}

      {/* ── RECETAS ─────────────────────────────────────────── */}
      {tab === 'recetas' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loadingR} onRefresh={refetchR} tintColor={colors.accent} />}>
          <View style={styles.topRow}>
            <Text style={styles.subtitle}>{recipes.length} recetas</Text>
            <TouchableOpacity style={styles.addBtn} onPress={abrirAltaReceta}>
              <Ionicons name="add" size={18} color={colors.onAccent} />
              <Text style={styles.addBtnText}>Nueva receta</Text>
            </TouchableOpacity>
          </View>

          {recipes.length === 0 ? (
            <Card><View style={styles.empty}>
              <Ionicons name="restaurant-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aún no tienes recetas. Créalas para componer tus planes.</Text>
            </View></Card>
          ) : recipes.map((r) => (
            <Card key={r.id}>
              <View style={styles.dietHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dietName}>{r.nombre}</Text>
                  <View style={styles.macroRow}>
                    {r.calorias != null && <Text style={styles.macro}>{r.calorias} kcal</Text>}
                    {r.proteinas_g != null && <Text style={styles.macro}>P {r.proteinas_g}g</Text>}
                    {r.carbohidratos_g != null && <Text style={styles.macro}>C {r.carbohidratos_g}g</Text>}
                    {r.grasas_g != null && <Text style={styles.macro}>G {r.grasas_g}g</Text>}
                  </View>
                  {!!r.descripcion && <Text style={styles.recDesc} numberOfLines={2}>{r.descripcion}</Text>}
                </View>
                <View style={styles.accionesFila}>
                  <TouchableOpacity onPress={() => setVerReceta(r)} hitSlop={8}
                                    accessibilityLabel={`Ver ${r.nombre}`}>
                    <Ionicons name="eye-outline" size={20} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => abrirEdicionReceta(r)} hitSlop={8}
                                    accessibilityLabel={`Editar ${r.nombre}`}>
                    <Ionicons name="create-outline" size={20} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteRecipe(r)} hitSlop={8}
                                    accessibilityLabel={`Eliminar ${r.nombre}`}>
                    <Ionicons name="trash-outline" size={20} color={colors.dataRiesgo} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* ── Modal crear receta ──────────────────────────────── */}
      <Modal visible={showRecipe} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editandoR ? 'Editar receta' : 'Nueva receta'}</Text>
              <TouchableOpacity onPress={() => { setShowRecipe(false); setEditandoR(null); }}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Field label="Nombre *" value={rForm.nombre} onChange={(t) => setRForm({ ...rForm, nombre: t })} colors={colors} styles={styles} placeholder="Ej: Avena con plátano" />
              <View style={styles.row2}>
                <Field flex label="Calorías" value={rForm.calorias} onChange={(t) => setRForm({ ...rForm, calorias: t })} keyboard colors={colors} styles={styles} placeholder="350" />
                <Field flex label="Proteína (g)" value={rForm.proteinas} onChange={(t) => setRForm({ ...rForm, proteinas: t })} keyboard colors={colors} styles={styles} placeholder="20" />
              </View>
              <View style={styles.row2}>
                <Field flex label="Carbs (g)" value={rForm.carbohidratos} onChange={(t) => setRForm({ ...rForm, carbohidratos: t })} keyboard colors={colors} styles={styles} placeholder="45" />
                <Field flex label="Grasas (g)" value={rForm.grasas} onChange={(t) => setRForm({ ...rForm, grasas: t })} keyboard colors={colors} styles={styles} placeholder="8" />
              </View>
              <Field label="Descripción" value={rForm.descripcion} onChange={(t) => setRForm({ ...rForm, descripcion: t })} multiline colors={colors} styles={styles} placeholder="Preparación / notas…" />
              <Button label="Crear receta" onPress={createRecipe} loading={savingR} disabled={!rForm.nombre.trim()} style={{ marginTop: 12 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Modal crear plan (con recetas) ──────────────────── */}
      <Modal visible={showPlan} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editandoP ? 'Editar plan' : 'Nuevo plan'}</Text>
              <TouchableOpacity onPress={() => { setShowPlan(false); setEditandoP(null); }}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Field label="Nombre del plan *" value={pForm.nombre} onChange={(t) => setPForm({ ...pForm, nombre: t })} colors={colors} styles={styles} placeholder="Ej: Definición 1800 kcal" />

              <Text style={styles.fieldLabel}>Objetivo</Text>
              <View style={styles.chipsRow}>
                {OBJETIVOS.map((o) => {
                  const active = pForm.objetivo === o;
                  return (
                    <TouchableOpacity key={o} onPress={() => setPForm({ ...pForm, objetivo: o })}
                      style={[styles.objChip, active && styles.objChipActive]}>
                      <Text style={[styles.objChipText, active && { color: colors.onAccent }]}>{OBJ_LABEL[o]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Comidas */}
              <View style={styles.comidasHead}>
                <Text style={styles.fieldLabel}>Comidas ({totalKcal} kcal)</Text>
                <TouchableOpacity onPress={addComida} style={styles.addComidaBtn}>
                  <Ionicons name="add" size={15} color={colors.accent} />
                  <Text style={styles.addComidaText}>Agregar comida</Text>
                </TouchableOpacity>
              </View>

              {comidas.length === 0 ? (
                <Text style={styles.hintText}>Agrega comidas y elige recetas de tu biblioteca para cada una.</Text>
              ) : comidas.map((c, i) => (
                <View key={i} style={styles.comidaCard}>
                  <View style={styles.comidaTop}>
                    <TextInput style={styles.comidaName} value={c.nombre}
                      onChangeText={(t) => setComidaNombre(i, t)} placeholder="Nombre de la comida"
                      placeholderTextColor={colors.textMuted} />
                    <TouchableOpacity onPress={() => removeComida(i)} hitSlop={8}>
                      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  {c.recetas.length > 0 && (
                    <View style={styles.recChips}>
                      {c.recetas.map((r) => (
                        <View key={r.id} style={styles.recChip}>
                          <Text style={styles.recChipText}>{r.nombre}</Text>
                          <TouchableOpacity onPress={() => toggleRecipeInComida(i, r)} hitSlop={6}>
                            <Ionicons name="close" size={13} color={colors.accent} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                  <TouchableOpacity style={styles.pickRecipeBtn}
                    onPress={() => { if (recipes.length === 0) { Alert.alert('Sin recetas', 'Primero crea recetas en la pestaña Recetas.'); return; } setPickerFor(i); }}>
                    <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                    <Text style={styles.pickRecipeText}>Añadir recetas</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <Button label="Crear plan" onPress={createPlan} loading={savingP}
                disabled={!pForm.nombre.trim()} style={{ marginTop: 14 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Modal selector de recetas para una comida ───────── */}
      <Modal visible={pickerFor !== null} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { maxHeight: '75%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elegir recetas</Text>
              <TouchableOpacity onPress={() => setPickerFor(null)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <FlatList
              data={recipes}
              keyExtractor={(r) => r.id}
              renderItem={({ item: r }) => {
                const selected = pickerFor !== null && comidas[pickerFor]?.recetas.some((x) => x.id === r.id);
                return (
                  <TouchableOpacity style={styles.pickRow} onPress={() => pickerFor !== null && toggleRecipeInComida(pickerFor, r)}>
                    <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={22} color={selected ? colors.accent : colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickName}>{r.nombre}</Text>
                      <Text style={styles.pickMacro}>{r.calorias ?? '—'} kcal · P {r.proteinas_g ?? 0} · C {r.carbohidratos_g ?? 0} · G {r.grasas_g ?? 0}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <Button label="Listo" onPress={() => setPickerFor(null)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>

      {/* ── Modal asignar ───────────────────────────────────── */}
      <Modal visible={!!assignFor} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { maxHeight: '75%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Asignar: {assignFor?.nombre}</Text>
              <TouchableOpacity onPress={() => setAssignFor(null)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            {members.length === 0 ? (
              <Text style={styles.emptyText}>No tienes clientes asignados.</Text>
            ) : (
              <FlatList data={members} keyExtractor={(m) => m.id_miembro}
                renderItem={({ item: m }) => (
                  <TouchableOpacity style={styles.pickRow} onPress={() => assignTo(m)} disabled={assigning}>
                    <View style={styles.memberAvatar}><Text style={styles.memberInitial}>{m.nombre.charAt(0).toUpperCase()}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickName}>{m.nombre}</Text>
                      <Text style={styles.pickMacro} numberOfLines={1}>{m.email}</Text>
                    </View>
                  </TouchableOpacity>
                )} />
            )}
          </View>
        </View>
      </Modal>

      {/* ── Detalle de receta ────────────────────────────────── */}
      <Modal visible={!!verReceta} transparent animationType="slide"
             onRequestClose={() => setVerReceta(null)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{toStr(verReceta?.nombre)}</Text>
              <TouchableOpacity onPress={() => setVerReceta(null)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.macrosGrid}>
                {[
                  ['Calorías', verReceta?.calorias, 'kcal'],
                  ['Proteínas', verReceta?.proteinas_g, 'g'],
                  ['Carbohidratos', verReceta?.carbohidratos_g, 'g'],
                  ['Grasas', verReceta?.grasas_g, 'g'],
                ].map(([etiqueta, valor, unidad]) => (
                  <View key={String(etiqueta)} style={styles.macroBox}>
                    <Text style={styles.macroValor}>
                      {valor != null ? `${valor}` : '—'}
                      <Text style={styles.macroUnidad}> {valor != null ? unidad : ''}</Text>
                    </Text>
                    <Text style={styles.macroEtiqueta}>{etiqueta}</Text>
                  </View>
                ))}
              </View>
              {verReceta?.descripcion ? (
                <>
                  <Text style={styles.fieldLabel}>Preparación</Text>
                  <Text style={styles.detalleTexto}>{verReceta.descripcion}</Text>
                </>
              ) : (
                <Text style={styles.detalleVacio}>Sin descripción registrada.</Text>
              )}
              <TouchableOpacity
                style={styles.detalleEditar}
                onPress={() => { const r = verReceta!; setVerReceta(null); abrirEdicionReceta(r); }}
                accessibilityRole="button" accessibilityLabel="Editar esta receta"
              >
                <Ionicons name="create-outline" size={17} color={colors.onAccent} />
                <Text style={styles.detalleEditarText}>Editar receta</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Detalle de plan ──────────────────────────────────── */}
      <Modal visible={!!verPlan} transparent animationType="slide"
             onRequestClose={() => setVerPlan(null)}>
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{toStr(verPlan?.nombre)}</Text>
              <TouchableOpacity onPress={() => setVerPlan(null)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.metaRow}>
                <Badge label={OBJ_LABEL[verPlan?.objetivo ?? 'mantenimiento'] ?? '—'} color="purple" />
                {verPlan?.calorias_meta ? (
                  <Text style={styles.metaText}>{verPlan.calorias_meta} kcal por día</Text>
                ) : null}
              </View>

              {/* Comidas del plan, aplanadas desde la estructura por semanas */}
              {toArray<any>(toArray<any>(toArray<any>((verPlan as any)?.semanas)[0]?.dias)[0]?.comidas)
                .map((c: any, i: number) => (
                  <View key={i} style={styles.comidaDetalle}>
                    <Text style={styles.comidaTitulo}>{toStr(c.nombre, `Comida ${i + 1}`)}</Text>
                    {toArray<any>(c.items).map((it: any, j: number) => (
                      <View key={j} style={styles.itemDetalle}>
                        <Ionicons name="ellipse" size={6} color={colors.accent} />
                        <Text style={styles.itemNombre}>{toStr(it.nombre_alimento)}</Text>
                        {it.calorias != null ? (
                          <Text style={styles.itemKcal}>{it.calorias} kcal</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ))}

              <TouchableOpacity
                style={styles.detalleEditar}
                onPress={() => { const d = verPlan!; setVerPlan(null); abrirEdicionPlan(d); }}
                accessibilityRole="button" accessibilityLabel="Editar este plan"
              >
                <Ionicons name="create-outline" size={17} color={colors.onAccent} />
                <Text style={styles.detalleEditarText}>Editar plan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Campo de formulario reutilizable
function Field({ label, value, onChange, placeholder, keyboard, multiline, flex, colors, styles }: {
  label: string; value: string; onChange: (t: string) => void; placeholder?: string;
  keyboard?: boolean; multiline?: boolean; flex?: boolean;
  colors: ReturnType<typeof useColors>; styles: ReturnType<typeof make_styles>;
}) {
  return (
    <View style={flex ? { flex: 1 } : undefined}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={[styles.input, multiline && { height: 64 }]} value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor={colors.textMuted}
        keyboardType={keyboard ? 'number-pad' : 'default'} multiline={multiline} />
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },

    // ── Acciones de cada tarjeta ────────────────────────────────────────────
    accionesFila: { flexDirection: 'row', alignItems: 'center', gap: 14 },

    // ── Hojas de detalle ────────────────────────────────────────────────────
    macrosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    macroBox: {
      flex: 1, minWidth: '45%', backgroundColor: colors.surface,
      borderRadius: 12, padding: 12, gap: 2,
    },
    macroValor:    { color: colors.text, fontSize: 18 * fs, fontWeight: '800' },
    macroUnidad:   { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600' },
    macroEtiqueta: { color: colors.textMuted, fontSize: 11 * fs },
    detalleTexto:  { color: colors.text, fontSize: 13.5 * fs, lineHeight: 20 },
    detalleVacio:  { color: colors.textMuted, fontSize: 12.5 * fs, marginTop: 12 },
    comidaDetalle: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 12,
      marginTop: 10, gap: 6,
    },
    comidaTitulo: { color: colors.text, fontSize: 13.5 * fs, fontWeight: '700' },
    itemDetalle:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemNombre:   { color: colors.textSecondary, fontSize: 12.5 * fs, flex: 1 },
    itemKcal:     { color: colors.textMuted, fontSize: 11.5 * fs },
    detalleEditar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 13,
      marginTop: 20, marginBottom: 6,
    },
    detalleEditarText: { color: colors.onAccent, fontSize: 14 * fs, fontWeight: '700' },

    tabRow:  { flexDirection: 'row', marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.card,
               borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border },
    tabBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10 },
    tabBtnActive:  { backgroundColor: colors.accentBg },
    tabLabel:      { color: colors.textSecondary, fontSize: 14 * fs, fontWeight: '600' },
    tabLabelActive:{ color: colors.accent },
    content: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
    topRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    subtitle:{ color: colors.textSecondary, fontSize: 13 * fs },
    addBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accent,
               borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
    addBtnText: { color: colors.onAccent, fontSize: 13 * fs, fontWeight: '700' },

    empty:     { alignItems: 'center', paddingVertical: 24, gap: 10 },
    emptyText: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center', lineHeight: 20, paddingVertical: 8 },

    dietHead:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    dietName:  { color: colors.text, fontSize: 16 * fs, fontWeight: '700' },
    metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
    metaText:  { color: colors.textSecondary, fontSize: 12 * fs },
    macroRow:  { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' },
    macro:     { color: colors.accent, fontSize: 12 * fs, fontWeight: '600' },
    recDesc:   { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 6, lineHeight: 17 },
    assignRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
                 borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
    assignText:{ color: colors.textSecondary, fontSize: 13 * fs, flex: 1 },
    assignBtn: { backgroundColor: colors.accent + '1A', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
    assignBtnText: { color: colors.accent, fontSize: 12 * fs, fontWeight: '700' },

    overlay:  { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalBox: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                padding: 20, borderWidth: 1, borderColor: colors.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    modalTitle:  { color: colors.text, fontSize: 18 * fs, fontWeight: '700', flex: 1, marginRight: 8 },
    fieldLabel:  { color: colors.textSecondary, fontSize: 13 * fs, marginBottom: 4, marginTop: 12 },
    input:       { backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
                   color: colors.text, padding: 12, fontSize: 15 * fs },
    row2:        { flexDirection: 'row', gap: 12 },
    chipsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    objChip:     { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBg },
    objChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    objChipText: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600' },

    comidasHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    addComidaBtn:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
    addComidaText:{ color: colors.accent, fontSize: 13 * fs, fontWeight: '700' },
    hintText:    { color: colors.textMuted, fontSize: 12 * fs, fontStyle: 'italic', marginTop: 6 },
    comidaCard:  { backgroundColor: colors.inputBg, borderRadius: 14, padding: 12, marginTop: 10, gap: 8,
                   borderWidth: 1, borderColor: colors.border },
    comidaTop:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    comidaName:  { flex: 1, color: colors.text, fontSize: 14 * fs, fontWeight: '700' },
    recChips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    recChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent + '1A',
                   borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
    recChipText: { color: colors.accent, fontSize: 12 * fs, fontWeight: '600' },
    pickRecipeBtn:{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
    pickRecipeText:{ color: colors.accent, fontSize: 13 * fs, fontWeight: '600' },

    pickRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
                 borderBottomWidth: 1, borderBottomColor: colors.border },
    pickName:  { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
    pickMacro: { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
    memberAvatar:{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
    memberInitial:{ color: colors.onAccent, fontSize: 15 * fs, fontWeight: '700' },
  });
}
