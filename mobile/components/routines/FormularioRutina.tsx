/**
 * FormularioRutina — creación de una rutina completa desde el móvil.
 *
 * El entrenador arma la rutina en dos pasos, porque meter la ficha y todos los
 * días en una sola pantalla de teléfono resulta ilegible:
 *
 *   1. Ficha:  nombre, categoría, dificultad, duración y descripción.
 *   2. Días:   se añaden días de la semana y, dentro de cada uno, ejercicios.
 *
 * Los ejercicios se eligen de la biblioteca del entrenador (GET
 * /api/trainer/exercises), que es lo que hace viable el flujo en móvil: no hay
 * que teclear el nombre de cada ejercicio, se toca de una lista. Las series y
 * repeticiones se heredan del ejercicio y se pueden ajustar por día.
 *
 *   POST /api/trainer/routines
 *
 * El backend, al recibir la rutina, también da de alta en la biblioteca los
 * ejercicios que no existieran, así que la rutina queda consistente aunque se
 * escriba un ejercicio suelto.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray, toStr } from '../../utils/format';
import api from '../../services/api';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const CATEGORIAS  = ['Fuerza', 'Hipertrofia', 'Resistencia', 'Pérdida de peso', 'General'];
const DIFICULTADES = ['Principiante', 'Intermedio', 'Avanzado'];
const GRUPOS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio', 'Full body'];

interface EjercicioBiblioteca {
  id:              number;
  nombre:          string;
  grupo_muscular?: string | null;
  series?:         number | null;
  repeticiones?:   string | null;
}

/** Ejercicio ya colocado dentro de un día de la rutina. */
interface EjercicioDia {
  name:         string;
  sets:         string;
  reps:         string;
  peso:         string;
  muscleGroup:  string;
}

interface DiaRutina {
  day:         string;
  muscleGroup: string;
  exercises:   EjercicioDia[];
}

interface Props {
  visible:    boolean;
  onClose:    () => void;
  /** Se llama tras crear la rutina, para recargar la lista. */
  onGuardado: () => void;
}

