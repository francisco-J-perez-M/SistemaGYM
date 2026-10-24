/**
 * TrainerSchedule.jsx — Agenda: calendario mensual (izq.) + KPIs y sesiones del día (der.)
 *
 * Layout:
 *   ┌──────────────────────────┬──────────────┐
 *   │  Calendario mensual       │  KPI cards   │
 *   │  (dots por sesión,        │  2×2         │
 *   │   semana resaltada)       ├──────────────┤
 *   │                           │  Sesiones    │
 *   │                           │  del día sel.│
 *   └──────────────────────────┴──────────────┘
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar, FiChevronLeft, FiChevronRight,
  FiPlus, FiCheck, FiX, FiAlertCircle, FiRefreshCw,
} from "react-icons/fi";
import trainerService from "../../services/entrenador/trainerService";
import "../../css/CSSUnificado.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  scheduled:     { label: "Programada",  color: "#6366f1", bg: "rgba(99,102,241,.15)"  },
  "in-progress": { label: "En curso",    color: "#f59e0b", bg: "rgba(245,158,11,.15)"  },
  completed:     { label: "Completada",  color: "#22c55e", bg: "rgba(34,197,94,.15)"   },
  cancelled:     { label: "Cancelada",   color: "#ef4444", bg: "rgba(239,68,68,.15)"   },
};

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const DAY_HEADERS = ["L","M","X","J","V","S","D"];

// ─── Calendar helpers ─────────────────────────────────────────────────────────
function toDateStr(d) {
  const dt = new Date(d);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, "0"),
    String(dt.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Returns Monday of the week containing `d` (time zeroed out). */
function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const dow = date.getDay(); // 0=Sun
  date.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
  return date;
}

