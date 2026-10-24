/**
 * FormularioEjercicio — alta y edición de un ejercicio de la biblioteca
 * personal del entrenador desde el móvil.
 *
 * Equivale al formulario del portal web, recortado a lo que se puede llenar con
 * comodidad en una pantalla de teléfono: nombre, grupo muscular, series, reps,
 * duración, descripción y hasta tres imágenes.
 *
 *   POST /api/trainer/exercises          alta
 *   PUT  /api/trainer/exercises/<id>     edición
 *
 * El backend rechaza con 409 un nombre repetido dentro de la biblioteca del
 * entrenador; ese mensaje se muestra tal cual porque explica el problema mejor
 * que un "error al guardar" genérico.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, TextInput,
  TouchableOpacity, Alert, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { toArray, toStr } from '../../utils/format';
import api from '../../services/api';
import { elegirFoto } from '../../services/media';

/** Grupos musculares del sistema. Mismo catálogo que usa la web. */
export const GRUPOS_MUSCULARES = [
  'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio', 'Full body',
];

const TIPOS = ['Fuerza', 'Cardio', 'Movilidad', 'Funcional'];

/** Tope de imágenes que acepta el backend por ejercicio. */
const MAX_IMAGENES = 3;

export interface EjercicioEditable {
  id?:             number;
  nombre?:         string;
  descripcion?:    string | null;
  grupo_muscular?: string | null;
  tipo?:           string | null;
  series?:         number | null;
  repeticiones?:   string | null;
  duracion_min?:   number | null;
  imagenes?:       string[] | null;
  video?:          string | null;
}

interface Props {
  visible:   boolean;
  /** Ejercicio a editar; null o undefined abre el formulario en modo alta. */
  ejercicio?: EjercicioEditable | null;
  onClose:   () => void;
  /** Se llama tras guardar con éxito, para que la lista se recargue. */
  onGuardado: () => void;
}

