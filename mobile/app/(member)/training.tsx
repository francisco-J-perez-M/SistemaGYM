/**
 * Entrenamiento — Miembro
 * Tab "Mi Rutina":  GET /api/user/training/assigned-routines
 *   → { rutinas: [{ id, nombre, descripcion, categoria, dificultad,
 *                   duracion_minutos, nombre_entrenador, notas_entrenador,
 *                   dias: [{ id, dia, grupo, ejercicios: [{nombre, series, reps, peso, notas}] }] }] }
 *
 * Tab "Entrenador": GET /api/user/training/trainers
 *   + Chat GET|POST /api/user/training/chat/<trainer_id>
 */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, SectionList, TouchableOpacity,
  RefreshControl, TextInput, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray, toDateStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import RoutineDetailModal, { type RoutineForModal } from '../../components/routines/RoutineDetailModal';
import ExerciseDetailSheet, { type ExerciseDetail, cacheVideo, cacheImages } from '../../components/routines/ExerciseDetailSheet';
import api from '../../services/api';
import * as Haptics from 'expo-haptics';

type Tab = 'rutina' | 'entrenador';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Ejercicio {
  nombre:          string;
  series?:         string | number;
  reps?:           string | number;
  peso?:           string | number;
  notas?:          string;
  instrucciones?:  string;
  imagenes?:       string[];
  video?:          string;
}
interface DiaRutina {
  id:         string;
  dia:        string;
  grupo:      string;
  ejercicios: Ejercicio[];
}
interface RutinaAsignada {
  id:                string;
  nombre:            string;
  descripcion?:      string;
  categoria?:        string;
  dificultad?:       string;
  duracion_minutos?: number;
  nombre_entrenador?: string;
  notas_entrenador?:  string;
  dias:              DiaRutina[];
}
interface Trainer {
  id?:           number;
  _id?:          string;
  nombre?:       string;
  name?:         string;
  especialidad?: string;
  email?:        string;
  foto?:         string | null;   // base64 data URI
}
interface PTSolicitud {
  id?:                string;
  id_entrenador_pg:   number;
  nombre_entrenador?: string;
  estado:             string;   // pendiente | aceptada | rechazada
}
interface ChatMsg {
  _id?:       string;
  remitente?: string;
  rol?:       string;
  mensaje?:   string;
  texto?:     string;
  fecha?:     string;
  created_at?: string;
}

function trainerName(t: Trainer): string {
  return toStr(t.nombre ?? t.name, 'Entrenador');
}

