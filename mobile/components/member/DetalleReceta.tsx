/**
 * DetalleReceta — ficha completa de una receta.
 *
 * La lista de recetas solo cabe para el nombre y los macros; aquí se ve la
 * imagen, los ingredientes y la preparación, que es lo que el miembro necesita
 * para cocinarla.
 *
 * Los datos vienen con dos juegos de nombres según quién creó la receta
 * (`proteinas_g` desde la biblioteca del entrenador, `proteinas` en las
 * antiguas) y los ingredientes pueden ser texto libre o una lista de objetos.
 * Las funciones `macro()` e `ingredientesComoLista()` normalizan ambos casos,
 * porque la pantalla no debería saber de qué versión del backend salió el dato.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { toArray, toStr } from '../../utils/format';
import type { Receta, IngredienteReceta } from '../../types';

interface Props {
  receta:  Receta | null;
  onClose: () => void;
}

/** Macro de la receta, venga con sufijo `_g` o sin él. */
export function macro(r: Receta | null, clave: 'proteinas' | 'carbohidratos' | 'grasas'): number | undefined {
  if (!r) return undefined;
  const conSufijo = (r as any)[`${clave}_g`];
  const sinSufijo = (r as any)[clave];
  const val = conSufijo ?? sinSufijo;
  return typeof val === 'number' ? val : (val ? Number(val) : undefined);
}

/** Ingredientes como líneas de texto, sea cual sea el formato guardado. */
export function ingredientesComoLista(r: Receta | null): string[] {
  if (!r?.ingredientes) return [];

  // Formato viejo: un bloque de texto con un ingrediente por línea o por coma.
  if (typeof r.ingredientes === 'string') {
    return r.ingredientes
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return toArray<IngredienteReceta>(r.ingredientes)
    .map((ing) => [ing.cantidad, ing.unidad, ing.nombre]
      .filter((p) => p !== undefined && p !== null && String(p).trim() !== '')
      .join(' ')
      .trim())
    .filter(Boolean);
}

export default function DetalleReceta({ receta, onClose }: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const [imgFallo, setImgFallo] = useState(false);

  if (!receta) return null;

  const ingredientes = ingredientesComoLista(receta);
  const pasos = toStr(receta.instrucciones)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const proteinas     = macro(receta, 'proteinas');
  const carbohidratos = macro(receta, 'carbohidratos');
  const grasas        = macro(receta, 'grasas');

  // Una data URL vacía o rota deja un hueco gris; se detecta antes de pintarla.
  const hayImagen = !imgFallo && !!receta.imagen && String(receta.imagen).length > 24;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{toStr(receta.nombre, 'Receta')}</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.cuerpo, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
        >
          {hayImagen ? (
            <Image
              source={{ uri: String(receta.imagen) }}
              style={styles.foto}
              resizeMode="cover"
              onError={() => setImgFallo(true)}
            />
          ) : (
            <View style={[styles.foto, styles.fotoVacia]}>
              <Ionicons name="restaurant-outline" size={38} color={colors.textMuted} />
              <Text style={styles.fotoVaciaTxt}>Sin imagen</Text>
            </View>
          )}

          <Text style={styles.titulo}>{toStr(receta.nombre, 'Receta')}</Text>
          {!!receta.categoria && <Text style={styles.categoria}>{toStr(receta.categoria)}</Text>}
          {!!receta.descripcion && <Text style={styles.descripcion}>{toStr(receta.descripcion)}</Text>}

          {/* Cifras */}
          <View style={styles.cifras}>
            {receta.calorias !== undefined && (
              <Cifra valor={`${receta.calorias}`} unidad="kcal" tinte={colors.accent} styles={styles} />
            )}
            {proteinas !== undefined && (
              <Cifra valor={`${proteinas}`} unidad="g proteína" tinte={colors.error} styles={styles} />
            )}
            {carbohidratos !== undefined && (
              <Cifra valor={`${carbohidratos}`} unidad="g carbos" tinte={colors.warning} styles={styles} />
            )}
            {grasas !== undefined && (
              <Cifra valor={`${grasas}`} unidad="g grasas" tinte={colors.info} styles={styles} />
            )}
          </View>

          {!!receta.tiempo_preparacion_min && (
            <View style={styles.tiempo}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.tiempoTxt}>
                {receta.tiempo_preparacion_min} minutos de preparación
              </Text>
            </View>
          )}

          {ingredientes.length > 0 && (
            <>
              <Text style={styles.seccion}>Ingredientes</Text>
              {ingredientes.map((ing, i) => (
                <View key={`${ing}-${i}`} style={styles.item}>
                  <View style={styles.punto} />
                  <Text style={styles.itemTxt}>{ing}</Text>
                </View>
              ))}
            </>
          )}

          {pasos.length > 0 && (
            <>
              <Text style={styles.seccion}>Preparación</Text>
              {pasos.map((paso, i) => (
                <View key={i} style={styles.item}>
                  <View style={styles.numero}>
                    <Text style={styles.numeroTxt}>{i + 1}</Text>
                  </View>
                  <Text style={styles.itemTxt}>{paso}</Text>
                </View>
              ))}
            </>
          )}

          {ingredientes.length === 0 && pasos.length === 0 && (
            <Text style={styles.vacio}>
              Esta receta todavía no tiene ingredientes ni preparación registrados.
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Cifra({ valor, unidad, tinte, styles }: any) {
  return (
    <View style={styles.cifra}>
      <Text style={[styles.cifraVal, { color: tinte }]}>{valor}</Text>
      <Text style={styles.cifraUni}>{unidad}</Text>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.background,
    },
    headerTitle: { flex: 1, color: colors.text, fontSize: 17 * fs, fontWeight: '700' },

    cuerpo: { padding: 18, gap: 2 },
    foto:   { width: '100%', height: 200, borderRadius: 16, backgroundColor: colors.card },
    fotoVacia: {
      alignItems: 'center', justifyContent: 'center', gap: 6,
      borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    },
    fotoVaciaTxt: { color: colors.textMuted, fontSize: 12 * fs },

    titulo:     { color: colors.text, fontSize: 21 * fs, fontWeight: '800', marginTop: 16 },
    categoria:  { color: colors.accent, fontSize: 13 * fs, fontWeight: '600', marginTop: 3 },
    descripcion:{ color: colors.textSecondary, fontSize: 13.5 * fs, lineHeight: 20, marginTop: 8 },

    cifras: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
    cifra: {
      flexGrow: 1, minWidth: 76, alignItems: 'center',
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 13, paddingVertical: 11,
    },
    cifraVal: { fontSize: 19 * fs, fontWeight: '800' },
    cifraUni: { color: colors.textSecondary, fontSize: 11 * fs, marginTop: 1 },

    tiempo:    { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 },
    tiempoTxt: { color: colors.textSecondary, fontSize: 13 * fs },

    seccion: { color: colors.text, fontSize: 15.5 * fs, fontWeight: '700', marginTop: 24, marginBottom: 10 },
    item:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 9 },
    punto: {
      width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 7,
    },
    numero: {
      width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accentBg,
      alignItems: 'center', justifyContent: 'center',
    },
    numeroTxt: { color: colors.accent, fontSize: 11.5 * fs, fontWeight: '700' },
    itemTxt:   { flex: 1, color: colors.text, fontSize: 13.5 * fs, lineHeight: 20 },

    vacio: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center', marginTop: 28, lineHeight: 19 },
  });
}
