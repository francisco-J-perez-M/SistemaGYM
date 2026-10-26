/**
 * Entrenador — Miembro (chat + gestión de PT).
 *
 * Segundo lugar al que llega el acceso directo "Chat con entrenador" del
 * nuevo Paso A de Entrenamiento (ver app/(member)/training.tsx) -- esta
 * pantalla ya existía como chat simple, y ahora además absorbe TODO el flujo
 * de solicitud de entrenador personal que antes vivía en el tab "Entrenador"
 * de training.tsx (ver bitácora de ese archivo en git): elegir entrenador,
 * solicitar PT, cancelar una solicitud pendiente, y ver el perfil completo
 * (PerfilEntrenador) del entrenador ya asignado. El chat en sí (burbujas,
 * doble check de leído) es el que ya existía aquí sin cambios.
 *
 * GET  /api/user/training/chat/<trainer_id>  → { mensajes: [{id, remitente, texto, fecha, leido}] }
 * POST /api/user/training/chat/<trainer_id>  → { mensaje }  body: { texto }
 * GET  /api/user/training/trainers           → { trainers: [{id, nombre, email, especialidad, foto}] }
 * GET/POST/DELETE /api/user/training/pt-request → solicitudes de PT (pendiente|aceptada|rechazada)
 */
import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity,
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
import PerfilEntrenador from '../../components/usuarios/PerfilEntrenador';
import api from '../../services/api';
import * as Haptics from 'expo-haptics';

interface Trainer {
  id?:           number;
  _id?:          string;
  nombre?:       string;
  name?:         string;
  especialidad?: string;
  email?:        string;
  foto?:         string | null;   // base64 data URI
}

interface ChatMsg {
  id?:       string;
  _id?:      string;
  remitente: string;
  rol?:      string;
  texto?:    string;
  mensaje?:  string;
  fecha?:    string;
  created_at?: string;
  leido?:    boolean;
}

interface PTSolicitud {
  id?:                string;
  id_entrenador_pg:   number;
  nombre_entrenador?: string;
  estado:             string;   // pendiente | aceptada | rechazada
}

function trainerName(t: Trainer) {
  return toStr(t.nombre ?? t.name, 'Entrenador');
}