// ── Calificación + terminar entrenamiento personal ─────────────────────────────
function TrainerActions({ colors, onTerminar }: { colors: any; onTerminar: () => void }) {
  const [rating, setRating] = useState(0);
  const [saved, setSaved]   = useState(false);
  useEffect(() => {
    api.get(ENDPOINTS.USER_TRAINER_RATING)
      .then(({ data }) => { if (data?.rating != null) { setRating(data.rating); setSaved(true); } })
      .catch(() => {});
  }, []);
  const submit = async (v: number) => {
    setRating(v);
    try { await api.post(ENDPOINTS.USER_TRAINER_RATING, { calificacion: v }); setSaved(true); }
    catch (e: any) { Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar la calificación.'); }
  };
  const terminar = () => {
    Alert.alert('Terminar entrenamiento', '¿Terminar con este entrenador? Después podrás solicitar a otro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Terminar', style: 'destructive', onPress: async () => {
        try { await api.delete(ENDPOINTS.USER_PT_ACTIVO); onTerminar(); }
        catch (e: any) { Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo terminar.'); }
      } },
    ]);
  };
  return (
    <Card>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6 }}>
        {saved ? 'Tu calificación' : 'Califica a tu entrenador'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <TouchableOpacity key={i} onPress={() => submit(i)} hitSlop={6}>
            <Ionicons name={i <= rating ? 'star' : 'star-outline'} size={26}
                      color={i <= rating ? colors.promo : colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={terminar} style={{ alignSelf: 'flex-start' }}>
        <Text style={{ color: colors.dataRiesgo, fontSize: 13, fontWeight: '600' }}>Terminar entrenamiento personal</Text>
      </TouchableOpacity>
    </Card>
  );
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function TrainingScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const mbS = useMemo(() => make_mbS(colors, fs), [colors, fs]);
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets   = useSafeAreaInsets();
  const [tab, setTab]                         = useState<Tab>('rutina');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [expandedRutina, setExpandedRutina]   = useState<string | null>(null);
  const [selectedRutina, setSelectedRutina]   = useState<RoutineForModal | null>(null);
  const [selectedEj, setSelectedEj] = useState<ExerciseDetail | null>(null);
  const [msg, setMsg]     = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const { data: rutinaData, loading: loadingR, refetch: refetchR } =
    useFetch<{ rutinas: RutinaAsignada[] }>(ENDPOINTS.USER_ASSIGNED_ROUTINES);

  const { data: trainersData, loading: loadingT, refetch: refetchT } =
    useFetch<Trainer[] | { trainers: Trainer[] }>(ENDPOINTS.USER_TRAINERS_LIST);

  // Solicitudes PT: el miembro solo puede chatear con su entrenador ASIGNADO
  // (solicitud en estado "aceptada"). Restringimos la lista a esos entrenadores.
  const { data: ptData, loading: loadingPT, refetch: refetchPT } =
    useFetch<{ solicitudes: PTSolicitud[] }>(ENDPOINTS.USER_PT_REQUEST);

  const rutinas     = toArray(rutinaData?.rutinas);
  const allTrainers = toArray(Array.isArray(trainersData) ? trainersData : (trainersData as any)?.trainers ?? []);
  const assignedIds = new Set(
    toArray(ptData?.solicitudes)
      .filter((s) => s.estado === 'aceptada')
      .map((s) => s.id_entrenador_pg),
  );
  // Entrenadores asignados (con info completa del catálogo). Si el catálogo aún
  // no cargó pero sí hay solicitud aceptada, caemos a los datos de la solicitud.
  const trainers: Trainer[] = allTrainers.filter((t) => assignedIds.has((t.id ?? t._id) as number));
  if (trainers.length === 0 && assignedIds.size > 0) {
    toArray(ptData?.solicitudes)
      .filter((s) => s.estado === 'aceptada')
      .forEach((s) => trainers.push({ id: s.id_entrenador_pg, nombre: s.nombre_entrenador }));
  }
  const active   = selectedTrainer ?? (trainers[0] ?? null);
  const trainerId = active?.id ?? active?._id;
  const chatUrl   = trainerId ? `${ENDPOINTS.USER_CHAT_BASE}/${trainerId}` : '';

  const { data: chatData, loading: loadingC, refetch: refetchC } =
    useFetch<ChatMsg[] | { mensajes: ChatMsg[] }>(chatUrl);

  const mensajes = toArray(Array.isArray(chatData) ? chatData : (chatData as any)?.mensajes ?? []);

  const handleSend = async () => {
    const texto = msg.trim();
    if (!texto || !trainerId) return;
    setSending(true);
    try {
      await api.post(`${ENDPOINTS.USER_CHAT_BASE}/${trainerId}`, { texto });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMsg('');
      refetchC();
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  };

  if ((tab === 'rutina' ? loadingR : loadingT) && rutinas.length === 0 && trainers.length === 0) {
    return <LoadingSpinner fullScreen message="Cargando entrenamiento…" />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top + 16 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 60}
    >
      {/* Tabs */}
      <View style={styles.tabRow}>
        {([['rutina', 'Mi Rutina', 'barbell-outline'], ['entrenador', 'Entrenador', 'person-outline']] as const).map(([t, label, icon]) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
          >
            <Ionicons name={icon} size={16} color={tab === t ? colors.accent : colors.textSecondary} />
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── MI RUTINA ────────────────────────────────────────── */}
      {tab === 'rutina' && (
        <FlatList
          data={rutinas}
          keyExtractor={(r, i) => r.id ?? String(i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loadingR} onRefresh={refetchR} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="barbell-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyText}>No tienes rutinas asignadas.</Text>
              <Text style={styles.emptyHint}>Tu entrenador las configurará pronto.</Text>
            </View>
          }
          renderItem={({ item: r }) => {
            const isOpen = expandedRutina === r.id;
            return (
              <Card style={styles.rutinaCard}>
                {/* Header */}
                <TouchableOpacity
                  style={styles.rutinaHeader}
                  onPress={() => setExpandedRutina(isOpen ? null : r.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                >
                  <View style={styles.rutinaIconBox}>
                    <Ionicons name="barbell-outline" size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rutinaNombre}>{r.nombre}</Text>
                    <Text style={styles.rutinaMeta}>
                      {[r.categoria, r.dificultad, r.duracion_minutos && `${r.duracion_minutos} min`]
                        .filter(Boolean).join(' · ')}
                    </Text>
                    {r.nombre_entrenador ? (
                      <Text style={styles.rutinaTrainer}>Por {r.nombre_entrenador}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={mbS.verBtn}
                    onPress={() => setSelectedRutina(r as RoutineForModal)}
                    accessibilityLabel={`Ver detalle de ${r.nombre}`}
                    accessibilityRole="button"
                  >
                    <Ionicons name="eye-outline" size={13} color={colors.onAccent} />
                    <Text style={mbS.verBtnText}>Ver</Text>
                  </TouchableOpacity>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18} color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {r.descripcion ? (
                  <Text style={styles.rutinaDesc}>{r.descripcion}</Text>
                ) : null}

                {r.notas_entrenador ? (
                  <View style={styles.notasBox}>
                    <Ionicons name="chatbubble-outline" size={12} color={colors.accent} />
                    <Text style={styles.notasText}>{r.notas_entrenador}</Text>
                  </View>
                ) : null}

                {/* Días y ejercicios (expandible) */}
                {isOpen && toArray(r.dias).map((dia) => (
                  <View key={dia.id} style={styles.diaSection}>
                    <View style={styles.diaHeader}>
                      <Text style={styles.diaNombre}>{toStr(dia.dia)}</Text>
                      {dia.grupo ? (
                        <Text style={styles.diaGrupo}>{dia.grupo}</Text>
                      ) : null}
                    </View>
                    {toArray(dia.ejercicios).map((ej, i) => (
                      <View key={i} style={styles.ejRow}>
                        <View style={styles.ejNum}>
                          <Text style={styles.ejNumText}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ejNombre}>{toStr(ej.nombre)}</Text>
                          <Text style={styles.ejDetalle}>
                            {[
                              ej.series && `${ej.series} series`,
                              ej.reps   && `${ej.reps} reps`,
                              ej.peso   && `${ej.peso} kg`,
                            ].filter(Boolean).join(' · ')}
                          </Text>
                          {ej.notas ? <Text style={styles.ejNotas}>{ej.notas}</Text> : null}
                        </View>
                        <TouchableOpacity
                          style={mbS.verBtn}
                          onPress={() => {
                            const vk  = ej.video    ? `ej_${r.id}_${dia.id}_${i}` : undefined;
                            const ik  = ej.imagenes ? `im_${r.id}_${dia.id}_${i}` : undefined;
                            if (vk && ej.video)    cacheVideo(vk, ej.video);
                            if (ik && ej.imagenes) cacheImages(ik, ej.imagenes);
                            setSelectedEj({
                              nombre: toStr(ej.nombre),
                              setsStr: [ej.series && `${ej.series} series`, ej.reps && `${ej.reps} reps`].filter(Boolean).join(' × '),
                              peso: ej.peso ? String(ej.peso) : undefined,
                              notas: ej.notas,
                              instrucciones: ej.instrucciones,
                              imageKey: ik,
                              videoKey: vk,
                            });
                          }}
                          accessibilityLabel={`Ver detalle de ${ej.nombre}`}
                          accessibilityRole="button">
                          <Ionicons name="eye-outline" size={13} color={colors.onAccent} />
                          <Text style={mbS.verBtnText}>Ver</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ))}
              </Card>
            );
          }}
        />
      )}

      {/* ── ENTRENADOR + CHAT ─────────────────────────────────── */}
      {tab === 'entrenador' && (
        <View style={{ flex: 1 }}>
          {/* Selector si hay varios */}
          {trainers.length > 1 && (
            <FlatList
              horizontal data={trainers}
              keyExtractor={(t, i) => String(t.id ?? t._id ?? i)}
              showsHorizontalScrollIndicator={false}
              style={styles.trainerSelector}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 8, alignItems: 'center' }}
              renderItem={({ item: t }) => {
                const isActive = (t.id ?? t._id) === (active?.id ?? active?._id);
                return (
                  <TouchableOpacity
                    style={[styles.trainerChip, isActive && styles.trainerChipActive]}
                    onPress={() => setSelectedTrainer(t)}
                  >
                    <Text style={[styles.trainerChipText, isActive && { color: colors.onAccent }]}>
                      {trainerName(t)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Card entrenador */}
          {trainers.length === 0 ? (
            <Card style={styles.trainerCard}>
              <View style={styles.empty}>
                <Ionicons name="person-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>Aún no tienes un entrenador asignado.</Text>
                <Text style={styles.emptyHint}>
                  Envía una solicitud de entrenamiento personal desde tu entrenador.
                  Cuando la acepte, podrás chatear aquí.
                </Text>
              </View>
            </Card>
          ) : active ? (
            <Card style={styles.trainerCard}>
              <View style={styles.trainerRow}>
                {active.foto && active.foto.startsWith('data:image') ? (
                  <Image source={{ uri: active.foto }} style={styles.trainerAvatarImg} resizeMode="cover" />
                ) : (
                  <View style={styles.trainerAvatar}>
                    <Text style={styles.trainerInitials}>
                      {trainerName(active).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.trainerName}>{trainerName(active)}</Text>
                  {active.especialidad ? <Text style={styles.trainerSpec}>{active.especialidad}</Text> : null}
                  {active.email ? <Text style={styles.trainerEmail}>{active.email}</Text> : null}
                </View>
                <Badge label="PT" color="accent" />
              </View>
            </Card>
          ) : null}

          {active ? <TrainerActions colors={colors} onTerminar={() => { setSelectedTrainer(null); refetchPT?.(); }} /> : null}

          {/* Chat */}
          <View style={styles.chatContainer}>
            <Text style={styles.chatTitle}>
              {active ? `Chat con ${trainerName(active)}` : 'Chat'}
            </Text>
            <FlatList
              ref={flatRef}
              data={mensajes}
              keyExtractor={(m, i) => m._id ?? String(i)}
              contentContainerStyle={styles.chatList}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={loadingC} onRefresh={refetchC} tintColor={colors.accent} />}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.chatEmpty}>
                  <Ionicons name="chatbubbles-outline" size={36} color={colors.textMuted} />
                  <Text style={styles.chatEmptyText}>
                    {trainerId ? 'Inicia la conversación.' : 'Selecciona un entrenador.'}
                  </Text>
                </View>
              }
              renderItem={({ item: m }) => {
                const isMe  = (m.remitente ?? m.rol) === 'miembro';
                const texto = toStr(m.mensaje ?? m.texto);
                const hora  = toStr(m.fecha ?? m.created_at);
                return (
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{texto}</Text>
                    {hora ? (
                      <Text style={[styles.bubbleTime, isMe && { color: colors.onAccent, opacity: 0.7 }]}>
                        {toDateStr(hora, 16).slice(11, 16)}
                      </Text>
                    ) : null}
                  </View>
                );
              }}
            />
            <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
              <TextInput
                style={styles.textInput}
                placeholder={trainerId ? 'Escribe un mensaje…' : 'Selecciona un entrenador'}
                placeholderTextColor={colors.textMuted}
                value={msg} onChangeText={setMsg}
                multiline maxLength={500}
                editable={!!trainerId}
                accessibilityLabel="Mensaje al entrenador"
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!msg.trim() || sending || !trainerId) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!msg.trim() || sending || !trainerId}
              >
                <Ionicons name="send" size={18} color={colors.onAccent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <ExerciseDetailSheet
        visible={!!selectedEj}
        exercise={selectedEj}
        onClose={() => setSelectedEj(null)}
      />
      <RoutineDetailModal
        visible={!!selectedRutina}
        routine={selectedRutina}
        onClose={() => setSelectedRutina(null)}
        mode="member"
      />
    </KeyboardAvoidingView>
  );
}

function make_mbS(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  verBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accent, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  verBtnText: { color: colors.onAccent, fontSize: 11 * fs, fontWeight: '700' },
});
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  tabRow:  { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border },
  tabBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10 },
  tabBtnActive:  { backgroundColor: colors.accentBg },
  tabLabel:      { color: colors.textSecondary, fontSize: 14 * fs, fontWeight: '600' },
  tabLabelActive:{ color: colors.accent },
  list:    { paddingHorizontal: 20, gap: 14, paddingBottom: 32 },
  empty:   { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: 15 * fs, fontWeight: '600', textAlign: 'center' },
  emptyHint: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center' },
  rutinaCard:   { gap: 10 },
  rutinaHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rutinaIconBox:{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center' },
  rutinaNombre: { color: colors.text, fontSize: 16 * fs, fontWeight: '700' },
  rutinaMeta:   { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
  rutinaTrainer:{ color: colors.accent, fontSize: 11 * fs, marginTop: 1 },
  rutinaDesc:   { color: colors.textSecondary, fontSize: 13 * fs, lineHeight: 18 },
  notasBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: colors.accentBg, borderRadius: 8, padding: 8 },
  notasText:    { color: colors.textSecondary, fontSize: 12 * fs, flex: 1 },
  diaSection:   { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 8 },
  diaHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  diaNombre:    { color: colors.accent, fontSize: 13 * fs, fontWeight: '700' },
  diaGrupo:     { color: colors.textSecondary, fontSize: 12 * fs },
  ejRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ejNum:        { width: 22, height: 22, borderRadius: 8, backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center' },
  ejNumText:    { color: colors.accent, fontSize: 11 * fs, fontWeight: '700' },
  ejNombre:     { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
  ejDetalle:    { color: colors.accent, fontSize: 12 * fs },
  ejNotas:      { color: colors.textSecondary, fontSize: 12 * fs, fontStyle: 'italic' },
  trainerSelector: { flexGrow: 0, maxHeight: 48 },
  trainerChip:  { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  trainerChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  trainerChipText:   { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
  trainerCard:  { marginHorizontal: 20, marginBottom: 12 },
  trainerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trainerAvatar:{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  trainerAvatarImg:{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.surface },
  trainerInitials: { color: colors.onAccent, fontSize: 22 * fs, fontWeight: '800' },
  trainerName:  { color: colors.text, fontSize: 16 * fs, fontWeight: '700' },
  trainerSpec:  { color: colors.accent, fontSize: 12 * fs },
  trainerEmail: { color: colors.textSecondary, fontSize: 12 * fs },
  chatContainer:{ flex: 1, marginHorizontal: 20 },
  chatTitle:    { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '700', marginBottom: 8 },
  chatList:     { paddingVertical: 8, gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  chatEmpty:    { alignItems: 'center', gap: 8, paddingVertical: 24 },
  chatEmptyText:{ color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center' },
  bubble:       { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 2 },
  bubbleMe:     { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleThem:   { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText:   { color: colors.text, fontSize: 14 * fs, lineHeight: 20 },
  bubbleTextMe: { color: colors.onAccent },
  bubbleTime:   { color: colors.textMuted, fontSize: 10 * fs, alignSelf: 'flex-end' },
  inputBar:     { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  textInput:    { flex: 1, maxHeight: 100, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: colors.text, fontSize: 14 * fs, borderWidth: 1, borderColor: colors.border },
  sendBtn:      { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
}
