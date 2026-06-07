/**
 * TrainerSchedule.jsx — Agenda + Historial de sesiones (módulo unificado)
 *
 * Tabs:
 *  • Agenda    — Calendario mensual + KPIs semanales + sesiones del día
 *  • Historial — Lista paginada de sesiones con filtros (antes TrainerSessions)
 *
 * Regla de negocio: solo se pueden crear sesiones para hoy o días futuros.
 * Los días pasados son de solo consulta.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar, FiChevronLeft, FiChevronRight,
  FiPlus, FiCheck, FiX, FiAlertCircle, FiRefreshCw,
  FiClock, FiCheckCircle, FiXCircle, FiPlay, FiFilter,
  FiUser, FiMapPin, FiFileText, FiEdit2, FiTrash2,
  FiList, FiLock,
} from "react-icons/fi";
import trainerService from "../../services/entrenador/trainerService";
import "../../css/CSSUnificado.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  scheduled:     { label: "Programada", color: "var(--accent)",   bg: "var(--accent-dim)"        },
  "in-progress": { label: "En curso",   color: "var(--warning)",  bg: "rgba(245,158,11,.15)"     },
  completed:     { label: "Completada", color: "var(--success)",  bg: "rgba(34,197,94,.15)"      },
  cancelled:     { label: "Cancelada",  color: "var(--danger)",   bg: "rgba(239,68,68,.15)"      },
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

function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const dow = date.getDay();
  date.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
  return date;
}

function calcWeekOffset(base, target) {
  const mBase = getMonday(base).getTime();
  const mTgt  = getMonday(target).getTime();
  return Math.round((mTgt - mBase) / (7 * 24 * 60 * 60 * 1000));
}

function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const prevLast = new Date(year, month, 0).getDate();
  let startDow   = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const days = [];
  for (let i = startDow - 1; i >= 0; i--)
    days.push({ date: new Date(year, month - 1, prevLast - i), currentMonth: false });
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push({ date: new Date(year, month, d), currentMonth: true });
  let nd = 1;
  while (days.length < 42)
    days.push({ date: new Date(year, month + 1, nd++), currentMonth: false });
  return days;
}

// ─── NotesModal ───────────────────────────────────────────────────────────────
function NotesModal({ session, onClose, onSaved }) {
  const [notes, setNotes]   = useState(session.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await trainerService.updateSession(session.id_sesion, { notas: notes });
      onSaved(); onClose();
    } catch (e) { alert(`Error: ${e.message}`); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.75)",
        backdropFilter:"blur(6px)", display:"flex", alignItems:"center",
        justifyContent:"center", padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity:0, scale:0.92, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.92 }}
        style={{ background:"var(--bg-card)", border:"1px solid var(--border)",
          borderRadius:18, padding:28, width:"100%", maxWidth:460 }}
      >
        <h3 style={{ marginBottom:8, fontSize:18, fontWeight:700 }}>Editar Notas</h3>
        <p style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:20 }}>
          {session.client} — {session.time}
        </p>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          className="input-compact" rows={5}
          style={{ resize:"vertical", width:"100%", fontFamily:"inherit" }}
          placeholder="Agregar notas de la sesión…" />
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={onClose} className="btn-outline-small" style={{ flex:1, padding:10 }}>Cancelar</button>
          <button onClick={handleSave} className="btn-compact-primary"
            style={{ flex:2, padding:10, opacity: saving ? 0.7 : 1 }} disabled={saving}>
            <FiCheck size={14} /> {saving ? "Guardando…" : "Guardar Notas"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── DeleteModal ──────────────────────────────────────────────────────────────
function DeleteModal({ session, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try { await trainerService.deleteSession(session.id_sesion); onDeleted(); onClose(); }
    catch (e) { alert(`Error: ${e.message}`); }
    finally { setDeleting(false); }
  };
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.75)",
        backdropFilter:"blur(6px)", display:"flex", alignItems:"center",
        justifyContent:"center", padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
        exit={{ opacity:0, scale:0.92 }}
        style={{ background:"var(--bg-card)", border:"1px solid var(--danger)",
          borderRadius:18, padding:28, width:"100%", maxWidth:400, textAlign:"center" }}
      >
        <FiTrash2 size={40} style={{ color:"var(--danger)", marginBottom:16 }} />
        <h3 style={{ marginBottom:8, fontSize:18, fontWeight:700 }}>Eliminar Sesión</h3>
        <p style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:24 }}>
          ¿Eliminar la sesión de <strong>{session.client}</strong>? Esta acción no se puede deshacer.
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} className="btn-outline-small" style={{ flex:1, padding:10 }}>Cancelar</button>
          <button onClick={handleDelete} disabled={deleting}
            style={{ flex:1, padding:10, background:"var(--danger)", color:"#fff", border:"none",
              borderRadius:8, cursor: deleting ? "not-allowed" : "pointer", fontWeight:600,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              opacity: deleting ? 0.7 : 1 }}>
            <FiTrash2 size={14} /> {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── SessionCard (panel del día en Agenda) ────────────────────────────────────
function SessionCard({ session, onComplete, onCancel, onNotes, onDelete, isLoading, isPast }) {
  const cfg    = STATUS_CFG[session.status] || STATUS_CFG.scheduled;
  const canAct = !isPast && session.status !== "completed" && session.status !== "cancelled";

  return (
    <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
      style={{ background:"var(--bg-card)", border:"1px solid var(--border)",
        borderLeft:`3px solid ${cfg.color}`, borderRadius:8, padding:"9px 10px" }}
    >
      <div style={{ fontSize:13, fontWeight:700, color:cfg.color, marginBottom:2 }}>
        {session.time || "—"}
      </div>
      <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)",
        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom:2 }}>
        {session.client || "Sin cliente"}
      </div>
      <div style={{ fontSize:10, color:"var(--text-secondary)", marginBottom:6 }}>
        {session.type} · {session.duration}
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px",
          background:cfg.bg, color:cfg.color, borderRadius:4 }}>
          {cfg.label}
        </span>
        <div style={{ display:"flex", gap:4 }}>
          {canAct && (
            <>
              <button onClick={() => onComplete(session.id_sesion)} disabled={isLoading} title="Completar"
                style={{ width:20, height:20, borderRadius:4, border:"none",
                  background:"rgba(34,197,94,.2)", color:"var(--success)",
                  cursor: isLoading ? "wait" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                <FiCheck size={10} />
              </button>
              <button onClick={() => onCancel(session.id_sesion)} disabled={isLoading} title="Cancelar"
                style={{ width:20, height:20, borderRadius:4, border:"none",
                  background:"rgba(239,68,68,.2)", color:"var(--danger)",
                  cursor: isLoading ? "wait" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                <FiX size={10} />
              </button>
            </>
          )}
          <button onClick={() => onNotes(session)} title="Notas"
            style={{ width:20, height:20, borderRadius:4, border:"none",
              background:"var(--bg-input)", color:"var(--text-secondary)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <FiEdit2 size={10} />
          </button>
          <button onClick={() => onDelete(session)} title="Eliminar"
            style={{ width:20, height:20, borderRadius:4, border:"none",
              background:"rgba(239,68,68,.12)", color:"var(--danger)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <FiTrash2 size={10} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── NewSessionModal ──────────────────────────────────────────────────────────
function NewSessionModal({ onClose, onSaved, defaultDate, members, todayStr }) {
  const [form, setForm] = useState({
    fecha:            defaultDate || todayStr,
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
  const isPastDate = form.fecha < todayStr;

  const handleSubmit = async () => {
    if (isPastDate) { setError("No se pueden crear sesiones para fechas pasadas."); return; }
    if (!form.fecha || !form.hora_inicio) { setError("Fecha y hora son obligatorias"); return; }
    setSaving(true); setError("");
    try {
      await trainerService.createSession({
        ...form,
        id_miembro:       form.id_miembro || null,
        duracion_minutos: parseInt(form.duracion_minutos),
      });
      onSaved(); onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const lbl = { fontSize:11, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:5 };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.75)",
        backdropFilter:"blur(6px)", display:"flex", alignItems:"center",
        justifyContent:"center", padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity:0, scale:0.92, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.92, y:20 }}
        style={{ background:"var(--bg-card)", border:"1px solid var(--border)",
          borderRadius:16, padding:28, width:"100%", maxWidth:500,
          maxHeight:"90vh", overflowY:"auto" }}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <h3 style={{ fontSize:18, fontWeight:700 }}>Nueva Sesión</h3>
          <button onClick={onClose} style={{ background:"none", border:"none",
            cursor:"pointer", color:"var(--text-secondary)" }}>
            <FiX size={20} />
          </button>
        </div>

        {(error || isPastDate) && (
          <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid var(--danger)",
            borderRadius:8, padding:"10px 14px", marginBottom:16,
            color:"var(--danger)", fontSize:13, display:"flex", gap:8, alignItems:"center" }}>
            <FiLock size={15} />
            {error || "La fecha seleccionada es anterior a hoy. Cambia la fecha para continuar."}
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={lbl}>Fecha *</label>
              <input type="date" value={form.fecha} min={todayStr}
                onChange={e => set("fecha", e.target.value)} className="input-compact" />
            </div>
            <div>
              <label style={lbl}>Hora *</label>
              <input type="time" value={form.hora_inicio}
                onChange={e => set("hora_inicio", e.target.value)} className="input-compact" />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={lbl}>Duración</label>
              <select value={form.duracion_minutos}
                onChange={e => set("duracion_minutos", e.target.value)} className="input-compact">
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
              <select value={form.id_miembro}
                onChange={e => set("id_miembro", e.target.value)} className="input-compact">
                <option value="">Seleccionar miembro…</option>
                {members.filter(m => m.is_my_client).length > 0 && (
                  <optgroup label="Mis clientes">
                    {members.filter(m => m.is_my_client).map(m => (
                      <option key={m.id_miembro} value={m.id_miembro}>{m.nombre}</option>
                    ))}
                  </optgroup>
                )}
                {members.filter(m => !m.is_my_client).length > 0 && (
                  <optgroup label="Otros miembros">
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
              <input type="text" value={form.nombre_sesion}
                onChange={e => set("nombre_sesion", e.target.value)}
                placeholder="Ej: HIIT Avanzado" className="input-compact" />
            </div>
          )}
          <div>
            <label style={lbl}>Ubicación</label>
            <input type="text" value={form.ubicacion}
              onChange={e => set("ubicacion", e.target.value)}
              placeholder="Sala 1, Online, Exterior…" className="input-compact" />
          </div>
          <div>
            <label style={lbl}>Notas</label>
            <textarea value={form.notas} onChange={e => set("notas", e.target.value)}
              placeholder="Notas adicionales…" className="input-compact"
              rows={3} style={{ resize:"vertical" }} />
          </div>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:22 }}>
          <button onClick={onClose} className="btn-outline-small" style={{ flex:1, padding:10 }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-compact-primary"
            style={{ flex:2, padding:10, opacity: (saving || isPastDate) ? 0.55 : 1 }}
            disabled={saving || isPastDate}>
            <FiCheck size={15} /> {saving ? "Guardando…" : "Crear Sesión"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── AddDayButton ─────────────────────────────────────────────────────────────
function AddDayButton({ onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      title={disabled ? "No se pueden crear sesiones en fechas pasadas" : "Añadir sesión"}
      style={{ width:"100%", padding:"6px 4px",
        background: hovered ? "var(--accent-dim)" : "transparent",
        border:`1px dashed ${hovered && !disabled ? "var(--accent)" : "var(--border)"}`,
        borderRadius:7, cursor: disabled ? "not-allowed" : "pointer", fontSize:11,
        color: disabled ? "var(--text-tertiary)" : (hovered ? "var(--accent)" : "var(--text-tertiary)"),
        display:"flex", alignItems:"center", justifyContent:"center", gap:4,
        transition:"all 0.15s", opacity: disabled ? 0.5 : 1,
      }}
    >
      {disabled ? <FiLock size={11} /> : <FiPlus size={11} />}
      {disabled ? "Solo consulta" : "Añadir sesión"}
    </button>
  );
}

// ─── HistorialTab ─────────────────────────────────────────────────────────────
function HistorialTab({ onNotesFn, onDeleteFn }) {
  const [filterStatus, setFilterStatus]   = useState("all");
  const [dateRange, setDateRange]         = useState("week");
  const [sessions, setSessions]           = useState([]);
  const [stats, setStats]                 = useState({
    total:0, completed:0, scheduled:0, cancelled:0, in_progress:0, attendance_rate:0,
  });
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [total, setTotal]                 = useState(0);
  const [page, setPage]                   = useState(1);
  const perPage = 20;

  const fetchSessions = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await trainerService.getSessions({ status: filterStatus, range: dateRange, page, per_page: perPage });
      setSessions(data.sessions || []);
      setStats(data.stats || {});
      setTotal(data.total || 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filterStatus, dateRange, page]);

  useEffect(() => { setPage(1); }, [filterStatus, dateRange]);
  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleStatusUpdate = async (sessionId, newStatus) => {
    setActionLoading(sessionId);
    try { await trainerService.updateSessionStatus(sessionId, newStatus); fetchSessions(); }
    catch (e) { alert(`Error: ${e.message}`); }
    finally { setActionLoading(null); }
  };

  const statusColor = s => ({
    completed:"var(--success)", "in-progress":"var(--accent)",
    scheduled:"#38bdf8", cancelled:"var(--danger)",
  }[s] || "var(--text-secondary)");
  const statusText = s => ({
    completed:"Completada", "in-progress":"En Curso",
    scheduled:"Programada", cancelled:"Cancelada",
  }[s] || s);
  const statusIcon = s => ({
    completed:<FiCheckCircle />, "in-progress":<FiPlay />,
    scheduled:<FiClock />, cancelled:<FiXCircle />,
  }[s] || <FiClock />);

  const filterBtns = [
    { value:"all",         label:"Todas"       },
    { value:"completed",   label:"Completadas" },
    { value:"in-progress", label:"En Curso"    },
    { value:"scheduled",   label:"Programadas" },
    { value:"cancelled",   label:"Canceladas"  },
  ];
  const rangeBtns = [
    { value:"today", label:"Hoy"    },
    { value:"week",  label:"Semana" },
    { value:"month", label:"Mes"    },
  ];

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom:20,
        gridTemplateColumns:"repeat(auto-fit, minmax(130px,1fr))" }}>
        {[
          { title:"Total",       value: stats.total,     color:"var(--accent)"  },
          { title:"Completadas", value: stats.completed, color:"var(--success)" },
          { title:"Programadas", value: stats.scheduled, color:"#38bdf8"        },
          { title:"Canceladas",  value: stats.cancelled, color:"var(--danger)"  },
          { title:"Asistencia",  value:`${stats.attendance_rate || 0}%`, color:"var(--warning)" },
        ].map(({ title, value, color }) => (
          <div key={title} className="stat-card" style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase",
              letterSpacing:".06em", color:"var(--text-secondary)", marginBottom:6 }}>
              {title}
            </div>
            <div style={{ fontSize:26, fontWeight:800, color, lineHeight:1 }}>
              {loading ? "—" : value}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="chart-card" style={{ marginBottom:16, padding:"14px 18px" }}>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
            <FiFilter size={14} style={{ color:"var(--text-secondary)" }} />
            <span style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)" }}>Estado:</span>
            {filterBtns.map(f => (
              <button key={f.value} onClick={() => setFilterStatus(f.value)}
                style={{ padding:"5px 11px", borderRadius:6, fontSize:11, fontWeight:600,
                  cursor:"pointer", transition:"all 0.15s",
                  background: filterStatus===f.value ? "var(--accent)" : "transparent",
                  border:`1px solid ${filterStatus===f.value ? "var(--accent)" : "var(--border)"}`,
                  color: filterStatus===f.value ? "#fff" : "var(--text-secondary)" }}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)" }}>Periodo:</span>
            {rangeBtns.map(r => (
              <button key={r.value} onClick={() => setDateRange(r.value)}
                style={{ padding:"5px 11px", borderRadius:6, fontSize:11, fontWeight:600,
                  cursor:"pointer", transition:"all 0.15s",
                  background: dateRange===r.value ? "var(--accent)" : "transparent",
                  border:`1px solid ${dateRange===r.value ? "var(--accent)" : "var(--border)"}`,
                  color: dateRange===r.value ? "#fff" : "var(--text-secondary)" }}>
                {r.label}
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={fetchSessions} style={{ marginLeft:"auto" }}>
            <FiRefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid var(--danger)",
          borderRadius:10, padding:"12px 16px", marginBottom:16,
          color:"var(--danger)", fontSize:13, display:"flex", gap:8, alignItems:"center" }}>
          <FiAlertCircle size={15} /> {error}
          <button onClick={fetchSessions} style={{ marginLeft:"auto", background:"none",
            border:"none", cursor:"pointer", color:"var(--danger)", textDecoration:"underline", fontSize:12 }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Lista */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 style={{ fontSize:14, fontWeight:700 }}>Sesiones ({total})</h3>
        </div>

        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:16 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:90, borderRadius:12 }} />)}
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0", color:"var(--text-secondary)" }}>
            <FiClock size={40} style={{ opacity:.25, display:"block", margin:"0 auto 12px" }} />
            <p style={{ fontSize:14 }}>No hay sesiones con los filtros seleccionados</p>
          </div>
        ) : (
          <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:10 }}>
            {sessions.map(session => (
              <motion.div key={session.id_sesion}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                style={{ background:"var(--bg-input)", border:"1px solid var(--border)",
                  borderLeft:`4px solid ${statusColor(session.status)}`,
                  borderRadius:12, padding:16,
                  display:"grid", gridTemplateColumns:"auto 1fr auto", gap:16,
                  alignItems:"center", opacity: session.status==="cancelled" ? 0.6 : 1 }}
                whileHover={{ translateX: 4, borderColor:"var(--accent)" }}
              >
                {/* Fecha + icono */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  gap:6, minWidth:72 }}>
                  <div style={{ fontSize:20, fontWeight:700, color:"var(--accent)" }}>{session.time}</div>
                  <div style={{ fontSize:10, color:"var(--text-secondary)", textAlign:"center" }}>
                    {new Date(session.date + "T00:00:00").toLocaleDateString("es-MX",
                      { day:"numeric", month:"short" })}
                  </div>
                  <div style={{ width:34, height:34, borderRadius:"50%",
                    background:`${statusColor(session.status)}20`,
                    color:statusColor(session.status),
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>
                    {statusIcon(session.status)}
                  </div>
                </div>

                {/* Detalles */}
                <div>
                  <h4 style={{ fontSize:15, fontWeight:600, marginBottom:6,
                    textDecoration: session.status==="cancelled" ? "line-through" : "none" }}>
                    {session.client}
                  </h4>
                  <div style={{ display:"flex", gap:12, fontSize:12,
                    color:"var(--text-secondary)", flexWrap:"wrap", marginBottom:4 }}>
                    <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <FiUser size={12} />{session.type}
                    </span>
                    <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <FiClock size={12} />{session.duration}
                    </span>
                    <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <FiMapPin size={12} />{session.location}
                    </span>
                    {session.exercises > 0 && (
                      <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <FiFileText size={12} />{session.exercises} ejercicios
                      </span>
                    )}
                  </div>
                  {session.notes && (
                    <div style={{ fontSize:11, color:"var(--text-secondary)", fontStyle:"italic",
                      background:"var(--bg-card)", padding:"6px 10px", borderRadius:6,
                      borderLeft:"2px solid var(--accent)" }}>
                      {session.notes}
                    </div>
                  )}
                </div>

                {/* Estado + acciones */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  gap:6, minWidth:100 }}>
                  <div style={{ padding:"4px 10px",
                    background:`${statusColor(session.status)}20`,
                    color:statusColor(session.status), borderRadius:8, fontSize:11, fontWeight:600 }}>
                    {statusText(session.status)}
                  </div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"center" }}>
                    {session.status === "scheduled" && (
                      <button className="btn-compact-primary" style={{ fontSize:11, padding:"4px 8px" }}
                        onClick={() => handleStatusUpdate(session.id_sesion, "in-progress")}
                        disabled={actionLoading === session.id_sesion}>
                        <FiPlay size={10} /> Iniciar
                      </button>
                    )}
                    {session.status === "in-progress" && (
                      <button className="btn-compact-primary" style={{ fontSize:11, padding:"4px 8px" }}
                        onClick={() => handleStatusUpdate(session.id_sesion, "completed")}
                        disabled={actionLoading === session.id_sesion}>
                        <FiCheckCircle size={10} /> Finalizar
                      </button>
                    )}
                    <button className="icon-btn" onClick={() => onNotesFn(session)}
                      title="Editar notas" style={{ width:28, height:28 }}>
                      <FiEdit2 size={12} />
                    </button>
                    <button className="icon-btn danger" onClick={() => onDeleteFn(session)}
                      title="Eliminar" style={{ width:28, height:28 }}>
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && total > perPage && (
          <div style={{ display:"flex", justifyContent:"center", gap:10,
            marginTop:20, alignItems:"center" }}>
            <button className="btn-outline-small" onClick={() => setPage(p => Math.max(1,p-1))}
              disabled={page===1} style={{ opacity: page===1 ? 0.4 : 1 }}>
              Anterior
            </button>
            <span>{page} de {Math.ceil(total/perPage)}</span>
            <button className="btn-outline-small" onClick={() => setPage(p => p+1)}
              disabled={page >= Math.ceil(total/perPage)}
              style={{ opacity: page >= Math.ceil(total/perPage) ? 0.4 : 1 }}>
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TrainerSchedule() {
  const todayRef = useRef((() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  })());
  const todayStr = toDateStr(todayRef.current);

  const [activeTab, setActiveTab]         = useState("agenda");
  const [currentWeek, setCurrentWeek]     = useState(0);
  const [selectedDate, setSelectedDate]   = useState(todayStr);
  const [viewMonth, setViewMonth]         = useState({
    year: todayRef.current.getFullYear(), month: todayRef.current.getMonth(),
  });
  const [scheduleData, setScheduleData]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [showModal, setShowModal]         = useState(false);
  const [modalDate, setModalDate]         = useState(null);
  const [members, setMembers]             = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [editNotesSession, setEditNotesSession] = useState(null);
  const [deleteSession, setDeleteSession] = useState(null);

  const isPastDate = selectedDate < todayStr;

  const fetchSchedule = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await trainerService.getSchedule(currentWeek);
      setScheduleData(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [currentWeek]);

  const fetchMembers = useCallback(async () => {
    try { setMembers(await trainerService.getMembers()); } catch (_) {}
  }, []);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);
  useEffect(() => { fetchMembers();  }, [fetchMembers]);

  const weekDays = scheduleData
    ? Object.entries(scheduleData.schedule).map(([, day]) => ({
        date:     day.date,
        sessions: day.sessions || [],
      }))
    : [];

  const sessionsByDate = Object.fromEntries(weekDays.map(d => [d.date, d.sessions]));
  const weekDateSet    = new Set(weekDays.map(d => d.date));

  const totalSessions = weekDays.reduce((a, d) => a + d.sessions.length, 0);
  const completadas   = weekDays.reduce((a, d) => a + d.sessions.filter(s => s.status==="completed").length, 0);
  const programadas   = weekDays.reduce((a, d) => a + d.sessions.filter(s => s.status==="scheduled").length, 0);
  const canceladas    = weekDays.reduce((a, d) => a + d.sessions.filter(s => s.status==="cancelled").length, 0);

  const weekLabel = scheduleData ? (() => {
    const s = new Date(scheduleData.week_start + "T00:00:00");
    const e = new Date(scheduleData.week_end   + "T00:00:00");
    const o = { day:"numeric", month:"short" };
    return `${s.toLocaleDateString("es-MX", o)} – ${e.toLocaleDateString("es-MX", { ...o, year:"numeric" })}`;
  })() : "—";

  const selectedDaySessions = sessionsByDate[selectedDate] || [];
  const selInLoadedWeek     = weekDateSet.has(selectedDate);
  const selDateLabel        = new Date(selectedDate + "T00:00:00")
    .toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long" });

  const navigateWeek = delta => {
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

  const navigateMonth = delta => {
    setViewMonth(vm => {
      let { year, month } = vm;
      month += delta;
      if (month > 11) { month = 0; year++; }
      if (month <  0) { month = 11; year--; }
      return { year, month };
    });
  };

  const handleDayClick = date => {
    const ds     = toDateStr(date);
    const offset = calcWeekOffset(todayRef.current, date);
    setSelectedDate(ds);
    if (offset !== currentWeek) setCurrentWeek(offset);
  };

  const handleStatusUpdate = async (sessionId, newStatus) => {
    setActionLoading(sessionId);
    try { await trainerService.updateSessionStatus(sessionId, newStatus); fetchSchedule(); }
    catch (e) { alert(`Error: ${e.message}`); }
    finally { setActionLoading(null); }
  };

  const openNewSession = date => {
    if (date < todayStr) return;
    setModalDate(date);
    setShowModal(true);
  };

  const calDays  = generateCalendarDays(viewMonth.year, viewMonth.month);
  const kpiCards = [
    { label:"Total",       value: totalSessions, color:"var(--accent)"  },
    { label:"Completadas", value: completadas,   color:"var(--success)" },
    { label:"Programadas", value: programadas,   color:"#38bdf8"        },
    { label:"Canceladas",  value: canceladas,    color:"var(--danger)"  },
  ];

  return (
    <div className="dashboard-content">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:22, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 className="page-title" style={{ marginBottom:4 }}>Agenda y Sesiones</h2>
          <p style={{ fontSize:13, color:"var(--text-secondary)", margin:0 }}>
            {loading ? "Cargando…"
              : `${weekLabel} · ${totalSessions} sesiones (${completadas} completadas)`}
          </p>
        </div>
        <div style={{ display:"flex", gap:4, background:"var(--bg-input)",
          padding:3, borderRadius:10, border:"1px solid var(--border)" }}>
          {[
            { id:"agenda",    label:"Agenda",    icon:<FiCalendar size={13}/> },
            { id:"historial", label:"Historial", icon:<FiList size={13}/>    },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px",
                borderRadius:7, border:"none", fontSize:12, fontWeight:600, cursor:"pointer",
                background: activeTab===t.id ? "var(--accent)" : "transparent",
                color: activeTab===t.id ? "#fff" : "var(--text-secondary)",
                transition:"all 0.15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid var(--danger)",
          borderRadius:10, padding:"12px 16px", marginBottom:20,
          color:"var(--danger)", fontSize:13, display:"flex", gap:10, alignItems:"center" }}>
          <FiAlertCircle size={15} /> {error}
          <button onClick={fetchSchedule} style={{ marginLeft:"auto", background:"none",
            border:"none", cursor:"pointer", color:"var(--danger)",
            textDecoration:"underline", fontSize:12 }}>
            Reintentar
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "agenda" && (
          <motion.div key="agenda"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:18, flexWrap:"wrap" }}>
              <button className="icon-btn" onClick={() => navigateWeek(-1)}><FiChevronLeft size={18} /></button>
              <button className="btn-outline-small" onClick={goToday}>Hoy</button>
              <button className="icon-btn" onClick={() => navigateWeek(1)}><FiChevronRight size={18} /></button>
              <button className="icon-btn" onClick={fetchSchedule} title="Actualizar">
                <FiRefreshCw size={15}
                  style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              </button>
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
                {isPastDate && (
                  <span style={{ fontSize:11, color:"var(--text-secondary)",
                    display:"flex", alignItems:"center", gap:5,
                    background:"var(--bg-input)", padding:"5px 10px", borderRadius:6,
                    border:"1px solid var(--border)" }}>
                    <FiLock size={10} /> Día pasado — solo consulta
                  </span>
                )}
                <button className="btn-compact-primary"
                  onClick={() => openNewSession(selectedDate)}
                  disabled={isPastDate}
                  style={{ opacity: isPastDate ? 0.4 : 1,
                    cursor: isPastDate ? "not-allowed" : "pointer" }}>
                  <FiPlus size={15} /> Nueva Sesión
                </button>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, alignItems:"start" }}>
              <div className="stat-card" style={{ padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:16 }}>
                  <button className="icon-btn" onClick={() => navigateMonth(-1)}>
                    <FiChevronLeft size={16} />
                  </button>
                  <span style={{ fontWeight:700, fontSize:15 }}>
                    {MONTH_NAMES[viewMonth.month]} {viewMonth.year}
                  </span>
                  <button className="icon-btn" onClick={() => navigateMonth(1)}>
                    <FiChevronRight size={16} />
                  </button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
                  {DAY_HEADERS.map(h => (
                    <div key={h} style={{ textAlign:"center", fontSize:10, fontWeight:700,
                      color:"var(--text-secondary)", padding:"4px 0",
                      textTransform:"uppercase", letterSpacing:".06em" }}>
                      {h}
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                  {calDays.map(({ date, currentMonth }, idx) => {
                    const ds       = toDateStr(date);
                    const isToday  = ds === todayStr;
                    const isSel    = ds === selectedDate;
                    const isPast   = ds < todayStr;
                    const sessions = sessionsByDate[ds] || [];
                    const inWeek   = weekDateSet.has(ds);
                    let cellBg = "transparent", cellBdr = "transparent";
                    let numClr = currentMonth
                      ? (isPast ? "rgba(150,150,160,0.55)" : "var(--text-primary)")
                      : "rgba(150,150,160,0.3)";
                    let numW = currentMonth ? 400 : 300;
                    if (isToday)     { cellBg = "var(--accent)"; numClr = "#fff"; numW = 800; }
                    else if (isSel)  { cellBg = "rgba(99,102,241,.12)"; cellBdr = "var(--accent)"; numClr = "var(--accent)"; numW = 700; }
                    else if (inWeek) { cellBg = "rgba(99,102,241,.05)"; }
                    return (
                      <div key={idx} onClick={() => handleDayClick(date)}
                        onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = isSel ? "rgba(99,102,241,.18)" : "var(--bg-input)"; }}
                        onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = cellBg; }}
                        style={{ display:"flex", flexDirection:"column", alignItems:"center",
                          justifyContent:"center", padding:"5px 2px", borderRadius:8,
                          cursor:"pointer", border:`1px solid ${cellBdr}`, background:cellBg,
                          transition:"background .13s, border-color .13s", minHeight:46,
                          opacity: isPast && !isToday && !isSel ? 0.75 : 1 }}>
                        <span style={{ fontSize:13, fontWeight:numW, color:numClr, lineHeight:1 }}>
                          {date.getDate()}
                        </span>
                        {sessions.length > 0 && (
                          <div style={{ display:"flex", gap:2, marginTop:4 }}>
                            {sessions.slice(0,3).map((s,si) => {
                              const cfg = STATUS_CFG[s.status] || STATUS_CFG.scheduled;
                              return <div key={si} style={{ width:5, height:5, borderRadius:"50%",
                                background: isToday ? "rgba(255,255,255,.85)" : cfg.color }} />;
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display:"flex", gap:12, marginTop:14, paddingTop:12,
                  borderTop:"1px solid var(--border)", flexWrap:"wrap" }}>
                  {Object.entries(STATUS_CFG).map(([k, cfg]) => (
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:cfg.color }} />
                      <span style={{ fontSize:10, color:"var(--text-secondary)" }}>{cfg.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {kpiCards.map(({ label, value, color }) => (
                    <div key={label} className="stat-card" style={{ padding:"14px 16px" }}>
                      <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase",
                        letterSpacing:".06em", color:"var(--text-secondary)", marginBottom:6 }}>
                        {label}
                      </div>
                      <div style={{ fontSize:30, fontWeight:800, color, lineHeight:1 }}>
                        {loading ? "—" : value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="stat-card" style={{ padding:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"flex-start", marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)",
                        textTransform:"capitalize", lineHeight:1.3 }}>
                        {selDateLabel}
                      </div>
                      {isPastDate ? (
                        <div style={{ fontSize:10, color:"var(--warning)", marginTop:3,
                          display:"flex", alignItems:"center", gap:4 }}>
                          <FiLock size={9} /> Solo consulta
                        </div>
                      ) : (
                        selInLoadedWeek && !loading && (
                          <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>
                            {selectedDaySessions.length} sesión{selectedDaySessions.length!==1?"es":""}
                          </div>
                        )
                      )}
                    </div>
                    {!isPastDate && (
                      <button className="btn-compact-primary"
                        onClick={() => openNewSession(selectedDate)}
                        style={{ padding:"6px 10px", fontSize:11 }}>
                        <FiPlus size={12} /> Añadir
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {[1,2].map(i => <div key={i} className="skeleton"
                        style={{ height:74, borderRadius:8 }} />)}
                    </div>
                  ) : !selInLoadedWeek ? (
                    <div style={{ textAlign:"center", padding:"24px 0",
                      color:"var(--text-secondary)", fontSize:13 }}>
                      <FiCalendar size={26}
                        style={{ opacity:.3, display:"block", margin:"0 auto 10px" }} />
                      Cargando semana…
                    </div>
                  ) : selectedDaySessions.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"24px 0",
                      color:"var(--text-secondary)", fontSize:13 }}>
                      <FiCalendar size={26}
                        style={{ opacity:.25, display:"block", margin:"0 auto 10px" }} />
                      Sin sesiones para este día
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {selectedDaySessions.map(session => (
                        <SessionCard key={session.id_sesion} session={session}
                          isPast={isPastDate}
                          onComplete={id => handleStatusUpdate(id, "completed")}
                          onCancel={id   => handleStatusUpdate(id, "cancelled")}
                          onNotes={setEditNotesSession}
                          onDelete={setDeleteSession}
                          isLoading={actionLoading === session.id_sesion}
                        />
                      ))}
                    </div>
                  )}

                  {selInLoadedWeek && !loading && (
                    <div style={{ marginTop:10 }}>
                      <AddDayButton disabled={isPastDate}
                        onClick={() => openNewSession(selectedDate)} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "historial" && (
          <motion.div key="historial"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
            <HistorialTab
              onNotesFn={setEditNotesSession}
              onDeleteFn={setDeleteSession}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <NewSessionModal
            onClose={() => setShowModal(false)}
            onSaved={fetchSchedule}
            defaultDate={modalDate}
            members={members}
            todayStr={todayStr}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editNotesSession && (
          <NotesModal session={editNotesSession}
            onClose={() => setEditNotesSession(null)}
            onSaved={fetchSchedule} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteSession && (
          <DeleteModal session={deleteSession}
            onClose={() => setDeleteSession(null)}
            onDeleted={fetchSchedule} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
