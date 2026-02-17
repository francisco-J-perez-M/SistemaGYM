import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock, FiCheckCircle, FiXCircle, FiPlay, FiFilter,
  FiUser, FiMapPin, FiFileText, FiAlertCircle, FiRefreshCw,
  FiEdit2, FiTrash2, FiCheck, FiX
} from "react-icons/fi";
import trainerService from "../services/trainerService";
import "../css/CSSUnificado.css";

// ─── Notes Modal ──────────────────────────────────────────────────────────────
function NotesModal({ session, onClose, onSaved }) {
  const [notes, setNotes] = useState(session.notes || "");
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
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
        style={{ background: "var(--bg-card-dark)", border: "1px solid var(--border-dark)", borderRadius: "18px", padding: "28px", width: "100%", maxWidth: "460px" }}
      >
        <h3 style={{ marginBottom: "8px", fontSize: "18px", fontWeight: "700" }}>Editar Notas</h3>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>{session.client} — {session.time}</p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input" rows={5} style={{ resize: "vertical", width: "100%" }} placeholder="Agregar notas de la sesión..." />
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <motion.button onClick={onClose} className="btn-outline-small" style={{ flex: 1, padding: "10px" }} whileTap={{ scale: 0.97 }}>Cancelar</motion.button>
          <motion.button onClick={handleSave} className="btn-compact-primary" style={{ flex: 2, padding: "10px" }} disabled={saving} whileTap={{ scale: 0.97 }}>
            <FiCheck size={14} /> {saving ? "Guardando..." : "Guardar Notas"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ session, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try { await trainerService.deleteSession(session.id_sesion); onDeleted(); onClose(); }
    catch (e) { alert(`Error: ${e.message}`); }
    finally { setDeleting(false); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
        style={{ background: "var(--bg-card-dark)", border: "1px solid var(--error-color)", borderRadius: "18px", padding: "28px", width: "100%", maxWidth: "400px", textAlign: "center" }}
      >
        <FiTrash2 size={40} style={{ color: "var(--error-color)", marginBottom: "16px" }} />
        <h3 style={{ marginBottom: "8px", fontSize: "18px", fontWeight: "700" }}>Eliminar Sesión</h3>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "24px" }}>
          ¿Eliminar la sesión de <strong>{session.client}</strong>? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <motion.button onClick={onClose} className="btn-outline-small" style={{ flex: 1, padding: "10px" }} whileTap={{ scale: 0.97 }}>Cancelar</motion.button>
          <motion.button onClick={handleDelete} disabled={deleting} whileTap={{ scale: 0.97 }}
            style={{ flex: 1, padding: "10px", background: "var(--error-color)", color: "#fff", border: "none", borderRadius: "8px", cursor: deleting ? "not-allowed" : "pointer", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: deleting ? 0.7 : 1 }}>
            <FiTrash2 size={14} /> {deleting ? "Eliminando..." : "Eliminar"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TrainerSessions() {
  const [filterStatus, setFilterStatus]       = useState("all");
  const [dateRange, setDateRange]             = useState("week");
  const [sessions, setSessions]               = useState([]);
  const [stats, setStats]                     = useState({ total: 0, completed: 0, scheduled: 0, cancelled: 0, in_progress: 0, attendance_rate: 0 });
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState("");
  const [actionLoading, setActionLoading]     = useState(null);
  const [editNotesSession, setEditNotesSession] = useState(null);
  const [deleteSession, setDeleteSession]     = useState(null);
  const [total, setTotal]                     = useState(0);
  const [page, setPage]                       = useState(1);
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

  const statusColor = (s) => ({ completed: "var(--success-color)", "in-progress": "var(--accent-color)", scheduled: "#38bdf8", cancelled: "var(--error-color)" }[s] || "var(--text-secondary)");
  const statusText  = (s) => ({ completed: "Completada", "in-progress": "En Curso", scheduled: "Programada", cancelled: "Cancelada" }[s] || s);
  const statusIcon  = (s) => ({ completed: <FiCheckCircle />, "in-progress": <FiPlay />, scheduled: <FiClock />, cancelled: <FiXCircle /> }[s] || <FiClock />);

  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const iv = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  const filterBtns = [
    { value: "all", label: "Todas" },
    { value: "completed", label: "Completadas" },
    { value: "in-progress", label: "En Curso" },
    { value: "scheduled", label: "Programadas" },
    { value: "cancelled", label: "Canceladas" },
  ];
  const rangeBtns = [
    { value: "today", label: "Hoy" },
    { value: "week", label: "Semana" },
    { value: "month", label: "Mes" },
  ];

  return (
    <div className="dashboard-content">
      <motion.div className="welcome-section" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <div className="welcome-content">
          <div className="welcome-text"><h2>Historial de Sesiones</h2><p>Monitorea y gestiona todas tus sesiones de entrenamiento</p></div>
          <FiClock size={50} style={{ color: "var(--accent-color)", opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div className="kpi-grid" style={{ marginTop: "25px", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }} variants={cv} initial="hidden" animate="visible">
        {[
          { title: "Total Sesiones",  value: stats.total,           detail: "Periodo seleccionado", highlight: true },
          { title: "Completadas",     value: stats.completed,       detail: `${stats.total ? Math.round((stats.completed/stats.total)*100) : 0}% del total`, icon: <FiCheckCircle size={16} />, trend: "positive" },
          { title: "Programadas",     value: stats.scheduled,       detail: "Próximas sesiones",    icon: <FiClock size={16} />, trend: "warning" },
          { title: "Canceladas",      value: stats.cancelled,       detail: `${stats.total ? Math.round((stats.cancelled/stats.total)*100) : 0}% del total` },
          { title: "Asistencia",      value: `${stats.attendance_rate}%`, detail: "Tasa de asistencia", highlight: true },
        ].map((kpi, i) => (
          <motion.div key={i} className={`stat-card ${kpi.highlight ? "highlight-border" : ""}`} variants={iv}>
            <div className="stat-header">
              <h3>{kpi.title}</h3>
              {kpi.icon && <span className={`trend ${kpi.trend || ""}`}>{kpi.icon}</span>}
            </div>
            <div className={`stat-value ${kpi.highlight ? "highlight" : ""}`}>{loading ? "—" : kpi.value}</div>
            <div className="stat-detail">{kpi.detail}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div className="chart-card" style={{ marginTop: "25px" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <FiFilter size={16} style={{ color: "var(--text-secondary)" }} />
            <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>Estado:</span>
            {filterBtns.map(f => (
              <motion.button key={f.value} className="btn-outline-small" onClick={() => setFilterStatus(f.value)}
                style={{ background: filterStatus === f.value ? "var(--accent-color)" : "transparent", color: filterStatus === f.value ? "var(--text-on-accent)" : "var(--text-secondary)", borderColor: filterStatus === f.value ? "var(--accent-color)" : "var(--border-dark)" }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{f.label}
              </motion.button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>Periodo:</span>
            {rangeBtns.map(r => (
              <motion.button key={r.value} className="btn-outline-small" onClick={() => setDateRange(r.value)}
                style={{ background: dateRange === r.value ? "var(--accent-color)" : "transparent", color: dateRange === r.value ? "var(--text-on-accent)" : "var(--text-secondary)", borderColor: dateRange === r.value ? "var(--accent-color)" : "var(--border-dark)" }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{r.label}
              </motion.button>
            ))}
          </div>
          <motion.button className="icon-btn" onClick={fetchSessions} style={{ marginLeft: "auto" }} title="Actualizar" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <FiRefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </motion.button>
        </div>
      </motion.div>

      {error && (
        <div style={{ background: "rgba(255,59,48,0.1)", border: "1px solid var(--error-color)", borderRadius: "10px", padding: "14px 18px", marginTop: "16px", color: "var(--error-color)", fontSize: "13px", display: "flex", gap: "10px", alignItems: "center" }}>
          <FiAlertCircle size={16} /> {error}
          <button onClick={fetchSessions} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--error-color)", textDecoration: "underline" }}>Reintentar</button>
        </div>
      )}

      {/* Sessions List */}
      <motion.div className="chart-card" style={{ marginTop: "20px" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="chart-header"><h3>Sesiones ({total})</h3></div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
            <motion.div className="spinner" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          </div>
        ) : (
          <motion.div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }} variants={cv} initial="hidden" animate="visible">
            {sessions.map((session) => (
              <motion.div key={session.id_sesion} variants={iv}
                style={{ background: "var(--input-bg-dark)", border: "1px solid var(--border-dark)", borderLeft: `4px solid ${statusColor(session.status)}`, borderRadius: "12px", padding: "20px", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "20px", alignItems: "center", opacity: session.status === "cancelled" ? 0.6 : 1 }}
                whileHover={{ borderColor: "var(--accent-color)", transform: "translateX(5px)" }}
              >
                {/* Date + icon */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", minWidth: "80px" }}>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--accent-color)" }}>{session.time}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", textAlign: "center" }}>
                    {new Date(session.date + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </div>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: `${statusColor(session.status)}20`, color: statusColor(session.status), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                    {statusIcon(session.status)}
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", textDecoration: session.status === "cancelled" ? "line-through" : "none" }}>{session.client}</h4>
                  <div style={{ display: "flex", gap: "14px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FiUser size={13} />{session.type}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FiClock size={13} />{session.duration}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FiMapPin size={13} />{session.location}</span>
                    {session.exercises > 0 && <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FiFileText size={13} />{session.exercises} ejercicios</span>}
                    {session.attendance && <span style={{ padding: "2px 8px", background: "rgba(76,217,100,0.1)", color: "var(--success-color)", borderRadius: "5px", fontSize: "11px", fontWeight: "600" }}>✓ Asistió</span>}
                  </div>
                  {session.notes && (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic", background: "var(--bg-card-dark)", padding: "8px 12px", borderRadius: "6px", borderLeft: "2px solid var(--accent-color)" }}>{session.notes}</div>
                  )}
                </div>

                {/* Status + actions */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", minWidth: "110px" }}>
                  <div style={{ padding: "5px 12px", background: `${statusColor(session.status)}20`, color: statusColor(session.status), borderRadius: "8px", fontSize: "12px", fontWeight: "600" }}>{statusText(session.status)}</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
                    {session.status === "scheduled" && (
                      <motion.button className="btn-compact-primary" style={{ fontSize: "11px", padding: "5px 10px" }} onClick={() => handleStatusUpdate(session.id_sesion, "in-progress")} disabled={actionLoading === session.id_sesion} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <FiPlay size={11} /> Iniciar
                      </motion.button>
                    )}
                    {session.status === "in-progress" && (
                      <motion.button className="btn-compact-primary" style={{ fontSize: "11px", padding: "5px 10px" }} onClick={() => handleStatusUpdate(session.id_sesion, "completed")} disabled={actionLoading === session.id_sesion} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <FiCheckCircle size={11} /> Finalizar
                      </motion.button>
                    )}
                    <motion.button className="icon-btn" onClick={() => setEditNotesSession(session)} title="Editar notas" style={{ width: "30px", height: "30px" }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><FiEdit2 size={13} /></motion.button>
                    <motion.button className="icon-btn danger" onClick={() => setDeleteSession(session)} title="Eliminar" style={{ width: "30px", height: "30px" }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><FiTrash2 size={13} /></motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && total > perPage && (
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "24px", alignItems: "center" }}>
            <motion.button className="btn-outline-small" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ opacity: page === 1 ? 0.4 : 1 }} whileTap={{ scale: 0.95 }}>Anterior</motion.button>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Página {page} de {Math.ceil(total / perPage)}</span>
            <motion.button className="btn-outline-small" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / perPage)} style={{ opacity: page >= Math.ceil(total / perPage) ? 0.4 : 1 }} whileTap={{ scale: 0.95 }}>Siguiente</motion.button>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="empty-state">
            <FiClock size={48} style={{ opacity: 0.3, marginBottom: "15px" }} />
            <h3>No hay sesiones</h3>
            <p>No se encontraron sesiones con los filtros seleccionados</p>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {editNotesSession && <NotesModal session={editNotesSession} onClose={() => setEditNotesSession(null)} onSaved={fetchSessions} />}
      </AnimatePresence>
      <AnimatePresence>
        {deleteSession && <DeleteModal session={deleteSession} onClose={() => setDeleteSession(null)} onDeleted={fetchSessions} />}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}