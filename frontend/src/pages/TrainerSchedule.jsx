import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar, FiClock, FiUser, FiChevronLeft, FiChevronRight,
  FiPlus, FiMapPin, FiVideo, FiCheck, FiX, FiAlertCircle, FiRefreshCw
} from "react-icons/fi";
import trainerService from "../services/trainerService";
import "../css/CSSUnificado.css";

// ─── New Session Modal ────────────────────────────────────────────────────────
function NewSessionModal({ onClose, onSaved, selectedDayDate, members }) {
  const [form, setForm] = useState({
    fecha: selectedDayDate || new Date().toISOString().split("T")[0],
    hora_inicio: "09:00",
    duracion_minutos: 60,
    tipo: "Personal",
    ubicacion: "",
    nombre_sesion: "",
    notas: "",
    id_miembro: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.fecha || !form.hora_inicio) { setError("Fecha y hora son obligatorias"); return; }
    setSaving(true); setError("");
    try {
      await trainerService.createSession({
        ...form,
        id_miembro: form.id_miembro ? parseInt(form.id_miembro) : null,
        duracion_minutos: parseInt(form.duracion_minutos),
      });
      onSaved(); onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
        style={{ background: "var(--bg-card-dark)", border: "1px solid var(--border-dark)", borderRadius: "18px", padding: "32px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: "700" }}>Nueva Sesión</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><FiX size={22} /></button>
        </div>

        {error && (
          <div style={{ background: "rgba(255,59,48,0.1)", border: "1px solid var(--error-color)", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: "var(--error-color)", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center" }}>
            <FiAlertCircle size={16} /> {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Fecha *</label>
              <input type="date" name="fecha" value={form.fecha} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Hora *</label>
              <input type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Duración</label>
              <select name="duracion_minutos" value={form.duracion_minutos} onChange={handleChange} className="form-input">
                {[30, 45, 60, 75, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Tipo</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} className="form-input">
                <option value="Personal">Personal</option>
                <option value="Grupal">Grupal</option>
                <option value="Consulta">Consulta</option>
              </select>
            </div>
          </div>

          {form.tipo === "Personal" ? (
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Cliente</label>
              <select name="id_miembro" value={form.id_miembro} onChange={handleChange} className="form-input">
                <option value="">Seleccionar cliente...</option>
                {members.map(m => <option key={m.id_miembro} value={m.id_miembro}>{m.nombre}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Nombre de la clase</label>
              <input type="text" name="nombre_sesion" value={form.nombre_sesion} onChange={handleChange} placeholder="Ej: HIIT Avanzado" className="form-input" />
            </div>
          )}

          <div>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Ubicación</label>
            <input type="text" name="ubicacion" value={form.ubicacion} onChange={handleChange} placeholder="Sala 1, Online, Exterior..." className="form-input" />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} placeholder="Notas adicionales..." className="form-input" rows={3} style={{ resize: "vertical" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <motion.button onClick={onClose} className="btn-outline-small" style={{ flex: 1, padding: "12px" }} whileTap={{ scale: 0.97 }}>Cancelar</motion.button>
          <motion.button onClick={handleSubmit} className="btn-compact-primary" style={{ flex: 2, padding: "12px", opacity: saving ? 0.7 : 1 }} disabled={saving} whileTap={{ scale: saving ? 1 : 0.97 }}>
            <FiCheck size={16} /> {saving ? "Guardando..." : "Crear Sesión"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TrainerSchedule() {
  const [currentWeek, setCurrentWeek]     = useState(0);
  const [selectedDay, setSelectedDay]     = useState(null);
  const [scheduleData, setScheduleData]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [showModal, setShowModal]         = useState(false);
  const [members, setMembers]             = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

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
  useEffect(() => { fetchMembers(); },  [fetchMembers]);

  const handleStatusUpdate = async (sessionId, newStatus) => {
    setActionLoading(sessionId);
    try { await trainerService.updateSessionStatus(sessionId, newStatus); fetchSchedule(); }
    catch (e) { alert(`Error: ${e.message}`); }
    finally { setActionLoading(null); }
  };

  const weekDays = scheduleData
    ? Object.entries(scheduleData.schedule).map(([idx, day]) => ({
        index: parseInt(idx), date: new Date(day.date + "T00:00:00"),
        dayName: day.day_name, dayNumber: day.day_number,
        isToday: day.is_today, sessions: day.sessions,
      }))
    : [];

  const selectedDayData = selectedDay !== null ? weekDays[selectedDay] : null;

  const statusColor = (s) => ({ scheduled: "#38bdf8", "in-progress": "var(--accent-color)", completed: "var(--success-color)", cancelled: "var(--error-color)" }[s] || "var(--text-secondary)");
  const statusLabel = (s) => ({ scheduled: "Programada", "in-progress": "En Curso", completed: "Completada", cancelled: "Cancelada" }[s] || s);

  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const iv = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="dashboard-content">
      <motion.div className="welcome-section" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <div className="welcome-content">
          <div className="welcome-text"><h2>Agenda y Calendario</h2><p>Gestiona tus sesiones y horarios semanales</p></div>
          <FiCalendar size={50} style={{ color: "var(--accent-color)", opacity: 0.8 }} />
        </div>
      </motion.div>

      <motion.div className="chart-card" style={{ marginTop: "25px" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "5px" }}>
              {scheduleData ? `Semana del ${new Date(scheduleData.week_start + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })}` : "Cargando..."}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Total de sesiones: {scheduleData?.total_sessions ?? "—"}</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <motion.button className="icon-btn" onClick={() => { setCurrentWeek(w => w - 1); setSelectedDay(null); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><FiChevronLeft size={18} /></motion.button>
            <motion.button className="btn-compact-primary" onClick={() => { setCurrentWeek(0); setSelectedDay(null); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Hoy</motion.button>
            <motion.button className="icon-btn" onClick={() => { setCurrentWeek(w => w + 1); setSelectedDay(null); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><FiChevronRight size={18} /></motion.button>
            <motion.button className="icon-btn" onClick={fetchSchedule} title="Actualizar" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <FiRefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </motion.button>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(255,59,48,0.1)", border: "1px solid var(--error-color)", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", color: "var(--error-color)", fontSize: "13px", display: "flex", gap: "10px", alignItems: "center" }}>
            <FiAlertCircle size={16} /> {error}
            <button onClick={fetchSchedule} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--error-color)", textDecoration: "underline", fontSize: "12px" }}>Reintentar</button>
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <motion.div className="spinner" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          </div>
        ) : (
          <motion.div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", marginBottom: "20px" }} variants={cv} initial="hidden" animate="visible">
            {weekDays.map((day) => (
              <motion.div key={day.index} variants={iv} onClick={() => setSelectedDay(day.index)}
                style={{ background: day.isToday ? "linear-gradient(135deg, var(--accent-color), var(--accent-hover))" : selectedDay === day.index ? "var(--input-bg-dark)" : "var(--bg-card-dark)", border: `2px solid ${selectedDay === day.index ? "var(--accent-color)" : "var(--border-dark)"}`, borderRadius: "12px", padding: "15px", textAlign: "center", cursor: "pointer", transition: "all 0.3s ease" }}
                whileHover={{ scale: 1.05, borderColor: "var(--accent-color)" }} whileTap={{ scale: 0.98 }}
              >
                <div style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px", color: day.isToday ? "var(--text-on-accent)" : "var(--text-secondary)" }}>{day.dayName.slice(0, 3)}</div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: day.isToday ? "var(--text-on-accent)" : "var(--text-primary)" }}>{day.dayNumber}</div>
                <div style={{ fontSize: "10px", marginTop: "8px", padding: "3px 6px", background: day.isToday ? "rgba(0,0,0,0.2)" : "rgba(251,227,121,0.1)", borderRadius: "6px", color: day.isToday ? "var(--text-on-accent)" : "var(--accent-color)" }}>{day.sessions.length} sesiones</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedDay !== null && selectedDayData && (
          <motion.div className="chart-card" style={{ marginTop: "20px" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <div className="chart-header">
              <h3><FiClock style={{ marginRight: 8 }} />Sesiones del {selectedDayData.dayName} {selectedDayData.dayNumber}</h3>
              <motion.button className="btn-compact-primary" onClick={() => setShowModal(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><FiPlus size={16} /> Nueva Sesión</motion.button>
            </div>

            <div style={{ marginTop: "20px" }}>
              {selectedDayData.sessions.length > 0 ? (
                <motion.div variants={cv} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedDayData.sessions.map((session) => (
                    <motion.div key={session.id_sesion} variants={iv}
                      style={{ background: "var(--input-bg-dark)", border: "1px solid var(--border-dark)", borderLeft: `4px solid ${statusColor(session.status)}`, borderRadius: "12px", padding: "20px", display: "grid", gridTemplateColumns: "80px 1fr auto", gap: "20px", alignItems: "center" }}
                      whileHover={{ borderColor: "var(--accent-color)", transform: "translateX(5px)" }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--accent-color)" }}>{session.time}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>{session.duration}</div>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>{session.client}</h4>
                        <div style={{ display: "flex", gap: "15px", fontSize: "13px", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><FiUser size={14} />{session.type}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>{session.location === "Online" ? <FiVideo size={14} /> : <FiMapPin size={14} />}{session.location}</span>
                          <span style={{ padding: "2px 8px", background: `${statusColor(session.status)}20`, color: statusColor(session.status), borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>{statusLabel(session.status)}</span>
                        </div>
                        {session.notes && <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic", background: "var(--bg-card-dark)", padding: "6px 10px", borderRadius: "6px", borderLeft: "2px solid var(--accent-color)" }}>{session.notes}</div>}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {session.status !== "completed" && session.status !== "cancelled" && (
                          <motion.button className="icon-btn" style={{ background: "rgba(76,217,100,0.1)", color: "var(--success-color)" }} onClick={() => handleStatusUpdate(session.id_sesion, "completed")} disabled={actionLoading === session.id_sesion} title="Completada" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><FiCheck size={18} /></motion.button>
                        )}
                        {session.status !== "cancelled" && (
                          <motion.button className="icon-btn danger" onClick={() => handleStatusUpdate(session.id_sesion, "cancelled")} disabled={actionLoading === session.id_sesion} title="Cancelar" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><FiX size={18} /></motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="empty-state">
                  <FiCalendar size={48} style={{ opacity: 0.3, marginBottom: "15px" }} />
                  <h3>No hay sesiones programadas</h3>
                  <p>Este día está libre. ¿Quieres agregar una nueva sesión?</p>
                  <motion.button className="btn-compact-primary" onClick={() => setShowModal(true)} style={{ marginTop: "15px" }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><FiPlus size={16} /> Nueva Sesión</motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && <NewSessionModal onClose={() => setShowModal(false)} onSaved={fetchSchedule} selectedDayDate={selectedDayData?.date.toISOString().split("T")[0]} members={members} />}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}