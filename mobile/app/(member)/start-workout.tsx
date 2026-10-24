/**
 * Empezar entrenamiento — sesión guiada (SCRUM-167 / HU-29).
 *
 * Un solo toque desde el inicio de la app (ver botón "Empezar entrenamiento"
 * en app/(member)/index.tsx) lleva aquí. La pantalla resuelve sola la rutina
 * y el día que corresponden a HOY —ni rutina ni día se eligen a mano— y
 * guía al miembro ejercicio por ejercicio, serie por serie, con descanso
 * cronometrado entre series. Al terminar, registra la sesión con el MISMO
 * endpoint y payload que ya usa la bitácora manual (workout-log.tsx), así
 * que alimenta el historial de progreso exactamente igual.
 *
 * Selección de "hoy": se reutiliza la misma lógica de workout-log.tsx
 * (normTxt/todayName/dayMatchesToday) pero con un criterio más estricto:
 * esa pantalla cae al día 0 si ninguno coincide (conveniencia para registrar
 * a mano); aquí, si NINGUNA rutina tiene un día que coincida con hoy, se
 * trata como "sin rutina asignada para hoy" (estado alterno explícito),
 * en vez de ofrecer silenciosamente el día equivocado como si fuera el de hoy.
 *
 * Descanso entre series: el modelo de ejercicio del backend todavía no
 * tiene un campo de descanso configurable (ver api/app/routes/miembro/
 * user_routine.py) — se usa un valor por defecto razonable
 * (DESCANSO_DEFECTO_SEG) hasta que exista ese campo; queda documentado
 * aquí como el punto de extensión, no oculto.
 */
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';

// ── Tipos (mismo contrato que workout-log.tsx, ver GET /api/user/routines
//    y GET /api/user/training/assigned-routines) ───────────────────────────
interface RoutineEx {
  nombre: string; series?: string | number; reps?: string | number; peso?: string | number;
  grupo?: string; unidad?: string; notas?: string; imagenes?: string[]; video?: string;
}
interface RoutineDay { id: string; dia?: string; grupo?: string; ejercicios: RoutineEx[] }
interface Routine {
  id: string; nombre: string; activa?: boolean; duracion_minutos?: number; dias: RoutineDay[];
  id_rutina?: string | null; nombre_entrenador?: string;
}
type Origen = 'propia' | 'entrenador';
type RoutineUI = Routine & { origen: Origen; idRutinaOrigen: string | null };

const normalizaRutina = (r: Routine, origen: Origen): RoutineUI => ({
  ...r,
  origen,
  id: `${origen}:${r.id}`,
  idRutinaOrigen: origen === 'entrenador' ? (r.id_rutina ?? null) : r.id,
});

const WEEKDAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const normTxt = (s?: string) =>
  (s ?? '').toString().toLowerCase()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u').trim();
const todayName = () => WEEKDAYS_ES[new Date().getDay()];
const dayMatchesToday = (d?: RoutineDay | null) => normTxt(d?.dia).includes(todayName());

const DESCANSO_DEFECTO_SEG = 60;
const LB_A_KG = 0.453592;
const convertirPeso = (valor: number, de: string, a: string): number => {
  const deLb = (de || 'kg').toLowerCase().startsWith('lb');
  const aLb  = (a  || 'kg').toLowerCase().startsWith('lb');
  if (deLb === aLb) return valor;
  return deLb ? valor * LB_A_KG : valor / LB_A_KG;
};

// Un "paso" es una serie concreta de un ejercicio concreto — la sesión es la
// lista completa de pasos, en orden, de principio a fin.
interface Paso {
  exIdx: number; serieIdx: number; totalSeries: number;
  nombre: string; grupo?: string; notas?: string; imagenes?: string[]; video?: string;
  repeticionesObjetivo: string; pesoObjetivo: string; unidad: string;
}

