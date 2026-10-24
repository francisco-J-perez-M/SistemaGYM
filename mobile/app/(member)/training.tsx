/**
 * Entrenamiento — Miembro
 * Tabs:
 *   Mi Rutina   → GET /api/user/training/assigned-routines
 *   Entrenador  → GET /api/user/training/trainers + chat GET|POST /api/user/training/chat/<trainer_id>
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
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
  nombre:         string;
  series?:        number;
  repeticiones?:  number;
  descanso?:      string;
  notas?:         string;
}
interface Rutina {
  _id:          string;
  nombre:       string;
  descripcion?: string;
  dias?:        number;
  activa?:      boolean;
  ejercicios?:  Ejercicio[];
}
interface Trainer {
  id?:           number;
  _id?:          string;
  nombre?:       string;
  name?:         string;   // alias que usa el backend en algunos endpoints
  especialidad?: string;
  email?:        string;
}
interface ChatMsg {
  _id?:      string;
  remitente?: string;   // 'miembro' | 'entrenador'
  rol?:       string;
  mensaje?:   string;
  texto?:     string;   // alias
  fecha?:     string;
  created_at?: string; // alias
}

// ── helpers ───────────────────────────────────────────────────────────────────
function getTrainerName(t: Trainer): string {
  return toStr(t.nombre ?? t.name, 'Entrenador');
}

// ── Subcomponente Ejercicio ───────────────────────────────────────────────────
function EjercicioRow({ ej }: { ej: Ejercicio }) {
  const detail = [
    ej.series       && `${ej.series} series`,
    ej.repeticiones && `${ej.repeticiones} reps`,
    ej.descanso     && `${ej.descanso} desc`,
  ].filter(Boolean).join(' · ');

  return (
    <View style={styles.ejRow}>
      <View style={styles.ejBullet} />
      <View style={{ flex: 1 }}>
        <Text style={styles.ejNombre}>{ej.nombre}</Text>
        {detail ? <Text style={styles.ejDetalle}>{detail}</Text> : null}
        {ej.notas ? <Text style={styles.ejNotas}>{ej.notas}</Text> : null}
      </View>
    </View>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function TrainingScreen() {
  const insets   = useSafeAreaInsets();
  const [tab, setTab]               = useState<Tab>('rutina');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [msg, setMsg]               = useState('');
  const [sending, setSending]       = useState(false);
  const flatRef = useRef<FlatList>(null);

  // Rutinas asignadas al miembro
  const { data: rutinaData, loading: loadingR, refetch: refetchR } =
    useFetch<Rutina[] | { rutinas: Rutina[] }>(ENDPOINTS.USER_ASSIGNED_ROUTINES);

  // Lista de entrenadores disponibles
  const { data: trainersData, loading: loadingT, refetch: refetchT } =
    useFetch<Trainer[] | { trainers: Trainer[] }>(ENDPOINTS.USER_TRAINERS_LIST);

  const rutinas  = toArray(
    Array.isArray(rutinaData) ? rutinaData : (rutinaData as any)?.rutinas ?? []
  );
  const trainers = toArray(
    Array.isArray(trainersData) ? trainersData : (trainersData as any)?.trainers ?? []
  );

  // Trainer activo para el chat — se selecciona manualmente o primero disponible
  const activeTrainer = selectedTrainer ?? (trainers[0] ?? null);
  const trainerId = activeTrainer?.id ?? activeTrainer?._id;
  const chatUrl   = trainerId ? `${ENDPOINTS.USER_CHAT_BASE}/${trainerId}` : null;

  const { data: chatData, loading: loadingC, refetch: refetchC } =
    useFetch<ChatMsg[] | { mensajes: ChatMsg[] }>(chatUrl ?? '');

  const mensajes = toArray(
    Array.isArray(chatData) ? chatData : (chatData as any)?.mensajes ?? []
  );

  const handleSend = async () => {
    const texto = msg.trim();
    if (!texto || !trainerId) return;
    setSending(true);
    try {
      await api.post(`${ENDPOINTS.USER_CHAT_BASE}/${trainerId}`, { mensaje: texto });
      setMsg('');
      refetchC();
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const isLoading = tab === 'rutina' ? loadingR : loadingT;
  if (isLoading && (tab === 'rutina' ? rutinas.length === 0 : trainers.length === 0)) {
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

      {/* ── MI RUTINA ────────────────────────────────────────────────────── */}
      {tab === 'rutina' && (
        <FlatList
          data={rutinas}
          keyExtractor={(r, i) => r._id ?? String(i)}
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
          renderItem={({ item: r }) => (
            <Card style={styles.rutinaCard}>
              <View style={styles.rutinaHeader}>
                <View style={styles.rutinaIconBox}>
                  <Ionicons name="barbell-outline" size={20} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rutinaNombre}>{r.nombre}</Text>
                  {r.dias ? <Text style={styles.rutinaDias}>{r.dias} días / semana</Text> : null}
                </View>
                <Badge label={r.activa ? 'Activa' : 'Inactiva'} color={r.activa ? 'success' : 'warning'} />
              </View>
              {r.descripcion ? <Text style={styles.rutinaDesc}>{r.descripcion}</Text> : null}
              {toArray(r.ejercicios).length > 0 && (
                <View style={styles.ejList}>
                  <Text style={styles.ejListTitle}>Ejercicios</Text>
                  {r.ejercicios!.map((ej, i) => <EjercicioRow key={i} ej={ej} />)}
                </View>
              )}
            </Card>
          )}
        />
      )}

      {/* ── ENTRENADOR + CHAT ─────────────────────────────────────────────── */}
      {tab === 'entrenador' && (
        <View style={{ flex: 1 }}>
          {trainers.length === 0 ? (
            <Card style={styles.trainerCard}>
              <View style={styles.empty}>
                <Ionicons name="person-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Sin entrenadores disponibles.</Text>
                <Text style={styles.emptyHint}>El gimnasio asignará un PT pronto.</Text>
              </View>
            </Card>
          ) : (
            <>
              {/* Selector de entrenador si hay más de uno */}
              {trainers.length > 1 && (
                <View style={styles.trainerSelector}>
                  <FlatList
                    data={trainers}
                    horizontal
                    keyExtractor={(t, i) => String(t.id ?? t._id ?? i)}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 8 }}
                    renderItem={({ item: t }) => {
                      const isActive = (t.id ?? t._id) === (activeTrainer?.id ?? activeTrainer?._id);
                      return (
                        <TouchableOpacity
                          style={[styles.trainerChip, isActive && styles.trainerChipActive]}
                          onPress={() => setSelectedTrainer(t)}
                        >
                          <Text style={[styles.trainerChipText, isActive && { color: '#fff' }]}>
                            {getTrainerName(t)}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              )}

              {/* Card del entrenador activo */}
              {activeTrainer && (
                <Card style={styles.trainerCard}>
                  <View style={styles.trainerRow}>
                    <View style={styles.trainerAvatar}>
                      <Text style={styles.trainerInitials}>
                        {getTrainerName(activeTrainer).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trainerName}>{getTrainerName(activeTrainer)}</Text>
                      {activeTrainer.especialidad && (
                        <Text style={styles.trainerSpec}>{activeTrainer.especialidad}</Text>
                      )}
                      {activeTrainer.email && (
                        <Text style={styles.trainerEmail}>{activeTrainer.email}</Text>
                      )}
                    </View>
                    <Badge label="PT" color="accent" />
                  </View>
                </Card>
              )}

              {/* Chat */}
              <View style={styles.chatContainer}>
                <Text style={styles.chatTitle}>Chat con {getTrainerName(activeTrainer ?? {})}</Text>

                {!trainerId ? (
                  <View style={styles.chatEmpty}>
                    <Ionicons name="chatbubbles-outline" size={36} color={Colors.textMuted} />
                    <Text style={styles.chatEmptyText}>Selecciona un entrenador para chatear.</Text>
                  </View>
                ) : (
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
                        <Text style={styles.chatEmptyText}>Inicia la conversación.</Text>
                      </View>
                    }
                    renderItem={({ item: m }) => {
                      const isMe = (m.remitente ?? m.rol) === 'miembro';
                      const texto = toStr(m.mensaje ?? m.texto);
                      const fecha = toStr(m.fecha ?? m.created_at);
                      return (
                        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{texto}</Text>
                          {fecha ? (
                            <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.6)' }]}>
                              {toDateStr(fecha, 16).slice(11, 16)}
                            </Text>
                          ) : null}
                        </View>
                      );
                    }}
                  />
                )}

                {/* Input */}
                <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={trainerId ? 'Escribe un mensaje…' : 'Selecciona un entrenador primero'}
                    placeholderTextColor={Colors.textMuted}
                    value={msg}
                    onChangeText={setMsg}
                    multiline
                    maxLength={500}
                    editable={!!trainerId}
                    accessibilityLabel="Mensaje al entrenador"
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, (!msg.trim() || sending || !trainerId) && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!msg.trim() || sending || !trainerId}
                    accessibilityLabel="Enviar mensaje"
                  >
                    <Ionicons name="send" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.background },
  tabRow:  {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: Colors.card, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabBtn:  {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 10,
  },
  tabBtnActive:  { backgroundColor: 'rgba(108,99,255,0.15)' },
  tabLabel:      { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  tabLabelActive:{ color: Colors.accent },

  /* Rutina */
  list:    { paddingHorizontal: 20, gap: 14, paddingBottom: 32 },
  empty:   { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptyHint: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
  rutinaCard:   { gap: 10 },
  rutinaHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rutinaIconBox:{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(108,99,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  rutinaNombre: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  rutinaDias:   { color: Colors.textSecondary, fontSize: 12 },
  rutinaDesc:   { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  ejList:      { gap: 6, paddingTop: 4 },
  ejListTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  ejRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ejBullet:{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 5 },
  ejNombre:  { color: Colors.text, fontSize: 14, fontWeight: '600' },
  ejDetalle: { color: Colors.accent, fontSize: 12 },
  ejNotas:   { color: Colors.textSecondary, fontSize: 12, fontStyle: 'italic' },

  /* Trainer selector */
  trainerSelector: { marginBottom: 8 },
  trainerChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  trainerChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  trainerChipText:   { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },

  /* Trainer card */
  trainerCard: { marginHorizontal: 20, marginBottom: 12 },
  trainerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trainerAvatar: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  trainerInitials: { color: '#fff', fontSize: 22, fontWeight: '800' },
  trainerName:  { color: Colors.text, fontSize: 16, fontWeight: '700' },
  trainerSpec:  { color: Colors.accent, fontSize: 12 },
  trainerEmail: { color: Colors.textSecondary, fontSize: 12 },

  /* Chat */
  chatContainer: { flex: 1, marginHorizontal: 20 },
  chatTitle:     { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  chatList:      { paddingVertical: 8, gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  chatEmpty:     { alignItems: 'center', gap: 8, paddingVertical: 24 },
  chatEmptyText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
  bubble: {
    maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, gap: 2,
  },
  bubbleMe:    { alignSelf: 'flex-end', backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  bubbleThem:  { alignSelf: 'flex-start', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText:  { color: Colors.text, fontSize: 14, lineHeight: 20 },
  bubbleTextMe:{ color: '#fff' },
  bubbleTime:  { color: Colors.textMuted, fontSize: 10, alignSelf: 'flex-end' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1, maxHeight: 100, backgroundColor: Colors.card,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
