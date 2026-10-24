/**
 * Agenda — Entrenador
 * GET /api/trainer/schedule → { week_start, week_end,
 *   schedule: { "0": {day_name, day_number, is_today, sessions:[{id_sesion, date, time,
 *               client, type, duration, duracion_minutos, location, status, notes,
 *               exercises, attendance, nombre_sesion, id_miembro}]} },
 *   total_sessions }
 * POST /api/trainer/sessions → { fecha, hora_inicio, id_miembro?, duracion_minutos, tipo,
 *                                nombre_sesion, notas }
 * GET /api/trainer/members → { members: [{id, nombre, email}] }
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, ScrollView, TextInput, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColors } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';

type ViewMode = 'hoy' | 'semana';

interface Session {
  id_sesion:      string;
  date:           string;
  time:           string;
  client:         string;
  type?:          string;
  duration:       string;
  duracion_minutos: number;
  location:       string;
  status?:        string;
  notes?:         string;
  nombre_sesion?: string;
  id_miembro?:    string;
}

interface DaySchedule {
  day_name:   string;
  day_number: number;
  is_today:   boolean;
  sessions:   Session[];
}

interface ScheduleResponse {
  week_start:    string;
  week_end:      string;
  schedule:      Record<string, DaySchedule>;
  total_sessions: number;
}

interface Member {
  id_miembro: string;   // campo real: string ObjectId
  nombre:     string;
  email?:     string;
  is_my_client?: boolean;
}

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error'> = {
  completed: 'success', scheduled: 'warning', cancelled: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  completed: 'Completada', scheduled: 'Programada', cancelled: 'Cancelada',
};

// ── Formulario nueva sesión ───────────────────────────────────────────────────
interface NewSessionForm {
  fecha:             string;
  hora_inicio:       string;
  duracion_minutos:  string;
  tipo:              string;
  nombre_sesion:     string;
  notas:             string;
  id_miembro:        string;
}

const TIPOS_SESION = ['Personal', 'Grupal', 'Evaluación', 'Rehabilitación'];

function FormField({ label, value, onChange, placeholder, keyboardType, multiline, fStyles, colors }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean;
  fStyles: ReturnType<typeof make_fStyles>;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={fStyles.field}>
      <Text style={fStyles.label}>{label}</Text>
      <TextInput
        style={[fStyles.input, multiline && fStyles.inputMulti]}
        value={value} onChangeText={onChange}
        placeholder={placeholder ?? ''} placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType ?? 'default'} multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        accessibilityLabel={label}
      />
    </View>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ScheduleScreen() {
  const colors = useColors();
  const styles = useMemo(() => make_styles(colors), [colors]);
  const fStyles = useMemo(() => make_fStyles(colors), [colors]);
  const calStyles = useMemo(() => make_calStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [view,      setView]      = useState<ViewMode>('hoy');
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [showCal,   setShowCal]   = useState(false);
  const [calDate,   setCalDate]   = useState(new Date());
  const [form, setForm] = useState<NewSessionForm>({
    fecha: new Date().toISOString().slice(0, 10),
    hora_inicio: '08:00',
    duracion_minutos: '60',
    tipo: 'Personal',
    nombre_sesion: '',
    notas: '',
    id_miembro: '',
  });

  const { data, loading, refetch }           = useFetch<ScheduleResponse>(ENDPOINTS.TRAINER_SCHEDULE);
  const { data: membersData, loading: loadM } = useFetch<{ members: Member[] }>(ENDPOINTS.TRAINER_MEMBERS);

  const members = toArray(membersData?.members ?? []);

  // Aplanar sesiones del schedule
  const scheduleMap: Record<string, DaySchedule> = data?.schedule ?? {};
  const allDays    = Object.values(scheduleMap).sort((a, b) => a.day_number - b.day_number);
  const today      = new Date().toISOString().slice(0, 10);
  const todaySessions = allDays.flatMap(d => d.sessions).filter(s => s.date === today);
  const displayDays   = view === 'hoy'
    ? allDays.filter(d => d.is_today)
    : allDays;

  const setField = (key: keyof NewSessionForm) => (v: string) =>
    setForm(prev => ({ ...prev, [key]: v }));

  const handleCreate = async () => {
    if (!form.fecha || !form.hora_inicio) {
      Alert.alert('Requerido', 'Completa la fecha y hora de inicio.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        fecha:            form.fecha,
        hora_inicio:      form.hora_inicio,
        duracion_minutos: parseInt(form.duracion_minutos) || 60,
        tipo:             form.tipo,
        nombre_sesion:    form.nombre_sesion.trim() || undefined,
        notas:            form.notas.trim() || undefined,
      };
      if (form.id_miembro) payload.id_miembro = form.id_miembro;
      await api.post(ENDPOINTS.TRAINER_SESSIONS, payload);
      setShowModal(false);
      setForm({ fecha: today, hora_inicio: '08:00', duracion_minutos: '60', tipo: 'Personal', nombre_sesion: '', notas: '', id_miembro: '' });
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo crear la sesión');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando agenda…" />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title} accessibilityRole="header">Agenda</Text>
          <Text style={styles.sub}>{data?.total_sessions ?? 0} sesiones esta semana</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
          accessibilityLabel="Agendar nueva sesión"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Toggle hoy/semana */}
      <View style={styles.viewToggle}>
        {(['hoy', 'semana'] as ViewMode[]).map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.viewBtn, view === v && styles.viewBtnActive]}
            onPress={() => setView(v)}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === v }}
          >
            <Ionicons
              name={v === 'hoy' ? 'today-outline' : 'calendar-outline'}
              size={16}
              color={view === v ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.viewLabel, view === v && styles.viewLabelActive]}>
              {v === 'hoy' ? 'Hoy' : 'Esta semana'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de días y sesiones */}
      <FlatList
        data={displayDays}
        keyExtractor={d => d.day_name}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyText}>Sin sesiones {view === 'hoy' ? 'para hoy' : 'esta semana'}.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
              <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
              <Text style={styles.emptyBtnText}>Agendar sesión</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: day }) => {
          if (day.sessions.length === 0 && view === 'semana') {
            return (
              <View style={styles.dayRow}>
                <Text style={[styles.dayName, day.is_today && styles.dayNameToday]}>
                  {day.day_name} {day.day_number} {day.is_today ? '· Hoy' : ''}
                </Text>
                <Text style={styles.noSessions}>Sin sesiones</Text>
              </View>
            );
          }
          return (
            <View>
              <Text style={[styles.dayName, day.is_today && styles.dayNameToday]}>
                {day.day_name} {day.day_number} {day.is_today ? '· Hoy' : ''}
              </Text>
              {day.sessions.map(s => (
                <Card key={s.id_sesion} style={styles.sessionCard}>
                  <View style={styles.sessionTop}>
                    <View style={styles.timeBox}>
                      <Text style={styles.timeText}>{s.time}</Text>
                      <Text style={styles.durationText}>{s.duration}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientName}>{toStr(s.client, 'Sin cliente')}</Text>
                      {s.nombre_sesion ? <Text style={styles.sessionName}>{s.nombre_sesion}</Text> : null}
                      <Text style={styles.sessionType}>{toStr(s.type)} · {s.location}</Text>
                    </View>
                    <Badge
                      label={STATUS_LABEL[s.status ?? ''] ?? toStr(s.status, 'Programada')}
                      color={STATUS_COLOR[s.status ?? ''] ?? 'warning'}
                    />
                  </View>
                  {s.notes ? (
                    <Text style={styles.sessionNotes} numberOfLines={2}>{s.notes}</Text>
                  ) : null}
                </Card>
              ))}
            </View>
          );
        }}
      />

      {/* Modal nueva sesión */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva sesión</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
              {/* Date picker */}
              <View style={fStyles.field}>
                <Text style={fStyles.label}>Fecha</Text>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => { setCalDate(form.fecha ? new Date(form.fecha + 'T00:00:00') : new Date()); setShowCal(true); }}
                  accessibilityLabel="Seleccionar fecha"
                  accessibilityRole="button"
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.accent} />
                  <Text style={styles.dateBtnText}>{form.fecha || 'Seleccionar fecha'}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <FormField label="Hora de inicio (HH:MM)" value={form.hora_inicio}
                onChange={setField('hora_inicio')} placeholder="08:00"
                fStyles={fStyles} colors={colors} />
              <FormField label="Duración (minutos)" value={form.duracion_minutos}
                onChange={setField('duracion_minutos')} keyboardType="numeric"
                fStyles={fStyles} colors={colors} />
              <FormField label="Nombre de la sesión (opcional)" value={form.nombre_sesion}
                onChange={setField('nombre_sesion')} placeholder="Ej: Día de pecho"
                fStyles={fStyles} colors={colors} />
              <FormField label="Notas (opcional)" value={form.notas}
                onChange={setField('notas')} multiline
                fStyles={fStyles} colors={colors} />

              {/* Tipo */}
              <Text style={fStyles.label}>Tipo de sesión</Text>
              <View style={styles.tiposRow}>
                {TIPOS_SESION.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tipoChip, form.tipo === t && styles.tipoChipActive]}
                    onPress={() => setForm(p => ({ ...p, tipo: t }))}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: form.tipo === t }}
                  >
                    <Text style={[styles.tipoText, form.tipo === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Seleccionar cliente */}
              {members.length > 0 && (
                <>
                  <Text style={[fStyles.label, { marginTop: 8 }]}>Cliente (opcional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                    <TouchableOpacity
                      style={[styles.clientChip, !form.id_miembro && styles.clientChipActive]}
                      onPress={() => setForm(p => ({ ...p, id_miembro: '' }))}
                    >
                      <Text style={[styles.clientChipText, !form.id_miembro && { color: '#fff' }]}>Sin asignar</Text>
                    </TouchableOpacity>
                    {members.map(m => {
                      const isSelected = form.id_miembro === m.id_miembro;
                      return (
                        <TouchableOpacity
                          key={m.id_miembro}
                          style={[styles.clientChip, isSelected && styles.clientChipActive]}
                          onPress={() => setForm(p => ({ ...p, id_miembro: m.id_miembro }))}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: isSelected }}
                          accessibilityLabel={m.nombre ?? 'Cliente'}
                        >
                          <Text style={[styles.clientChipText, isSelected && { color: '#fff' }]}>
                            {toStr(m.nombre, m.id_miembro)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <View style={{ height: 16 }} />
              <Button
                label={saving ? 'Guardando…' : 'Agendar sesión'}
                onPress={handleCreate}
                loading={saving}
                icon={<Ionicons name="calendar-outline" size={18} color="#fff" />}
              />
            </ScrollView>

            {/* Calendario inline */}
            {showCal && (
              <InlineCalendar
                selectedDate={form.fecha}
                onSelect={(d) => { setField('fecha')(d); setShowCal(false); }}
                onClose={() => setShowCal(false)}
                colors={colors}
                calStyles={calStyles}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Inline Calendar Component ─────────────────────────────────────────────────
const DAYS   = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function InlineCalendar({ selectedDate, onSelect, onClose, colors, calStyles }: {
  selectedDate: string;
  onSelect: (d: string) => void;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  calStyles: ReturnType<typeof make_calStyles>;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const [viewYear,  setViewYear]  = React.useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(initDate.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  // lunes=0 … domingo=6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return d < today;
  };
  const isSelected = (day: number) => {
    const str = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return str === selectedDate;
  };
  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();

  const handleDay = (day: number) => {
    if (isPast(day)) return;
    const str = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    onSelect(str);
  };

  return (
    <View style={calStyles.overlay}>
      <TouchableOpacity style={calStyles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar calendario" />
      <View style={calStyles.sheet}>
        {/* Header mes/año */}
        <View style={calStyles.header}>
          <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn} accessibilityLabel="Mes anterior">
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={calStyles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn} accessibilityLabel="Mes siguiente">
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Días de la semana */}
        <View style={calStyles.weekRow}>
          {DAYS.map(d => <Text key={d} style={calStyles.weekDay}>{d}</Text>)}
        </View>

        {/* Grid de días */}
        <View style={calStyles.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={`e-${i}`} style={calStyles.cell} />;
            const past     = isPast(day);
            const selected = isSelected(day);
            const todayDay = isToday(day);
            return (
              <TouchableOpacity
                key={`d-${day}`}
                style={[
                  calStyles.cell,
                  selected && calStyles.cellSelected,
                  todayDay && !selected && calStyles.cellToday,
                  past && calStyles.cellPast,
                ]}
                onPress={() => handleDay(day)}
                disabled={past}
                accessibilityRole="button"
                accessibilityLabel={`${day} de ${MONTHS[viewMonth]}`}
                accessibilityState={{ selected, disabled: past }}
              >
                <Text style={[
                  calStyles.cellText,
                  selected && calStyles.cellTextSelected,
                  todayDay && !selected && calStyles.cellTextToday,
                  past && calStyles.cellTextPast,
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={calStyles.cancelBtn} onPress={onClose}>
          <Text style={calStyles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function make_calStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  overlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, justifyContent: 'flex-end' },
  backdrop:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:     { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  monthLabel:{ color: colors.text, fontSize: 18, fontWeight: '700' },
  weekRow:   { flexDirection: 'row', marginBottom: 8 },
  weekDay:   { flex: 1, textAlign: 'center', color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  grid:      { flexDirection: 'row', flexWrap: 'wrap' },
  cell:      { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  cellSelected: { backgroundColor: colors.accent },
  cellToday:    { borderWidth: 2, borderColor: colors.accent },
  cellPast:     { opacity: 0.25 },
  cellText:     { color: colors.text, fontSize: 14, fontWeight: '500' },
  cellTextSelected: { color: '#fff', fontWeight: '700' },
  cellTextToday:    { color: colors.accent, fontWeight: '700' },
  cellTextPast:     { color: colors.textMuted },
  cancelBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 10 },
  cancelText:{ color: colors.textSecondary, fontSize: 15 },
});
}

function make_fStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  field:     { gap: 4, marginBottom: 8 },
  label:     { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  input:     { backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  inputMulti:{ minHeight: 72, textAlignVertical: 'top' },
});
}

function make_styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  screen:   { flex: 1, backgroundColor: colors.background },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 12 },
  title:    { color: colors.text, fontSize: 26, fontWeight: '700' },
  sub:      { color: colors.textSecondary, fontSize: 13 },
  addBtn:   { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  viewToggle: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border },
  viewBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 },
  viewBtnActive: { backgroundColor: 'rgba(108,99,255,0.15)' },
  viewLabel:     { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  viewLabelActive:{ color: colors.accent },
  list:     { paddingHorizontal: 20, gap: 6, paddingBottom: 32 },
  empty:    { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText:{ color: colors.textMuted, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.12)', marginTop: 4 },
  emptyBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  dayRow:   { marginBottom: 4 },
  dayName:  { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 8 },
  dayNameToday: { color: colors.accent },
  noSessions: { color: colors.textMuted, fontSize: 12, marginBottom: 8 },
  sessionCard:{ marginBottom: 8, gap: 6 },
  sessionTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timeBox:    { alignItems: 'center', width: 52 },
  timeText:   { color: colors.accent, fontSize: 14, fontWeight: '700' },
  durationText:{ color: colors.textMuted, fontSize: 11 },
  clientName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  sessionName:{ color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  sessionType:{ color: colors.textMuted, fontSize: 12 },
  sessionNotes:{ color: colors.textSecondary, fontSize: 12, fontStyle: 'italic', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 2 },
  modalOverlay:{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet:  { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:  { color: colors.text, fontSize: 20, fontWeight: '700' },
  tiposRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tipoChip:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tipoChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tipoText:    { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  clientChip:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  clientChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  clientChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  dateBtn:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border },
  dateBtnText:    { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
});
}
