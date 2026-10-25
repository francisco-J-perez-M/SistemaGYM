/**
 * Empezar entrenamiento — sesión guiada LIBRE (SCRUM-167 / HU-29, v2).
 *
 * v1 forzaba una secuencia lineal (ejercicio 1 serie 1 -> serie 2 -> ...
 * -> ejercicio 2...) con pantalla de descanso bloqueante entre series.
 * Retroalimentación de Miguel tras probarla: en la práctica NO se hacen
 * las series seguidas en ese orden -se alternan ejercicios, se hace otro
 * si el aparato está ocupado, etc.-, así que v2 cambia el modelo:
 *
 * - Se muestran TODOS los ejercicios del día de hoy como una lista de
 *   tarjetas; el socio elige con qué ejercicio empezar y en qué orden
 *   seguir, sin ninguna secuencia forzada.
 * - Cada tarjeta se expande para registrar sus series (reps/carga,
 *   prellenadas con el objetivo) y marcarlas completadas una por una,
 *   en cualquier momento y en cualquier orden entre ejercicios.
 * - El descanso ya NO bloquea la pantalla: es un aviso no intrusivo que
 *   corre en segundo plano mientras el socio sigue viendo/eligiendo
 *   ejercicios (puede ignorarlo o "saltarlo").
 * - "Terminar rutina" está siempre visible — permite cerrar la sesión
 *   antes de completar todo, por la razón que sea.
 * - Al terminar (por el boton o porque ya se completaron todas las
 *   series) se muestra "Rutina finalizada" con un resumen y el botón
 *   "Guardar sesión"; tras guardar, "¿Empezar de nuevo?" reinicia la
 *   misma rutina de hoy desde cero sin salir de la pantalla.
 *
 * Selección de "hoy": igual que v1 — misma lógica de workout-log.tsx
 * (normTxt/todayName/dayMatchesToday) pero SIN el fallback al día 0:
 * si ninguna rutina activa tiene un día que coincida con hoy, es el
 * estado alterno "sin rutina para hoy".
 *
 * Rutina propia vs. asignada (bug reportado por Miguel): antes se tomaba
 * SIEMPRE la primera rutina del arreglo `routines` cuyo día coincidiera
 * con hoy, y ese arreglo pone las rutinas propias antes que las asignadas
 * por un entrenador — así que si el socio tenía una propia Y una asignada
 * para el mismo día, la asignada nunca se usaba, sin avisar que existía.
 * Ahora se calculan TODAS las candidatas de hoy (`candidatas`, de
 * cualquier origen) y, si hay más de una:
 *   - por defecto se prioriza la asignada por el entrenador (es la que
 *     alguien más está dando seguimiento, tiene más peso que la propia);
 *   - pero se muestra un selector (chips) para que el socio la cambie por
 *     la propia u otra candidata en cualquier momento, antes de marcar
 *     series o a medias (con confirmación si ya tiene series marcadas,
 *     porque cambiar de rutina reinicia el progreso de la sesión actual).
 *
 * Descanso entre series: el modelo de ejercicio del backend todavía no
 * tiene un campo de descanso configurable (ver api/app/routes/miembro/
 * user_routine.py) — se usa un valor por defecto razonable
 * (DESCANSO_DEFECTO_SEG) hasta que exista ese campo.
 *
 * Imágenes del ejercicio (retro de Miguel): se mostraba solo la primera
 * (`imagenes[0]`) aunque un ejercicio admite hasta 3 (ver MAX_IMAGENES en
 * FormularioEjercicio.tsx). Ahora se muestran TODAS las que tenga, en una
 * fila dentro de la tarjeta expandida; si no tiene ninguna, no se muestra
 * nada (igual que antes).
 */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, Image, Linking, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import { toArray } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { estaConectado } from '../../services/offline/connectivity';
import { encolarAccion } from '../../services/offline/queue';
import { leerJSON, escribirJSON } from '../../services/offline/storage';
import ExerciseDetailSheet, { type ExerciseDetail, cacheVideo, cacheImages } from '../../components/routines/ExerciseDetailSheet';

