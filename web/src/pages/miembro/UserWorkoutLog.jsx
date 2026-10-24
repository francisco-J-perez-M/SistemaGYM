/**
 * UserWorkoutLog.jsx — Registrar entrenamiento (bitácora del miembro).
 *
 * El miembro registra los ejercicios que hizo (series, repeticiones y peso
 * levantado) y, al terminar, su peso corporal del día. Eso:
 *   - guarda el entrenamiento en su bitácora,
 *   - cuenta como asistencia,
 *   - actualiza automáticamente sus métricas, gráficas y predicción de peso.
 * Solo iconos (react-icons), sin emojis.
 */
import { useState, useEffect, useCallback } from "react";
import {
  FiPlus, FiTrash2, FiSave, FiActivity, FiCalendar, FiClock,
  FiTrendingUp, FiCheckCircle, FiRefreshCw, FiBarChart2,
} from "react-icons/fi";
import { GiMuscleUp } from "react-icons/gi";
import { getUserDashboard, completeWorkout, getWorkouts } from "../../api/workouts";
import "../../css/CSSUnificado.css";

const emptySerie = () => ({ repeticiones: "", peso: "" });
const emptyExercise = () => ({ nombre: "", series: [emptySerie()] });

// "3x12" -> 3 series de 12 reps
function parseSets(setsStr) {
  const m = String(setsStr || "").match(/(\d+)\s*x\s*(\d+)/i);
  if (!m) return [emptySerie()];
  const n = Math.min(8, parseInt(m[1], 10) || 1);
  const reps = m[2] || "";
  return Array.from({ length: n }, () => ({ repeticiones: reps, peso: "" }));
}