/** Number of weeks from monday-of-base to monday-of-target (positive = future). */
function calcWeekOffset(base, target) {
  const mBase = getMonday(base).getTime();
  const mTgt  = getMonday(target).getTime();
  return Math.round((mTgt - mBase) / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Generates 42 cells (6 rows × 7 cols, Mon-start) for the given month.
 * Cells outside the month are flagged `currentMonth: false`.
 */
function generateCalendarDays(year, month) {
  const firstDay    = new Date(year, month, 1);
  const lastDay     = new Date(year, month + 1, 0);
  const prevLast    = new Date(year, month, 0).getDate();
  let   startDow    = firstDay.getDay();                    // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1;            // Mon=0 … Sun=6

  const days = [];

  // Previous-month fill
  for (let i = startDow - 1; i >= 0; i--)
    days.push({ date: new Date(year, month - 1, prevLast - i), currentMonth: false });

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push({ date: new Date(year, month, d), currentMonth: true });

  // Next-month fill up to 42 cells
  let nd = 1;
  while (days.length < 42)
    days.push({ date: new Date(year, month + 1, nd++), currentMonth: false });

  return days;
}

// ─── SessionCard ──────────────────────────────────────────────────────────────
function SessionCard({ session, onComplete, onCancel, isLoading }) {
  const cfg    = STATUS_CFG[session.status] || STATUS_CFG.scheduled;
  const canAct = session.status !== "completed" && session.status !== "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background:  "var(--bg-card)",
        border:      `1px solid var(--border)`,
        borderLeft:  `3px solid ${cfg.color}`,
        borderRadius: 8,
        padding:     "9px 10px",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color, marginBottom: 2 }}>
        {session.time || "—"}
      </div>
      <div style={{
        fontSize: 12, fontWeight: 600, color: "var(--text-primary)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2,
      }}>
        {session.client || "Sin cliente"}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 6 }}>
        {session.type} · {session.duration}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "2px 7px",
          background: cfg.bg, color: cfg.color, borderRadius: 4,
        }}>
          {cfg.label}
        </span>
        {canAct && (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => onComplete(session.id_sesion)} disabled={isLoading} title="Completar"
              style={{ width:20, height:20, borderRadius:4, border:"none",
                background:"rgba(34,197,94,.2)", color:"#22c55e",
                cursor: isLoading ? "wait" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
              <FiCheck size={10} />
            </button>
            <button onClick={() => onCancel(session.id_sesion)} disabled={isLoading} title="Cancelar"
              style={{ width:20, height:20, borderRadius:4, border:"none",
                background:"rgba(239,68,68,.2)", color:"#ef4444",
                cursor: isLoading ? "wait" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
              <FiX size={10} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── NewSessionModal ──────────────────────────────────────────────────────────
function NewSessionModal({ onClose, onSaved, defaultDate, members }) {
  const [form, setForm] = useState({
    fecha:            defaultDate || new Date().toISOString().split("T")[0],
    hora_inicio:      "09:00",
    duracion_minutos: 60,
    tipo:             "Personal",
    ubicacion:        "",
    nombre_sesion:    "",
    notas:            "",
    id_miembro:       "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.fecha || !form.hora_inicio) { setError("Fecha y hora son obligatorias"); return; }
    setSaving(true); setError("");
    try {
      await trainerService.createSession({
        ...form,
        id_miembro:       form.id_miembro || null,
        duracion_minutos: parseInt(form.duracion_minutos),
      });
      onSaved(); onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const lbl = { fontSize:11, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:5 };

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.75)",
        backdropFilter:"blur(6px)", display:"flex", alignItems:"center",
        justifyContent:"center", padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity:0, scale:0.92, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.92, y:20 }}
        style={{ background:"var(--bg-card)", border:"1px solid var(--border)",
          borderRadius:16, padding:28, width:"100%", maxWidth:500,
          maxHeight:"90vh", overflowY:"auto" }}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <h3 style={{ fontSize:18, fontWeight:700 }}>Nueva Sesión</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-secondary)" }}>
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background:"var(--danger-bg)", border:"1px solid var(--danger)",
            borderRadius:8, padding:"10px 14px", marginBottom:16,
            color:"var(--danger)", fontSize:13, display:"flex", gap:8, alignItems:"center" }}>
            <FiAlertCircle size={15} /> {error}
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={lbl}>Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} className="input-compact" />
            </div>
            <div>
              <label style={lbl}>Hora *</label>
              <input type="time" value={form.hora_inicio} onChange={e => set("hora_inicio", e.target.value)} className="input-compact" />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={lbl}>Duración</label>
              <select value={form.duracion_minutos} onChange={e => set("duracion_minutos", e.target.value)} className="input-compact">
                {[30,45,60,75,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tipo</label>
              <select value={form.tipo} onChange={e => set("tipo", e.target.value)} className="input-compact">
                <option>Personal</option>
                <option>Grupal</option>
                <option>Consulta</option>
              </select>
            </div>
          </div>
          {form.tipo === "Personal" ? (
            <div>
              <label style={lbl}>Cliente</label>
              <select value={form.id_miembro} onChange={e => set("id_miembro", e.target.value)} className="input-compact">
                <option value="">Seleccionar miembro del gym...</option>
                {/* Mis clientes asignados primero */}
                {members.filter(m => m.is_my_client).length > 0 && (
                  <optgroup label="Mis clientes">
                    {members.filter(m => m.is_my_client).map(m => (
                      <option key={m.id_miembro} value={m.id_miembro}>{m.nombre}</option>
                    ))}
                  </optgroup>
                )}
                {/* Resto del gym */}
                {members.filter(m => !m.is_my_client).length > 0 && (
                  <optgroup label="Otros miembros del gym">
                    {members.filter(m => !m.is_my_client).map(m => (
                      <option key={m.id_miembro} value={m.id_miembro}>{m.nombre}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          ) : (
            <div>
              <label style={lbl}>Nombre de la clase</label>
              <input type="text" value={form.nombre_sesion} onChange={e => set("nombre_sesion", e.target.value)}
                placeholder="Ej: HIIT Avanzado" className="input-compact" />
            </div>
          )}
          <div>
            <label style={lbl}>Ubicación</label>
            <input type="text" value={form.ubicacion} onChange={e => set("ubicacion", e.target.value)}
              placeholder="Sala 1, Online, Exterior..." className="input-compact" />
          </div>
          <div>
            <label style={lbl}>Notas</label>
            <textarea value={form.notas} onChange={e => set("notas", e.target.value)}
              placeholder="Notas adicionales..." className="input-compact"
              rows={3} style={{ resize:"vertical" }} />
          </div>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:22 }}>
          <button onClick={onClose} className="btn-outline-small" style={{ flex:1, padding:"10px" }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-compact-primary"
            style={{ flex:2, padding:"10px", opacity: saving ? 0.7 : 1 }} disabled={saving}>
            <FiCheck size={15} /> {saving ? "Guardando..." : "Crear Sesión"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── AddDayButton ─────────────────────────────────────────────────────────────
function AddDayButton({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:"100%", padding:"6px 4px",
        background: hovered ? "var(--accent-dim)" : "transparent",
        border: `1px dashed ${hovered ? "var(--accent)" : "var(--border)"}`,
        borderRadius:7, cursor:"pointer", fontSize:11,
        color: hovered ? "var(--accent)" : "var(--text-tertiary)",
        display:"flex", alignItems:"center", justifyContent:"center", gap:4,
        transition:"all 0.15s",
      }}
    >
      <FiPlus size={11} /> Añadir sesión
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TrainerSchedule() {
  // Freeze "today" for the lifetime of this mount
  const todayRef = useRef((() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  })());
  const todayStr = toDateStr(todayRef.current);

  const [currentWeek, setCurrentWeek]     = useState(0);
  const [selectedDate, setSelectedDate]   = useState(todayStr);
  const [viewMonth, setViewMonth]         = useState({
    year:  todayRef.current.getFullYear(),
    month: todayRef.current.getMonth(),
  });
  const [scheduleData, setScheduleData]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [showModal, setShowModal]         = useState(false);
  const [modalDate, setModalDate]         = useState(null);
  const [members, setMembers]             = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSchedule = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await trainerService.getSchedule(currentWeek);
      setScheduleData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [currentWeek]);

  const fetchMembers = useCallback(async () => {
    try { setMembers(await trainerService.getMembers()); } catch (_) {}
  }, []);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);
  useEffect(() => { fetchMembers();  }, [fetchMembers]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const weekDays = scheduleData
    ? Object.entries(scheduleData.schedule).map(([idx, day]) => ({
        index:     parseInt(idx),
        date:      day.date,
        dayName:   day.day_name,
        dayNumber: day.day_number,
        isToday:   day.is_today,
        sessions:  day.sessions || [],
      }))
    : [];

  const sessionsByDate = Object.fromEntries(weekDays.map(d => [d.date, d.sessions]));
  const weekDateSet    = new Set(weekDays.map(d => d.date));

  const totalSessions = weekDays.reduce((a, d) => a + d.sessions.length, 0);
  const completadas   = weekDays.reduce((a, d) => a + d.sessions.filter(s => s.status === "completed").length,    0);
  const programadas   = weekDays.reduce((a, d) => a + d.sessions.filter(s => s.status === "scheduled").length,    0);
  const canceladas    = weekDays.reduce((a, d) => a + d.sessions.filter(s => s.status === "cancelled").length,    0);

  const weekLabel = scheduleData ? (() => {
    const s = new Date(scheduleData.week_start + "T00:00:00");
    const e = new Date(scheduleData.week_end   + "T00:00:00");
    const o = { day:"numeric", month:"short" };
    return `${s.toLocaleDateString("es-MX", o)} – ${e.toLocaleDateString("es-MX", { ...o, year:"numeric" })}`;
  })() : "—";

  // Selected day
  const selectedDaySessions = sessionsByDate[selectedDate] || [];
  const selInLoadedWeek     = weekDateSet.has(selectedDate);
  const selDateLabel        = new Date(selectedDate + "T00:00:00")
    .toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long" });

  // ── Navigation ─────────────────────────────────────────────────────────────
  /** Move selected date ±N weeks and re-fetch. */
  const navigateWeek = (delta) => {
    setCurrentWeek(w => w + delta);
    setSelectedDate(prev => {
      const d = new Date(prev + "T00:00:00");
      d.setDate(d.getDate() + delta * 7);
      const ds = toDateStr(d);
      setViewMonth({ year: d.getFullYear(), month: d.getMonth() });
      return ds;
    });
  };

  const goToday = () => {
    setCurrentWeek(0);
    setSelectedDate(todayStr);
    setViewMonth({ year: todayRef.current.getFullYear(), month: todayRef.current.getMonth() });
  };

  /** Navigate the calendar month display (does NOT trigger a new week fetch). */
  const navigateMonth = (delta) => {
    setViewMonth(vm => {
      let { year, month } = vm;
      month += delta;
      if (month > 11) { month = 0; year++; }
      if (month <  0) { month = 11; year--; }
      return { year, month };
    });
  };

  /** Click a calendar day: select it and fetch its week if different. */
  const handleDayClick = (date) => {
    const ds     = toDateStr(date);
    const offset = calcWeekOffset(todayRef.current, date);
    setSelectedDate(ds);
    if (offset !== currentWeek) setCurrentWeek(offset);
  };

  // ── Session actions ─────────────────────────────────────────────────────────
  const handleStatusUpdate = async (sessionId, newStatus) => {
    setActionLoading(sessionId);
    try {
      await trainerService.updateSessionStatus(sessionId, newStatus);
      fetchSchedule();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Calendar cells ──────────────────────────────────────────────────────────
  const calDays = generateCalendarDays(viewMonth.year, viewMonth.month);

  const kpiCards = [
    { label:"Total semana",  value: totalSessions, color:"#6366f1" },
    { label:"Completadas",   value: completadas,   color:"#22c55e" },
    { label:"Programadas",   value: programadas,   color:"#6366f1" },
    { label:"Canceladas",    value: canceladas,    color:"#ef4444" },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-content">

      {/* ── Page header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 className="page-title" style={{ marginBottom:4 }}>Agenda y Calendario</h2>
          <p style={{ fontSize:13, color:"var(--text-secondary)", margin:0 }}>
            {loading ? "Cargando…"
              : `${weekLabel} · ${totalSessions} sesiones (${completadas} completadas)`}
          </p>
        </div>

        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button className="icon-btn" onClick={() => navigateWeek(-1)}>
            <FiChevronLeft size={18} />
          </button>
          <button className="btn-outline-small" onClick={goToday}>Hoy</button>
          <button className="icon-btn" onClick={() => navigateWeek(1)}>
            <FiChevronRight size={18} />
          </button>
          <button className="icon-btn" onClick={fetchSchedule} title="Actualizar">
            <FiRefreshCw size={15}
              style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <button className="btn-compact-primary"
            onClick={() => { setModalDate(selectedDate); setShowModal(true); }}>
            <FiPlus size={15} /> Nueva Sesión
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ background:"var(--danger-bg)", border:"1px solid var(--danger)",
          borderRadius:10, padding:"12px 16px", marginBottom:20,
          color:"var(--danger)", fontSize:13, display:"flex", gap:10, alignItems:"center" }}>
          <FiAlertCircle size={15} /> {error}
          <button onClick={fetchSchedule} style={{ marginLeft:"auto", background:"none", border:"none",
            cursor:"pointer", color:"var(--danger)", textDecoration:"underline", fontSize:12 }}>
            Reintentar
          </button>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, alignItems:"start" }}>

        {/* ════════════════════ LEFT: MONTHLY CALENDAR ════════════════════ */}
        <div className="stat-card" style={{ padding:20 }}>

          {/* Month navigation */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <button className="icon-btn" onClick={() => navigateMonth(-1)}>
              <FiChevronLeft size={16} />
            </button>
            <span style={{ fontWeight:700, fontSize:15, color:"var(--text-primary)" }}>
              {MONTH_NAMES[viewMonth.month]} {viewMonth.year}
            </span>
            <button className="icon-btn" onClick={() => navigateMonth(1)}>
              <FiChevronRight size={16} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
            {DAY_HEADERS.map(h => (
              <div key={h} style={{
                textAlign:"center", fontSize:10, fontWeight:700,
                color:"var(--text-secondary)", padding:"4px 0",
                textTransform:"uppercase", letterSpacing:".06em",
              }}>
                {h}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
            {calDays.map(({ date, currentMonth }, idx) => {
              const ds       = toDateStr(date);
              const isToday  = ds === todayStr;
              const isSel    = ds === selectedDate;
              const sessions = sessionsByDate[ds] || [];
              const inWeek   = weekDateSet.has(ds);

              // Cell background / border
              let cellBg  = "transparent";
              let cellBdr = "transparent";
              let numClr  = currentMonth ? "var(--text-primary)" : "rgba(150,150,160,0.4)";
              let numW    = currentMonth ? 400 : 300;

              if (isToday) {
                cellBg = "var(--accent)";
                numClr = "#fff";
                numW   = 800;
              } else if (isSel) {
                cellBg  = "rgba(99,102,241,0.12)";
                cellBdr = "var(--accent)";
                numClr  = "var(--accent)";
                numW    = 700;
              } else if (inWeek) {
                cellBg = "rgba(99,102,241,0.05)";
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(date)}
                  onMouseEnter={e => {
                    if (!isToday)
                      e.currentTarget.style.background =
                        isSel ? "rgba(99,102,241,0.18)" : "var(--bg-input)";
                  }}
                  onMouseLeave={e => {
                    if (!isToday)
                      e.currentTarget.style.background = cellBg;
                  }}
                  style={{
                    display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center",
                    padding:"5px 2px", borderRadius:8,
                    cursor:"pointer",
                    border:`1px solid ${cellBdr}`,
                    background: cellBg,
                    transition:"background 0.13s, border-color 0.13s",
                    minHeight:46, position:"relative",
                  }}
                >
                  {/* Day number */}
                  <span style={{ fontSize:13, fontWeight:numW, color:numClr, lineHeight:1 }}>
                    {date.getDate()}
                  </span>

                  {/* Session dots (max 3) */}
                  {sessions.length > 0 && (
                    <div style={{ display:"flex", gap:2, marginTop:4 }}>
                      {sessions.slice(0, 3).map((s, si) => {
                        const cfg = STATUS_CFG[s.status] || STATUS_CFG.scheduled;
                        return (
                          <div key={si} style={{
                            width:5, height:5, borderRadius:"50%",
                            background: isToday ? "rgba(255,255,255,0.85)" : cfg.color,
                          }} />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status legend */}
          <div style={{
            display:"flex", gap:14, marginTop:16, paddingTop:14,
            borderTop:"1px solid var(--border)", flexWrap:"wrap",
          }}>
            {Object.entries(STATUS_CFG).map(([k, cfg]) => (
              <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:cfg.color }} />
                <span style={{ fontSize:10, color:"var(--text-secondary)" }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════ RIGHT: KPIs + DAY SESSIONS ════════════════════ */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* KPI cards — 2×2 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {kpiCards.map(({ label, value, color }) => (
              <div key={label} className="stat-card" style={{ padding:"14px 16px" }}>
                <div style={{
                  fontSize:9, fontWeight:700, textTransform:"uppercase",
                  letterSpacing:".06em", color:"var(--text-secondary)", marginBottom:6,
                }}>
                  {label}
                </div>
                <div style={{ fontSize:30, fontWeight:800, color, lineHeight:1 }}>
                  {loading ? "—" : value}
                </div>
              </div>
            ))}
          </div>

          {/* Day sessions panel */}
          <div className="stat-card" style={{ padding:16 }}>

            {/* Panel header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div>
                <div style={{
                  fontSize:13, fontWeight:700, color:"var(--text-primary)",
                  textTransform:"capitalize", lineHeight:1.3,
                }}>
                  {selDateLabel}
                </div>
                <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>
                  {selInLoadedWeek && !loading
                    ? `${selectedDaySessions.length} sesión${selectedDaySessions.length !== 1 ? "es" : ""}`
                    : ""}
                </div>
              </div>
              <button
                className="btn-compact-primary"
                onClick={() => { setModalDate(selectedDate); setShowModal(true); }}
                style={{ padding:"6px 10px", fontSize:11, whiteSpace:"nowrap" }}
              >
                <FiPlus size={12} /> Añadir
              </button>
            </div>

            {/* Sessions content */}
            {loading ? (
              /* Skeleton */
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[1, 2].map(i => (
                  <div key={i} className="skeleton" style={{ height:74, borderRadius:8 }} />
                ))}
              </div>
            ) : !selInLoadedWeek ? (
              /* Selected day is not in the loaded week (edge case during fetch) */
              <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text-secondary)", fontSize:13 }}>
                <FiCalendar size={26} style={{ opacity:.3, display:"block", margin:"0 auto 10px" }} />
                Cargando semana…
              </div>
            ) : selectedDaySessions.length === 0 ? (
              /* No sessions for this day */
              <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text-secondary)", fontSize:13 }}>
                <FiCalendar size={26} style={{ opacity:.25, display:"block", margin:"0 auto 10px" }} />
                Sin sesiones para este día
              </div>
            ) : (
              /* Session cards */
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {selectedDaySessions.map(session => (
                  <SessionCard
                    key={session.id_sesion}
                    session={session}
                    onComplete={id => handleStatusUpdate(id, "completed")}
                    onCancel={id   => handleStatusUpdate(id, "cancelled")}
                    isLoading={actionLoading === session.id_sesion}
                  />
                ))}
              </div>
            )}

            {/* Add button (only when day is loaded) */}
            {selInLoadedWeek && !loading && (
              <div style={{ marginTop:10 }}>
                <AddDayButton onClick={() => { setModalDate(selectedDate); setShowModal(true); }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {showModal && (
          <NewSessionModal
            onClose={() => setShowModal(false)}
            onSaved={fetchSchedule}
            defaultDate={modalDate}
            members={members}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
