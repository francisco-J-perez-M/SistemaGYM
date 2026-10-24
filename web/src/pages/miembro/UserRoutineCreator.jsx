import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus, FiTrash2, FiSave, FiCopy, FiAlertCircle, FiCheckCircle,
  FiChevronDown, FiChevronUp, FiSearch, FiZap, FiActivity, FiMoon
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

/* ─── Datos estáticos ────────────────────────────────────────── */
const DIAS_SEMANA = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const DIAS_CORTO  = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

const GRUPOS = [
  { id:"pecho",      label:"Pecho",           color:"#ef4444" },
  { id:"espalda",    label:"Espalda",          color:"#6366f1" },
  { id:"hombros",    label:"Hombros",          color:"#8b5cf6" },
  { id:"biceps",     label:"Bíceps",           color:"#f59e0b" },
  { id:"triceps",    label:"Tríceps",          color:"#f97316" },
  { id:"piernas",    label:"Piernas",          color:"#22c55e" },
  { id:"gluteos",    label:"Glúteos",          color:"#ec4899" },
  { id:"abdomen",    label:"Abdomen / Core",   color:"#06b6d4" },
  { id:"cardio",     label:"Cardio",           color:"#84cc16" },
  { id:"descanso",   label:"Descanso",         color:"#64748b" },
];

const SUGERENCIAS = {
  pecho:    ["Press Banca","Press Inclinado","Press Declinado","Aperturas con Mancuernas","Fondos en paralelas","Pullover","Cruce de poleas"],
  espalda:  ["Dominadas","Remo con Barra","Remo con Mancuerna","Jalones al Pecho","Jalones tras Nuca","Face Pull","Pull-Over"],
  hombros:  ["Press Militar","Elevaciones Laterales","Elevaciones Frontales","Pájaros","Press Arnold","Encogimientos con Mancuernas"],
  biceps:   ["Curl con Barra","Curl con Mancuernas","Curl Martillo","Curl Concentrado","Curl en Polea","Curl de Predicador"],
  triceps:  ["Extensiones Tríceps","Patadas de Tríceps","Jalones al Pecho (tríceps)","Press Francés","Extensión Aérea"],
  piernas:  ["Sentadillas","Prensa de Piernas","Extensiones","Curl Femoral","Zancadas","Sentadilla Búlgara","Elevaciones de Gemelos"],
  gluteos:  ["Hip Thrust","Puente de Glúteo","Zancadas","Sentadilla Sumo","Abductores en Máquina","Patadas de Glúteo"],
  abdomen:  ["Crunches","Plancha","Elevación de Piernas","Bicicleta","Russian Twist","Rueda Abdominal","Crunches en Polea"],
  cardio:   ["Caminadora 30 min","Bicicleta 20 min","Elíptica 20 min","Remo 15 min","Jump Rope 15 min","HIIT 20 min"],
  descanso: [],
};

