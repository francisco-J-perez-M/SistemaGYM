/**
 * Chat — Miembro
 * Conversación con el entrenador asignado.
 * Los mensajes son los mismos que se ven desde la web (misma colección MongoDB).
 *
 * GET  /api/user/training/chat/<trainer_id>  → { mensajes: [{id, remitente, texto, fecha, leido}] }
 * POST /api/user/training/chat/<trainer_id>  → { mensaje }  body: { texto }
 * GET  /api/user/training/trainers           → { trainers: [{id, nombre, email, especialidad}] }
 */
import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray, toDateStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../services/api';
import * as Haptics from 'expo-haptics';

interface Trainer {
  id?:           number;
  _id?:          string;
  nombre?:       string;
  name?:         string;
  especialidad?: string;
  email?:        string;
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

function trainerName(t: Trainer) {
  return toStr(t.nombre ?? t.name, 'Entrenador');
}

export default function MemberChatScreen() {
  const colors  = useColors();
  const fs      = useFontScale();
  const styles  = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets  = useSafeAreaInsets();

  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [msg,     setMsg]     = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  // Entrenadores disponibles
  const { data: trainersData, loading: loadingT, refetch: refetchT } =
    useFetch<Trainer[] | { trainers: Trainer[] }>(ENDPOINTS.USER_TRAINERS_LIST);
  const trainers = toArray(
    Array.isArray(trainersData) ? trainersData : (trainersData as any)?.trainers ?? []
  );

  const active     = selectedTrainer ?? (trainers[0] ?? null);
  const trainerId  = active?.id ?? active?._id;
  const chatUrl    = trainerId ? `${ENDPOINTS.USER_CHAT_BASE}/${trainerId}` : '';

  const { data: chatData, loading: loadingC, refetch: refetchC } =
    useFetch<ChatMsg[] | { mensajes: ChatMsg[] }>(chatUrl);
  const mensajes = toArray(
    Array.isArray(chatData) ? chatData : (chatData as any)?.mensajes ?? []
  );

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

  if (loadingT && trainers.length === 0) {
    return <LoadingSpinner fullScreen message="Cargando…" />;
  }

  // ── Sin entrenador asignado ───────────────────────────────────────────────
  if (!loadingT && trainers.length === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 24, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="chatbubbles-outline" size={52} color={colors.textMuted} />
        <Text style={styles.emptyText}>Sin entrenador asignado</Text>
        <Text style={styles.emptyHint}>
          Envía una solicitud PT desde la sección Entrenamiento para que un entrenador te contacte.
        </Text>
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

      {/* Header del entrenador activo */}
      {active && (
        <View style={styles.chatHeader}>
          <View style={styles.trainerAvatar}>
            <Text style={styles.trainerInitial}>
              {trainerName(active).charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.trainerName}>{trainerName(active)}</Text>
            {active.especialidad
              ? <Text style={styles.trainerSpec}>{active.especialidad}</Text>
              : null}
          </View>
          <TouchableOpacity onPress={() => { refetchC(); refetchT(); }}
            style={styles.refreshBtn} accessibilityLabel="Actualizar">
            <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
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
    </KeyboardAvoidingView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.background },
  emptyText:    { color: colors.text, fontSize: 17 * fs, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  emptyHint:    { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center', paddingHorizontal: 32, marginTop: 8, lineHeight: 20 },
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
