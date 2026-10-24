/**
 * UserWorkoutLog.jsx — Registrar entrenamiento (bitácora del miembro).
 *
 * El miembro SELECCIONA una de sus rutinas (propia o asignada por su entrenador)
 * y un día; los ejercicios se cargan desde ahí (no se escriben a mano). Solo
 * ajusta repeticiones y peso de cada serie. Al guardar:
 *   - se registra el entrenamiento en su bitácora,
 *   - cuenta como asistencia,
 *   - se calculan automáticamente las calorías quemadas,
 *   - y si captura su peso del día, se actualizan sus métricas y predicción.
 * Solo iconos (react-icons), sin emojis.
 */
import { useState, useEffect, useCallback } from "react";
import {
  FiPlus, FiTrash2, FiSave, FiActivity, FiCalendar, FiClock,
  FiTrendingUp, FiCheckCircle, FiRefreshCw, FiBarChart2, FiList,
} from "react-icons/fi";
import { GiMuscleUp } from "react-icons/gi";
import { getUserRoutines, completeWorkout, getWorkouts } from "../../api/workouts";
import { useNavigate } from "react-router-dom";
import "../../css/CSSUnificado.css";

const emptySerie = () => ({ repeticiones: "", peso: "" });

// Construye las series editables a partir de un ejercicio de la rutina.
function seriesFrom(ej) {
  const n = Math.min(10, Math.max(1, parseInt(ej.series, 10) || 3));
  const reps = ej.reps ? String(ej.reps) : "";
  const peso = ej.peso ? String(ej.peso) : "";
  return Array.from({ length: n }, () => ({ repeticiones: reps, peso }));
}

// ── Auto-detección del día por la fecha de hoy ──────────────────────────────
const WEEKDAYS_ES = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const normTxt = (s) =>
  (s ?? "").toString().toLowerCase()
    .replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i")
    .replace(/ó/g, "o").replace(/ú/g, "u").replace(/ü/g, "u").trim();
const todayName = () => WEEKDAYS_ES[new Date().getDay()];
// ¿El nombre del día de la rutina (p.ej. "Martes", "Día 2 · Martes") coincide con hoy?
const dayMatchesToday = (d) => normTxt(d?.dia).includes(todayName());
// Selecciona el día que cae hoy; si ninguno coincide, usa el primero.
const pickTodayOrFirst = (dias) => (dias || []).find(dayMatchesToday) || (dias || [])[0] || null;
// Ejercicios editables de un día (nombres fijos de la rutina, series por defecto).
// Cada ejercicio conserva su grupo muscular y su unidad de peso (kg / lb).
const exercisesFromDay = (day) =>
  (day?.ejercicios || []).filter(e => e.nombre).map(e => ({
    nombre: e.nombre,
    grupo: e.grupo || "",
    unidad: e.unidad || "kg",
    series: seriesFrom(e),
  }));

// Interpreta valores multivalor ("7,7,7" / "10,20,30") y convierte lb a kg.
const LB_A_KG = 0.453592;
const nums = (v) => String(v ?? "").replace(/;/g, ",").split(",")
  .map(p => { const m = p.match(/-?\d*\.?\d+/); return m ? parseFloat(m[0]) : null; })
  .filter(n => n != null && !isNaN(n));
const setVolumen = (s, unidad) => {
  const r = nums(s.repeticiones), p = nums(s.peso).map(x => x * (String(unidad).toLowerCase().startsWith("lb") ? LB_A_KG : 1));
  if (!r.length || !p.length) return 0;
  if (r.length === p.length) return r.reduce((a, x, i) => a + x * p[i], 0);
  return r.reduce((a, x) => a + x, 0) * (p.reduce((a, x) => a + x, 0) / p.length);
};

