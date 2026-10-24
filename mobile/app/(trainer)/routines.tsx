import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

interface Routine {
  _id:       string;
  nombre:    string;
  cliente?:  string;
  dias?:     number;
  activa?:   boolean;
}

export default function TrainerRoutinesScreen() {
  const insets = useSafeAreaInsets();
  const { data, loading, refetch } = useFetch<Routine[]>(ENDPOINTS.TRAINER_ROUTINES);

  if (loading) return <LoadingSpinner fullScreen message="Cargando rutinas…" />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Rutinas asignadas</Text>
        <Text style={styles.sub}>{toArray(data).length} rutinas creadas</Text>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(r) => r._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No has creado rutinas aún.</Text>
            <Text style={styles.emptyHint}>Crea y asigna rutinas desde el portal web.</Text>
          </View>
        }
        renderItem={({ item: r }) => (
          <Card style={styles.routineCard}>
            <View style={styles.routineRow}>
              <View style={styles.routineIcon}>
                <Ionicons name="barbell-outline" size={20} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineName}>{r.nombre}</Text>
                {r.cliente && <Text style={styles.routineClient}>Cliente: {r.cliente}</Text>}
                {r.dias && <Text style={styles.routineDias}>{r.dias} días / semana</Text>}
              </View>
              <Badge label={r.activa ? 'Activa' : 'Inactiva'} color={r.activa ? 'success' : 'warning'} />
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, gap: 4, paddingBottom: 12 },
  title:  { color: Colors.text, fontSize: 26, fontWeight: '700' },
  sub:    { color: Colors.textSecondary, fontSize: 13 },
  list:   { padding: 20, gap: 10, paddingBottom: 32 },
  empty:  { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
  emptyHint: { color: Colors.textMuted, fontSize: 13 },
  routineCard: { marginBottom: 0 },
  routineRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routineIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(108,99,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  routineName:   { color: Colors.text, fontSize: 15, fontWeight: '600' },
  routineClient: { color: Colors.textSecondary, fontSize: 12 },
  routineDias:   { color: Colors.accent, fontSize: 12 },
});