export default function MemberChatScreen() {
  const colors  = useColors();
  const fs      = useFontScale();
  const styles  = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets  = useSafeAreaInsets();

  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [perfilId, setPerfilId] = useState<number | null>(null);
  const [msg,     setMsg]     = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  // Catálogo de entrenadores del gimnasio.
  const { data: trainersData, loading: loadingT, refetch: refetchT } =
    useFetch<Trainer[] | { trainers: Trainer[] }>(ENDPOINTS.USER_TRAINERS_LIST);
  const allTrainers = toArray<Trainer>(
    Array.isArray(trainersData) ? trainersData : (trainersData as any)?.trainers ?? []
  );

  // Solicitudes PT: el miembro solo puede chatear con su entrenador ASIGNADO
  // (solicitud en estado "aceptada"); mientras no tenga uno, esta pantalla
  // gestiona la solicitud en su lugar.
  const { data: ptData, loading: loadingPT, refetch: refetchPT } =
    useFetch<{ solicitudes: PTSolicitud[] }>(ENDPOINTS.USER_PT_REQUEST);

  const assignedIds = new Set(
    toArray<PTSolicitud>(ptData?.solicitudes)
      .filter((s) => s.estado === 'aceptada')
      .map((s) => s.id_entrenador_pg),
  );
  const pendingRequest =
    toArray<PTSolicitud>(ptData?.solicitudes).find((s) => s.estado === 'pendiente') ?? null;
  const requestedIds = new Set(
    toArray<PTSolicitud>(ptData?.solicitudes)
      .filter((s) => s.estado === 'pendiente' || s.estado === 'aceptada')
      .map((s) => s.id_entrenador_pg),
  );
  const availableTrainers: Trainer[] = allTrainers.filter(
    (t) => !requestedIds.has((t.id ?? t._id) as number),
  );
  // Entrenadores asignados (con info completa del catálogo). Si el catálogo
  // aún no cargó pero sí hay solicitud aceptada, caemos a los datos de la
  // solicitud para no dejar la pantalla vacía mientras tanto.
  const trainers: Trainer[] = allTrainers.filter((t) => assignedIds.has((t.id ?? t._id) as number));
  if (trainers.length === 0 && assignedIds.size > 0) {
    toArray<PTSolicitud>(ptData?.solicitudes)
      .filter((s) => s.estado === 'aceptada')
      .forEach((s) => trainers.push({ id: s.id_entrenador_pg, nombre: s.nombre_entrenador }));
  }

  const active     = selectedTrainer ?? (trainers[0] ?? null);
  const trainerId  = active?.id ?? active?._id;
  const chatUrl    = trainerId ? `${ENDPOINTS.USER_CHAT_BASE}/${trainerId}` : '';

  const { data: chatData, loading: loadingC, refetch: refetchC } =
    useFetch<ChatMsg[] | { mensajes: ChatMsg[] }>(chatUrl);
  const mensajes = toArray(
    Array.isArray(chatData) ? chatData : (chatData as any)?.mensajes ?? []
  );

  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [cancelling, setCancelling]     = useState(false);

  const handleRequestPT = async (trainer: Trainer) => {
    const tId = Number(trainer.id ?? trainer._id ?? 0);
    if (!tId) return;
    setRequestingId(tId);
    try {
      await api.post(ENDPOINTS.USER_PT_REQUEST, { id_entrenador_pg: tId });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert(
        'Solicitud enviada',
        `Le avisamos a ${trainerName(trainer)}. Te notificaremos cuando responda.`,
      );
      refetchPT();
    } catch (e: any) {
      Alert.alert('No se pudo enviar', e?.response?.data?.error ?? 'Intenta de nuevo más tarde.');
    } finally {
      setRequestingId(null);
    }
  };

  const handleCancelPT = async () => {
    if (!pendingRequest?.id) return;
    setCancelling(true);
    try {
      await api.delete(`${ENDPOINTS.USER_PT_REQUEST}/${pendingRequest.id}`);
      refetchPT();
    } catch (e: any) {
      Alert.alert('No se pudo cancelar', e?.response?.data?.error ?? 'Intenta de nuevo más tarde.');
    } finally {
      setCancelling(false);
    }
  };

  const handleSend = async () => {
    const texto = msg.trim();
    if (!texto || !trainerId) return;
    setSending(true);
    try {
      await api.post(`${ENDPOINTS.USER_CHAT_BASE}/${trainerId}`, { texto });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMsg('');
      await refetchC();
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  };

  const handleSelect = useCallback((t: Trainer) => {
    setSelectedTrainer(t);
    setMsg('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 400);
  }, []);

  if ((loadingT || loadingPT) && allTrainers.length === 0 && trainers.length === 0) {
    return <LoadingSpinner fullScreen message="Cargando…" />;
  }

  // ── Sin entrenador asignado todavía: gestión de la solicitud de PT ──────
  // (pendiente de respuesta / sin entrenadores en el catálogo / elegir uno)
  if (trainers.length === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
        <ScrollView contentContainerStyle={styles.sinEntrenadorScroll} showsVerticalScrollIndicator={false}>
          {pendingRequest ? (
            <Card style={styles.trainerCard}>
              <View style={styles.empty}>
                <Ionicons name="time-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>
                  Esperando respuesta de {pendingRequest.nombre_entrenador ?? 'tu entrenador'}
                </Text>
                <Text style={styles.emptyHint}>Te avisaremos cuando la acepte o la rechace.</Text>
                <TouchableOpacity
                  onPress={handleCancelPT}
                  disabled={cancelling}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar solicitud"
                >
                  <Text style={styles.cancelRequestText}>
                    {cancelling ? 'Cancelando…' : 'Cancelar solicitud'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : availableTrainers.length === 0 ? (
            <Card style={styles.trainerCard}>
              <View style={styles.empty}>
                <Ionicons name="person-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>Tu gimnasio aún no tiene entrenadores disponibles.</Text>
              </View>
            </Card>
          ) : (
            <View>
              <Text style={styles.seccionTitle}>Elige un entrenador para solicitar PT</Text>
              {availableTrainers.map((t) => {
                const tId = Number(t.id ?? t._id ?? 0);
                return (
                  <Card key={tId} style={styles.trainerCard}>
                    <View style={styles.trainerRow}>
                      {t.foto && t.foto.startsWith('data:image') ? (
                        <Image source={{ uri: t.foto }} style={styles.trainerAvatarImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.trainerAvatar}>
                          <Text style={styles.trainerInitial}>{trainerName(t).charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.trainerName}>{trainerName(t)}</Text>
                        {t.especialidad ? <Text style={styles.trainerSpec}>{t.especialidad}</Text> : null}
                      </View>
                      <TouchableOpacity
                        style={styles.requestBtn}
                        onPress={() => handleRequestPT(t)}
                        disabled={requestingId === tId}
                        accessibilityRole="button"
                        accessibilityLabel={`Solicitar a ${trainerName(t)}`}
                      >
                        <Text style={styles.requestBtnText}>
                          {requestingId === tId ? 'Enviando…' : 'Solicitar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 56}
    >
      {/* Selector de entrenador (si hay varios) */}
      {trainers.length > 1 && (
        <FlatList
          horizontal
          data={trainers}
          keyExtractor={(t, i) => String(t.id ?? t._id ?? i)}
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, alignItems: 'center', paddingVertical: 8 }}
          renderItem={({ item: t }) => {
            const isActive = (t.id ?? t._id) === (active?.id ?? active?._id);
            return (
              <TouchableOpacity
                style={[styles.trainerChip, isActive && styles.trainerChipActive]}
                onPress={() => handleSelect(t)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.trainerChipText, isActive && { color: colors.onAccent }]}>
                  {trainerName(t)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Header del entrenador activo -- toca para ver su perfil completo
          (certificaciones y calificación, vía PerfilEntrenador). */}
      {active && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setPerfilId(Number(active.id ?? 0) || null)}
          accessibilityRole="button"
          accessibilityLabel={`Ver el perfil de ${trainerName(active)}`}
          accessibilityHint="Muestra su información, certificaciones y la calificación"
        >
          <View style={styles.chatHeader}>
            {active.foto && active.foto.startsWith('data:image') ? (
              <Image source={{ uri: active.foto }} style={styles.trainerAvatarImg} resizeMode="cover" />
            ) : (
              <View style={styles.trainerAvatar}>
                <Text style={styles.trainerInitial}>
                  {trainerName(active).charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.trainerName}>{trainerName(active)}</Text>
              {active.especialidad
                ? <Text style={styles.trainerSpec}>{active.especialidad}</Text>
                : null}
            </View>
            <Badge label="PT" color="accent" />
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); refetchC(); refetchT(); }}
              style={styles.refreshBtn} accessibilityLabel="Actualizar">
              <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Mensajes */}
      <FlatList
        ref={flatRef}
        data={mensajes}
        keyExtractor={(m, i) => m.id ?? m._id ?? String(i)}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loadingC} onRefresh={refetchC} tintColor={colors.accent} />
        }
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.chatEmpty}>
            <Ionicons name="chatbubbles-outline" size={36} color={colors.textMuted} />
            <Text style={styles.chatEmptyText}>
              {trainerId ? 'Inicia la conversación con tu entrenador.' : 'Selecciona un entrenador.'}
            </Text>
          </View>
        }
        renderItem={({ item: m }) => {
          const isMe  = (m.remitente ?? m.rol) === 'miembro';
          const texto = toStr(m.texto ?? m.mensaje);
          const hora  = m.fecha ?? m.created_at;
          const horaStr = hora ? toDateStr(hora, 16).slice(11, 16) : '';
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{texto}</Text>
              <View style={styles.bubbleMeta}>
                {horaStr ? (
                  <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMine]}>{horaStr}</Text>
                ) : null}
                {isMe && m.leido !== undefined && (
                  <Ionicons
                    name={m.leido ? 'checkmark-done' : 'checkmark'}
                    size={12}
                    color={colors.onAccent}
                    style={{ opacity: m.leido ? 1 : 0.55 }}
                  />
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.textInput}
          placeholder={trainerId ? 'Escribe un mensaje…' : 'Selecciona un entrenador'}
          placeholderTextColor={colors.textMuted}
          value={msg}
          onChangeText={setMsg}
          multiline
          maxLength={500}
          editable={!!trainerId}
          accessibilityLabel="Mensaje al entrenador"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!msg.trim() || sending || !trainerId) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!msg.trim() || sending || !trainerId}
          accessibilityLabel="Enviar mensaje"
          accessibilityRole="button"
        >
          <Ionicons name={sending ? 'hourglass-outline' : 'send'} size={18} color={colors.onAccent} />
        </TouchableOpacity>
      </View>

      <PerfilEntrenador
        trainerId={perfilId}
        onClose={() => setPerfilId(null)}
        esMiEntrenador={!!active && Number(active.id) === perfilId}
        onTerminar={() => { setSelectedTrainer(null); refetchPT?.(); }}
      />
    </KeyboardAvoidingView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.background },
  empty:        { alignItems: 'center', paddingVertical: 8, gap: 8 },
  emptyText:    { color: colors.text, fontSize: 15 * fs, fontWeight: '700', textAlign: 'center' },
  emptyHint:    { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center' },
  // Scroll de la pantalla "sin entrenador asignado todavía" (pendiente de
  // respuesta / sin entrenadores / elige uno para pedir PT).
  sinEntrenadorScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 20 },
  seccionTitle: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '700', marginBottom: 10 },
  trainerCard:  { marginBottom: 12 },
  trainerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestBtn:     { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  requestBtnText: { color: colors.onAccent, fontSize: 13 * fs, fontWeight: '700' },
  cancelRequestText: { color: colors.error, fontSize: 13 * fs, fontWeight: '600', marginTop: 4 },
  trainerChip:  { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  trainerChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  trainerChipText:   { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
  chatHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 16, paddingVertical: 12,
                  borderBottomWidth: 1, borderBottomColor: colors.border,
                  backgroundColor: colors.card },
  trainerAvatar:{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.accent,
                  alignItems: 'center', justifyContent: 'center' },
  trainerAvatarImg: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface },
  trainerInitial:{ color: colors.onAccent, fontSize: 17 * fs, fontWeight: '800' },
  trainerName:  { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },
  trainerSpec:  { color: colors.accent, fontSize: 11 * fs },
  refreshBtn:   { padding: 6 },
  chatList:     { paddingHorizontal: 16, paddingVertical: 12, gap: 8,
                  flexGrow: 1, justifyContent: 'flex-end' },
  chatEmpty:    { alignItems: 'center', gap: 8, paddingVertical: 40 },
  chatEmptyText:{ color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center', paddingHorizontal: 20 },
  bubble:       { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 4 },
  bubbleMe:     { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleThem:   { alignSelf: 'flex-start', backgroundColor: colors.card,
                  borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText:   { color: colors.text, fontSize: 14 * fs, lineHeight: 20 },
  bubbleTextMe: { color: colors.onAccent },
  bubbleMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  bubbleTime:   { color: colors.textMuted, fontSize: 10 * fs },
  bubbleTimeMine: { color: colors.onAccent, opacity: 0.7 },
  inputBar:     { flexDirection: 'row', alignItems: 'flex-end', gap: 10,
                  paddingTop: 8, paddingHorizontal: 16,
                  borderTopWidth: 1, borderTopColor: colors.border,
                  backgroundColor: colors.background },
  textInput:    { flex: 1, maxHeight: 100, backgroundColor: colors.card, borderRadius: 12,
                  paddingHorizontal: 14, paddingVertical: 10, color: colors.text,
                  fontSize: 14 * fs, borderWidth: 1, borderColor: colors.border },
  sendBtn:         { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent,
                     alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
}