export default function FormularioEjercicio({
  visible, ejercicio, onClose, onGuardado,
}: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  const editando = !!ejercicio?.id;

  const [nombre,      setNombre]      = useState(toStr(ejercicio?.nombre));
  const [grupo,       setGrupo]       = useState(toStr(ejercicio?.grupo_muscular));
  const [tipo,        setTipo]        = useState(toStr(ejercicio?.tipo));
  const [series,      setSeries]      = useState(ejercicio?.series ? String(ejercicio.series) : '');
  const [reps,        setReps]        = useState(toStr(ejercicio?.repeticiones));
  const [duracion,    setDuracion]    = useState(ejercicio?.duracion_min ? String(ejercicio.duracion_min) : '');
  const [descripcion, setDescripcion] = useState(toStr(ejercicio?.descripcion));
  const [video,       setVideo]       = useState(toStr(ejercicio?.video));
  const [imagenes,    setImagenes]    = useState<string[]>(toArray<string>(ejercicio?.imagenes));
  const [guardando,   setGuardando]   = useState(false);

  const agregarImagen = async () => {
    if (imagenes.length >= MAX_IMAGENES) {
      Alert.alert('Máximo alcanzado', `Un ejercicio admite hasta ${MAX_IMAGENES} imágenes.`);
      return;
    }
    const res = await elegirFoto();
    if (res.ok && res.dataUrl) {
      setImagenes((prev) => [...prev, res.dataUrl!]);
    } else if (res.error) {
      // `error: null` significa que el usuario canceló: eso no es un fallo y no
      // se le avisa de nada.
      Alert.alert('No se pudo agregar la imagen', res.error);
    }
  };

  const guardar = async () => {
    const limpio = nombre.trim();
    if (!limpio) {
      Alert.alert('Falta el nombre', 'El ejercicio necesita un nombre para guardarse.');
      return;
    }

    setGuardando(true);
    try {
      // Los campos numéricos vacíos se mandan como null y no como cadena vacía:
      // el backend hace int() sobre ellos y "" lanzaría ValueError.
      const cuerpo = {
        nombre:         limpio,
        grupo_muscular: grupo || null,
        tipo:           tipo || null,
        series:         series ? Number(series) : null,
        repeticiones:   reps.trim() || null,
        duracion_min:   duracion ? Number(duracion) : null,
        descripcion:    descripcion.trim() || null,
        video:          video.trim() || null,
        imagenes:       imagenes.slice(0, MAX_IMAGENES),
      };

      if (editando) {
        await api.put(`${ENDPOINTS.TRAINER_EXERCISES}/${ejercicio!.id}`, cuerpo);
      } else {
        await api.post(ENDPOINTS.TRAINER_EXERCISES, cuerpo);
      }

      onGuardado();
      onClose();
    } catch (e: any) {
      Alert.alert(
        'No se pudo guardar',
        e?.response?.data?.error || 'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            accessibilityLabel="Cancelar"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {editando ? 'Editar ejercicio' : 'Nuevo ejercicio'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.cuerpo, { paddingBottom: insets.bottom + 90 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Press de banca"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Nombre del ejercicio"
          />

          <Text style={styles.label}>Grupo muscular</Text>
          <View style={styles.chips}>
            {GRUPOS_MUSCULARES.map((g) => (
              <Chip key={g} activo={grupo === g} onPress={() => setGrupo(grupo === g ? '' : g)} styles={styles}>
                {g}
              </Chip>
            ))}
          </View>

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.chips}>
            {TIPOS.map((t) => (
              <Chip key={t} activo={tipo === t} onPress={() => setTipo(tipo === t ? '' : t)} styles={styles}>
                {t}
              </Chip>
            ))}
          </View>

          <View style={styles.fila}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Series</Text>
              <TextInput
                style={styles.input}
                value={series}
                onChangeText={(v) => setSeries(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="4"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Número de series"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Repeticiones</Text>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                placeholder="8-12"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Repeticiones"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Minutos</Text>
              <TextInput
                style={styles.input}
                value={duracion}
                onChangeText={(v) => setDuracion(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Duración en minutos"
              />
            </View>
          </View>

          <Text style={styles.label}>Instrucciones</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Cómo ejecutarlo, errores comunes, respiración…"
            placeholderTextColor={colors.textMuted}
            multiline
            accessibilityLabel="Instrucciones del ejercicio"
          />

          <Text style={styles.label}>Video (enlace)</Text>
          <TextInput
            style={styles.input}
            value={video}
            onChangeText={setVideo}
            placeholder="https://…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
            accessibilityLabel="Enlace del video"
          />

          <Text style={styles.label}>Imágenes ({imagenes.length}/{MAX_IMAGENES})</Text>
          <View style={styles.galeria}>
            {imagenes.map((img, i) => (
              <View key={i} style={styles.miniWrap}>
                <Image source={{ uri: img }} style={styles.mini} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.quitarImg}
                  onPress={() => setImagenes((prev) => prev.filter((_, idx) => idx !== i))}
                  accessibilityLabel={`Quitar imagen ${i + 1}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={13} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {imagenes.length < MAX_IMAGENES && (
              <TouchableOpacity
                style={styles.agregarImg}
                onPress={agregarImagen}
                accessibilityLabel="Agregar imagen"
                accessibilityRole="button"
              >
                <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.guardar, { paddingBottom: insets.bottom + 14, opacity: guardando ? 0.6 : 1 }]}
          onPress={guardar}
          disabled={guardando}
          accessibilityRole="button"
          accessibilityLabel="Guardar ejercicio"
        >
          {guardando
            ? <ActivityIndicator color={colors.onAccent} />
            : <>
                <Ionicons name="checkmark" size={19} color={colors.onAccent} />
                <Text style={styles.guardarTxt}>{editando ? 'Guardar cambios' : 'Crear ejercicio'}</Text>
              </>}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function Chip({ activo, onPress, children, styles }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, activo && styles.chipActivo]}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
    >
      <Text style={[styles.chipTxt, activo && styles.chipTxtActivo]}>{children}</Text>
    </TouchableOpacity>
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

    cuerpo: { padding: 18, gap: 4 },
    label:  { color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '700', marginTop: 14, marginBottom: 6 },
    input: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
      color: colors.text, fontSize: 14 * fs,
    },
    textArea: { minHeight: 96, textAlignVertical: 'top' },
    fila:     { flexDirection: 'row', gap: 10 },

    chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip: {
      paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
    },
    chipActivo:    { backgroundColor: colors.accent, borderColor: colors.accent },
    chipTxt:       { color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '600' },
    chipTxtActivo: { color: colors.onAccent },

    galeria:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
    miniWrap: { width: 84, height: 84 },
    mini:     { width: 84, height: 84, borderRadius: 12, backgroundColor: colors.card },
    quitarImg: {
      position: 'absolute', top: -6, right: -6,
      width: 24, height: 24, borderRadius: 12, backgroundColor: colors.error,
      alignItems: 'center', justifyContent: 'center',
    },
    agregarImg: {
      width: 84, height: 84, borderRadius: 12,
      borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card,
    },

    guardar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
      backgroundColor: colors.accent, paddingTop: 14,
    },
    guardarTxt: { color: colors.onAccent, fontSize: 15.5 * fs, fontWeight: '700' },
  });
}