const PLANTILLAS = [
  {
    nombre: "Push / Pull / Legs",
    dias: [
      { dia:"Lunes",    grupo:"pecho",   ejercicios:[{nombre:"Press Banca",series:"4",reps:"10"},{nombre:"Press Inclinado",series:"3",reps:"12"},{nombre:"Extensiones Tríceps",series:"3",reps:"15"},{nombre:"Fondos",series:"3",reps:"12"}] },
      { dia:"Martes",   grupo:"espalda", ejercicios:[{nombre:"Dominadas",series:"4",reps:"8"},{nombre:"Remo con Barra",series:"4",reps:"10"},{nombre:"Curl con Barra",series:"3",reps:"12"},{nombre:"Curl Martillo",series:"3",reps:"12"}] },
      { dia:"Miércoles",grupo:"piernas", ejercicios:[{nombre:"Sentadillas",series:"4",reps:"12"},{nombre:"Prensa",series:"3",reps:"15"},{nombre:"Extensiones",series:"3",reps:"15"},{nombre:"Elevaciones de Gemelos",series:"4",reps:"20"}] },
      { dia:"Jueves",   grupo:"descanso",ejercicios:[] },
      { dia:"Viernes",  grupo:"pecho",   ejercicios:[{nombre:"Press Banca",series:"4",reps:"10"},{nombre:"Aperturas",series:"3",reps:"12"},{nombre:"Press Arnold",series:"3",reps:"12"}] },
      { dia:"Sábado",   grupo:"espalda", ejercicios:[{nombre:"Jalones al Pecho",series:"4",reps:"12"},{nombre:"Remo con Mancuerna",series:"3",reps:"12"},{nombre:"Curl Concentrado",series:"3",reps:"15"}] },
      { dia:"Domingo",  grupo:"descanso",ejercicios:[] },
    ],
  },
  {
    nombre: "Full Body 3 días",
    dias: [
      { dia:"Lunes",    grupo:"pecho",   ejercicios:[{nombre:"Press Banca",series:"3",reps:"10"},{nombre:"Sentadillas",series:"3",reps:"12"},{nombre:"Dominadas",series:"3",reps:"8"},{nombre:"Plancha",series:"3",reps:"45s"}] },
      { dia:"Miércoles",grupo:"hombros", ejercicios:[{nombre:"Press Militar",series:"3",reps:"10"},{nombre:"Remo con Barra",series:"3",reps:"10"},{nombre:"Prensa",series:"3",reps:"15"},{nombre:"Crunches",series:"3",reps:"20"}] },
      { dia:"Viernes",  grupo:"piernas", ejercicios:[{nombre:"Zancadas",series:"3",reps:"12"},{nombre:"Press Inclinado",series:"3",reps:"10"},{nombre:"Jalones",series:"3",reps:"12"},{nombre:"Elevación de Piernas",series:"3",reps:"15"}] },
    ],
  },
];

