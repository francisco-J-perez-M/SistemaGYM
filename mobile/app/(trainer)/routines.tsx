/**
 * Rutinas — Entrenador
 * GET /api/trainer/routines → { success, routines, total, categoryCounts }
 *
 * Campos reales por rutina:
 *   id, name, category, duration, exercises (count), difficulty,
 *   clients, description, active, lastUsed,
 *   exerciseList: [{ name, sets, rest, day, peso, imagenes }]
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  RefreshControl, LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toStr, toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

// ── Types reales del API ──────────────────────────────────────────────────────
interface ExerciseItem {
  name:     string;
  sets:     string;   // e.g. "3x12"
  rest:     string;
  day:      string;
  peso?:    string;
}

interface Routine {
  id:          string;
  name:        string;
  category:    string;
  duration:    string;   // e.g. "60 min"
  exercises:   number;   // total count
  difficulty:  string;
  clients:     number;
  description: string;
  active:      boolean;
  lastUsed:    string;
  exerciseList: ExerciseItem[];
}

interface Exercise {
  id:              number;
  nombre:          string;
  descripcion?:    string;
  grupo_muscular?: string;
  tipo?:           string;
  series?:         number;
  repeticiones?:   string;
  duracion_min?:   number;
}

interface RoutinesResponse {
  success:        boolean;
  routines:       Routine[];
  total:          number;
  categoryCounts: Record<string, number>;
}

const DIFF_COLOR: Record<string, 'success' | 'warning' | 'error' | 'accent'> = {
  'Principiante': 'success',
  'Intermedio':   'warning',
  'Avanzado':     'error',
};

const CAT_ICONS: Record<string, string> = {
  'Fuerza':      'barbell-outline',
  'Hipertrofia': 'body-outline',
  'Cardio':      'heart-outline',
  'Funcional':   'flash-outline',
  'Movilidad':   'accessibility-outline',
  'General':     'grid-outline',
};

type MainTab = 'rutinas' | 'ejercicios';

export default function TrainerRoutinesScreen() {
  const insets = useSafeAreaInsets();
  const [mainTab,    setMainTab]    = useState<MainTab>('rutinas');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [catFilter,  setCatFilter]  = useState<string>('Todas');
  const [exSearch,   setExSearch]   = useState('');

  const { data, loading, refetch } = useFetch<RoutinesResponse>(ENDPOINTS.TRAINER_ROUTINES);
  const { data: exData, loading: loadingEx, refetch: refetchEx } =
    useFetch<{ exercises: Exercise[] }>(ENDPOINTS.TRAINER_EXERCISES);

  if (loading && mainTab === 'rutinas') return <LoadingSpinner fullScreen message="Cargando rutinas…" />;
  if (loadingEx && mainTab === 'ejercicios') return <LoadingSpinner fullScreen message="Cargando ejercicios…" />;

  const routines = toArray(data?.routines ?? (Array.isArray(data) ? data : []));
  const cats     = ['Todas', ...Object.keys(data?.categoryCounts ?? {}).filter(k => (data?.categoryCounts?.[k] ?? 0) > 0)];
  const filtered = catFilter === 'Todas' ? routines : routines.filter(r => r.category === catFilter);

  const allExercises = toArray(exData?.exercises ?? []);
  const filteredEx   = exSearch
    ? allExercises.filter(e => e.nombre.toLowerCase().includes(exSearch.toLowerCase()) || (e.grupo_muscular ?? '').toLowerCase().includes(exSearch.toLowerCase()))
    : allExercises;

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Rutinas</Text>
        <Text style={styles.sub}>{routines.length} creadas · {allExercises.length} ejercicios</Text>
      </View>

      {/* Tab principal */}
      <View style={styles.mainTabRow}>
        {([['rutinas','Rutinas','barbell-outline'],['ejercicios','Ejercicios','list-outline']] as const).map(([t,label,icon])=>(
          <TouchableOpacity key={t} style={[styles.mainTab, mainTab===t && styles.mainTabActive]}
            onPress={()=>setMainTab(t)} accessibilityRole="tab" accessibilityState={{selected:mainTab===t}}>
            <Ionicons name={icon} size={15} color={mainTab===t ? Colors.accent : Colors.textSecondary}/>
            <Text style={[styles.mainTabText, mainTab===t && styles.mainTabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TAB EJERCICIOS ── */}
      {mainTab === 'ejercicios' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o grupo…"
              placeholderTextColor={Colors.textMuted}
              value={exSearch}
              onChangeText={setExSearch}
              accessibilityLabel="Buscar ejercicios"
            />
          </View>
          <FlatList
            data={filteredEx}
            keyExtractor={(e) => String(e.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={loadingEx} onRefresh={refetchEx} tintColor={Colors.accent} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="barbell-outline" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No se encontraron ejercicios.</Text>
              </View>
            }
            renderItem={({ item: e }) => (
              <View style={styles.exCard}>
                <View style={styles.exCardIcon}>
                  <Ionicons name="barbell-outline" size={18} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exCardName}>{e.nombre}</Text>
                  <Text style={styles.exCardMeta}>
                    {[e.grupo_muscular, e.tipo,
                      e.series && e.repeticiones && `${e.series}×${e.repeticiones}`,
                      e.duracion_min && `${e.duracion_min} min`
                    ].filter(Boolean).join(' · ')}
                  </Text>
                  {e.descripcion ? <Text style={styles.exCardDesc} numberOfLines={2}>{e.descripcion}</Text> : null}
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* ── TAB RUTINAS ── */}
      {mainTab === 'rutinas' && <>
      {/* Filtro por categoría */}
      <FlatList
        horizontal
        data={cats}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.catChip, catFilter === cat && styles.catChipActive]}
            onPress={() => setCatFilter(cat)}
            accessibilityRole="button"
            accessibilityState={{ selected: catFilter === cat }}
          >
            <Text style={[styles.catText, catFilter === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Lista de rutinas */}
      <FlatList
        data={filtered}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No hay rutinas en esta categoría.</Text>
            <Text style={styles.emptyHint}>Crea rutinas desde el portal web.</Text>
          </View>
        }
        renderItem={({ item: r }) => {
          const isOpen  = expandedId === r.id;
          const icon    = CAT_ICONS[r.category] ?? 'grid-outline';
          const diffColor = DIFF_COLOR[r.difficulty] ?? 'accent';

          return (
            <Card style={styles.card}>
              {/* Cabecera de la rutina */}
              <TouchableOpacity
                onPress={() => toggle(r.id)}
                style={styles.cardTop}
                accessibilityRole="button"
                accessibilityLabel={`${r.name}, ${r.exercises} ejercicios`}
                accessibilityState={{ expanded: isOpen }}
              >
                <View style={styles.catIcon}>
                  <Ionicons name={icon as any} size={20} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineName}>{toStr(r.name)}</Text>
                  <Text style={styles.routineMeta}>
                    {r.category} · {r.duration} · {r.clients} cliente{r.clients !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <Badge label={r.active ? 'Activa' : 'Inactiva'} color={r.active ? 'success' : 'warning'} />
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <StatPill icon="barbell-outline"   label={`${r.exercises} ejercicios`} />
                <StatPill icon="flash-outline"      label={r.difficulty} color={diffColor === 'error' ? Colors.error : diffColor === 'warning' ? Colors.warning : Colors.success} />
                <StatPill icon="time-outline"       label={r.lastUsed ?? 'Nunca'} />
              </View>

              {/* Descripción */}
              {r.description ? (
                <Text style={styles.routineDesc} numberOfLines={isOpen ? undefined : 1}>
                  {r.description}
                </Text>
              ) : null}

              {/* Lista de ejercicios (expandible) */}
              {isOpen && toArray(r.exerciseList).length > 0 && (
                <View style={styles.exList}>
                  <Text style={styles.exListTitle}>Ejercicios</Text>
                  {r.exerciseList.map((ex, i) => (
                    <View key={i} style={styles.exRow}>
                      <View style={styles.exNumBox}>
                        <Text style={styles.exNum}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exName}>{toStr(ex.name)}</Text>
                        <Text style={styles.exMeta}>
                          {[ex.sets, ex.rest && `Desc: ${ex.rest}`, ex.peso && `${ex.peso} kg`]
                            .filter(Boolean).join(' · ')}
                        </Text>
                        {ex.day ? <Text style={styles.exDay}>{ex.day}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          );
        }}
      />
      </>}
    </View>
  );
}

function StatPill({ icon, label, color }: { icon: string; label: string; color?: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon as any} size={12} color={color ?? Colors.textSecondary} />
      <Text style={[styles.statLabel, color && { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.background },
  header:  { paddingHorizontal: 20, gap: 2, paddingBottom: 8 },
  title:   { color: Colors.text, fontSize: 26, fontWeight: '700' },
  sub:     { color: Colors.textSecondary, fontSize: 13 },
  catScroll:  { maxHeight: 44, marginBottom: 4 },
  catContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  catText:       { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: '#fff' },
  list:   { padding: 16, gap: 12, paddingBottom: 32 },
  empty:  { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
  emptyHint: { color: Colors.textMuted, fontSize: 13 },
  card:       { gap: 8 },
  cardTop:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardActions:{ alignItems: 'flex-end', gap: 4 },
  catIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(108,99,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  routineName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  routineMeta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  statsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.backgroundAlt ?? Colors.card, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statLabel:   { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  routineDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  exList:      { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, gap: 8 },
  exListTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  exRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exNumBox:    { width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(108,99,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  exNum:       { color: Colors.accent, fontSize: 12, fontWeight: '700' },
  exName:      { color: Colors.text, fontSize: 14, fontWeight: '600' },
  exMeta:      { color: Colors.accent, fontSize: 12 },
  exDay:       { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  mainTabRow:  { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: Colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border },
  mainTab:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 },
  mainTabActive: { backgroundColor: 'rgba(108,99,255,0.15)' },
  mainTabText:   { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  mainTabTextActive: { color: Colors.accent },
  searchBox:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingHorizontal: 10, paddingVertical: 10 },
  exCard:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  exCardIcon:  { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(108,99,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  exCardName:  { color: Colors.text, fontSize: 14, fontWeight: '700' },
  exCardMeta:  { color: Colors.accent, fontSize: 12, marginTop: 2 },
  exCardDesc:  { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
});
