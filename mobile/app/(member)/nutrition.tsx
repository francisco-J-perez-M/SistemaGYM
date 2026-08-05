/**
 * Pantalla Nutrición — plan alimenticio y recetas.
 *
 * El plan del entrenador se guarda anidado (`semanas → dias → comidas`) y los
 * planes antiguos o los que crea el propio miembro traen `comidas` sueltas.
 * `aplanarDias()` reduce ambos formatos a una lista de días, que es la única
 * forma de que el miembro vea el plan completo venga de donde venga.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray, toStr } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DetalleReceta, { macro } from '../../components/member/DetalleReceta';
import type { Receta, Dieta, DiaDieta, ComidaDieta } from '../../types';

type Tab = 'dietas' | 'recetas';

/**
 * Devuelve los días del plan, sea cual sea el formato en que se guardó.
 *
 * - Formato del entrenador: semanas[].dias[].comidas[]
 * - Formato plano (legado y planes del propio miembro): comidas[]
 *
 * Cuando hay varias semanas, el número de semana se antepone al día para que
 * "Lunes" de la semana 1 no se confunda con el de la semana 2.
 */
function aplanarDias(d: Dieta): DiaDieta[] {
  const semanas = toArray(d.semanas);

  if (semanas.length > 0) {
    const varias = semanas.length > 1;
    return semanas.flatMap((sem, i) =>
      toArray<DiaDieta>(sem?.dias).map((dia) => ({
        ...dia,
        dia: varias
          ? `Semana ${sem?.semana ?? i + 1} · ${toStr(dia?.dia, 'Día')}`
          : toStr(dia?.dia, 'Día'),
      })),
    );
  }

  // Sin semanas, las comidas planas se presentan como un único día para que la
  // pantalla no necesite dos ramas de dibujado.
  const comidas = toArray<ComidaDieta>(d.comidas);
  return comidas.length > 0 ? [{ dia: 'Plan diario', comidas }] : [];
}

/** Línea legible de una comida: lo que se come, sin importar dónde se guardó. */
function detalleComida(c: ComidaDieta): string[] {
  const alimentos = toArray<string>(c?.alimentos).map((a) => toStr(a)).filter(Boolean);
  const recetas   = toArray<string>(c?.recetas).map((r) => toStr(r)).filter(Boolean);
  return [...alimentos, ...recetas];
}

