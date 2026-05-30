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
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, SectionList, TouchableOpacity,
  RefreshControl, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray, toDateStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

type Tab = 'rutina' | 'entrenador';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Ejercicio {
  nombre: string;
  series?: string | number;
  reps?:   string | number;
  peso?:   string | number;
  notas?:  string;
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

// ── Componente ────────────────────────────────────────────────────────────────
export default function TrainingScreen() {
  const insets   = useSafeAreaInsets();
  const [tab, setTab]                         = useState<Tab>('rutina');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [expandedRutina, setExpandedRutina]   = useState<string | null>(null);
  const [msg, setMsg]     = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const { data: rutinaData, loading: loadingR, refetch: refetchR } =
    useFetch<{ rutinas: RutinaAsignada[] }>(ENDPOINTS.USER_ASSIGNED_ROUTINES);

  const { data: trainersData, loading: loadingT, refetch: refetchT } =
    useFetch<Trainer[] | { trainers: Trainer[] }>(ENDPOINTS.USER_TRAINERS_LIST);

  const rutinas  = toArray(rutinaData?.rutinas);
  const trainers = toArray(Array.isArray(trainersData) ? trainersData : (trainersData as any)?.trainers ?? []);
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
            <Ionicons name={icon} size={16} color={tab === t ? Colors.accent : Colors.textSecondary} />
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
          refreshControl={<RefreshControl refreshing={loadingR} onRefresh={refetchR} tintColor={Colors.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="barbell-outline" size={44} color={Colors.textMuted} />
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
                    <Ionicons name="barbell-outline" size={20} color={Colors.accent} />
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
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18} color={Colors.textSecondary}
                  />
                </TouchableOpacity>

                {r.descripcion ? (
                  <Text style={styles.rutinaDesc}>{r.descripcion}</Text>
                ) : null}

                {r.notas_entrenador ? (
                  <View style={styles.notasBox}>
                    <Ionicons name="chatbubble-outline" size={12} color={Colors.accent} />
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
              contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 8 }}
              renderItem={({ item: t }) => {
                const isActive = (t.id ?? t._id) === (active?.id ?? active?._id);
                return (
                  <TouchableOpacity
                    style={[styles.trainerChip, isActive && styles.trainerChipActive]}
                    onPress={() => setSelectedTrainer(t)}
                  >
                    <Text style={[styles.trainerChipText, isActive && { color: '#fff' }]}>
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
                <Ionicons name="person-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Sin entrenadores disponibles.</Text>
              </View>
            </Card>
          ) : active ? (
            <Card style={styles.trainerCard}>
              <View style={styles.trainerRow}>
                <View style={styles.trainerAvatar}>
                  <Text style={styles.trainerInitials}>
                    {trainerName(active).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trainerName}>{trainerName(active)}</Text>
                  {active.especialidad ? <Text style={styles.trainerSpec}>{active.especialidad}</Text> : null}
                  {active.email ? <Text style={styles.trainerEmail}>{active.email}</Text> : null}
                </View>
                <Badge label="PT" color="accent" />
              </View>
            </Card>
          ) : null}

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
              refreshControl={<RefreshControl refreshing={loadingC} onRefresh={refetchC} tintColor={Colors.accent} />}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.chatEmpty}>
                  <Ionicons name="chatbubbles-outline" size={36} color={Colors.textMuted} />
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
                      <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.6)' }]}>
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
                placeholderTextColor={Colors.textMuted}
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
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.background },
  tabRow:  { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border },
  tabBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10 },
  tabBtnActive:  { backgroundColor: 'rgba(108,99,255,0.15)' },
  tabLabel:      { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  tabLabelActive:{ color: Colors.accent },
  list:    { paddingHorizontal: 20, gap: 14, paddingBottom: 32 },
  empty:   { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptyHint: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
  rutinaCard:   { gap: 10 },
  rutinaHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rutinaIconBox:{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(108,99,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  rutinaNombre: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  rutinaMeta:   { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  rutinaTrainer:{ color: Colors.accent, fontSize: 11, marginTop: 1 },
  rutinaDesc:   { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  notasBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: 'rgba(108,99,255,0.08)', borderRadius: 8, padding: 8 },
  notasText:    { color: Colors.textSecondary, fontSize: 12, flex: 1 },
  diaSection:   { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, gap: 8 },
  diaHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  diaNombre:    { color: Colors.accent, fontSize: 13, fontWeight: '700' },
  diaGrupo:     { color: Colors.textSecondary, fontSize: 12 },
  ejRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ejNum:        { width: 22, height: 22, borderRadius: 8, backgroundColor: 'rgba(108,99,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  ejNumText:    { color: Colors.accent, fontSize: 11, fontWeight: '700' },
  ejNombre:     { color: Colors.text, fontSize: 14, fontWeight: '600' },
  ejDetalle:    { color: Colors.accent, fontSize: 12 },
  ejNotas:      { color: Colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
  trainerChip:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  trainerChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  trainerChipText:   { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  trainerCard:  { marginHorizontal: 20, marginBottom: 12 },
  trainerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trainerAvatar:{ width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  trainerInitials: { color: '#fff', fontSize: 22, fontWeight: '800' },
  trainerName:  { color: Colors.text, fontSize: 16, fontWeight: '700' },
  trainerSpec:  { color: Colors.accent, fontSize: 12 },
  trainerEmail: { color: Colors.textSecondary, fontSize: 12 },
  chatContainer:{ flex: 1, marginHorizontal: 20 },
  chatTitle:    { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  chatList:     { paddingVertical: 8, gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  chatEmpty:    { alignItems: 'center', gap: 8, paddingVertical: 24 },
  chatEmptyText:{ color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
  bubble:       { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 2 },
  bubbleMe:     { alignSelf: 'flex-end', backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  bubbleThem:   { alignSelf: 'flex-start', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText:   { color: Colors.text, fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime:   { color: Colors.textMuted, fontSize: 10, alignSelf: 'flex-end' },
  inputBar:     { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  textInput:    { flex: 1, maxHeight: 100, backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  sendBtn:      { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