export default function UserWorkoutLog() {
  const navigate = useNavigate();

  const [routines, setRoutines] = useState([]);
  const [loadingRoutines, setLoadingRoutines] = useState(true);
  const [routineId, setRoutineId] = useState("");
  const [dayId, setDayId] = useState("");

  const [exercises, setExercises] = useState([]); // [{ nombre, series:[{repeticiones,peso}] }]
  const [duracion, setDuracion] = useState("");
  const [pesoCorporal, setPeso] = useState("");
  const [notas, setNotas]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  const [workouts, setWorkouts] = useState([]);
  const [resumen, setResumen]   = useState(null);
  const [loadingHist, setLoadingHist] = useState(true);

  const selectedRoutine = routines.find(r => r.id === routineId) || null;
  const days = selectedRoutine?.dias || [];
  const selectedDay = days.find(d => d.id === dayId) || null;

  const loadHist = useCallback(() => {
    setLoadingHist(true);
    getWorkouts({ limit: 20 })
      .then(r => { setWorkouts(r.data?.workouts || []); setResumen(r.data?.resumen || null); })
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, []);

  const loadRoutines = useCallback(() => {
    setLoadingRoutines(true);
    getUserRoutines()
      .then(r => setRoutines(r.data?.rutinas || []))
      .catch(() => setRoutines([]))
      .finally(() => setLoadingRoutines(false));
  }, []);

  useEffect(() => { loadRoutines(); loadHist(); }, [loadRoutines, loadHist]);

  // Aplica una rutina: fija duración y preselecciona el día que cae HOY
  // (o el primero si ninguno coincide), cargando sus ejercicios.
  const applyRoutine = useCallback((rut) => {
    if (!rut) { setRoutineId(""); setDayId(""); setExercises([]); return; }
    setRoutineId(rut.id);
    setDuracion(rut.duracion_minutos ? String(rut.duracion_minutos) : "");
    const day = pickTodayOrFirst(rut.dias);
    setDayId(day?.id || "");
    setExercises(day ? exercisesFromDay(day) : []);
    setMsg(null);
  }, []);

  // Auto-selección inicial: primera rutina activa + día de hoy (una sola vez).
  const [autoApplied, setAutoApplied] = useState(false);
  useEffect(() => {
    if (!autoApplied && !routineId && routines.length > 0) {
      applyRoutine(routines.find(x => x.activa !== false) || routines[0]);
      setAutoApplied(true);
    }
  }, [routines, autoApplied, routineId, applyRoutine]);

  const onRoutineChange = (id) => applyRoutine(routines.find(r => r.id === id));

  const onDayChange = (id) => {
    setDayId(id);
    setExercises(exercisesFromDay(days.find(x => x.id === id)));
  };

  // Series editables (solo reps/peso; los nombres vienen de la rutina).
  const addSerie = (i) => setExercises(xs => xs.map((x, idx) => idx === i ? { ...x, series: [...x.series, emptySerie()] } : x));
  const removeSerie = (i, si) => setExercises(xs => xs.map((x, idx) => idx === i ? { ...x, series: x.series.length > 1 ? x.series.filter((_, k) => k !== si) : x.series } : x));
  const setSerie = (i, si, field, v) => setExercises(xs => xs.map((x, idx) =>
    idx === i ? { ...x, series: x.series.map((s, k) => k === si ? { ...s, [field]: v } : s) } : x));
  const toggleUnit = (i) => setExercises(xs => xs.map((x, idx) =>
    idx === i ? { ...x, unidad: (x.unidad === "lb" ? "kg" : "lb") } : x));

  const totalVolumen = exercises.reduce((acc, ex) =>
    acc + ex.series.reduce((a, s) => a + setVolumen(s, ex.unidad), 0), 0);

  const save = async () => {
    if (!selectedRoutine || !selectedDay) { setMsg({ type: "warn", text: "Selecciona una rutina y un día." }); return; }
    const ejercicios = exercises
      .map(ex => ({
        nombre: ex.nombre,
        grupo: ex.grupo || undefined,
        unidad: ex.unidad || "kg",
        series: ex.series
          .filter(s => (s.repeticiones ?? "") !== "" || (s.peso ?? "") !== "")
          .map(s => ({ repeticiones: String(s.repeticiones ?? ""), peso: String(s.peso ?? ""), unidad: ex.unidad || "kg" })),
      }))
      .filter(ex => ex.series.length > 0);
    if (ejercicios.length === 0) { setMsg({ type: "warn", text: "Registra al menos una serie (repeticiones o peso) en algún ejercicio." }); return; }

    setSaving(true);
    setMsg(null);
    try {
      const { data } = await completeWorkout({
        nombre_rutina: `${selectedRoutine.nombre}${selectedDay.grupo ? " - " + selectedDay.grupo : ""}`,
        grupo_muscular: selectedDay.grupo || undefined,
        id_rutina: selectedRoutine.id,
        duracion_min: duracion ? parseInt(duracion) : undefined,
        peso_corporal: pesoCorporal ? parseFloat(pesoCorporal) : undefined,
        notas: notas.trim() || undefined,
        ejercicios,
      });
      setMsg({
        type: "ok",
        text: `Entrenamiento guardado: ${data.total_ejercicios} ejercicios, ${data.total_series} series. ` +
          `Quemaste aproximadamente ${data.calorias_estimadas} kcal.` +
          (data.peso_registrado ? " Tu peso del día actualizó tus métricas." : ""),
      });
      // Recargar el día para volver a empezar con los valores de la rutina.
      if (selectedDay) setExercises(exercisesFromDay(selectedDay));
      setPeso(""); setNotas("");
      loadHist();
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.error || "No se pudo guardar el entrenamiento." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Registrar entrenamiento</h1>
          <p style={S.sub}>Elige tu rutina y registra lo que hiciste. Tus calorías se calculan solas.</p>
        </div>
      </div>

      <div style={S.grid}>
        {/* ── Formulario ── */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <h3 style={S.cardTitle}><FiActivity /> Tu entrenamiento</h3>
            <button style={S.ghostBtn} onClick={loadRoutines}><FiRefreshCw /> Recargar rutinas</button>
          </div>

          {loadingRoutines ? (
            <p style={{ color: "var(--text-secondary)", padding: 20 }}>Cargando tus rutinas…</p>
          ) : routines.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <GiMuscleUp size={36} style={{ color: "var(--text-secondary)", opacity: .4 }} />
              <p style={{ color: "var(--text-secondary)", margin: "12px 0 16px" }}>
                Aún no tienes rutinas. Crea una o pídele a tu entrenador que te asigne una para registrar tus entrenamientos.
              </p>
              <button style={S.saveBtn} onClick={() => navigate("/user/routine")}>Ir a Mi Rutina</button>
            </div>
          ) : (
            <>
              {/* Selección de rutina y día */}
              <label style={S.label}>Rutina</label>
              <select style={S.input} value={routineId} onChange={e => onRoutineChange(e.target.value)}>
                <option value="">Selecciona una rutina…</option>
                {routines.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}{r.activa === false ? " (inactiva)" : ""}</option>
                ))}
              </select>

              {days.length > 1 && (
                <>
                  <label style={S.label}>
                    Día
                    {selectedDay && dayMatchesToday(selectedDay) && (
                      <span style={S.todayTag}><FiCalendar size={10} /> Hoy</span>
                    )}
                  </label>
                  <select style={S.input} value={dayId} onChange={e => onDayChange(e.target.value)}>
                    {days.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.dia || "Día"}{d.grupo ? ` · ${d.grupo}` : ""}{dayMatchesToday(d) ? " (hoy)" : ""}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {/* Ejercicios de la rutina, agrupados por grupo muscular */}
              {selectedDay && (
                exercises.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", padding: "16px 0" }}>Este día no tiene ejercicios.</p>
                ) : (
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 18 }}>
                    {(() => {
                      const grupos = [];
                      exercises.forEach(ex => { const gg = ex.grupo || "General"; if (!grupos.includes(gg)) grupos.push(gg); });
                      return grupos.map(gid => (
                        <div key={gid}>
                          {(grupos.length > 1 || (gid && gid !== "General")) && (
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "capitalize", margin: "0 0 8px" }}>{gid}</div>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {exercises.map((ex, i) => ({ ex, i })).filter(x => (x.ex.grupo || "General") === gid).map(({ ex, i }) => (
                              <div key={i} style={S.exCard}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                                  <GiMuscleUp style={{ color: "var(--accent)", flexShrink: 0 }} />
                                  <span style={{ flex: 1, fontWeight: 600, color: "var(--text-primary)" }}>{ex.nombre}</span>
                                  <button onClick={() => toggleUnit(i)} title="Cambiar unidad de peso (kg / lb)"
                                    style={{ padding: "4px 10px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--accent)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                    {ex.unidad || "kg"}
                                  </button>
                                </div>
                                <div style={S.serieHead}>
                                  <span style={{ width: 28 }}>#</span>
                                  <span style={{ flex: 1 }}>Repeticiones</span>
                                  <span style={{ flex: 1 }}>Peso ({ex.unidad || "kg"})</span>
                                  <span style={{ width: 30 }} />
                                </div>
                                {ex.series.map((s, si) => (
                                  <div key={si} style={S.serieRow}>
                                    <span style={S.serieNum}>{si + 1}</span>
                                    <input style={{ ...S.input, margin: 0, flex: 1 }} type="text" inputMode="numeric" value={s.repeticiones}
                                      onChange={e => setSerie(i, si, "repeticiones", e.target.value)} placeholder="12 o 7,7,7" />
                                    <input style={{ ...S.input, margin: 0, flex: 1 }} type="text" inputMode="decimal" value={s.peso}
                                      onChange={e => setSerie(i, si, "peso", e.target.value)} placeholder="opcional" />
                                    <button style={S.iconGhost} onClick={() => removeSerie(i, si)} title="Quitar serie"><FiTrash2 size={13} /></button>
                                  </div>
                                ))}
                                <button style={S.addSerie} onClick={() => addSerie(i)}><FiPlus size={13} /> Agregar serie</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "2px 2px 0", lineHeight: 1.5 }}>
                      Tip: en repeticiones o peso puedes registrar varios valores separados por coma (ej. 7,7,7 y 10,20,30) para drop-sets o pirámides.
                    </p>
                  </div>
                )
              )}

              {/* Cierre */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
                <div>
                  <label style={S.label}><FiClock /> Duración (min)</label>
                  <input style={S.input} type="number" value={duracion} onChange={e => setDuracion(e.target.value)} placeholder="45" />
                </div>
                <div>
                  <label style={S.label}><FiTrendingUp /> Peso corporal (opcional)</label>
                  <input style={S.input} type="number" value={pesoCorporal} onChange={e => setPeso(e.target.value)} placeholder="Ej. 78.5" />
                </div>
              </div>
              {/* El peso es el único dato del formulario que alimenta la
                  predicción. Sin decirlo, la gente lo dejaba vacío y luego no
                  entendía por qué "Mi Predicción" seguía en cero registros
                  teniendo la bitácora llena de entrenamientos. */}
              <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5 }}>
                Al guardar, tu entrenamiento queda registrado y se calculan tus calorías
                quemadas automáticamente.{" "}
                <strong style={{ color: "var(--accent)" }}>
                  Si anotas tu peso, cuenta para tu predicción de peso corporal.
                </strong>
              </p>
              <label style={S.label}>Notas</label>
              <input style={S.input} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Cómo te sentiste…" />

              <div style={S.volBar}>
                <span>Volumen de esta sesión</span>
                <strong>{totalVolumen.toFixed(0)} kg</strong>
              </div>

              {msg && (
                <div style={{ ...S.msg, ...(msg.type === "ok" ? S.msgOk : msg.type === "error" ? S.msgErr : S.msgWarn) }}>
                  {msg.type === "ok" ? <FiCheckCircle /> : <FiActivity />} {msg.text}
                </div>
              )}

              <button style={S.saveBtn} onClick={save} disabled={saving || !selectedDay}>
                <FiSave /> {saving ? "Guardando…" : "Guardar entrenamiento"}
              </button>
            </>
          )}
        </div>

        {/* ── Bitácora ── */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <h3 style={S.cardTitle}><FiCalendar /> Tu bitácora</h3>
            <button style={S.ghostBtn} onClick={loadHist}><FiRefreshCw /> Actualizar</button>
          </div>

          {resumen && (
            <div style={S.resumen}>
              <div style={S.resItem}><strong>{resumen.total}</strong><span>Entrenamientos</span></div>
              <div style={S.resItem}><strong>{resumen.este_mes}</strong><span>Este mes</span></div>
              <div style={S.resItem}><strong>{Math.round(resumen.volumen_total)}</strong><span>kg volumen</span></div>
              <div style={S.resItem}><strong>{resumen.calorias_total ?? 0}</strong><span>kcal total</span></div>
            </div>
          )}

          {loadingHist ? (
            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: 24 }}>Cargando…</p>
          ) : workouts.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
              <FiBarChart2 size={36} style={{ opacity: .3 }} />
              <p style={{ marginTop: 10 }}>Aún no registras entrenamientos. ¡Registra el primero!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {workouts.map(w => (
                <div key={w.id} style={S.wItem}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--text-primary)", fontSize: 14 }}>{w.nombre_rutina}</strong>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{w.fecha}</span>
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap", fontSize: 12, color: "var(--text-secondary)" }}>
                    <span><FiActivity size={12} /> {w.total_ejercicios} ejercicios</span>
                    <span>{w.total_series} series</span>
                    <span>{Math.round(w.volumen_total || 0)} kg vol.</span>
                    {w.calorias_estimadas ? <span style={{ color: "var(--accent-soft, var(--accent))" }}>{w.calorias_estimadas} kcal</span> : null}
                    {w.duracion_min ? <span><FiClock size={12} /> {w.duracion_min} min</span> : null}
                    {w.peso_corporal ? <span><FiTrendingUp size={12} /> {w.peso_corporal} kg</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { padding: "28px 32px", minHeight: "100vh", background: "var(--bg-main)" },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 800, color: "var(--text-primary)", margin: 0 },
  sub: { fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" },
  grid: { display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, alignItems: "start" },
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8 },
  cardTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 },
  ghostBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  label: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary)", margin: "12px 0 5px", fontWeight: 600 },
  todayTag: { display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8, padding: "2px 8px", borderRadius: 20, background: "var(--accent-dim, rgba(108,99,255,.15))", color: "var(--accent)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px" },
  input: { width: "100%", boxSizing: "border-box", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 14 },
  exCard: { background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 },
  serieHead: { display: "flex", gap: 8, fontSize: 11, color: "var(--text-tertiary, var(--text-secondary))", fontWeight: 600, marginBottom: 4, padding: "0 2px" },
  serieRow: { display: "flex", gap: 8, alignItems: "center", marginBottom: 6 },
  serieNum: { width: 28, textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--accent)" },
  addSerie: { display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 0", marginTop: 2 },
  iconGhost: { width: 30, background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "inline-flex", justifyContent: "center" },
  volBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "12px 14px", background: "var(--accent-dim, rgba(108,99,255,.1))", borderRadius: 10, color: "var(--text-primary)", fontSize: 14 },
  msg: { display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: "10px 14px", borderRadius: 10, fontSize: 13 },
  msgOk: { background: "rgba(16,185,129,.12)", color: "var(--success)" },
  msgErr: { background: "rgba(239,68,68,.12)", color: "var(--danger)" },
  msgWarn: { background: "rgba(234,179,8,.12)", color: "var(--warning)" },
  saveBtn: { width: "100%", marginTop: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  resumen: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 },
  resItem: { background: "var(--bg-input)", borderRadius: 10, padding: "12px 8px", textAlign: "center", display: "flex", flexDirection: "column", gap: 2 },
  wItem: { background: "var(--bg-input)", borderRadius: 10, padding: "12px 14px" },
};