function construirPasos(dia: RoutineDay | null): Paso[] {
  if (!dia) return [];
  const pasos: Paso[] = [];
  (dia.ejercicios || []).forEach((ex, exIdx) => {
    if (!ex.nombre) return;
    const n = Math.min(10, Math.max(1, parseInt(String(ex.series ?? 3), 10) || 3));
    for (let serieIdx = 0; serieIdx < n; serieIdx++) {
      pasos.push({
        exIdx, serieIdx, totalSeries: n,
        nombre: ex.nombre, grupo: ex.grupo || dia.grupo, notas: ex.notas,
        imagenes: ex.imagenes, video: ex.video,
        repeticionesObjetivo: ex.reps != null ? String(ex.reps) : '',
        pesoObjetivo: ex.peso != null ? String(ex.peso) : '',
        unidad: ex.unidad || 'kg',
      });
    }
  });
  return pasos;
}

export default function StartWorkoutScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const { data: routinesData, loading: loadingPropias } =
    useFetch<{ rutinas: Routine[] }>(ENDPOINTS.USER_ROUTINES);
  const { data: assignedData, loading: loadingAsignadas } =
    useFetch<{ rutinas: Routine[] }>(ENDPOINTS.USER_ASSIGNED_ROUTINES);
  const { data: profileData, loading: loadingProfile } =
    useFetch<{ unidadMedida?: string }>(ENDPOINTS.USER_PROFILE);

  const cargando = loadingPropias || loadingAsignadas || loadingProfile;

  const routines = useMemo<RoutineUI[]>(() => [
    ...toArray<Routine>(routinesData?.rutinas).map(r => normalizaRutina(r, 'propia')),
    ...toArray<Routine>(assignedData?.rutinas).map(r => normalizaRutina(r, 'entrenador')),
  ], [routinesData, assignedData]);

  // Se busca, entre TODAS las rutinas activas, la primera con un día que
  // coincida con hoy. A diferencia de workout-log.tsx, aquí NO hay fallback
  // al día 0: si nada coincide, es el estado "sin rutina para hoy".
  const seleccion = useMemo(() => {
    for (const r of routines) {
      if (r.activa === false) continue;
      const idx = (r.dias || []).findIndex(dayMatchesToday);
      if (idx >= 0) return { routine: r, day: r.dias[idx] };
    }
    return null;
  }, [routines]);

  const pasos = useMemo(() => construirPasos(seleccion?.day ?? null), [seleccion]);
  const unidadPreferida = (profileData?.unidadMedida || '').toLowerCase().startsWith('imperial') ? 'lb' : 'kg';

  const [pasoActual, setPasoActual] = useState(0);
  const [registro, setRegistro] = useState<Record<number, { reps: string; peso: string }>>({});
  const [descansando, setDescansando] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [sesionIniciada] = useState(() => Date.now());
  const [guardando, setGuardando] = useState(false);
  const [terminada, setTerminada] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const paso = pasos[pasoActual] ?? null;
  const actual = paso ? (registro[pasoActual] ?? { reps: paso.repeticionesObjetivo, peso: paso.pesoObjetivo }) : null;

  const setActual = (campo: 'reps' | 'peso', v: string) => {
    if (!paso) return;
    setRegistro((r) => ({ ...r, [pasoActual]: { ...(r[pasoActual] ?? { reps: paso.repeticionesObjetivo, peso: paso.pesoObjetivo }), [campo]: v } }));
  };

  const iniciarDescanso = useCallback((segundos: number, siguiente: () => void) => {
    setDescansando(true);
    setSegundosRestantes(segundos);
    timerRef.current = setInterval(() => {
      setSegundosRestantes((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setDescansando(false);
          siguiente();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const saltarDescanso = (siguiente: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDescansando(false);
    siguiente();
  };

  const marcarSerieCompletada = () => {
    if (!paso) return;
    // Registra lo realmente hecho (editable) antes de avanzar — si el
    // miembro no tocó nada, queda lo sugerido.
    setRegistro((r) => ({ ...r, [pasoActual]: actual! }));
    const avanzar = () => setPasoActual((p) => p + 1);
    if (pasoActual + 1 >= pasos.length) {
      avanzar(); // cae en la pantalla de resumen/finalización, sin descanso
    } else {
      iniciarDescanso(DESCANSO_DEFECTO_SEG, avanzar);
    }
  };

  const finalizarSesion = async () => {
    if (!seleccion) return;
    setGuardando(true);
    try {
      // Agrupa los pasos (series individuales) de vuelta por ejercicio,
      // con el mismo payload que ya usa workout-log.tsx — así esta sesión
      // guiada alimenta el progreso exactamente igual que el registro manual.
      const porEjercicio = new Map<number, { nombre: string; grupo?: string; unidad: string; series: { repeticiones: string; peso: string; unidad: string }[] }>();
      pasos.forEach((p, i) => {
        const r = registro[i] ?? { reps: p.repeticionesObjetivo, peso: p.pesoObjetivo };
        if (!porEjercicio.has(p.exIdx)) {
          porEjercicio.set(p.exIdx, { nombre: p.nombre, grupo: p.grupo, unidad: p.unidad, series: [] });
        }
        porEjercicio.get(p.exIdx)!.series.push({ repeticiones: r.reps, peso: r.peso, unidad: p.unidad });
      });
      const ejercicios = Array.from(porEjercicio.values()).filter((e) => e.series.length > 0);
      const duracionMin = Math.max(1, Math.round((Date.now() - sesionIniciada) / 60000));

      const { data: res } = await api.post(ENDPOINTS.WORKOUT_COMPLETE, {
        nombre_rutina: `${seleccion.routine.nombre}${seleccion.day.grupo ? ' - ' + seleccion.day.grupo : ''}`,
        grupo_muscular: seleccion.day.grupo || undefined,
        id_rutina: seleccion.routine.idRutinaOrigen ?? undefined,
        duracion_min: duracionMin,
        ejercicios,
      });
      setTerminada(true);
      Alert.alert(
        '¡Sesión completada!',
        `${res.total_ejercicios} ejercicios · ${res.total_series} series.\n` +
        `Quemaste aproximadamente ${res.calorias_estimadas} kcal.`,
        [{ text: 'Listo', onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar la sesión.');
    } finally {
      setGuardando(false);
    }
  };

  // ── Estados de carga / alterno (sin rutina para hoy) ───────────────────
  if (cargando) return <LoadingSpinner fullScreen message="Preparando tu entrenamiento…" />;

  if (!seleccion || pasos.length === 0) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="moon-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Hoy no tienes rutina asignada</Text>
        <Text style={styles.emptyText}>
          Puede ser un día de descanso, o aún no tienes una rutina con ejercicios para hoy.
        </Text>
        <Button
          label="Registrar un entrenamiento libre"
          onPress={() => router.replace('/(member)/workout-log')}
          style={{ marginTop: 20, width: '100%' }}
        />
        <Button
          label="Ver / crear mis rutinas"
          variant="secondary"
          onPress={() => router.replace('/(member)/mi-rutina')}
          style={{ marginTop: 10, width: '100%' }}
        />
      </View>
    );
  }

  // ── Resumen final ────────────────────────────────────────────────────────
  if (pasoActual >= pasos.length) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="trophy-outline" size={56} color={colors.accent} />
        <Text style={styles.emptyTitle}>¡Terminaste tu rutina!</Text>
        <Text style={styles.emptyText}>
          {pasos.length} series registradas. Guarda la sesión para que cuente en tu progreso.
        </Text>
        <Button
          label="Finalizar y guardar"
          onPress={finalizarSesion}
          loading={guardando}
          disabled={terminada}
          style={{ marginTop: 20, width: '100%' }}
        />
      </View>
    );
  }

  // ── Pantalla de descanso ─────────────────────────────────────────────────
  if (descansando) {
    const siguientePaso = pasos[pasoActual + 1];
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.descansoLabel}>DESCANSO</Text>
        <Text style={styles.descansoTimer}>{segundosRestantes}s</Text>
        {siguientePaso && (
          <Text style={styles.emptyText}>
            Siguiente: {siguientePaso.nombre} — serie {siguientePaso.serieIdx + 1} de {siguientePaso.totalSeries}
          </Text>
        )}
        <Button
          label="Saltar descanso"
          variant="secondary"
          onPress={() => saltarDescanso(() => setPasoActual((p) => p + 1))}
          style={{ marginTop: 24, width: '100%' }}
        />
      </View>
    );
  }

  // ── Ejercicio/serie actual ──────────────────────────────────────────────
  const pesoMostrado = actual?.peso ? convertirPeso(parseFloat(actual.peso) || 0, paso!.unidad, unidadPreferida) : null;
  const progreso = Math.round((pasoActual / pasos.length) * 100);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.progresoBar}>
        <View style={[styles.progresoFill, { width: `${progreso}%`, backgroundColor: colors.accent }]} />
      </View>
      <Text style={styles.progresoTexto}>
        Ejercicio {paso!.exIdx + 1} · Serie {paso!.serieIdx + 1} de {paso!.totalSeries}
      </Text>

      <Card style={{ marginTop: 12 }}>
        <Text style={styles.nombreEjercicio}>{paso!.nombre}</Text>
        {!!paso!.grupo && <Text style={styles.grupoEjercicio}>{paso!.grupo}</Text>}

        {!!paso!.imagenes?.length && (
          <Image source={{ uri: paso!.imagenes[0] }} style={styles.imagen} resizeMode="cover" />
        )}
        {!!paso!.video && (
          <TouchableOpacity onPress={() => Linking.openURL(paso!.video!)} style={styles.videoLink}>
            <Ionicons name="play-circle-outline" size={18} color={colors.accent} />
            <Text style={{ color: colors.accent, marginLeft: 6, fontWeight: '600' }}>Ver video de técnica</Text>
          </TouchableOpacity>
        )}
        {!!paso!.notas && <Text style={styles.notas}>{paso!.notas}</Text>}

        <View style={styles.camposRow}>
          <View style={styles.campoCol}>
            <Text style={styles.campoLabel}>Repeticiones</Text>
            <TextInput
              style={styles.campoInput}
              value={actual?.reps ?? ''}
              onChangeText={(v) => setActual('reps', v)}
              keyboardType="number-pad"
              placeholder={paso!.repeticionesObjetivo || '—'}
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.campoCol}>
            <Text style={styles.campoLabel}>Carga ({unidadPreferida})</Text>
            <TextInput
              style={styles.campoInput}
              value={pesoMostrado != null ? String(Math.round(pesoMostrado * 10) / 10) : ''}
              onChangeText={(v) => {
                const n = parseFloat(v.replace(',', '.'));
                setActual('peso', isNaN(n) ? '' : String(convertirPeso(n, unidadPreferida, paso!.unidad)));
              }}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <Text style={styles.descansoHint}>
          Descanso sugerido al terminar esta serie: {DESCANSO_DEFECTO_SEG}s
        </Text>

        <Button
          label="Marcar serie completada"
          icon={<Ionicons name="checkmark-circle-outline" size={18} color={colors.onAccent} />}
          onPress={marcarSerieCompletada}
          style={{ marginTop: 16 }}
        />
      </Card>
    </ScrollView>
  );
}