export default function UserWorkoutLog() {
  const [nombre, setNombre]   = useState("Entrenamiento de hoy");
  const [grupo, setGrupo]     = useState("");
  const [duracion, setDuracion] = useState("");
  const [pesoCorporal, setPeso] = useState("");
  const [notas, setNotas]     = useState("");
  const [exercises, setExercises] = useState([emptyExercise()]);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  const [workouts, setWorkouts] = useState([]);
  const [resumen, setResumen]   = useState(null);
  const [loadingHist, setLoadingHist] = useState(true);
  const [loadingToday, setLoadingToday] = useState(false);

  const loadHist = useCallback(() => {
    setLoadingHist(true);
    getWorkouts({ limit: 20 })
      .then(r => { setWorkouts(r.data?.workouts || []); setResumen(r.data?.resumen || null); })
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, []);

  useEffect(() => { loadHist(); }, [loadHist]);

  const loadToday = async () => {
    setLoadingToday(true);
    try {
      const { data } = await getUserDashboard();
      const tw = data?.todayWorkout;
      const exs = (tw?.exercises || []).filter(e => e.name);
      if (exs.length === 0) { setMsg({ type: "warn", text: "No hay rutina asignada para hoy. Agrega tus ejercicios manualmente." }); return; }
      setNombre(tw?.type ? `Rutina: ${tw.type}` : "Entrenamiento de hoy");
      setGrupo(tw?.type || "");
      setExercises(exs.map(e => ({ nombre: e.name, series: parseSets(e.sets) })));
      setMsg(null);
    } catch {
      setMsg({ type: "error", text: "No se pudo cargar la rutina de hoy." });
    } finally {
      setLoadingToday(false);
    }
  };

  // ── Manipulación de ejercicios / series ────────────────────────────────────
  const setExName = (i, v) => setExercises(xs => xs.map((x, idx) => idx === i ? { ...x, nombre: v } : x));
  const addExercise = () => setExercises(xs => [...xs, emptyExercise()]);
  const removeExercise = (i) => setExercises(xs => xs.length > 1 ? xs.filter((_, idx) => idx !== i) : xs);
  const addSerie = (i) => setExercises(xs => xs.map((x, idx) => idx === i ? { ...x, series: [...x.series, emptySerie()] } : x));
  const removeSerie = (i, si) => setExercises(xs => xs.map((x, idx) => idx === i ? { ...x, series: x.series.length > 1 ? x.series.filter((_, k) => k !== si) : x.series } : x));
  const setSerie = (i, si, field, v) => setExercises(xs => xs.map((x, idx) =>
    idx === i ? { ...x, series: x.series.map((s, k) => k === si ? { ...s, [field]: v } : s) } : x));

  const totalVolumen = exercises.reduce((acc, ex) =>
    acc + ex.series.reduce((a, s) => a + (parseFloat(s.repeticiones) || 0) * (parseFloat(s.peso) || 0), 0), 0);

  const save = async () => {
    const ejercicios = exercises
      .filter(ex => ex.nombre.trim())
      .map(ex => ({
        nombre: ex.nombre.trim(),
        series: ex.series
          .filter(s => s.repeticiones || s.peso)
          .map(s => ({ repeticiones: parseInt(s.repeticiones) || 0, peso: parseFloat(s.peso) || 0 })),
      }));
    if (ejercicios.length === 0) { setMsg({ type: "warn", text: "Agrega al menos un ejercicio con sus series." }); return; }

    setSaving(true);
    setMsg(null);
    try {
      const { data } = await completeWorkout({
        nombre_rutina: nombre.trim() || "Entrenamiento libre",
        grupo_muscular: grupo || undefined,
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
      // Reset
      setExercises([emptyExercise()]);
      setDuracion(""); setPeso(""); setNotas(""); setNombre("Entrenamiento de hoy"); setGrupo("");
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
          <p style={S.sub}>Anota lo que hiciste hoy. Tus métricas y predicción se actualizan al registrar tu peso.</p>
        </div>
      </div>

      <div style={S.grid}>
        {/* ── Formulario ── */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <h3 style={S.cardTitle}><FiActivity /> Tu entrenamiento</h3>
            <button style={S.ghostBtn} onClick={loadToday} disabled={loadingToday}>
              <FiRefreshCw /> {loadingToday ? "Cargando…" : "Cargar rutina de hoy"}
            </button>
          </div>

          <label style={S.label}>Nombre del entrenamiento</label>
          <input style={S.input} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Día de pecho" />

          {/* Ejercicios */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {exercises.map((ex, i) => (
              <div key={i} style={S.exCard}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <GiMuscleUp style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <input style={{ ...S.input, margin: 0, flex: 1 }} value={ex.nombre}
                    onChange={e => setExName(i, e.target.value)} placeholder={`Ejercicio ${i + 1} (ej. Press banca)`} />
                  <button style={S.iconDanger} onClick={() => removeExercise(i)} title="Quitar ejercicio"><FiTrash2 /></button>
                </div>

                <div style={S.serieHead}>
                  <span style={{ width: 28 }}>#</span>
                  <span style={{ flex: 1 }}>Repeticiones</span>
                  <span style={{ flex: 1 }}>Peso (kg)</span>
                  <span style={{ width: 30 }} />
                </div>
                {ex.series.map((s, si) => (
                  <div key={si} style={S.serieRow}>
                    <span style={S.serieNum}>{si + 1}</span>
                    <input style={{ ...S.input, margin: 0, flex: 1 }} type="number" inputMode="numeric" value={s.repeticiones}
                      onChange={e => setSerie(i, si, "repeticiones", e.target.value)} placeholder="12" />
                    <input style={{ ...S.input, margin: 0, flex: 1 }} type="number" inputMode="decimal" value={s.peso}
                      onChange={e => setSerie(i, si, "peso", e.target.value)} placeholder="40" />
                    <button style={S.iconGhost} onClick={() => removeSerie(i, si)} title="Quitar serie"><FiTrash2 size={13} /></button>
                  </div>
                ))}
                <button style={S.addSerie} onClick={() => addSerie(i)}><FiPlus size={13} /> Agregar serie</button>
              </div>
            ))}
            <button style={S.addEx} onClick={addExercise}><FiPlus /> Agregar ejercicio</button>
          </div>

          {/* Cierre */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
            <div>
              <label style={S.label}><FiClock /> Duración (min)</label>
              <input style={S.input} type="number" value={duracion} onChange={e => setDuracion(e.target.value)} placeholder="45" />
            </div>
            <div>
              <label style={S.label}><FiTrendingUp /> Peso corporal (opcional)</label>
              <input style={S.input} type="number" value={pesoCorporal} onChange={e => setPeso(e.target.value)} placeholder="Solo si te pesaste hoy" />
            </div>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6 }}>
            Al guardar, tu entrenamiento queda registrado y se calculan tus calorías quemadas automáticamente. El peso es opcional: regístralo solo si te pesaste.
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

          <button style={S.saveBtn} onClick={save} disabled={saving}>
            <FiSave /> {saving ? "Guardando…" : "Guardar entrenamiento"}
          </button>
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
  input: { width: "100%", boxSizing: "border-box", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 14 },
  exCard: { background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 },
  serieHead: { display: "flex", gap: 8, fontSize: 11, color: "var(--text-tertiary, var(--text-secondary))", fontWeight: 600, marginBottom: 4, padding: "0 2px" },
  serieRow: { display: "flex", gap: 8, alignItems: "center", marginBottom: 6 },
  serieNum: { width: 28, textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--accent)" },
  addSerie: { display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 0", marginTop: 2 },
  addEx: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--accent-dim, rgba(108,99,255,.12))", border: "1px dashed var(--accent)", color: "var(--accent)", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  iconDanger: { background: "rgba(239,68,68,.1)", border: "none", color: "var(--danger)", borderRadius: 7, padding: "7px 9px", cursor: "pointer", display: "inline-flex" },
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