// ── Tipos (mismo contrato que workout-log.tsx) ──────────────────────────────
interface RoutineEx {
  nombre: string; series?: string | number; reps?: string | number; peso?: string | number;
  grupo?: string; unidad?: string; notas?: string; instrucciones?: string;
  imagenes?: string[]; video?: string;
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
// "Registrar rutina de otro día de la semana" (no solo hoy): se necesita
// el nombre del día de una fecha YYYY-MM-DD cualquiera (no solo hoy), para
// encontrar la candidata que corresponde al día que el socio elija con los
// chips de abajo — y la fecha local de "hoy" en el mismo formato, para
// saber si el día elegido es hoy o uno pasado de la semana.
const fechaLocalHoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const nombreDeFecha = (fechaYYYYMMDD: string) => {
  const [y, m, d] = fechaYYYYMMDD.split('-').map(Number);
  return WEEKDAYS_ES[new Date(y, (m || 1) - 1, d || 1).getDay()];
};
const dayMatchesName = (d: RoutineDay | null | undefined, nombre: string) => normTxt(d?.dia).includes(nombre);
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']; // mismo orden que /api/user/checkins/semana (lunes..domingo)

const DESCANSO_DEFECTO_SEG = 60;
// Presets del botón de ajustes (⚙) de la barra superior -- ver
// abrirAjustesDescanso más abajo.
const RESTS_PRESET = [30, 45, 60, 90, 120, 180];

// ── "Previa" por ejercicio (tabla de registro del Paso C) ───────────────────
// No existe un histórico set-por-set en el backend (WORKOUT_COMPLETE solo
// guarda el agregado de la sesión, ver api/app/routes/pagos_online.py... no,
// ver api/app/routes/miembro/user_routine.py) y agregar ese endpoint está
// fuera de alcance aquí (solo frontend). En su lugar se guarda LOCALMENTE en
// este dispositivo lo último que se registró de cada ejercicio -- por nombre,
// sin importar en qué rutina -- y eso alimenta la columna "Previa": es honesto
// sobre su alcance real (el último registro de ESTE teléfono, no un histórico
// de servidor que viaje entre dispositivos o se vea en el portal web).
const CLAVE_PREVIA = 'gympro:ultima_serie_por_ejercicio:v1';
const normalizarNombreEj = (s: string) => s.trim().toLowerCase();
type SerieGuardada = { reps: string; peso: string; unidad: string };
type PreviaPorEjercicio = Record<string, SerieGuardada[]>;

const LB_A_KG = 0.453592;
const convertirPeso = (valor: number, de: string, a: string): number => {
  const deLb = (de || 'kg').toLowerCase().startsWith('lb');
  const aLb  = (a  || 'kg').toLowerCase().startsWith('lb');
  if (deLb === aLb) return valor;
  return deLb ? valor * LB_A_KG : valor / LB_A_KG;
};

// ── Modelo de la sesión: un ejercicio con sus series, editable libremente ──
interface SerieUI {
  idx: number; reps: string; peso: string; completada: boolean;
  /** Último valor registrado de ESTA serie para este ejercicio (ver
   *  CLAVE_PREVIA) -- null/undefined si nunca se registró antes. */
  previa?: SerieGuardada;
}
interface EjercicioUI {
  exIdx: number; nombre: string; grupo?: string; notas?: string; instrucciones?: string;
  /** Nota libre de ESTA sesión (no viene de la rutina, no se envía al
   *  backend -- ver botón "Notas" en el render). */
  notasSesion: string;
  imagenes?: string[]; video?: string; unidad: string;
  repsObjetivo: string; pesoObjetivo: string; series: SerieUI[];
}

function construirEjercicios(dia: RoutineDay | null): EjercicioUI[] {
  if (!dia) return [];
  return (dia.ejercicios || [])
    .filter((ex) => !!ex.nombre)
    .map((ex, exIdx) => {
      const n = Math.min(10, Math.max(1, parseInt(String(ex.series ?? 3), 10) || 3));
      const repsObjetivo = ex.reps != null ? String(ex.reps) : '';
      const pesoObjetivo = ex.peso != null ? String(ex.peso) : '';
      const series: SerieUI[] = Array.from({ length: n }, (_, idx) => ({
        idx, reps: repsObjetivo, peso: pesoObjetivo, completada: false,
      }));
      return {
        exIdx, nombre: ex.nombre, grupo: ex.grupo || dia.grupo, notas: ex.notas,
        instrucciones: ex.instrucciones, notasSesion: '',
        imagenes: ex.imagenes, video: ex.video, unidad: ex.unidad || 'kg',
        repsObjetivo, pesoObjetivo, series,
      };
    });
}

export default function StartWorkoutScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  // Paso B del flujo de Entrenamiento (ver empezarEntrenamiento en
  // components/routines/RoutineDetailModal.tsx): llega con la rutina y el
  // día EXACTOS a entrenar -- se ignora entonces toda la resolución de "qué
  // rutina toca hoy" de abajo (candidatas/chips de día) y se arranca esa
  // sesión directo, sea o no el día de la semana que es hoy. Sin params
  // (atajo "Empezar entrenamiento" de Inicio, o entrada directa), el
  // comportamiento es exactamente el de siempre: resolver "hoy" solo.
  const params = useLocalSearchParams<{ routineId?: string; diaId?: string }>();

  // SCRUM-168 / HU-30: la rutina de hoy es la lectura más crítica para
  // entrenar sin conexión — cachear las tres sin las cuales no hay sesión
  // que armar (rutinas propias, asignadas y la unidad de peso del perfil).
  const { data: routinesData, loading: loadingPropias } =
    useFetch<{ rutinas: Routine[] }>(ENDPOINTS.USER_ROUTINES, undefined, { cache: true });
  const { data: assignedData, loading: loadingAsignadas } =
    useFetch<{ rutinas: Routine[] }>(ENDPOINTS.USER_ASSIGNED_ROUTINES, undefined, { cache: true });
  const { data: profileData, loading: loadingProfile } =
    useFetch<{ unidadMedida?: string }>(ENDPOINTS.USER_PROFILE, undefined, { cache: true });
  // "Registrar rutina de otro día de la semana" (no solo hoy): qué días
  // lunes-domingo ya tienen check-in registrado (ver checkins/semana en el
  // backend) — determina qué chips de día están habilitados más abajo.
  const { data: semanaData } = useFetch<{
    semana: { fecha: string; dia: string; asistio: boolean; futuro: boolean }[];
    hoy: string;
  }>(ENDPOINTS.USER_CHECKINS_SEMANA, undefined, { cache: true });
  const diasSemana = semanaData?.semana ?? [];

  const cargando = loadingPropias || loadingAsignadas || loadingProfile;

  // Día de la semana actual que se está viendo/registrando — por defecto
  // hoy. Cambiarlo recalcula `candidatas` más abajo para ese día en vez de
  // hoy, pero solo se puede elegir un día con asistencia ya registrada
  // (ver chips de día en el render): sin check-in ese día, no hay nada que
  // registrar ahí (ver bloque "Anti-fraude" del backend).
  const [diaElegido, setDiaElegido] = useState<string>(() => fechaLocalHoy());
  const nombreDiaElegido = useMemo(() => nombreDeFecha(diaElegido), [diaElegido]);
  const esDiaElegidoHoy = diaElegido === fechaLocalHoy();