function make_styles(colors: any, fs: (n: number) => number) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    center:  { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
    emptyTitle: { fontSize: fs(18), fontWeight: '700', color: colors.text, marginTop: 14, textAlign: 'center' },
    emptyText:  { fontSize: fs(14), color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
    progresoBar:  { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
    progresoFill: { height: 6, borderRadius: 3 },
    progresoTexto: { fontSize: fs(12), color: colors.textSecondary, marginTop: 8, fontWeight: '600' },
    nombreEjercicio: { fontSize: fs(20), fontWeight: '800', color: colors.text },
    grupoEjercicio:  { fontSize: fs(13), color: colors.textSecondary, marginTop: 2 },
    imagen: { width: '100%', height: 160, borderRadius: 12, marginTop: 12 },
    videoLink: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    notas: { fontSize: fs(13), color: colors.textMuted, marginTop: 10, lineHeight: 19 },
    camposRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
    campoCol: { flex: 1 },
    campoLabel: { fontSize: fs(12), color: colors.textSecondary, marginBottom: 6, fontWeight: '600' },
    campoInput: {
      backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
      color: colors.text, padding: 12, fontSize: fs(16), fontWeight: '700', textAlign: 'center',
    },
    descansoHint: { fontSize: fs(11.5), color: colors.textMuted, marginTop: 10 },
    descansoLabel: { fontSize: fs(14), fontWeight: '700', color: colors.textSecondary, letterSpacing: 1 },
    descansoTimer: { fontSize: fs(56), fontWeight: '800', color: colors.accent, marginTop: 4 },
  });
}
