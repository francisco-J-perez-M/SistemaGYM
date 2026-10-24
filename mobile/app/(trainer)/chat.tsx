/**
 * Chat — Entrenador
 * Lista de clientes con mensajes + conversación individual.
 *
 * GET  /api/trainer/chat/unread-summary → { total_unread, por_miembro: [{id_miembro_pg, nombre, unread}] }
 * GET  /api/trainer/members             → { members: [{id_miembro, nombre, email}] }
 * GET  /api/trainer/chat/<miembro_pg_id> → { mensajes: [{id, remitente, texto, fecha, leido}] }
 * POST /api/trainer/chat/<miembro_pg_id> → { mensaje }  body: { texto }
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
import Card from '../../components/ui/Card';
import api from '../../services/api';
import * as Haptics from 'expo-haptics';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Member {
  id_miembro:    string | number;
  id_miembro_pg?: number | null;
  nombre:        string;
  email?:        string;
}

interface UnreadEntry {
  id_miembro_pg: number;
  nombre:        string;
  unread:        number;
}

interface UnreadSummary {
  total_unread: number;
  por_miembro:  UnreadEntry[];
}

interface ChatMsg {
  id:        string;
  remitente: 'entrenador' | 'miembro';
  texto:     string;
  fecha?:    string;
  leido:     boolean;
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function TrainerChatScreen() {
  const colors  = useColors();
  const fs      = useFontScale();
  const styles  = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets  = useSafeAreaInsets();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [msg,    setMsg]    = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  // Solo clientes ASIGNADOS al entrenador (my_clients=1) — no todo el gimnasio.
  const { data: membersData, loading: loadingM, refetch: refetchM } =
    useFetch<{ members: Member[] }>(`${ENDPOINTS.TRAINER_MEMBERS}?my_clients=1`);
  const members = toArray(membersData?.members ?? []);

  // Resumen de no leídos
  const { data: unreadData, refetch: refetchUnread } =
    useFetch<UnreadSummary>(ENDPOINTS.TRAINER_CHAT_UNREAD);
  const unreadMap: Record<number, number> = {};
  toArray(unreadData?.por_miembro).forEach((u) => {
    unreadMap[u.id_miembro_pg] = u.unread;
  });

  // Mensajes del miembro seleccionado
  // id_miembro_pg es el PG int que necesita el endpoint de chat
  const memberId = selectedMember
    ? (selectedMember.id_miembro_pg
        ?? (typeof selectedMember.id_miembro === 'string'
            ? parseInt(selectedMember.id_miembro, 10)
            : selectedMember.id_miembro))
    : null;

  const chatUrl = memberId ? `${ENDPOINTS.TRAINER_CHAT_BASE}/${memberId}` : '';
  const { data: chatData, loading: loadingC, refetch: refetchC } =
    useFetch<{ mensajes: ChatMsg[] }>(chatUrl);
  const mensajes = toArray(chatData?.mensajes ?? []);

  const handleSend = async () => {
    const texto = msg.trim();
    if (!texto || !memberId) return;
    setSending(true);
    try {
      await api.post(`${ENDPOINTS.TRAINER_CHAT_BASE}/${memberId}`, { texto });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMsg('');
      await refetchC();
      await refetchUnread();
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  };

  const handleSelectMember = useCallback((m: Member) => {
    setSelectedMember(m);
    setMsg('');
    // Dar tiempo al fetch para cargar y hacer scroll
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 400);
  }, []);

  if (loadingM && members.length === 0) {
    return <LoadingSpinner fullScreen message="Cargando clientes…" />;
  }

  // ── Vista de lista de clientes ────────────────────────────────────────────
  if (!selectedMember) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Mensajes</Text>
          {(unreadData?.total_unread ?? 0) > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{unreadData!.total_unread}</Text>
            </View>
          )}
        </View>

        <FlatList
          data={members}
          keyExtractor={(m) => String(m.id_miembro)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loadingM}
              onRefresh={() => { refetchM(); refetchUnread(); }}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aún no tienes clientes asignados.</Text>
              <Text style={styles.emptyHint}>Acepta solicitudes PT para iniciar conversaciones.</Text>
            </View>
          }
          renderItem={({ item: m }) => {
            const mid   = m.id_miembro_pg ?? (typeof m.id_miembro === 'string' ? parseInt(m.id_miembro, 10) : m.id_miembro as number);
            const unread = unreadMap[mid] ?? 0;
            return (
              <TouchableOpacity
                style={styles.memberRow}
                onPress={() => handleSelectMember(m)}
                accessibilityRole="button"
                accessibilityLabel={`Chat con ${m.nombre}${unread ? `, ${unread} mensajes sin leer` : ''}`}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {toStr(m.nombre, '?').charAt(0).toUpperCase()}
                  </Text>
                  {unread > 0 && (
                    <View style={styles.unreadDot}>
                      <Text style={styles.unreadDotText}>{unread > 9 ? '9+' : unread}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.nombre}</Text>
                  {m.email ? <Text style={styles.memberEmail}>{m.email}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  }

  // ── Vista de conversación ─────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 56}
    >
      {/* Header conversación */}
      <View style={[styles.chatHeader, { paddingTop: insets.top > 0 ? 8 : 16 }]}>
        <TouchableOpacity
          onPress={() => { setSelectedMember(null); refetchUnread(); }}
          style={styles.backBtn}
          accessibilityLabel="Volver a la lista"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.chatHeaderAvatar}>
          <Text style={styles.chatHeaderInitial}>
            {toStr(selectedMember.nombre, '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatHeaderName}>{selectedMember.nombre}</Text>
          {selectedMember.email
            ? <Text style={styles.chatHeaderEmail}>{selectedMember.email}</Text>
            : null}
        </View>
        <TouchableOpacity
          onPress={() => { refetchC(); refetchUnread(); }}
          style={styles.refreshBtn}
          accessibilityLabel="Actualizar mensajes"
        >
          <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Mensajes */}
      <FlatList
        ref={flatRef}
        data={mensajes}
        keyExtractor={(m, i) => m.id ?? String(i)}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loadingC} onRefresh={refetchC} tintColor={colors.accent} />
        }
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.chatEmpty}>
            <Ionicons name="chatbubbles-outline" size={36} color={colors.textMuted} />
            <Text style={styles.chatEmptyText}>Inicia la conversación con {selectedMember.nombre}.</Text>
          </View>
        }
        renderItem={({ item: m }) => {
          const isMe = m.remitente === 'entrenador';
          const hora = m.fecha ? toDateStr(m.fecha, 16).slice(11, 16) : '';
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{m.texto}</Text>
              <View style={styles.bubbleMeta}>
                {hora ? (
                  <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMine]}>{hora}</Text>
                ) : null}
                {isMe && (
                  <Ionicons
                    name={m.leido ? 'checkmark-done' : 'checkmark'}
                    size={12}
                    color={m.leido ? '#a0f0c0' : 'rgba(255,255,255,0.5)'}
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
          placeholder="Escribe un mensaje…"
          placeholderTextColor={colors.textMuted}
          value={msg}
          onChangeText={setMsg}
          multiline
          maxLength={500}
          accessibilityLabel="Mensaje al cliente"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!msg.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!msg.trim() || sending}
          accessibilityLabel="Enviar mensaje"
          accessibilityRole="button"
        >
          <Ionicons name={sending ? 'hourglass-outline' : 'send'} size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  title:        { color: colors.text, fontSize: 26 * fs, fontWeight: '700', flex: 1 },
  totalBadge:   { backgroundColor: colors.error, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  totalBadgeText: { color: '#fff', fontSize: 12 * fs, fontWeight: '700' },
  list:         { paddingHorizontal: 20, gap: 4, paddingBottom: 32 },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText:    { color: colors.textMuted, fontSize: 15 * fs, fontWeight: '600', textAlign: 'center' },
  emptyHint:    { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center' },
  memberRow:    {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  memberAvatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  memberInitial:{ color: '#fff', fontSize: 20 * fs, fontWeight: '800' },
  unreadDot:    {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: colors.error, borderRadius: 10,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadDotText:{ color: '#fff', fontSize: 10 * fs, fontWeight: '800' },
  memberName:   { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },
  memberEmail:  { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
  // ── Chat ──
  chatHeader:   {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backBtn:        { padding: 4 },
  chatHeaderAvatar: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  chatHeaderInitial: { color: '#fff', fontSize: 16 * fs, fontWeight: '800' },
  chatHeaderName:    { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },
  chatHeaderEmail:   { color: colors.textSecondary, fontSize: 11 * fs },
  refreshBtn:        { padding: 6 },
  chatList:    { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  chatEmpty:   { alignItems: 'center', gap: 8, paddingVertical: 40 },
  chatEmptyText: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center', paddingHorizontal: 20 },
  bubble:      { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 4 },
  bubbleMe:    { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleThem:  { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText:  { color: colors.text, fontSize: 14 * fs, lineHeight: 20 },
  bubbleTextMe:{ color: '#fff' },
  bubbleMeta:  { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  bubbleTime:  { color: colors.textMuted, fontSize: 10 * fs },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.6)' },
  inputBar:    {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingTop: 8, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  textInput:   {
    flex: 1, maxHeight: 100,
    backgroundColor: colors.card, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    color: colors.text, fontSize: 14 * fs,
    borderWidth: 1, borderColor: colors.border,
  },
  sendBtn:         { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
}