/* ─── Componentes ────────────────────────────────────────────── */
function GrupoSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = GRUPOS.find(g => g.id === value) || GRUPOS[0];
  return (
    <div style={{ position:"relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display:"flex", alignItems:"center", gap:8, padding:"6px 12px",
          background:"var(--bg-input)", border:"1px solid var(--border)",
          borderRadius:8, cursor:"pointer", fontSize:13, color:"var(--text-primary)",
          whiteSpace:"nowrap",
        }}
      >
        <span style={{ width:10, height:10, borderRadius:"50%", background:current.color, display:"inline-block", flexShrink:0 }}/>
        <span style={{ color:current.color, fontWeight:600 }}>{current.label}</span>
        {open ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
      </button>
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:50,
          background:"var(--bg-card)", border:"1px solid var(--border)",
          borderRadius:10, padding:6, minWidth:180, boxShadow:"0 8px 24px rgba(0,0,0,.25)",
        }}>
          {GRUPOS.map(g => (
            <div
              key={g.id}
              onClick={() => { onChange(g.id); setOpen(false); }}
              style={{
                display:"flex", alignItems:"center", gap:8, padding:"7px 10px",
                borderRadius:7, cursor:"pointer", fontSize:13,
                background: g.id === value ? `${g.color}18` : "transparent",
                color: g.id === value ? g.color : "var(--text-primary)",
              }}
            >
              <span style={{ width:8, height:8, borderRadius:"50%", background:g.color, display:"inline-block", flexShrink:0 }}/> {g.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EjercicioRow({ ej, idx, grupo, onUpdate, onDelete }) {
  const [showSug, setShowSug] = useState(false);
  const g    = GRUPOS.find(g => g.id === grupo) || GRUPOS[0];
  const sugs = (SUGERENCIAS[grupo] || []).filter(s =>
    ej.nombre === "" || s.toLowerCase().includes(ej.nombre.toLowerCase())
  );
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowSug(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{
      position:"relative", display:"grid",
      gridTemplateColumns:"24px 1fr 60px 60px 32px",
      gap:8, alignItems:"center",
      padding:"8px 10px", background:"var(--bg-input)", borderRadius:9, marginBottom:6,
    }}>
      {/* Número */}
      <div style={{
        width:22, height:22, borderRadius:6,
        background:`${g.color}22`, color:g.color,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:10, fontWeight:800, flexShrink:0,
      }}>{idx + 1}</div>

      <div style={{ position:"relative" }}>
        <input
          placeholder="Nombre del ejercicio…"
          value={ej.nombre}
          onChange={e => { onUpdate("nombre", e.target.value); setShowSug(true); }}
          onFocus={() => setShowSug(true)}
          style={{ width:"100%", padding:"7px 10px", background:"var(--bg-card)",
            border:"1px solid var(--border)", borderRadius:7,
            color:"var(--text-primary)", fontSize:13, boxSizing:"border-box" }}
        />
        {showSug && sugs.length > 0 && ej.nombre.length < 20 && (
          <div style={{
            position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:40,
            background:"var(--bg-card)", border:"1px solid var(--border)",
            borderRadius:8, maxHeight:160, overflowY:"auto",
            boxShadow:"0 8px 24px rgba(0,0,0,.3)",
          }}>
            {sugs.slice(0,6).map(s => (
              <div key={s} onClick={() => { onUpdate("nombre", s); setShowSug(false); }}
                style={{ padding:"9px 12px", cursor:"pointer", fontSize:13, color:"var(--text-primary)",
                  display:"flex", alignItems:"center", gap:8 }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-input)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ width:7, height:7, borderRadius:"50%", background:g.color, display:"inline-block", flexShrink:0 }}/>
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      <input placeholder="Series" value={ej.series}
        onChange={e => onUpdate("series", e.target.value)}
        style={{ padding:"7px 4px", background:"var(--bg-card)", border:"1px solid var(--border)",
          borderRadius:7, color:"var(--text-primary)", fontSize:13, textAlign:"center",
          width:"100%", boxSizing:"border-box" }}
      />
      <input placeholder="Reps" value={ej.reps}
        onChange={e => onUpdate("reps", e.target.value)}
        style={{ padding:"7px 4px", background:"var(--bg-card)", border:"1px solid var(--border)",
          borderRadius:7, color:"var(--text-primary)", fontSize:13, textAlign:"center",
          width:"100%", boxSizing:"border-box" }}
      />
      <button onClick={onDelete}
        style={{ padding:6, background:"none", border:"none", color:"var(--text-secondary)",
          cursor:"pointer", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "none"; }}
      >
        <FiTrash2 size={14} />
      </button>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function UserRoutineCreator() {
  const navigate = useNavigate();
  const [routine,    setRoutine]    = useState({ nombre:"Mi Rutina", dias:[] });
  const [activeDay,  setActiveDay]  = useState(0);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(false);
  const [showTpl,    setShowTpl]    = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/", { replace:true }); return; }
    fetchRoutine();
  }, []);

  const fetchRoutine = async () => {
    try {
      const res = await fetch("/api/user/routines", {
        headers: { Authorization:`Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const d = await res.json();
        if (d.rutinas?.length > 0) setRoutine(d.rutinas[0]);
        else setRoutine({ nombre:"Mi Rutina", dias: [{ dia:"Lunes", grupo:"pecho", ejercicios:[{nombre:"",series:"4",reps:"12"}] }] });
      }
    } catch {}
  };

  /* ── Mutations ──────────────────────────────────────────────── */
  const setDias = (fn) => setRoutine(r => ({ ...r, dias: fn([...r.dias]) }));

  const addDay = () => {
    const usados = routine.dias.map(d => d.dia);
    const sig    = DIAS_SEMANA.find(d => !usados.includes(d));
    if (!sig) { setError("Ya están todos los días de la semana."); return; }
    setDias(dias => {
      const next = [...dias, { dia:sig, grupo:"pecho", ejercicios:[{nombre:"",series:"4",reps:"12"}] }];
      setActiveDay(next.length - 1);
      return next;
    });
  };

  const removeDay = (i) => {
    if (routine.dias.length <= 1) { setError("Debe haber al menos un día."); return; }
    setDias(dias => { dias.splice(i,1); return dias; });
    setActiveDay(ai => Math.max(0, ai >= i ? ai - 1 : ai));
  };

  const addExercise = (di) => setDias(dias => {
    dias[di].ejercicios.push({ nombre:"", series:"4", reps:"12" });
    return dias;
  });

  const updateExercise = (di, ei, field, val) => setDias(dias => {
    dias[di].ejercicios[ei][field] = val;
    return dias;
  });

  const removeExercise = (di, ei) => setDias(dias => {
    dias[di].ejercicios.splice(ei, 1);
    return dias;
  });

  const loadTemplate = (tpl) => {
    setRoutine({ ...tpl, id: routine.id });
    setActiveDay(0);
    setShowTpl(false);
  };

  const save = async () => {
    const valido = routine.dias.some(d => d.ejercicios.some(e => e.nombre.trim()));
    if (!valido) { setError("Agrega al menos un ejercicio con nombre."); return; }
    setSaving(true); setError(null);
    try {
      const url    = routine.id ? `/api/user/routines/${routine.id}` : "/api/user/routines";
      const method = routine.id ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { Authorization:`Bearer ${localStorage.getItem("token")}`, "Content-Type":"application/json" },
        body: JSON.stringify(routine),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      const d = await res.json();
      if (d.rutina?.id) setRoutine(r => ({ ...r, id: d.rutina.id }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const current = routine.dias[activeDay];
  const grupo   = current ? (GRUPOS.find(g => g.id === current.grupo) || GRUPOS[0]) : null;

  // Totales para el header info
  const totalDias = routine.dias.filter(d => d.grupo !== "descanso").length;
  const totalEjs  = routine.dias.reduce((acc, d) => acc + (d.ejercicios?.filter(e=>e.nombre.trim()).length ?? 0), 0);

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <header className="top-header">
          <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
            <div style={{
              width:40, height:40, borderRadius:12, flexShrink:0,
              background:"linear-gradient(135deg,var(--accent),#7c3aed)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <FiSave size={18} color="#fff" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <input
                value={routine.nombre}
                onChange={e => setRoutine(r => ({ ...r, nombre:e.target.value }))}
                style={{
                  background:"transparent", border:"none", fontSize:18, fontWeight:700,
                  color:"var(--text-primary)", outline:"none", width:"100%",
                  overflow:"hidden", textOverflow:"ellipsis",
                }}
                placeholder="Nombre de la rutina"
              />
              <div style={{ display:"flex", gap:8, marginTop:2 }}>
                <span style={{ fontSize:11, color:"var(--text-secondary)" }}>
                  {totalDias} día{totalDias !== 1 ? "s" : ""} de entrenamiento
                </span>
                {totalEjs > 0 && (
                  <span style={{ fontSize:11, color:"var(--text-secondary)" }}>
                    · {totalEjs} ejercicio{totalEjs !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            <motion.button
              whileHover={{ scale:1.04 }} whileTap={{ scale:.97 }}
              onClick={() => setShowTpl(true)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px",
                background:"var(--bg-input)", border:"1px solid var(--border)",
                borderRadius:8, color:"var(--text-secondary)", cursor:"pointer", fontSize:13, fontWeight:600 }}
            >
              <FiZap size={13} /> Plantillas
            </motion.button>
            <motion.button
              whileHover={{ scale:1.04 }} whileTap={{ scale:.97 }}
              onClick={save} disabled={saving}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px",
                background: saving ? "var(--bg-input)" : "var(--accent)",
                border:"none", borderRadius:8, color: saving ? "var(--text-secondary)" : "#fff",
                cursor: saving ? "not-allowed" : "pointer", fontSize:13, fontWeight:700 }}
            >
              {saving
                ? <><div className="dashboard-spinner" style={{width:14,height:14,borderWidth:2}}/> Guardando…</>
                : <><FiSave size={13}/> Guardar</>}
            </motion.button>
          </div>
        </header>

        <main className="dashboard-content">
          {/* Toasts */}
          <AnimatePresence>
            {error && (
              <motion.div key="err" initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:9, marginBottom:16, color:"#f87171", fontSize:13 }}>
                <FiAlertCircle /> {error}
                <button onClick={() => setError(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:"#f87171", cursor:"pointer", display:"flex" }}><FiX size={14}/></button>
              </motion.div>
            )}
            {success && (
              <motion.div key="ok" initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.3)", borderRadius:9, marginBottom:16, color:"#4ade80", fontSize:13 }}>
                <FiCheckCircle /> Rutina guardada exitosamente.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Week bar */}
          {routine.dias.length > 0 && (
            <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
              {routine.dias.map((d, i) => {
                const g = GRUPOS.find(g => g.id === d.grupo) || GRUPOS[0];
                const isActive = i === activeDay;
                const ejCount  = (d.ejercicios || []).filter(e => e.nombre.trim()).length;
                return (
                  <motion.div
                    key={i} whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:.97 }}
                    onClick={() => setActiveDay(i)}
                    style={{
                      padding:"10px 16px", borderRadius:12, cursor:"pointer",
                      background: isActive ? `${g.color}1a` : "var(--bg-card)",
                      border:`2px solid ${isActive ? g.color : "var(--border)"}`,
                      color: isActive ? g.color : "var(--text-secondary)",
                      display:"flex", alignItems:"center", gap:8, transition:"all .2s",
                      position:"relative",
                    }}
                  >
                    <span style={{ width:12, height:12, borderRadius:"50%", background:g.color, display:"inline-block", flexShrink:0 }}/>
                    <span style={{ display:"flex", flexDirection:"column", lineHeight:1.3 }}>
                      <span style={{ fontSize:10, fontWeight:500, opacity:.75 }}>
                        {DIAS_CORTO[DIAS_SEMANA.indexOf(d.dia)] ?? d.dia.slice(0,3)}
                      </span>
                      <span style={{ fontSize:13, fontWeight:700 }}>{g.label}</span>
                    </span>
                    {ejCount > 0 && (
                      <span style={{
                        position:"absolute", top:-6, right:-6,
                        width:18, height:18, borderRadius:"50%",
                        background: g.color, color:"#fff",
                        fontSize:10, fontWeight:700,
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>{ejCount}</span>
                    )}
                  </motion.div>
                );
              })}

              {routine.dias.length < 7 && (
                <motion.div
                  whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }}
                  onClick={addDay}
                  style={{ padding:"10px 16px", borderRadius:12, cursor:"pointer",
                    background:"var(--bg-card)", border:"2px dashed var(--border)",
                    color:"var(--text-secondary)", display:"flex", alignItems:"center", gap:6,
                    fontSize:13, fontWeight:600 }}
                >
                  <FiPlus size={14} /> Día
                </motion.div>
              )}
            </div>
          )}

          {/* Day editor */}
          {current ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDay}
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }}
                style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14 }}
              >
                {/* Day header */}
                <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                    {/* Day selector */}
                    <select
                      value={current.dia}
                      onChange={e => setDias(dias => { dias[activeDay].dia = e.target.value; return dias; })}
                      style={{ padding:"6px 12px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text-primary)", fontSize:14, fontWeight:700 }}
                    >
                      {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    {/* Grupo selector */}
                    <GrupoSelector
                      value={current.grupo}
                      onChange={v => setDias(dias => { dias[activeDay].grupo = v; return dias; })}
                    />
                  </div>

                  <div style={{ display:"flex", gap:8 }}>
                    <button
                      onClick={() => addExercise(activeDay)}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:`${grupo?.color ?? "var(--accent)"}22`, border:`1px solid ${grupo?.color ?? "var(--accent)"}44`, borderRadius:8, cursor:"pointer", color: grupo?.color ?? "var(--accent)", fontSize:13, fontWeight:600 }}
                    >
                      <FiPlus size={13} /> Ejercicio
                    </button>
                    {routine.dias.length > 1 && (
                      <button
                        onClick={() => removeDay(activeDay)}
                        style={{ padding:"7px 10px", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, cursor:"pointer", color:"#f87171", fontSize:13 }}
                      >
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Exercises */}
                <div style={{ padding:"16px 20px" }}>
                  {current.grupo === "descanso" ? (
                    <div style={{ textAlign:"center", padding:"40px 0", color:"var(--text-secondary)" }}>
                      <div style={{ width:48, height:48, borderRadius:12, background:"rgba(100,116,139,.12)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px" }}>
                      <FiMoon size={22} color="#64748b"/>
                    </div>
                      <p>Día de descanso — sin ejercicios.</p>
                    </div>
                  ) : current.ejercicios.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"30px 0", color:"var(--text-secondary)" }}>
                      <div style={{ width:44, height:44, borderRadius:11, background:`${grupo?.color}18`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px" }}>
                        <FiActivity size={20} color={grupo?.color || "var(--accent)"}/>
                      </div>
                      <p style={{ marginBottom:12 }}>No hay ejercicios todavía.</p>
                      <button onClick={() => addExercise(activeDay)} style={{ padding:"8px 16px", background:`${grupo?.color}22`, border:`1px solid ${grupo?.color}44`, borderRadius:8, cursor:"pointer", color:grupo?.color, fontWeight:600, fontSize:13, display:"inline-flex", alignItems:"center", gap:6 }}>
                        <FiPlus size={13} /> Agregar ejercicio
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Header row */}
                      <div style={{ display:"grid", gridTemplateColumns:"24px 1fr 60px 60px 32px", gap:8, padding:"0 8px 8px", fontSize:11, fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:".06em" }}>
                        <span></span><span>Ejercicio</span><span style={{textAlign:"center"}}>Series</span><span style={{textAlign:"center"}}>Reps</span><span></span>
                      </div>
                      <AnimatePresence>
                        {current.ejercicios.map((ej, ei) => (
                          <motion.div
                            key={ei}
                            initial={{ opacity:0, x:-10 }}
                            animate={{ opacity:1, x:0 }}
                            exit={{ opacity:0, x:10, height:0 }}
                          >
                            <EjercicioRow
                              ej={ej} idx={ei} grupo={current.grupo}
                              onUpdate={(f,v) => updateExercise(activeDay, ei, f, v)}
                              onDelete={() => removeExercise(activeDay, ei)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <button
                        onClick={() => addExercise(activeDay)}
                        style={{ marginTop:8, width:"100%", padding:"10px", background:"transparent", border:`1px dashed var(--border)`, borderRadius:9, cursor:"pointer", color:"var(--text-secondary)", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
                      >
                        <FiPlus size={13} /> Agregar ejercicio
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              style={{
                textAlign:"center", padding:"48px 24px",
                background:"var(--bg-card)", border:"1px dashed var(--border)",
                borderRadius:16, color:"var(--text-secondary)",
              }}
            >
              <div style={{ width:64, height:64, borderRadius:16, background:"rgba(99,102,241,.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <FiActivity size={28} color="var(--accent)"/>
              </div>
              <h3 style={{ fontSize:17, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>
                Esta rutina no tiene días aún
              </h3>
              <p style={{ fontSize:13, lineHeight:1.6, maxWidth:320, margin:"0 auto 20px" }}>
                Agrega días de entrenamiento con sus ejercicios,<br/>o carga una plantilla para empezar rápido.
              </p>
              <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
                <motion.button
                  whileHover={{ scale:1.04 }} whileTap={{ scale:.97 }}
                  onClick={() => setShowTpl(true)}
                  style={{ padding:"10px 20px", background:"var(--bg-input)", border:"1px solid var(--border)",
                    borderRadius:10, color:"var(--text-secondary)", cursor:"pointer", fontWeight:600, fontSize:13,
                    display:"flex", alignItems:"center", gap:7 }}
                >
                  <FiZap size={13}/> Usar plantilla
                </motion.button>
                <motion.button
                  whileHover={{ scale:1.04 }} whileTap={{ scale:.97 }}
                  onClick={addDay}
                  style={{ padding:"10px 20px", background:"var(--accent)", border:"none",
                    borderRadius:10, color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13,
                    display:"flex", alignItems:"center", gap:7 }}
                >
                  <FiPlus size={13}/> Agregar día
                </motion.button>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* Template modal */}
      <AnimatePresence>
        {showTpl && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setShowTpl(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          >
            <motion.div
              initial={{ scale:.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.9, opacity:0 }}
              onClick={e => e.stopPropagation()}
              style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:28, maxWidth:500, width:"100%" }}
            >
              <h3 style={{ marginBottom:4, fontSize:18, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}><FiZap color="var(--accent)"/> Plantillas de rutina</h3>
              <p style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:20 }}>Elige una para empezar rápido. Podrás editarla después.</p>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {PLANTILLAS.map((tpl, i) => (
                  <motion.div
                    key={i} whileHover={{ scale:1.02 }}
                    onClick={() => loadTemplate(tpl)}
                    style={{ padding:"14px 18px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:10, cursor:"pointer" }}
                  >
                    <div style={{ fontWeight:700, marginBottom:4 }}>{tpl.nombre}</div>
                    <div style={{ fontSize:12, color:"var(--text-secondary)" }}>
                      {tpl.dias.filter(d=>d.grupo!=="descanso").length} días de entrenamiento, {tpl.dias.filter(d=>d.grupo==="descanso").length} de descanso
                    </div>
                  </motion.div>
                ))}
              </div>
              <button onClick={() => setShowTpl(false)} style={{ marginTop:16, width:"100%", padding:10, background:"transparent", border:"1px solid var(--border)", borderRadius:9, color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