export default function NutritionScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  const CAT_COLORS: Record<string, string> = {
    'Alta proteína': colors.error,
    'Bajo carbohidrato': colors.warning,
    'Vegetariana': colors.success,
    'Vegana': colors.success,
    'Equilibrada': colors.info,
    'Pre-entreno': colors.accent,
    'Post-entreno': colors.purple,
  };
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('dietas');
  const [catFilter, setCatFilter] = useState<string>('Todas');
  // Plan desplegado por completo y receta cuya ficha se está viendo.
  const [dietaAbierta,  setDietaAbierta]  = useState<string | null>(null);
  const [recetaAbierta, setRecetaAbierta] = useState<Receta | null>(null);

  const { data: dietasRes, loading: loadingD, refetch: refetchD } = useFetch<{ dietas: Dieta[] }>(ENDPOINTS.DIETAS);
  const { data: recetasRes, loading: loadingR, refetch: refetchR } = useFetch<{ recetas: Receta[] }>(ENDPOINTS.RECETAS);

  const dietas  = dietasRes?.dietas  ?? [];
  const recetas = recetasRes?.recetas ?? [];
  const categories = ['Todas', ...Array.from(new Set(recetas.map((r) => r.categoria).filter(Boolean)))] as string[];
  const filteredRecetas = recetas.filter(
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
          refreshControl={<RefreshControl refreshing={loadingD} onRefresh={refetchD} tintColor={colors.accent} />}
        >
          {dietas.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="nutrition-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyText}>No tienes planes alimenticios aún.</Text>
              <Text style={styles.emptyHint}>Contacta a tu entrenador para que te asigne uno.</Text>
            </View>
          ) : (
            dietas.map((d) => {
              const dias     = aplanarDias(d);
              const kcal     = d.calorias_objetivo ?? d.calorias_meta;
              const abierta  = dietaAbierta === d._id;
              const visibles = abierta ? dias : dias.slice(0, 1);

              return (
                <Card key={d._id} style={styles.dietCard}>
                  <View style={styles.dietTop}>
                    <View style={styles.dietIconBox}>
                      <Ionicons name="leaf-outline" size={22} color={colors.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dietName}>{toStr(d.nombre, 'Plan alimenticio')}</Text>
                      <Text style={styles.dietCals}>
                        {[
                          kcal ? `${kcal} kcal / día` : null,
                          dias.length ? `${dias.length} día(s)` : null,
                          d.objetivo ? toStr(d.objetivo) : null,
                        ].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </View>

                  {!!d.descripcion && <Text style={styles.dietDesc}>{toStr(d.descripcion)}</Text>}
                  {!!d.notas && <Text style={styles.dietDesc}>{toStr(d.notas)}</Text>}

                  {/* Metas de macros, si el entrenador las fijó */}
                  {(d.proteinas_meta_g || d.carbohidratos_meta_g || d.grasas_meta_g) && (
                    <View style={styles.macroRow}>
                      {!!d.proteinas_meta_g     && <MacroPill label="P" value={d.proteinas_meta_g}     color={colors.error}   styles={styles} />}
                      {!!d.carbohidratos_meta_g && <MacroPill label="C" value={d.carbohidratos_meta_g} color={colors.warning} styles={styles} />}
                      {!!d.grasas_meta_g        && <MacroPill label="G" value={d.grasas_meta_g}        color={colors.info}    styles={styles} />}
                    </View>
                  )}

                  {dias.length === 0 ? (
                    <Text style={styles.dietDesc}>
                      Este plan aún no tiene comidas cargadas.
                    </Text>
                  ) : (
                    <>
                      {visibles.map((dia, iDia) => (
                        <View key={`${dia.dia}-${iDia}`} style={styles.diaBloque}>
                          <Text style={styles.diaTitulo}>{toStr(dia.dia, 'Día')}</Text>
                          {toArray<ComidaDieta>(dia.comidas).map((c, i) => {
                            const detalle = detalleComida(c);
                            return (
                              <View key={i} style={styles.mealRow}>
                                <Ionicons name="restaurant-outline" size={14} color={colors.accent} />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.mealName}>
                                    {toStr(c.nombre, 'Comida')}
                                    {c.hora ? <Text style={styles.mealHora}>  {toStr(c.hora)}</Text> : null}
                                  </Text>
                                  {detalle.length > 0 && (
                                    <Text style={styles.mealDetalle}>{detalle.join(' · ')}</Text>
                                  )}
                                  {!!c.notas && <Text style={styles.mealDetalle}>{toStr(c.notas)}</Text>}
                                </View>
                                {!!c.calorias && (
                                  <Text style={styles.mealKcal}>{c.calorias} kcal</Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      ))}

                      {/* Un plan de varias semanas no cabe entero en la tarjeta:
                          se muestra el primer día y el resto se despliega. */}
                      {dias.length > 1 && (
                        <TouchableOpacity
                          style={styles.verMas}
                          onPress={() => setDietaAbierta(abierta ? null : d._id)}
                          accessibilityRole="button"
                          accessibilityLabel={abierta ? 'Contraer el plan' : 'Ver el plan completo'}
                        >
                          <Text style={styles.verMasTxt}>
                            {abierta ? 'Mostrar menos' : `Ver los ${dias.length} días`}
                          </Text>
                          <Ionicons
                            name={abierta ? 'chevron-up' : 'chevron-down'}
                            size={15}
                            color={colors.accent}
                          />
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </Card>
              );
            })
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
            refreshControl={<RefreshControl refreshing={loadingR} onRefresh={refetchR} tintColor={colors.accent} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="restaurant-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyText}>No hay recetas en esta categoría.</Text>
              </View>
            }
            renderItem={({ item: r }) => {
              const p = macro(r, 'proteinas');
              const c = macro(r, 'carbohidratos');
              const g = macro(r, 'grasas');
              // Una data URL truncada da un cuadro gris; se descarta antes.
              const hayImagen = !!r.imagen && String(r.imagen).length > 24;

              return (
                <TouchableOpacity
                  onPress={() => setRecetaAbierta(r)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver la receta ${toStr(r.nombre)}`}
                >
                  <Card style={styles.recipeCard}>
                    <View style={styles.recipeTop}>
                      {hayImagen ? (
                        <Image
                          source={{ uri: String(r.imagen) }}
                          style={styles.recipeFoto}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.recipeAccent, { backgroundColor: CAT_COLORS[toStr(r.categoria)] ?? colors.accent }]} />
                      )}
                      <View style={{ flex: 1, paddingLeft: 12 }}>
                        <Text style={styles.recipeName}>{toStr(r.nombre, 'Receta')}</Text>
                        {!!r.categoria && <Badge label={toStr(r.categoria)} color="accent" />}
                        {!!r.tiempo_preparacion_min && (
                          <Text style={styles.recipeTiempo}>
                            {r.tiempo_preparacion_min} min de preparación
                          </Text>
                        )}
                      </View>
                      {r.calorias !== undefined && (
                        <View style={styles.calBox}>
                          <Text style={styles.calNum}>{r.calorias}</Text>
                          <Text style={styles.calUnit}>kcal</Text>
                        </View>
                      )}
                    </View>

                    {/* Macros */}
                    <View style={styles.macroRow}>
                      {p !== undefined && <MacroPill label="P" value={p} color={colors.error}   styles={styles} />}
                      {c !== undefined && <MacroPill label="C" value={c} color={colors.warning} styles={styles} />}
                      {g !== undefined && <MacroPill label="G" value={g} color={colors.info}    styles={styles} />}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}

      {/* Ficha completa de la receta elegida */}
      <DetalleReceta receta={recetaAbierta} onClose={() => setRecetaAbierta(null)} />
    </View>
  );
}

function MacroPill({ label, value, color, styles }: { label: string; value: number; color: string; styles: ReturnType<typeof make_styles> }) {
  return (
    <View style={[styles.macroPill, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.macroLabel, { color }]}>{label}</Text>
      <Text style={[styles.macroVal,   { color }]}>{value}g</Text>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.background },
  header:       { paddingHorizontal: 20, paddingTop: 16, gap: 14, paddingBottom: 8 },
  title:        { color: colors.text, fontSize: 26 * fs, fontWeight: '700' },
  tabRow:       { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border },
  tab:          { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive:    { backgroundColor: colors.accent },
  tabText:      { color: colors.textSecondary, fontSize: 14 * fs, fontWeight: '600' },
  tabTextActive:{ color: colors.onAccent },
  catScroll:    { maxHeight: 48, marginTop: 8 },
  catContent:   { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  catChip:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  catChipActive:{ backgroundColor: colors.accent, borderColor: colors.accent },
  catChipText:  { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
  catChipTextActive: { color: colors.onAccent },
  listContent:  { padding: 20, gap: 12, paddingBottom: 32 },
  empty:        { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText:    { color: colors.textMuted, fontSize: 15 * fs, fontWeight: '600', textAlign: 'center' },
  emptyHint:    { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center' },
  dietCard:     { gap: 10 },
  dietTop:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dietIconBox:  { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center' },
  dietName:     { color: colors.text, fontSize: 16 * fs, fontWeight: '700' },
  dietCals:     { color: colors.accent, fontSize: 13 * fs },
  dietDesc:     { color: colors.textSecondary, fontSize: 13 * fs, lineHeight: 18 },
  mealList:     { gap: 6, marginTop: 4 },
  mealRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 5 },
  mealName:     { color: colors.text, fontSize: 13 * fs, fontWeight: '600' },
  mealHora:     { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '400' },
  mealDetalle:  { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2, lineHeight: 17 },
  mealKcal:     { color: colors.accent, fontSize: 12 * fs, fontWeight: '700' },

  // Bloque de un día dentro del plan
  diaBloque: {
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  diaTitulo: { color: colors.accent, fontSize: 13 * fs, fontWeight: '700', marginBottom: 2 },
  verMas: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    marginTop: 12, paddingVertical: 9, borderRadius: 10,
    backgroundColor: colors.accentBg,
  },
  verMasTxt:    { color: colors.accent, fontSize: 13 * fs, fontWeight: '600' },
  recipeFoto:   { width: 68, height: 68, borderRadius: 12, backgroundColor: colors.surface },
  recipeTiempo: { color: colors.textSecondary, fontSize: 11.5 * fs, marginTop: 3 },
  recipeCard:   { overflow: 'hidden', padding: 0 },
  recipeTop:    { flexDirection: 'row', alignItems: 'center', padding: 14, paddingLeft: 0, gap: 0 },
  recipeAccent: { width: 4, height: '100%', borderTopLeftRadius: 16, borderBottomLeftRadius: 16, minHeight: 60 },
  recipeName:   { color: colors.text, fontSize: 15 * fs, fontWeight: '700', marginBottom: 4 },
  calBox:       { alignItems: 'flex-end' },
  calNum:       { color: colors.warning, fontSize: 20 * fs, fontWeight: '800' },
  calUnit:      { color: colors.textSecondary, fontSize: 11 * fs },
  macroRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  macroPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  macroLabel:   { fontSize: 11 * fs, fontWeight: '700' },
  macroVal:     { fontSize: 12 * fs, fontWeight: '600' },
});
}
