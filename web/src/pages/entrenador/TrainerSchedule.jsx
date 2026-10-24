/**
 * TrainerSchedule.jsx — Agenda semanal del entrenador.
 * Vista de 7 columnas (una por día) mostrando todas las sesiones de la semana.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar, FiChevronLeft, FiChevronRight,
  FiPlus, FiCheck, FiX, FiAlertCircle, FiRefreshCw,
} from "react-icons/fi";
import trainerService from "../../services/entrenador/trainerService";
import "../../css/CSSUnificado.css";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  scheduled:     { label: "Programada",  color: "#6366f1", bg: "rgba(99,102,241,.15)"  },
  "in-progress": { label: "En curso",    color: "#f59e0b", bg: "rgba(245,158,11,.15)"  },
  completed:     { label: "Completada",  color: "#22c55e", bg: "rgba(34,197,94,.15)"   },
  cancelled:     { label: "Cancelada",   color: "#ef4444", bg: "rgba(239,68,68,.15)"   },
};

// ─── Session card ─────────────────────────────────────────────────────────────
function SessionCard({ session, onComplete, onCancel, isLoading }) {
  const cfg    = STATUS_CFG[session.status] || STATUS_CFG.scheduled;
  const canAct = session.status !== "completed" && session.status !== "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--bg-card)",
        border: `1px solid var(--border)`,
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: 8,
        padding: "9px 10px",
      }}
    >
      {/* Hora */}
      <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color, marginBottom: 2 }}>
        {session.time || "—"}
      </div>

      {/* Cliente */}
      <div style={{
        fontSize: 12, fontWeight: 600, color: "var(--text-primary)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        marginBottom: 2,
      }}>
        {session.client || "Sin cliente"}
      </div>

      {/* Tipo + duración */}
      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 6 }}>
        {session.type} · {session.duration}
      </div>

      {/* Badge + acciones */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "2px 7px",
          background: cfg.bg, color: cfg.color, borderRadius: 4,
        }}>
          {cfg.label}
        </span>

        {canAct && (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => onComplete(session.id_sesion)}
              disabled={isLoading}
              title="Completar"
              style={{
                width: 20, height: 20, borderRadius: 4, border: "none",
                background: "rgba(34,197,94,.2)", color: "#22c55e",
                cursor: isLoading ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <FiCheck size={10} />
            </button>
            <button
              onClick={() => onCancel(session.id_sesion)}
              disabled={isLoading}
              title="Cancelar"
              style={{
                width: 20, height: 20, borderRadius: 4, border: "none",
                background: "rgba(239,68,68,.2)", color: "#ef4444",
                cursor: isLoading ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <FiX size={10} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── New Session Modal ────────────────────────────────────────────────────────
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
    if (!form.fecha || !form.hora_inicio) {
      setError("Fecha y hora son obligatorias"); return;
    }
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

  const labelStyle = {
    fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
    display: "block", marginBottom: 5,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 28, width: "100%", maxWidth: 500,
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Nueva Sesión</h3>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
            <FiX size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "var(--danger-bg)", border: "1px solid var(--danger)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            color: "var(--danger)", fontSize: 13, display: "flex", gap: 8, alignItems: "center",
          }}>
            <FiAlertCircle size={15} /> {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Fecha + Hora */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Fecha *</label>
              <input type="date" value={form.fecha}
                onChange={e => set("fecha", e.target.value)} className="input-compact" />
            </div>
            <div>
              <label style={labelStyle}>Hora *</label>
              <input type="time" value={form.hora_inicio}
                onChange={e => set("hora_inicio", e.target.value)} className="input-compact" />
            </div>
          </div>

          {/* Duración + Tipo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Duración</label>
              <select value={form.duracion_minutos}
                onChange={e => set("duracion_minutos", e.target.value)} className="input-compact">
                {[30, 45, 60, 75, 90, 120].map(d => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tipo</label>
              <select value={form.tipo}
                onChange={e => set("tipo", e.target.value)} className="input-compact">
                <option>Personal</option>
                <option>Grupal</option>
                <option>Consulta</option>
              </select>
            </div>
          </div>

          {/* Cliente o nombre de clase */}
          {form.tipo === "Personal" ? (
            <div>
              <label style={labelStyle}>Cliente</label>
              <select value={form.id_miembro}
                onChange={e => set("id_miembro", e.target.value)} className="input-compact">
                <option value="">Seleccionar cliente...</option>
                {members.map(m => (
                  <option key={m.id_miembro} value={m.id_miembro}>{m.nombre}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Nombre de la clase</label>
              <input type="text" value={form.nombre_sesion}
                onChange={e => set("nombre_sesion", e.target.value)}
                placeholder="Ej: HIIT Avanzado" className="input-compact" />
            </div>
          )}

          {/* Ubicación */}
          <div>
            <label style={labelStyle}>Ubicación</label>
            <input type="text" value={form.ubicacion}
              onChange={e => set("ubicacion", e.target.value)}
              placeholder="Sala 1, Online, Exterior..." className="input-compact" />
          </div>

          {/* Notas */}
          <div>
            <label style={labelStyle}>Notas</label>
            <textarea value={form.notas}
              onChange={e => set("notas", e.target.value)}
              placeholder="Notas adicionales..." className="input-compact"
              rows={3} style={{ resize: "vertical" }} />
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={onClose} className="btn-outline-small" style={{ flex: 1, padding: "10px" }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-compact-primary"
            style={{ flex: 2, padding: "10px", opacity: saving ? 0.7 : 1 }} disabled={saving}>
            <FiCheck size={15} /> {saving ? "Guardando..." : "Crear Sesión"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TrainerSchedule() {
  const [currentWeek, setCurrentWeek]     = useState(0);
  const [scheduleData, setScheduleData]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [showModal, setShowModal]         = useState(false);
  const [modalDate, setModalDate]         = useState(null);
  const [members, setMembers]             = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

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
  useEffect(() => { fetchMembers(); },  [fetchMembers]);

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

  const totalSessions = weekDays.reduce((acc, d) => acc + d.sessions.length, 0);
  const completadas   = weekDays.reduce(
    (acc, d) => acc + d.sessions.filter(s => s.status === "completed").length, 0
  );

  const weekLabel = scheduleData
    ? (() => {
        const s = new Date(scheduleData.week_start + "T00:00:00");
        const e = new Date(scheduleData.week_end   + "T00:00:00");
        const opts = { day: "numeric", month: "short" };
        return `${s.toLocaleDateString("es-MX", opts)} – ${e.toLocaleDateString("es-MX", { ...opts, year: "numeric" })}`;
      })()
    : "—";

  return (
    <div className="dashboard-content">
      {/* ── Header ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 24, flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h2 className="page-title" style={{ marginBottom: 4 }}>Agenda y Calendario</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            {loading ? "Cargando..." : `${weekLabel} · ${totalSessions} sesiones (${completadas} completadas)`}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="icon-btn"
            onClick={() => { setCurrentWeek(w => w - 1); }}>
            <FiChevronLeft size={18} />
          </button>
          <button className="btn-outline-small"
            onClick={() => setCurrentWeek(0)}>
            Hoy
          </button>
          <button className="icon-btn"
            onClick={() => { setCurrentWeek(w => w + 1); }}>
            <FiChevronRight size={18} />
          </button>
          <button className="icon-btn" onClick={fetchSchedule} title="Actualizar">
            <FiRefreshCw size={15}
              style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <button className="btn-compact-primary"
            onClick={() => { setModalDate(null); setShowModal(true); }}>
            <FiPlus size={15} /> Nueva Sesión
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: "var(--danger-bg)", border: "1px solid var(--danger)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 20,
          color: "var(--danger)", fontSize: 13, display: "flex", gap: 10, alignItems: "center",
        }}>
          <FiAlertCircle size={15} /> {error}
          <button onClick={fetchSchedule} style={{
            marginLeft: "auto", background: "none", border: "none",
            cursor: "pointer", color: "var(--danger)", textDecoration: "underline", fontSize: 12,
          }}>
            Reintentar
          </button>
        </div>
      )}

      {/* ── KPI strip ── */}
      {!loading && scheduleData && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Total sesiones",  value: totalSessions,                            color: "#6366f1" },
            { label: "Completadas",     value: completadas,                              color: "#22c55e" },
            { label: "Programadas",
              value: weekDays.reduce((a,d) => a + d.sessions.filter(s => s.status === "scheduled").length, 0),
              color: "#6366f1" },
            { label: "Canceladas",
              value: weekDays.reduce((a,d) => a + d.sessions.filter(s => s.status === "cancelled").length, 0),
              color: "#ef4444" },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card" style={{
              flex: "1 1 120px", padding: "12px 16px", minWidth: 100,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: ".05em", color: "var(--text-secondary)", marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Vista semanal (7 columnas) ── */}
      <div className="stat-card" style={{ padding: "20px", overflowX: "auto" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, minWidth: 700 }}>
            {[0,1,2,3,4,5,6].map(i => (
              <div key={i}>
                <div className="skeleton" style={{ height: 62, borderRadius: 10, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 72, borderRadius: 8, marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 52, borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, minWidth: 700 }}>
            {weekDays.map(day => (
              <div key={day.index}>
                {/* ── Day header ── */}
                <div style={{
                  textAlign: "center", padding: "10px 6px", borderRadius: 10,
                  marginBottom: 8, position: "relative",
                  background: day.isToday
                    ? "linear-gradient(135deg, var(--accent), var(--accent-hover))"
                    : "var(--bg-input)",
                  border: `1px solid ${day.isToday ? "var(--accent)" : "var(--border)"}`,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: day.isToday ? "rgba(255,255,255,0.75)" : "var(--text-secondary)",
                  }}>
                    {(day.dayName || "").slice(0, 3)}
                  </div>
                  <div style={{
                    fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginTop: 2,
                    color: day.isToday ? "#fff" : "var(--text-primary)",
                  }}>
                    {day.dayNumber}
                  </div>

                  {/* Badge de conteo */}
                  {day.sessions.length > 0 && (
                    <div style={{
                      position: "absolute", top: 5, right: 7,
                      width: 17, height: 17, borderRadius: "50%",
                      background: day.isToday ? "rgba(255,255,255,0.25)" : "var(--accent-dim)",
                      color: day.isToday ? "#fff" : "var(--accent)",
                      fontSize: 9, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {day.sessions.length}
                    </div>
                  )}
                </div>

                {/* ── Sessions ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {day.sessions.map(session => (
                    <SessionCard
                      key={session.id_sesion}
                      session={session}
                      onComplete={id => handleStatusUpdate(id, "completed")}
                      onCancel={id => handleStatusUpdate(id, "cancelled")}
                      isLoading={actionLoading === session.id_sesion}
                    />
                  ))}

                  {/* ── Add to this day ── */}
                  <AddDayButton onClick={() => { setModalDate(day.date); setShowModal(true); }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
        {Object.entries(STATUS_CFG).map(([k, cfg]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: cfg.color }} />
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* ── Nueva sesión modal ── */}
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

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Add-day button (memoized to avoid re-renders) ────────────────────────────
function AddDayButton({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", padding: "6px 4px",
        background: hovered ? "var(--accent-dim)" : "transparent",
        border: `1px dashed ${hovered ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 7, cursor: "pointer", fontSize: 11,
        color: hovered ? "var(--accent)" : "var(--text-tertiary)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        transition: "all 0.15s",
      }}
    >
      <FiPlus size={11} /> Añadir
    </button>
  );
}
