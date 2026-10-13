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
 * Descanso entre series: el modelo de ejercicio del backend todavía no
 * tiene un campo de descanso configurable (ver api/app/routes/miembro/
 * user_routine.py) — se usa un valor por defecto razonable
 * (DESCANSO_DEFECTO_SEG) hasta que exista ese campo.
 */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, Image, Linking,
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

// ── Tipos (mismo contrato que workout-log.tsx) ──────────────────────────────
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

// ── Modelo de la sesión: un ejercicio con sus series, editable libremente ──
interface SerieUI { idx: number; reps: string; peso: string; completada: boolean }
interface EjercicioUI {
  exIdx: number; nombre: string; grupo?: string; notas?: string;
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

  const seleccion = useMemo(() => {
    for (const r of routines) {
      if (r.activa === false) continue;
      const idx = (r.dias || []).findIndex(dayMatchesToday);
      if (idx >= 0) return { routine: r, day: r.dias[idx] };
    }
    return null;
  }, [routines]);

  const unidadPreferida = (profileData?.unidadMedida || '').toLowerCase().startsWith('imperial') ? 'lb' : 'kg';

  // Se siembra UNA sola vez cuando la selección de hoy esté lista — un
  // refetch posterior de rutinas/perfil no debe borrar el progreso que ya
  // llevas marcado en esta sesión.
  const [ejercicios, setEjercicios] = useState<EjercicioUI[] | null>(null);
  useEffect(() => {
    if (ejercicios === null && seleccion) {
      setEjercicios(construirEjercicios(seleccion.day));
    }
  }, [seleccion, ejercicios]);

  const [expandido, setExpandido] = useState<number | null>(null);
  const [estado, setEstado] = useState<'progreso' | 'finalizada' | 'guardada'>('progreso');
  const [restante, setRestante] = useState(0);
  const [sesionIniciada, setSesionIniciada] = useState(() => Date.now());
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<{ total_ejercicios: number; total_series: number; calorias_estimadas: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const iniciarDescansoNoBloqueante = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestante(DESCANSO_DEFECTO_SEG);
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
  };

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

    setGuardando(true);
    try {
      const duracionMin = Math.max(1, Math.round((Date.now() - sesionIniciada) / 60000));
      const { data: res } = await api.post(ENDPOINTS.WORKOUT_COMPLETE, {
        nombre_rutina: `${seleccion.routine.nombre}${seleccion.day.grupo ? ' - ' + seleccion.day.grupo : ''}`,
        grupo_muscular: seleccion.day.grupo || undefined,
        id_rutina: seleccion.routine.idRutinaOrigen ?? undefined,
        duracion_min: duracionMin,
        ejercicios: porGuardar,
      });
      setResultado(res);
      setEstado('guardada');
    } catch (e: any) {
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

  const lista = ejercicios ?? [];
  const totalSeries = lista.reduce((acc, e) => acc + e.series.length, 0);
  const hechas = lista.reduce((acc, e) => acc + e.series.filter((s) => s.completada).length, 0);
  const progreso = totalSeries > 0 ? Math.round((hechas / totalSeries) * 100) : 0;

  // ── Resumen / guardado ───────────────────────────────────────────────────
  if (estado === 'finalizada' || estado === 'guardada') {
    const guardada = estado === 'guardada';
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, styles.center, { paddingTop: insets.top + 24 }]}>
        <Ionicons name={guardada ? 'checkmark-done-circle-outline' : 'flag-outline'} size={56} color={colors.accent} />
        <Text style={styles.emptyTitle}>{guardada ? '¡Sesión guardada!' : 'Rutina finalizada'}</Text>
        <Text style={styles.emptyText}>
          {guardada && resultado
            ? `${resultado.total_ejercicios} ejercicios · ${resultado.total_series} series · ~${resultado.calorias_estimadas} kcal`
            : `${hechas} de ${totalSeries} series marcadas como completadas.`}
        </Text>

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

  // ── Lista libre de ejercicios de hoy ────────────────────────────────────
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.progresoBar}>
        <View style={[styles.progresoFill, { width: `${progreso}%`, backgroundColor: colors.accent }]} />
      </View>
      <View style={styles.headerRow}>
        <Text style={styles.progresoTexto}>{hechas} de {totalSeries} series completadas</Text>
        <TouchableOpacity onPress={terminarRutina} accessibilityLabel="Terminar rutina" style={styles.terminarBtn}>
          <Ionicons name="stop-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.terminarTexto}>Terminar rutina</Text>
        </TouchableOpacity>
      </View>

      {restante > 0 && (
        <View style={styles.descansoBanner}>
          <Ionicons name="time-outline" size={16} color={colors.accent} />
          <Text style={styles.descansoBannerTexto}>Descanso sugerido: {restante}s</Text>
          <TouchableOpacity onPress={saltarDescanso}>
            <Text style={styles.descansoBannerSaltar}>Saltar</Text>
          </TouchableOpacity>
        </View>
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
                  <Image source={{ uri: ej.imagenes[0] }} style={styles.imagen} resizeMode="cover" />
                )}
                {!!ej.video && (
                  <TouchableOpacity onPress={() => Linking.openURL(ej.video!)} style={styles.videoLink}>
                    <Ionicons name="play-circle-outline" size={18} color={colors.accent} />
                    <Text style={{ color: colors.accent, marginLeft: 6, fontWeight: '600' }}>Ver video de técnica</Text>
                  </TouchableOpacity>
                )}
                {!!ej.notas && <Text style={styles.notas}>{ej.notas}</Text>}

                {ej.series.map((serie) => {
                  const pesoMostrado = serie.peso ? convertirPeso(parseFloat(serie.peso) || 0, ej.unidad, unidadPreferida) : null;
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
              </View>
            )}
          </Card>
        );
      })}
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
    progresoBar:  { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
    progresoFill: { height: 6, borderRadius: 3 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    progresoTexto: { fontSize: 12 * fs, color: colors.textSecondary, fontWeight: '600' },
    terminarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
    terminarTexto: { fontSize: 12 * fs, color: colors.textSecondary, fontWeight: '600' },
    descansoBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
      backgroundColor: colors.inputBg, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 8, paddingHorizontal: 12,
    },
    descansoBannerTexto: { flex: 1, fontSize: 12.5 * fs, color: colors.text, fontWeight: '600' },
    descansoBannerSaltar: { fontSize: 12.5 * fs, color: colors.accent, fontWeight: '700' },
    ayudaTexto: { fontSize: 12 * fs, color: colors.textMuted, marginTop: 12, lineHeight: 17 },
    ejercicioHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ejercicioNombreRow: { flexDirection: 'row', alignItems: 'center' },
    nombreEjercicio: { fontSize: 15 * fs, fontWeight: '700', color: colors.text },
    grupoEjercicio:  { fontSize: 12 * fs, color: colors.textSecondary, marginTop: 2 },
    contadorSeries: { fontSize: 12 * fs, color: colors.textMuted, fontWeight: '700' },
    imagen: { width: '100%', height: 140, borderRadius: 12, marginBottom: 10 },
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