export default function FormularioRutina({ visible, onClose, onGuardado }: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  const [paso, setPaso] = useState<1 | 2>(1);

  const [nombre,      setNombre]      = useState('');
  const [categoria,   setCategoria]   = useState('General');
  const [dificultad,  setDificultad]  = useState('Intermedio');
  const [duracion,    setDuracion]    = useState('60');
  const [descripcion, setDescripcion] = useState('');
  const [dias,        setDias]        = useState<DiaRutina[]>([]);
  const [guardando,   setGuardando]   = useState(false);

  // Día al que se le están añadiendo ejercicios; null = selector cerrado.
  const [diaActivo, setDiaActivo] = useState<number | null>(null);
  const [busqueda,  setBusqueda]  = useState('');

  const { data: exData } = useFetch<{ exercises: EjercicioBiblioteca[] }>(ENDPOINTS.TRAINER_EXERCISES);
  const biblioteca = toArray<EjercicioBiblioteca>(exData?.exercises);

  const bibliotecaFiltrada = busqueda
    ? biblioteca.filter((e) =>
        toStr(e.nombre).toLowerCase().includes(busqueda.toLowerCase()) ||
        toStr(e.grupo_muscular).toLowerCase().includes(busqueda.toLowerCase()))
    : biblioteca;

  const diasUsados = dias.map((d) => d.day);
  const diasLibres = DIAS.filter((d) => !diasUsados.includes(d));

  const agregarDia = (dia: string) => {
    setDias((prev) => [...prev, { day: dia, muscleGroup: '', exercises: [] }]);
  };

  const quitarDia = (i: number) => {
    setDias((prev) => prev.filter((_, idx) => idx !== i));
  };

  const cambiarGrupoDia = (i: number, grupo: string) => {
    setDias((prev) => prev.map((d, idx) =>
      idx === i ? { ...d, muscleGroup: d.muscleGroup === grupo ? '' : grupo } : d));
  };

  /** Añade un ejercicio de la biblioteca al día abierto. */
  const agregarEjercicio = (ej: EjercicioBiblioteca) => {
    if (diaActivo === null) return;
    setDias((prev) => prev.map((d, idx) => idx !== diaActivo ? d : {
      ...d,
      exercises: [...d.exercises, {
        name:        toStr(ej.nombre),
        // Se heredan las series y reps del ejercicio para no partir de cero;
        // si el ejercicio no las trae se usan valores habituales.
        sets:        ej.series ? String(ej.series) : '3',
        reps:        toStr(ej.repeticiones, '12'),
        peso:        '',
        muscleGroup: toStr(ej.grupo_muscular) || d.muscleGroup,
      }],
    }));
    setDiaActivo(null);
    setBusqueda('');
  };

  const quitarEjercicio = (iDia: number, iEj: number) => {
    setDias((prev) => prev.map((d, idx) => idx !== iDia ? d : {
      ...d, exercises: d.exercises.filter((_, k) => k !== iEj),
    }));
  };

  const editarEjercicio = (iDia: number, iEj: number, campo: keyof EjercicioDia, valor: string) => {
    setDias((prev) => prev.map((d, idx) => idx !== iDia ? d : {
      ...d,
      exercises: d.exercises.map((e, k) => k === iEj ? { ...e, [campo]: valor } : e),
    }));
  };

  const totalEjercicios = dias.reduce((s, d) => s + d.exercises.length, 0);

  const guardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'La rutina necesita un nombre.');
      setPaso(1);
      return;
    }
    if (totalEjercicios === 0) {
      Alert.alert(
        'Rutina vacía',
        'Agrega al menos un ejercicio: una rutina sin ejercicios no le sirve a nadie.',
      );
      return;
    }

    setGuardando(true);
    try {
      await api.post(ENDPOINTS.TRAINER_ROUTINES, {
        name:             nombre.trim(),
        category:         categoria,
        difficulty:       dificultad,
        duration_minutes: Number(duracion) || 60,
        description:      descripcion.trim(),
        days:             dias,
      });
      onGuardado();
      cerrarYLimpiar();
    } catch (e: any) {
      Alert.alert(
        'No se pudo crear la rutina',
        e?.response?.data?.message || 'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const cerrarYLimpiar = () => {
    setPaso(1);
    setNombre(''); setCategoria('General'); setDificultad('Intermedio');
    setDuracion('60'); setDescripcion(''); setDias([]);
    setDiaActivo(null); setBusqueda('');
    onClose();
  };

  const confirmarSalida = () => {
    if (!nombre.trim() && dias.length === 0) { cerrarYLimpiar(); return; }
    Alert.alert('¿Descartar la rutina?', 'Se perderá lo que llevas armado.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: cerrarYLimpiar },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={confirmarSalida}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={paso === 2 ? () => setPaso(1) : confirmarSalida}
            style={styles.backBtn}
            accessibilityLabel={paso === 2 ? 'Volver a la ficha' : 'Cancelar'}
            accessibilityRole="button"
          >
            <Ionicons name={paso === 2 ? 'arrow-back' : 'close'} size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>Nueva rutina</Text>
            <Text style={styles.headerSub}>
              {paso === 1 ? 'Paso 1 de 2 · Ficha' : `Paso 2 de 2 · ${totalEjercicios} ejercicio(s)`}
            </Text>
          </View>
        </View>

        {/* ── PASO 1: ficha ── */}
        {paso === 1 && (
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
              placeholder="Push Pull Legs — Intermedio"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Nombre de la rutina"
            />

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.chips}>
              {CATEGORIAS.map((c) => (
                <Chip key={c} activo={categoria === c} onPress={() => setCategoria(c)} styles={styles}>
                  {c}
                </Chip>
              ))}
            </View>

            <Text style={styles.label}>Dificultad</Text>
            <View style={styles.chips}>
              {DIFICULTADES.map((d) => (
                <Chip key={d} activo={dificultad === d} onPress={() => setDificultad(d)} styles={styles}>
                  {d}
                </Chip>
              ))}
            </View>

            <Text style={styles.label}>Duración por sesión (minutos)</Text>
            <TextInput
              style={styles.input}
              value={duracion}
              onChangeText={(v) => setDuracion(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="60"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Duración en minutos"
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Para quién es, qué busca y cada cuánto se repite."
              placeholderTextColor={colors.textMuted}
              multiline
              accessibilityLabel="Descripción de la rutina"
            />
          </ScrollView>
        )}

        {/* ── PASO 2: días y ejercicios ── */}
        {paso === 2 && (
          <ScrollView
            contentContainerStyle={[styles.cuerpo, { paddingBottom: insets.bottom + 90 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {dias.length === 0 && (
              <Text style={styles.ayuda}>
                Agrega los días que se entrena y coloca los ejercicios de cada uno.
              </Text>
            )}

            {dias.map((dia, iDia) => (
              <View key={dia.day} style={styles.diaCard}>
                <View style={styles.diaHeader}>
                  <Ionicons name="calendar-outline" size={16} color={colors.accent} />
                  <Text style={styles.diaNombre}>{dia.day}</Text>
                  <TouchableOpacity
                    onPress={() => quitarDia(iDia)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={`Quitar ${dia.day}`}
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash-outline" size={17} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.chips}>
                  {GRUPOS.map((g) => (
                    <Chip
                      key={g}
                      activo={dia.muscleGroup === g}
                      onPress={() => cambiarGrupoDia(iDia, g)}
                      styles={styles}
                      pequeno
                    >
                      {g}
                    </Chip>
                  ))}
                </View>

                {dia.exercises.map((ej, iEj) => (
                  <View key={`${ej.name}-${iEj}`} style={styles.ejRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ejNombre} numberOfLines={1}>{ej.name}</Text>
                      <View style={styles.ejCampos}>
                        <CampoMini
                          etiqueta="Series" valor={ej.sets} styles={styles} colors={colors}
                          onChange={(v) => editarEjercicio(iDia, iEj, 'sets', v.replace(/[^0-9]/g, ''))}
                        />
                        <CampoMini
                          etiqueta="Reps" valor={ej.reps} styles={styles} colors={colors}
                          onChange={(v) => editarEjercicio(iDia, iEj, 'reps', v)}
                        />
                        <CampoMini
                          etiqueta="Peso" valor={ej.peso} styles={styles} colors={colors}
                          onChange={(v) => editarEjercicio(iDia, iEj, 'peso', v)}
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => quitarEjercicio(iDia, iEj)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={`Quitar ${ej.name}`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addEjBtn}
                  onPress={() => setDiaActivo(iDia)}
                  accessibilityLabel={`Agregar ejercicio a ${dia.day}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="add" size={17} color={colors.accent} />
                  <Text style={styles.addEjTxt}>Agregar ejercicio</Text>
                </TouchableOpacity>
              </View>
            ))}

            {diasLibres.length > 0 && (
              <>
                <Text style={styles.label}>Agregar día</Text>
                <View style={styles.chips}>
                  {diasLibres.map((d) => (
                    <Chip key={d} activo={false} onPress={() => agregarDia(d)} styles={styles}>
                      + {d}
                    </Chip>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        )}

        {/* Barra de acción */}
        <TouchableOpacity
          style={[styles.guardar, { paddingBottom: insets.bottom + 14, opacity: guardando ? 0.6 : 1 }]}
          onPress={paso === 1 ? () => setPaso(2) : guardar}
          disabled={guardando}
          accessibilityRole="button"
          accessibilityLabel={paso === 1 ? 'Continuar a los días' : 'Crear rutina'}
        >
          {guardando
            ? <ActivityIndicator color={colors.onAccent} />
            : <>
                <Ionicons
                  name={paso === 1 ? 'arrow-forward' : 'checkmark'}
                  size={19}
                  color={colors.onAccent}
                />
                <Text style={styles.guardarTxt}>
                  {paso === 1 ? 'Continuar' : 'Crear rutina'}
                </Text>
              </>}
        </TouchableOpacity>

        {/* Selector de ejercicio de la biblioteca */}
        <Modal
          visible={diaActivo !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setDiaActivo(null)}
        >
          <View style={styles.overlay}>
            <View style={[styles.hoja, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.hojaHeader}>
                <Text style={styles.hojaTitulo}>Elegir ejercicio</Text>
                <TouchableOpacity
                  onPress={() => setDiaActivo(null)}
                  accessibilityLabel="Cerrar selector"
                  accessibilityRole="button"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.buscador}>
                <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.buscadorInput}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar en tu biblioteca…"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Buscar ejercicio"
                />
              </View>

              <FlatList
                data={bibliotecaFiltrada}
                keyExtractor={(e) => String(e.id)}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 380 }}
                ListEmptyComponent={
                  <Text style={styles.ayuda}>
                    {biblioteca.length === 0
                      ? 'Tu biblioteca está vacía. Crea ejercicios desde la pestaña "Ejercicios".'
                      : 'Ningún ejercicio coincide con la búsqueda.'}
                  </Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bibRow}
                    onPress={() => agregarEjercicio(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Agregar ${item.nombre}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bibNombre}>{toStr(item.nombre)}</Text>
                      {!!item.grupo_muscular && (
                        <Text style={styles.bibGrupo}>{toStr(item.grupo_muscular)}</Text>
                      )}
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

function Chip({ activo, onPress, children, styles, pequeno }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, pequeno && styles.chipPequeno, activo && styles.chipActivo]}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
    >
      <Text style={[styles.chipTxt, activo && styles.chipTxtActivo]}>{children}</Text>
    </TouchableOpacity>
  );
}

interface CampoMiniProps {
  etiqueta: string;
  valor:    string;
  onChange: (v: string) => void;
  styles:   any;
  colors:   any;
}

function CampoMini({ etiqueta, valor, onChange, styles, colors }: CampoMiniProps) {
  return (
    <View style={styles.campoMini}>
      <Text style={styles.campoMiniLabel}>{etiqueta}</Text>
      <TextInput
        style={styles.campoMiniInput}
        value={valor}
        onChangeText={onChange}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={etiqueta}
      />
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
    headerTitle: { color: colors.text, fontSize: 17 * fs, fontWeight: '700' },
    headerSub:   { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 1 },

    cuerpo: { padding: 18, gap: 4 },
    label:  { color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '700', marginTop: 14, marginBottom: 6 },
    ayuda:  { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center', paddingVertical: 20, lineHeight: 19 },
    input: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
      color: colors.text, fontSize: 14 * fs,
    },
    textArea: { minHeight: 90, textAlignVertical: 'top' },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip: {
      paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
    },
    chipPequeno:   { paddingHorizontal: 10, paddingVertical: 5 },
    chipActivo:    { backgroundColor: colors.accent, borderColor: colors.accent },
    chipTxt:       { color: colors.textSecondary, fontSize: 12.5 * fs, fontWeight: '600' },
    chipTxtActivo: { color: colors.onAccent },

    diaCard: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 14, padding: 13, gap: 10, marginTop: 12,
    },
    diaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    diaNombre: { flex: 1, color: colors.text, fontSize: 15 * fs, fontWeight: '700' },

    ejRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border,
    },
    ejNombre: { color: colors.text, fontSize: 13.5 * fs, fontWeight: '600', marginBottom: 6 },
    ejCampos: { flexDirection: 'row', gap: 8 },
    campoMini:      { flex: 1 },
    campoMiniLabel: { color: colors.textMuted, fontSize: 10.5 * fs, marginBottom: 2 },
    campoMiniInput: {
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6,
      color: colors.text, fontSize: 13 * fs,
    },

    addEjBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 10, borderRadius: 11,
      borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border,
    },
    addEjTxt: { color: colors.accent, fontSize: 13 * fs, fontWeight: '600' },

    guardar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
      backgroundColor: colors.accent, paddingTop: 14,
    },
    guardarTxt: { color: colors.onAccent, fontSize: 15.5 * fs, fontWeight: '700' },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.6)', justifyContent: 'flex-end' },
    hoja: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      paddingHorizontal: 18, paddingTop: 16, gap: 12,
    },
    hojaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    hojaTitulo: { color: colors.text, fontSize: 16 * fs, fontWeight: '700' },
    buscador: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 12,
    },
    buscadorInput: { flex: 1, color: colors.text, fontSize: 14 * fs, paddingVertical: 10 },
    bibRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    bibNombre: { color: colors.text, fontSize: 14 * fs, fontWeight: '600' },
    bibGrupo:  { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 1 },
  });
}
