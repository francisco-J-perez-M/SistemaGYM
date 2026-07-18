/**
 * Check-ins (recepcionista) — lista de hoy + registro rápido.
 * Contratos reales:
 *   GET  /api/recepcionista/checkins  → { checkins: [...], total }
 *   POST /api/recepcionista/checkins  → body { id_usuario_pg }
 *   GET  /api/recepcionista/members?q= → { miembros: [...] }  (para elegir)
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import type { Checkin, ReceptionistMember } from '../../types';

function statusColor(s: string): 'success' | 'warning' | 'error' {
  if (s === 'Activa')     return 'success';
  if (s === 'Por vencer') return 'warning';
  return 'error';
}

export default function CheckinsScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data, loading, refetch } = useFetch<{ checkins: Checkin[] }>(ENDPOINTS.RECEP_CHECKINS);
  const checkins = toArray<Checkin>(data?.checkins);

  const [picker, setPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [registering, setRegistering] = useState(false);

  const { data: memData, loading: loadingMem } =
    useFetch<{ miembros: ReceptionistMember[] }>(`${ENDPOINTS.RECEP_MEMBERS}?q=${encodeURIComponent(search)}`);
  const members = toArray<ReceptionistMember>(memData?.miembros);

  const register = async (m: ReceptionistMember) => {
    if (m.id_usuario_pg == null) { Alert.alert('Error', 'Miembro sin ID de usuario.'); return; }
    setRegistering(true);
    try {
      await api.post(ENDPOINTS.RECEP_CHECKINS, { id_usuario_pg: m.id_usuario_pg });
      setPicker(false);
      setSearch('');
      refetch();
      Alert.alert('Check-in registrado', `Entrada de ${m.nombre} registrada.`);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo registrar el check-in');
    } finally {
      setRegistering(false);
    }
  };

  if (loading && checkins.length === 0) return <LoadingSpinner fullScreen message="Cargando check-ins…" />;

  return (
    <View style={styles.screen}>
      <FlatList
        data={checkins}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.topRow}>
            <View>
              <Text style={styles.title} accessibilityRole="header">Check-ins</Text>
              <Text style={styles.subtitle}>{checkins.length} hoy</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setPicker(true)}
              accessibilityRole="button" accessibilityLabel="Registrar check-in">
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Registrar</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="log-in-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyText}>Sin check-ins registrados hoy.</Text>
          </View>
        }
        renderItem={({ item: c }) => (
          <Card style={{ marginBottom: 10 }}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.initial}>{c.nombre.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.nombre}</Text>
                <Text style={styles.time}>
                  Entrada {c.hora_entrada}{c.hora_salida ? `  ·  Salida ${c.hora_salida}` : ''}
                </Text>
              </View>
              <Badge label={c.membership_status} color={statusColor(c.membership_status)} />
            </View>
          </Card>
        )}
      />

      {/* Modal selector de miembro */}
      <Modal visible={picker} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar check-in</Text>
              <TouchableOpacity onPress={() => setPicker(false)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar miembro por nombre o email…"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
            />
            {loadingMem ? (
              <LoadingSpinner message="Buscando…" />
            ) : (
              <FlatList
                data={members}
                keyExtractor={(m) => m.id}
                style={{ marginTop: 8 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={<Text style={styles.emptyText}>Sin resultados.</Text>}
                renderItem={({ item: m }) => (
                  <TouchableOpacity style={styles.memberRow} onPress={() => register(m)} disabled={registering}>
                    <View style={styles.avatarSm}>
                      <Text style={styles.initialSm}>{m.nombre.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{m.nombre}</Text>
                      <Text style={styles.time} numberOfLines={1}>{m.email}</Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color={colors.accent} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20 },
    topRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title:   { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
    subtitle:{ color: colors.textSecondary, fontSize: 13 * fs },
    addBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent,
               borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
    addBtnText: { color: '#fff', fontSize: 13 * fs, fontWeight: '700' },
    empty:     { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: colors.textMuted, fontSize: 14 * fs, textAlign: 'center', paddingVertical: 8 },
    row:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar:  { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.accent,
               alignItems: 'center', justifyContent: 'center' },
    initial: { color: '#fff', fontSize: 18 * fs, fontWeight: '800' },
    name:    { color: colors.text, fontSize: 15 * fs, fontWeight: '600' },
    time:    { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },

    overlay:  { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalBox: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: colors.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle:  { color: colors.text, fontSize: 18 * fs, fontWeight: '700' },
    searchInput: { backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
                   color: colors.text, padding: 14, fontSize: 15 * fs },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
                 borderBottomWidth: 1, borderBottomColor: colors.border },
    avatarSm:  { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface,
                 alignItems: 'center', justifyContent: 'center' },
    initialSm: { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },
  });
}
