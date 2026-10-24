/**
 * Pantalla Nutrición — plan alimenticio y recetas.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { Receta, Dieta } from '../../types';

type Tab = 'dietas' | 'recetas';

const CAT_COLORS: Record<string, string> = {
  'Alta proteína': Colors.error,
  'Bajo carbohidrato': Colors.warning,
  'Vegetariana': Colors.success,
  'Vegana': Colors.success,
  'Equilibrada': Colors.info,
  'Pre-entreno': Colors.accent,
  'Post-entreno': Colors.purple,
};

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('dietas');
  const [catFilter, setCatFilter] = useState<string>('Todas');

  const { data: dietas,  loading: loadingD, refetch: refetchD } = useFetch<Dieta[]>(ENDPOINTS.DIETAS);
  const { data: recetas, loading: loadingR, refetch: refetchR } = useFetch<Receta[]>(ENDPOINTS.RECETAS);

  const categories = ['Todas', ...Array.from(new Set((recetas ?? []).map((r) => r.categoria).filter(Boolean)))];
  const filteredRecetas = (recetas ?? []).filter(
    (r) => catFilter === 'Todas' || r.categoria === catFilter
  );

  const isLoading = loadingD || loadingR;

  if (isLoading) return <LoadingSpinner fullScreen message="Cargando nutrición…" />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Nutrición</Text>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['dietas', 'recetas'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === t && styles.tabActive]}
              onPress={() => setActiveTab(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === t }}
              accessibilityLabel={t === 'dietas' ? 'Planes alimenticios' : 'Recetas saludables'}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'dietas' ? 'Planes' : 'Recetas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dietas tab */}
      {activeTab === 'dietas' && (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loadingD} onRefresh={refetchD} tintColor={Colors.accent} />}
        >
          {(dietas ?? []).length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="nutrition-outline" size={44} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No tienes planes alimenticios aún.</Text>
              <Text style={styles.emptyHint}>Contacta a tu entrenador para que te asigne uno.</Text>
            </View>
          ) : (
            (dietas ?? []).map((d) => (
              <Card key={d._id} style={styles.dietCard}>
                <View style={styles.dietTop}>
                  <View style={styles.dietIconBox}>
                    <Ionicons name="leaf-outline" size={22} color={Colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dietName}>{d.nombre}</Text>
                    {d.calorias_objetivo && (
                      <Text style={styles.dietCals}>{d.calorias_objetivo} kcal / día</Text>
                    )}
                  </View>
                </View>
                {d.descripcion && (
                  <Text style={styles.dietDesc}>{d.descripcion}</Text>
                )}
                {(d.comidas ?? []).length > 0 && (
                  <View style={styles.mealList}>
                    {d.comidas.map((c, i) => (
                      <View key={i} style={styles.mealRow}>
                        <Ionicons name="time-outline" size={14} color={Colors.accent} />
                        <Text style={styles.mealName}>{c.nombre}</Text>
                        {c.hora && <Text style={styles.mealHora}>{c.hora}</Text>}
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* Recetas tab */}
      {activeTab === 'recetas' && (
        <>
          {/* Category filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={styles.catContent}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, catFilter === cat && styles.catChipActive]}
                onPress={() => setCatFilter(cat)}
                accessibilityRole="button"
                accessibilityState={{ selected: catFilter === cat }}
                accessibilityLabel={`Filtrar por ${cat}`}
              >
                <Text style={[styles.catChipText, catFilter === cat && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredRecetas}
            keyExtractor={(r) => r._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={loadingR} onRefresh={refetchR} tintColor={Colors.accent} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="restaurant-outline" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No hay recetas en esta categoría.</Text>
              </View>
            }
            renderItem={({ item: r }) => (
              <Card style={styles.recipeCard}>
                <View style={styles.recipeTop}>
                  <View style={[styles.recipeAccent, { backgroundColor: CAT_COLORS[r.categoria] ?? Colors.accent }]} />
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <Text style={styles.recipeName}>{r.nombre}</Text>
                    <Badge label={r.categoria} color="accent" />
                  </View>
                  <View style={styles.calBox}>
                    <Text style={styles.calNum}>{r.calorias}</Text>
                    <Text style={styles.calUnit}>kcal</Text>
                  </View>
                </View>

                {/* Macros */}
                <View style={styles.macroRow}>
                  {r.proteinas    !== undefined && <MacroPill label="P" value={r.proteinas}    color={Colors.error}   />}
                  {r.carbohidratos !== undefined && <MacroPill label="C" value={r.carbohidratos} color={Colors.warning} />}
                  {r.grasas       !== undefined && <MacroPill label="G" value={r.grasas}       color={Colors.info}    />}
                </View>
              </Card>
            )}
          />
        </>
      )}
    </View>
  );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.macroPill, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.macroLabel, { color }]}>{label}</Text>
      <Text style={[styles.macroVal,   { color }]}>{value}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.background },
  header:       { paddingHorizontal: 20, paddingTop: 16, gap: 14, paddingBottom: 8 },
  title:        { color: Colors.text, fontSize: 26, fontWeight: '700' },
  tabRow:       { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border },
  tab:          { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive:    { backgroundColor: Colors.accent },
  tabText:      { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  tabTextActive:{ color: '#fff' },
  catScroll:    { maxHeight: 48, marginTop: 8 },
  catContent:   { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  catChip:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  catChipActive:{ backgroundColor: Colors.accent, borderColor: Colors.accent },
  catChipText:  { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  catChipTextActive: { color: '#fff' },
  listContent:  { padding: 20, gap: 12, paddingBottom: 32 },
  empty:        { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText:    { color: Colors.textMuted, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptyHint:    { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
  dietCard:     { gap: 10 },
  dietTop:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dietIconBox:  { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.successBg, alignItems: 'center', justifyContent: 'center' },
  dietName:     { color: Colors.text, fontSize: 16, fontWeight: '700' },
  dietCals:     { color: Colors.accent, fontSize: 13 },
  dietDesc:     { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  mealList:     { gap: 6, marginTop: 4 },
  mealRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mealName:     { color: Colors.text, fontSize: 13, flex: 1 },
  mealHora:     { color: Colors.textSecondary, fontSize: 12 },
  recipeCard:   { overflow: 'hidden', padding: 0 },
  recipeTop:    { flexDirection: 'row', alignItems: 'center', padding: 14, paddingLeft: 0, gap: 0 },
  recipeAccent: { width: 4, height: '100%', borderTopLeftRadius: 16, borderBottomLeftRadius: 16, minHeight: 60 },
  recipeName:   { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  calBox:       { alignItems: 'flex-end' },
  calNum:       { color: Colors.warning, fontSize: 20, fontWeight: '800' },
  calUnit:      { color: Colors.textSecondary, fontSize: 11 },
  macroRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  macroPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  macroLabel:   { fontSize: 11, fontWeight: '700' },
  macroVal:     { fontSize: 12, fontWeight: '600' },
});