  // Cambiar de día (chips Lun-Dom más abajo): solo tiene efecto sobre días
  // con asistencia ya registrada (se valida al renderizar los chips, acá
  // solo se asume que ya se filtró). Como las series marcadas son de UNA
  // sesión a la vez, cambiar de día reinicia el progreso -- se avisa si ya
  // había algo marcado, igual que `elegirRutina` más abajo.
  const elegirDia = (fecha: string) => {
    if (fecha === diaElegido) return;
    const hechasActuales = (ejercicios ?? []).reduce(
      (acc, e) => acc + e.series.filter((s) => s.completada).length, 0,
    );
    const cambiar = () => {
      setDiaElegido(fecha);
      setRutinaElegidaId(null);
      setEjercicios(null);
      setExpandido(null);
      setEstado('progreso');
      setRestante(0);
      if (timerRef.current) clearInterval(timerRef.current);
      setSesionIniciada(Date.now());
      setResultado(null);
    };
    if (hechasActuales > 0) {
      Alert.alert(
        'Cambiar de día',
        'Tienes series marcadas en la sesión actual que se perderán si cambias de día. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cambiar', style: 'destructive', onPress: cambiar },
        ],
      );
    } else {
      cambiar();
    }
  };

  // Fila de chips Lun-Dom: solo se puede elegir un día con asistencia ya
  // registrada (`asistio`); los demás se ven deshabilitados. Se usa tanto
  // en el estado "sin rutina para este día" como en la lista de
  // ejercicios, para poder cambiar de día desde cualquiera de los dos.
  const renderDiaChips = () => {
    if (forzado || diasSemana.length === 0) return null;
    return (
      <View style={styles.diaSelectorRow}>
        {diasSemana.map((d, i) => {
          const habilitado = d.asistio && !d.futuro;
          const activo = d.fecha === diaElegido;
          const numeroDia = Number(d.fecha.split('-')[2]);
          return (
            <TouchableOpacity
              key={d.fecha}
              onPress={() => elegirDia(d.fecha)}
              disabled={!habilitado}
              style={[
                styles.diaChip,
                activo && styles.diaChipActivo,
                !habilitado && styles.diaChipDeshabilitado,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                `${DIAS_CORTOS[i]} ${numeroDia}` +
                (habilitado ? '' : ', sin check-in ese día') +
                (activo ? ', seleccionado' : '')
              }
            >
              <Text style={[
                styles.diaChipLabel,
                activo && styles.diaChipLabelActivo,
                !habilitado && styles.diaChipLabelDeshabilitado,
              ]}>
                {DIAS_CORTOS[i]}
              </Text>
              <Text style={[
                styles.diaChipNumero,
                activo && styles.diaChipLabelActivo,
                !habilitado && styles.diaChipLabelDeshabilitado,
              ]}>
                {numeroDia}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const routines = useMemo<RoutineUI[]>(() => [
    ...toArray<Routine>(routinesData?.rutinas).map(r => normalizaRutina(r, 'propia')),
    ...toArray<Routine>(assignedData?.rutinas).map(r => normalizaRutina(r, 'entrenador')),
  ], [routinesData, assignedData]);

  // Rutina+día exactos pedidos desde el Paso B (ver comentario de `params`
  // arriba). routine.id en `routines` lleva el prefijo origen: (ver
  // normalizaRutina) pero el id que manda RoutineDetailModal es el id crudo
  // del backend -- se prueban ambos orígenes en vez de pedirle el origen
  // también por parámetro.
  const seleccionForzada = useMemo(() => {
    if (!params.routineId || !params.diaId) return null;
    const r = routines.find((rt) =>
      rt.id === `entrenador:${params.routineId}` || rt.id === `propia:${params.routineId}`);
    const day = r?.dias?.find((d) => d.id === params.diaId);
    return r && day ? { routine: r, day } : null;
  }, [routines, params.routineId, params.diaId]);
  const forzado = !!seleccionForzada;

  // Todas las rutinas del día elegido (hoy por defecto), de cualquier
  // origen — puede haber más de una (propia + asignada por un entrenador
  // para el mismo día).
  const candidatas = useMemo(() => {
    const out: { routine: RoutineUI; day: RoutineDay }[] = [];
    for (const r of routines) {
      if (r.activa === false) continue;
      const idx = (r.dias || []).findIndex((d) => dayMatchesName(d, nombreDiaElegido));
      if (idx >= 0) out.push({ routine: r, day: r.dias[idx] });
    }
    return out;
  }, [routines, nombreDiaElegido]);

  // Cuál de las candidatas se está siguiendo hoy. Por defecto, la asignada
  // por un entrenador si hay una; si no, la primera propia. Se siembra una
  // sola vez (como `ejercicios` más abajo) para no saltar de rutina solo
  // porque refetchearon las rutinas/perfil.
  const [rutinaElegidaId, setRutinaElegidaId] = useState<string | null>(null);
  useEffect(() => {
    if (rutinaElegidaId === null && candidatas.length > 0) {
      const porDefecto = candidatas.find((c) => c.routine.origen === 'entrenador') ?? candidatas[0];
      setRutinaElegidaId(porDefecto.routine.id);
    }
  }, [candidatas, rutinaElegidaId]);

  const seleccion = useMemo(
    () => seleccionForzada
      ?? candidatas.find((c) => c.routine.id === rutinaElegidaId) ?? candidatas[0] ?? null,
    [seleccionForzada, candidatas, rutinaElegidaId],
  );

  const unidadPreferida = (profileData?.unidadMedida || '').toLowerCase().startsWith('imperial') ? 'lb' : 'kg';

  // Se siembra UNA sola vez cuando la selección de hoy esté lista — un
  // refetch posterior de rutinas/perfil no debe borrar el progreso que ya
  // llevas marcado en esta sesión.
  const [ejercicios, setEjercicios] = useState<EjercicioUI[] | null>(null);
  useEffect(() => {
    if (ejercicios !== null || !seleccion) return;
    const base = construirEjercicios(seleccion.day);
    setEjercicios(base); // primero sin previa, para no retrasar el primer render
    (async () => {
      const cache = await leerJSON<PreviaPorEjercicio>(CLAVE_PREVIA, {});
      if (Object.keys(cache).length === 0) return;
      setEjercicios((prev) => (prev ?? base).map((e) => {
        const guardadas = cache[normalizarNombreEj(e.nombre)];
        if (!guardadas?.length) return e;
        return { ...e, series: e.series.map((s, i) => (guardadas[i] ? { ...s, previa: guardadas[i] } : s)) };
      }));
    })();
  }, [seleccion, ejercicios]);

  const [expandido, setExpandido] = useState<number | null>(null);
  const [estado, setEstado] = useState<'progreso' | 'finalizada' | 'guardada'>('progreso');
  const [restante, setRestante] = useState(0);
  const [sesionIniciada, setSesionIniciada] = useState(() => Date.now());
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<{ total_ejercicios: number; total_series: number; calorias_estimadas: number } | null>(null);
  // SCRUM-168 / HU-30: la sesión se guardó en la cola offline (sin
  // confirmación del servidor todavía) — cambia el texto del resumen para
  // no mostrar calorías/volumen como si ya estuvieran confirmados.
  const [pendienteSync, setPendienteSync] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Cronómetro de sesión activa (barra superior) -- solo corre mientras se
  // está entrenando, no en las pantallas de resumen/guardado.
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (estado !== 'progreso') return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [estado]);
  const elapsedSeg = Math.max(0, Math.floor((ahora - sesionIniciada) / 1000));
  const elapsedStr = `${String(Math.floor(elapsedSeg / 60)).padStart(2, '0')}:`
    + String(elapsedSeg % 60).padStart(2, '0');

  // Ajustes (⚙ de la barra superior): duración del descanso, editable en
  // vivo -- el modelo de ejercicio del backend aún no tiene este campo (ver
  // nota sobre DESCANSO_DEFECTO_SEG en el encabezado), así que por ahora es
  // una preferencia de ESTA sesión, no algo que se guarde.
  const [descansoSeg, setDescansoSeg] = useState(DESCANSO_DEFECTO_SEG);
  const abrirAjustesDescanso = () => {
    Alert.alert(
      'Descanso entre series',
      `Duración actual: ${descansoSeg}s`,
      [
        ...RESTS_PRESET.map((s) => ({ text: `${s}s`, onPress: () => setDescansoSeg(s) })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  };

  // "+ Añadir serie": el número de series arrancaba fijo desde que se
  // sembraba la sesión -- esta serie nueva parte del objetivo (reps/peso)
  // del ejercicio, igual que las demás.
  const agregarSerie = (exIdx: number) => {
    setEjercicios((prev) => (prev ?? []).map((e) => {
      if (e.exIdx !== exIdx) return e;
      const siguienteIdx = e.series.length > 0 ? e.series[e.series.length - 1].idx + 1 : 0;
      return {
        ...e,
        series: [...e.series, { idx: siguienteIdx, reps: e.repsObjetivo, peso: e.pesoObjetivo, completada: false }],
      };
    }));
  };

  // "Reemplazar" ejercicio: no hay catálogo de ejercicios alternativos en el
  // backend todavía, así que el reemplazo es libre (texto) y SOLO de esta
  // sesión -- cambia el nombre con el que se registra (lo que se guarda al
  // final), no la rutina original.
  const [reemplazando, setReemplazando] = useState<number | null>(null);
  const [textoReemplazo, setTextoReemplazo] = useState('');
  const abrirReemplazo = (ej: EjercicioUI) => { setReemplazando(ej.exIdx); setTextoReemplazo(ej.nombre); };
  const confirmarReemplazo = () => {
    const nuevo = textoReemplazo.trim();
    if (nuevo) {
      setEjercicios((prev) => (prev ?? []).map((e) => (e.exIdx === reemplazando ? { ...e, nombre: nuevo } : e)));
    }
    setReemplazando(null);
  };

  // "Notas" de la sesión -- libres, por ejercicio, no se envían al backend
  // (ver notasSesion en EjercicioUI). Ocultas por defecto para no ocupar
  // espacio cuando no hay nada que anotar.
  const [notaAbiertaIdx, setNotaAbiertaIdx] = useState<number | null>(null);
  const actualizarNotaSesion = (exIdx: number, v: string) =>
    setEjercicios((prev) => (prev ?? []).map((e) => (e.exIdx === exIdx ? { ...e, notasSesion: v } : e)));

  // "Tutorial" -- reusa el bottom sheet de detalle (imágenes + video +
  // instrucciones) que ya usan training.tsx y mi-rutina.tsx; una
  // animación/modelo 3D del movimiento está fuera de alcance (no hay
  // assets ni motor 3D en el proyecto), así que la mejor versión
  // disponible sin eso es imágenes + video + instrucciones.
  const [tutorialEj, setTutorialEj] = useState<ExerciseDetail | null>(null);
  const abrirTutorial = (ej: EjercicioUI) => {
    const vk = ej.video    ? `sw_v_${ej.exIdx}` : undefined;
    const ik = ej.imagenes ? `sw_i_${ej.exIdx}` : undefined;
    if (vk && ej.video)    cacheVideo(vk, ej.video);
    if (ik && ej.imagenes) cacheImages(ik, ej.imagenes);
    setTutorialEj({
      nombre: ej.nombre,
      setsStr: `${ej.series.length} series${ej.repsObjetivo ? ` × ${ej.repsObjetivo} reps` : ''}`,
      peso: ej.pesoObjetivo || undefined,
      notas: ej.notas,
      instrucciones: ej.instrucciones,
      imageKey: ik,
      videoKey: vk,
    });
  };

  const iniciarDescansoNoBloqueante = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestante(descansoSeg);
    timerRef.current = setInterval(() => {
      setRestante((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };
  const saltarDescanso = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestante(0);
  };

  const actualizarSerie = (exIdx: number, serieIdx: number, campo: 'reps' | 'peso', valor: string) => {
    setEjercicios((prev) => (prev ?? []).map((e) => e.exIdx !== exIdx ? e : {
      ...e,
      series: e.series.map((s) => s.idx !== serieIdx ? s : { ...s, [campo]: valor }),
    }));
  };

  const marcarSerie = (exIdx: number, serieIdx: number) => {
    setEjercicios((prev) => {
      const next = (prev ?? []).map((e) => e.exIdx !== exIdx ? e : {
        ...e,
        series: e.series.map((s) => s.idx !== serieIdx ? s : { ...s, completada: !s.completada }),
      });
      const totalSeries = next.reduce((acc, e) => acc + e.series.length, 0);
      const hechas = next.reduce((acc, e) => acc + e.series.filter((s) => s.completada).length, 0);
      if (totalSeries > 0 && hechas === totalSeries) setEstado('finalizada');
      return next;
    });
    iniciarDescansoNoBloqueante();
  };

  const terminarRutina = () => {
    Alert.alert(
      'Terminar rutina',
      '¿Seguro que quieres terminar? Podrás guardar lo que llevas registrado.',
      [
        { text: 'Seguir entrenando', style: 'cancel' },
        { text: 'Terminar', style: 'destructive', onPress: () => setEstado('finalizada') },
      ],
    );
  };

  const volverAEntrenar = () => setEstado('progreso');

  const reiniciar = () => {
    setEjercicios(construirEjercicios(seleccion?.day ?? null));
    setExpandido(null);
    setEstado('progreso');
    setRestante(0);
    setSesionIniciada(Date.now());
    setResultado(null);
    setPendienteSync(false);
  };

  // SCRUM-168 / HU-30: la sesión completada nunca se pierde por falta de
  // señal — se encola y se confirma en el servidor al reconectar. Es una
  // escritura "segura" (no mueve dinero), a diferencia de renovar membresía
  // o pagar, que SÍ se bloquean sin conexión (ver membership.tsx, pos.tsx).
  const guardarSesion = async () => {
    if (!seleccion || !ejercicios) return;
    const porGuardar = ejercicios
      .map((e) => ({
        nombre: e.nombre, grupo: e.grupo, unidad: e.unidad,
        series: e.series.filter((s) => s.completada).map((s) => ({ repeticiones: s.reps, peso: s.peso, unidad: e.unidad })),
      }))
      .filter((e) => e.series.length > 0);

    if (porGuardar.length === 0) {
      Alert.alert('Nada que guardar', 'No marcaste ninguna serie como completada todavía.');
      return;
    }

    // "Previa" (ver CLAVE_PREVIA arriba): se guarda apenas se decide que SÍ
    // hay algo que registrar, sin esperar la confirmación del servidor -- es
    // una caché local optimista, igual de válida si el envío queda
    // encolado pendiente de sincronizar.
    leerJSON<PreviaPorEjercicio>(CLAVE_PREVIA, {}).then((cache) => {
      const next = { ...cache };
      for (const e of porGuardar) {
        next[normalizarNombreEj(e.nombre)] = e.series.map((s) => ({
          reps: String(s.repeticiones), peso: String(s.peso), unidad: e.unidad,
        }));
      }
      escribirJSON(CLAVE_PREVIA, next);
    });

    const duracionMin = Math.max(1, Math.round((Date.now() - sesionIniciada) / 60000));
    const payload = {
      nombre_rutina: `${seleccion.routine.nombre}${seleccion.day.grupo ? ' - ' + seleccion.day.grupo : ''}`,
      grupo_muscular: seleccion.day.grupo || undefined,
      id_rutina: seleccion.routine.idRutinaOrigen ?? undefined,
      duracion_min: duracionMin,
      ejercicios: porGuardar,
      // Se omite (el backend usa su propia hora local) tanto para "hoy"
      // como cuando la sesión llegó forzada desde el Paso B (`forzado`):
      // ahí no se está registrando retroactivamente un día pasado de la
      // semana, se está entrenando AHORA la rutina que el socio eligió.
      // Solo se manda cuando eligió explícitamente un día pasado con los
      // chips de abajo (ver renderDiaChips), que ya no se muestran cuando
      // `forzado` es true.
      dia: (forzado || esDiaElegidoHoy) ? undefined : diaElegido,
    };
    const totalSeriesGuardadas = porGuardar.reduce((acc, e) => acc + e.series.length, 0);

    const encolarYMostrar = async () => {
      await encolarAccion('WORKOUT_COMPLETE', ENDPOINTS.WORKOUT_COMPLETE, payload);
      setResultado({
        total_ejercicios: porGuardar.length,
        total_series: totalSeriesGuardadas,
        calorias_estimadas: 0, // se calcula en el servidor al sincronizar
      });
      setPendienteSync(true);
      setEstado('guardada');
    };

    setGuardando(true);
    try {
      if (!estaConectado()) {
        await encolarYMostrar();
        return;
      }
      const { data: res } = await api.post(ENDPOINTS.WORKOUT_COMPLETE, payload);
      setResultado(res);
      setPendienteSync(false);
      setEstado('guardada');
    } catch (e: any) {
      if (!e?.response) {
        // Se perdió la conexión justo al enviar: se encola en vez de
        // descartar la sesión completa que el socio acaba de registrar.
        await encolarYMostrar();
        return;
      }
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar la sesión.');
    } finally {
      setGuardando(false);
    }
  };

  // ── Estados de carga / alterno (sin rutina para hoy) ───────────────────
  // `ejercicios` arranca en null hasta que el efecto de arriba lo siembra;
  // solo esperamos ese sembrado cuando SÍ hay una rutina para hoy (si no la
  // hay, nunca se va a sembrar y hay que caer directo al estado alterno).
  const esperandoSiembra = !cargando && !!seleccion && ejercicios === null;
  if (cargando || esperandoSiembra) {
    return <LoadingSpinner fullScreen message="Preparando tu entrenamiento…" />;
  }

  if (!seleccion || (ejercicios !== null && ejercicios.length === 0)) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        {renderDiaChips()}
        <View style={styles.center}>
          <Ionicons name="moon-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {esDiaElegidoHoy ? 'Hoy no tienes rutina asignada' : `No tienes rutina para ese día`}
          </Text>
          <Text style={styles.emptyText}>
            {esDiaElegidoHoy
              ? 'Puede ser un día de descanso, o aún no tienes una rutina con ejercicios para hoy.'
              : 'Puede ser un día de descanso, o ese día no tiene ejercicios en tu rutina.'}
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
      </ScrollView>
    );
  }

  const lista = ejercicios ?? [];
  const totalSeries = lista.reduce((acc, e) => acc + e.series.length, 0);
  const hechas = lista.reduce((acc, e) => acc + e.series.filter((s) => s.completada).length, 0);
  const progreso = totalSeries > 0 ? Math.round((hechas / totalSeries) * 100) : 0;

  // Cambiar de candidata (solo tiene sentido cuando hay más de una para
  // hoy). Como las series de la sesión son de UNA rutina a la vez, cambiar
  // reinicia el progreso — se avisa si ya había algo marcado.
  const elegirRutina = (id: string) => {
    if (id === rutinaElegidaId) return;
    const cambiar = () => {
      setRutinaElegidaId(id);
      setEjercicios(null); // se vuelve a sembrar con los ejercicios de la nueva selección
      setExpandido(null);
      setEstado('progreso');
      setRestante(0);
      if (timerRef.current) clearInterval(timerRef.current);
      setSesionIniciada(Date.now());
      setResultado(null);
    };
    if (hechas > 0) {
      Alert.alert(
        'Cambiar de rutina',
        'Tienes series marcadas en la rutina actual que se perderán si cambias. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cambiar', style: 'destructive', onPress: cambiar },
        ],
      );
    } else {
      cambiar();
    }
  };

  // ── Resumen / guardado ───────────────────────────────────────────────────
  if (estado === 'finalizada' || estado === 'guardada') {
    const guardada = estado === 'guardada';
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, styles.center, { paddingTop: insets.top + 24 }]}>
        <Ionicons name={guardada ? 'checkmark-done-circle-outline' : 'flag-outline'} size={56} color={colors.accent} />
        <Text style={styles.emptyTitle}>{guardada ? '¡Sesión guardada!' : 'Rutina finalizada'}</Text>
        <Text style={styles.emptyText}>
          {guardada && resultado
            ? (pendienteSync
                ? `${resultado.total_ejercicios} ejercicios · ${resultado.total_series} series — se sincronizará al reconectar`
                : `${resultado.total_ejercicios} ejercicios · ${resultado.total_series} series · ~${resultado.calorias_estimadas} kcal`)
            : `${hechas} de ${totalSeries} series marcadas como completadas.`}
        </Text>
        {guardada && pendienteSync && (
          <View style={styles.syncPendienteBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
            <Text style={styles.syncPendienteTexto}>
              Guardado en tu dispositivo. Se enviará al servidor en cuanto recuperes conexión.
            </Text>
          </View>
        )}

        {!guardada && (
          <>
            <Button
              label="Guardar sesión"
              onPress={guardarSesion}
              loading={guardando}
              icon={<Ionicons name="save-outline" size={18} color={colors.onAccent} />}
              style={{ marginTop: 20, width: '100%' }}
            />
            <Button
              label="Seguir entrenando"
              variant="secondary"
              onPress={volverAEntrenar}
              style={{ marginTop: 10, width: '100%' }}
            />
          </>
        )}
        {guardada && (
          <>
            <Button
              label="¿Empezar de nuevo?"
              onPress={reiniciar}
              icon={<Ionicons name="refresh-outline" size={18} color={colors.onAccent} />}
              style={{ marginTop: 20, width: '100%' }}
            />
            <Button
              label="Salir"
              variant="secondary"
              onPress={() => router.back()}
              style={{ marginTop: 10, width: '100%' }}
            />
          </>
        )}
      </ScrollView>
    );
  }

  // ── Lista libre de ejercicios del día elegido ───────────────────────────
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      {renderDiaChips()}
      {!forzado && candidatas.length > 1 && (
        <View style={styles.selectorRutina}>
          {candidatas.map((c) => {
            const activa = c.routine.id === seleccion.routine.id;
            const asignada = c.routine.origen === 'entrenador';
            return (
              <TouchableOpacity
                key={c.routine.id}
                onPress={() => elegirRutina(c.routine.id)}
                style={[styles.rutinaChip, activa && styles.rutinaChipActiva]}
                accessibilityRole="button"
                accessibilityLabel={`${asignada ? 'Rutina asignada' : 'Mi rutina'}: ${c.routine.nombre}${activa ? ', seleccionada' : ''}`}
              >
                <Ionicons
                  name={asignada ? 'school-outline' : 'person-outline'}
                  size={13}
                  color={activa ? colors.onAccent : colors.textSecondary}
                />
                <Text style={[styles.rutinaChipTexto, activa && styles.rutinaChipTextoActiva]} numberOfLines={1}>
                  {c.routine.nombre || (asignada ? 'Asignada' : 'Mi rutina')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Barra superior del Paso C: cronómetro de sesión, descanso, ajustes
          y Terminar -- todo en un solo lugar, visible todo el tiempo. */}
      <View style={styles.topBar}>
        <View style={styles.cronometro}>
          <Ionicons name="time-outline" size={15} color={colors.accent} />
          <Text style={styles.cronometroTexto}>{elapsedStr}</Text>
        </View>
        {restante > 0 ? (
          <TouchableOpacity
            onPress={saltarDescanso}
            style={[styles.descansoChip, { backgroundColor: colors.accent }]}
            accessibilityRole="button"
            accessibilityLabel={`Descanso, ${restante} segundos restantes, tocar para saltar`}
          >
            <Ionicons name="hourglass-outline" size={14} color={colors.onAccent} />
            <Text style={styles.descansoChipTexto}>{restante}s · Saltar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={abrirAjustesDescanso}
            style={styles.ajustesBtn}
            accessibilityRole="button"
            accessibilityLabel={`Ajustar descanso entre series, actualmente ${descansoSeg} segundos`}
          >
            <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={terminarRutina} accessibilityLabel="Terminar rutina" style={styles.terminarBtn}>
          <Ionicons name="stop-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.terminarTexto}>Terminar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progresoBar}>
        <View style={[styles.progresoFill, { width: `${progreso}%`, backgroundColor: colors.accent }]} />
      </View>
      <Text style={styles.progresoTexto}>{hechas} de {totalSeries} series completadas</Text>

      {/* Pestañas/círculos para saltar a un ejercicio -- SOLO un atajo
          visual, no imponen ningún orden (ver el porqué en el encabezado
          del archivo: retro explícita de Miguel en v2 de esta pantalla). */}
      {lista.length > 1 && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.circulosRow} contentContainerStyle={styles.circulosRowContent}
        >
          {lista.map((ej) => {
            const completoEj = ej.series.length > 0 && ej.series.every((s) => s.completada);
            const activo = expandido === ej.exIdx;
            return (
              <TouchableOpacity
                key={ej.exIdx}
                onPress={() => setExpandido(ej.exIdx)}
                style={[
                  styles.circulo,
                  activo && styles.circuloActivo,
                  completoEj && !activo && styles.circuloCompleto,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Ir a ${ej.nombre}${completoEj ? ', completado' : ''}`}
              >
                {completoEj
                  ? <Ionicons name="checkmark" size={14} color={activo ? colors.onAccent : colors.success} />
                  : <Text style={[styles.circuloTexto, activo && styles.circuloTextoActivo]}>{ej.exIdx + 1}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <Text style={styles.ayudaTexto}>
        Elige con qué ejercicio seguir — no hay un orden obligatorio. Combínalos o salta a otro si el equipo está ocupado.
      </Text>

      {lista.map((ej) => {
        const hechasEj = ej.series.filter((s) => s.completada).length;
        const completoEj = hechasEj === ej.series.length;
        const abierto = expandido === ej.exIdx;
        return (
          <Card key={ej.exIdx} style={{ marginTop: 12 }}>
            <TouchableOpacity
              style={styles.ejercicioHeader}
              onPress={() => setExpandido(abierto ? null : ej.exIdx)}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <View style={styles.ejercicioNombreRow}>
                  {completoEj && <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 6 }} />}
                  <Text style={styles.nombreEjercicio}>{ej.nombre}</Text>
                </View>
                {!!ej.grupo && <Text style={styles.grupoEjercicio}>{ej.grupo}</Text>}
              </View>
              <Text style={styles.contadorSeries}>{hechasEj}/{ej.series.length}</Text>
              <Ionicons name={abierto ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {abierto && (
              <View style={{ marginTop: 12 }}>
                {!!ej.imagenes?.length && (
                  <View style={styles.galeriaRow}>
                    {ej.imagenes.map((uri, i) => (
                      <Image
                        key={i}
                        source={{ uri }}
                        style={[styles.imagen, ej.imagenes!.length > 1 && styles.imagenMultiple]}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
                {!!ej.notas && <Text style={styles.notas}>{ej.notas}</Text>}

                {/* Tutorial / Reemplazar / Notas -- ver abrirTutorial,
                    abrirReemplazo y actualizarNotaSesion más arriba. Una
                    animación/modelo 3D del movimiento está fuera de alcance
                    (no hay assets ni motor 3D en el proyecto): "Tutorial"
                    abre el mismo detalle con imágenes + video + instrucciones
                    que ya usan training.tsx y mi-rutina.tsx. */}
                <View style={styles.accionesEjRow}>
                  <TouchableOpacity style={styles.accionBtn} onPress={() => abrirTutorial(ej)} accessibilityRole="button">
                    <Ionicons name="play-circle-outline" size={16} color={colors.accent} />
                    <Text style={styles.accionBtnTexto}>Tutorial</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.accionBtn} onPress={() => abrirReemplazo(ej)} accessibilityRole="button">
                    <Ionicons name="swap-horizontal-outline" size={16} color={colors.accent} />
                    <Text style={styles.accionBtnTexto}>Reemplazar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.accionBtn}
                    onPress={() => setNotaAbiertaIdx(notaAbiertaIdx === ej.exIdx ? null : ej.exIdx)}
                    accessibilityRole="button"
                  >
                    <Ionicons name="create-outline" size={16} color={colors.accent} />
                    <Text style={styles.accionBtnTexto}>Notas</Text>
                  </TouchableOpacity>
                </View>

                {notaAbiertaIdx === ej.exIdx && (
                  <TextInput
                    style={styles.notaInput}
                    value={ej.notasSesion}
                    onChangeText={(v) => actualizarNotaSesion(ej.exIdx, v)}
                    placeholder="Nota de esta sesión (ej. sentí tirón, subí peso fácil…)"
                    placeholderTextColor={colors.textMuted}
                    multiline
                  />
                )}

                <View style={styles.serieHeaderRow}>
                  <Text style={[styles.serieHeaderTexto, styles.serieHeaderCheck]}>Serie</Text>
                  <Text style={[styles.serieHeaderTexto, styles.serieHeaderPrevia]}>Previa</Text>
                  <Text style={[styles.serieHeaderTexto, { flex: 1, textAlign: 'center' }]}>Reps</Text>
                  <Text style={styles.serieHeaderTexto}> </Text>
                  <Text style={[styles.serieHeaderTexto, { flex: 1, textAlign: 'center' }]}>Peso</Text>
                  <Text style={[styles.serieHeaderTexto, { width: 24 }]} />
                </View>

                {ej.series.map((serie) => {
                  const pesoMostrado = serie.peso ? convertirPeso(parseFloat(serie.peso) || 0, ej.unidad, unidadPreferida) : null;
                  const previaPeso = serie.previa?.peso
                    ? convertirPeso(parseFloat(serie.previa.peso) || 0, serie.previa.unidad, unidadPreferida)
                    : null;
                  const previaStr = serie.previa
                    ? `${serie.previa.reps}×${previaPeso != null ? Math.round(previaPeso * 10) / 10 : '—'}`
                    : '—';
                  return (
                    <View key={serie.idx} style={styles.serieRow}>
                      <TouchableOpacity
                        onPress={() => marcarSerie(ej.exIdx, serie.idx)}
                        style={[styles.serieCheck, serie.completada && styles.serieCheckHecha]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: serie.completada }}
                        accessibilityLabel={`Serie ${serie.idx + 1}`}
                      >
                        {serie.completada
                          ? <Ionicons name="checkmark" size={16} color={colors.onAccent} />
                          : <Text style={styles.serieNumero}>{serie.idx + 1}</Text>}
                      </TouchableOpacity>
                      <Text style={styles.serieVioPrevia} numberOfLines={1}>{previaStr}</Text>
                      <TextInput
                        style={styles.serieInput}
                        value={serie.reps}
                        onChangeText={(v) => actualizarSerie(ej.exIdx, serie.idx, 'reps', v)}
                        keyboardType="number-pad"
                        placeholder="reps"
                        placeholderTextColor={colors.textMuted}
                      />
                      <Text style={styles.serieX}>×</Text>
                      <TextInput
                        style={styles.serieInput}
                        value={pesoMostrado != null ? String(Math.round(pesoMostrado * 10) / 10) : ''}
                        onChangeText={(v) => {
                          const n = parseFloat(v.replace(',', '.'));
                          actualizarSerie(ej.exIdx, serie.idx, 'peso', isNaN(n) ? '' : String(convertirPeso(n, unidadPreferida, ej.unidad)));
                        }}
                        keyboardType="decimal-pad"
                        placeholder={unidadPreferida}
                        placeholderTextColor={colors.textMuted}
                      />
                      <Text style={styles.serieUnidad}>{unidadPreferida}</Text>
                    </View>
                  );
                })}

                <TouchableOpacity style={styles.addSerieBtn} onPress={() => agregarSerie(ej.exIdx)} accessibilityRole="button">
                  <Ionicons name="add" size={16} color={colors.accent} />
                  <Text style={styles.addSerieTexto}>Añadir serie</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        );
      })}

      {/* Reemplazar ejercicio (solo esta sesión) -- ver abrirReemplazo arriba. */}
      <Modal visible={reemplazando !== null} transparent animationType="fade" onRequestClose={() => setReemplazando(null)}>
        <View style={styles.reemplazoOverlay}>
          <View style={styles.reemplazoCard}>
            <Text style={styles.reemplazoTitulo}>Reemplazar ejercicio</Text>
            <Text style={styles.reemplazoAyuda}>
              Solo para esta sesión: cambia con qué nombre se registra, no la rutina original.
            </Text>
            <TextInput
              style={styles.reemplazoInput}
              value={textoReemplazo}
              onChangeText={setTextoReemplazo}
              placeholder="Nombre del ejercicio"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.reemplazoBotones}>
              <Button label="Cancelar" variant="secondary" onPress={() => setReemplazando(null)} style={{ flex: 1 }} />
              <Button label="Guardar" onPress={confirmarReemplazo} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <ExerciseDetailSheet
        visible={!!tutorialEj}
        exercise={tutorialEj}
        onClose={() => setTutorialEj(null)}
      />
    </ScrollView>
  );
}

function make_styles(colors: any, fs: number) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    center:  { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
    emptyTitle: { fontSize: 18 * fs, fontWeight: '700', color: colors.text, marginTop: 14, textAlign: 'center' },
    emptyText:  { fontSize: 14 * fs, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
    syncPendienteBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, width: '100%',
      backgroundColor: colors.inputBg, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 10, paddingHorizontal: 12,
    },
    syncPendienteTexto: { flex: 1, fontSize: 12.5 * fs, color: colors.textSecondary, lineHeight: 17 },
    selectorRutina: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    rutinaChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%',
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
    },
    rutinaChipActiva: { backgroundColor: colors.accent, borderColor: colors.accent },
    rutinaChipTexto: { fontSize: 12.5 * fs, color: colors.textSecondary, fontWeight: '600' },
    rutinaChipTextoActiva: { color: colors.onAccent },
    diaSelectorRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    diaChip: {
      flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
    },
    diaChipActivo: { backgroundColor: colors.accent, borderColor: colors.accent },
    diaChipDeshabilitado: { opacity: 0.4 },
    diaChipLabel: { fontSize: 11 * fs, color: colors.textSecondary, fontWeight: '600' },
    diaChipNumero: { fontSize: 13 * fs, color: colors.text, fontWeight: '700', marginTop: 2 },
    diaChipLabelActivo: { color: colors.onAccent },
    diaChipLabelDeshabilitado: { color: colors.textMuted },
    topBar: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 10,
    },
    cronometro: {
      flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    cronometroTexto: { fontSize: 13 * fs, color: colors.text, fontWeight: '700' },
    descansoChip: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 7, borderRadius: 10,
    },
    descansoChipTexto: { fontSize: 12.5 * fs, color: colors.onAccent, fontWeight: '700' },
    ajustesBtn: {
      width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    terminarBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8,
      borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    terminarTexto: { fontSize: 12 * fs, color: colors.textSecondary, fontWeight: '600' },
    progresoBar:  { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
    progresoFill: { height: 6, borderRadius: 3 },
    progresoTexto: { fontSize: 12 * fs, color: colors.textSecondary, fontWeight: '600', marginTop: 8 },
    circulosRow:        { flexGrow: 0, marginTop: 12 },
    circulosRowContent: { gap: 8, paddingVertical: 2 },
    circulo: {
      width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    circuloActivo:   { backgroundColor: colors.accent, borderColor: colors.accent },
    circuloCompleto: { backgroundColor: colors.successBg ?? (colors.success + '22'), borderColor: colors.success },
    circuloTexto:       { fontSize: 12.5 * fs, color: colors.textSecondary, fontWeight: '700' },
    circuloTextoActivo: { color: colors.onAccent },
    ayudaTexto: { fontSize: 12 * fs, color: colors.textMuted, marginTop: 12, lineHeight: 17 },
    accionesEjRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    accionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
      paddingVertical: 8, borderRadius: 10, backgroundColor: colors.accentBg,
    },
    accionBtnTexto: { fontSize: 12 * fs, color: colors.accent, fontWeight: '700' },
    notaInput: {
      backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      padding: 10, color: colors.text, fontSize: 13 * fs, minHeight: 60, textAlignVertical: 'top',
      marginBottom: 10,
    },
    serieHeaderRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    serieHeaderTexto: { fontSize: 10.5 * fs, color: colors.textMuted, fontWeight: '700' },
    serieHeaderCheck:  { width: 30, textAlign: 'center' },
    serieHeaderPrevia: { width: 54, textAlign: 'center' },
    serieVioPrevia: { width: 54, fontSize: 11.5 * fs, color: colors.textMuted, textAlign: 'center', fontWeight: '600' },
    addSerieBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 9, marginTop: 8, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed',
      borderColor: colors.accent,
    },
    addSerieTexto: { fontSize: 12.5 * fs, color: colors.accent, fontWeight: '700' },
    reemplazoOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    reemplazoCard: {
      width: '100%', backgroundColor: colors.card, borderRadius: 16, padding: 18, gap: 10,
      borderWidth: 1, borderColor: colors.border,
    },
    reemplazoTitulo: { fontSize: 16 * fs, color: colors.text, fontWeight: '700' },
    reemplazoAyuda:  { fontSize: 12 * fs, color: colors.textMuted, lineHeight: 17 },
    reemplazoInput: {
      backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14 * fs,
    },
    reemplazoBotones: { flexDirection: 'row', gap: 10, marginTop: 4 },
    ejercicioHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ejercicioNombreRow: { flexDirection: 'row', alignItems: 'center' },
    nombreEjercicio: { fontSize: 15 * fs, fontWeight: '700', color: colors.text },
    grupoEjercicio:  { fontSize: 12 * fs, color: colors.textSecondary, marginTop: 2 },
    contadorSeries: { fontSize: 12 * fs, color: colors.textMuted, fontWeight: '700' },
    galeriaRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    imagen: { flex: 1, height: 140, borderRadius: 12 },
    imagenMultiple: { height: 110 },
    videoLink: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    notas: { fontSize: 13 * fs, color: colors.textMuted, marginBottom: 10, lineHeight: 19 },
    serieRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    serieCheck: {
      width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    serieCheckHecha: { backgroundColor: colors.success, borderColor: colors.success },
    serieNumero: { fontSize: 12 * fs, fontWeight: '700', color: colors.textSecondary },
    serieInput: {
      flex: 1, backgroundColor: colors.inputBg, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      color: colors.text, paddingVertical: 8, paddingHorizontal: 10, fontSize: 14 * fs, fontWeight: '600', textAlign: 'center',
    },
    serieX: { fontSize: 13 * fs, color: colors.textMuted },
    serieUnidad: { fontSize: 11 * fs, color: colors.textMuted, width: 24 },
  });
}
