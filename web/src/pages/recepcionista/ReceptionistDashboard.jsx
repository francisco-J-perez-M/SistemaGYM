import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FiUserCheck, FiDollarSign, FiClock,
  FiUsers, FiCalendar, FiAlertCircle, FiRefreshCw,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const API = "/api/recepcionista";

const itemVar = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const containerVar = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const MEM_COLOR = {
  "Activa":        "var(--success-color)",
  "Por vencer":    "var(--warning-color)",
  "Vencida":       "var(--error-color)",
  "Sin membresía": "var(--text-secondary)",
};

function KpiCard({ icon: Icon, label, value, detail, accent }) {
  return (
    <motion.div className="stat-card" variants={itemVar}
      style={{ borderLeft: `3px solid ${accent || "var(--accent)"}` }}>
      <div className="stat-header">
        <h3><Icon style={{ marginRight: 8 }} />{label}</h3>
      </div>
      <div className="stat-value" style={{ color: accent || "var(--accent)" }}>
        {value ?? "—"}
      </div>
      {detail && <div className="stat-detail">{detail}</div>}
    </motion.div>
  );
}

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const [user,     setUser]     = useState(null);
  const [stats,    setStats]    = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/", { replace: true }); return; }
    setUser(JSON.parse(stored));
  }, []);

  const token = () => localStorage.getItem("token");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, chkRes] = await Promise.all([
        axios.get(`${API}/dashboard`, { headers: { Authorization: `Bearer ${token()}` } }),
        axios.get(`${API}/checkins`,  { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      setStats(dashRes.data);
      setCheckins(chkRes.data.checkins || []);
    } catch (err) {
      setError("No se pudo cargar la informacion del panel.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <motion.header className="top-header"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="page-title">Panel de Recepcion</h2>
          <div className="header-right">
            <button className="btn-outline-small" onClick={fetchAll} disabled={loading}>
              <FiRefreshCw size={13} style={{ marginRight: 5 }} />Actualizar
            </button>
            <div className="date-display">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </div>
            <div className="user-profile">
              <div className="avatar">
                {user.nombre?.split(" ").map(n => n[0]).join("").slice(0, 2) || "RC"}
              </div>
              <div className="user-info">
                <span className="name">{user.nombre || "Recepcionista"}</span>
                <span className="role">Recepcionista</span>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="dashboard-content">
          {/* Banner */}
          <motion.div className="welcome-section"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="welcome-content">
              <div className="welcome-text">
                <h2>Bienvenida, {user.nombre?.split(" ")[0] || "Recepcionista"}</h2>
                {stats && (
                  <p>
                    {stats.today_checkins} check-ins hoy &bull;{" "}
                    {stats.pending_payments} pagos pendientes &bull;{" "}
                    {stats.expiring_soon} membresias por vencer esta semana
                  </p>
                )}
              </div>
              <FiUserCheck size={48} style={{ color: "var(--accent)", opacity: 0.8 }} />
            </div>
          </motion.div>

          {error && (
            <div style={{
              margin: "16px 0", padding: "12px 16px",
              background: "rgba(239,68,68,0.12)", borderRadius: 8,
              color: "var(--error-color)", display: "flex", gap: 10, alignItems: "center",
            }}>
              <FiAlertCircle /> {error}
            </div>
          )}

          {/* KPIs */}
          <motion.div className="kpi-grid" style={{ marginTop: 24 }}
            variants={containerVar} initial="hidden" animate="visible">
            <KpiCard icon={FiUserCheck}   label="Check-ins Hoy"
              value={loading ? "..." : stats?.today_checkins}
              detail="Desde las 6:00 AM" accent="var(--success-color)" />
            <KpiCard icon={FiDollarSign}  label="Pagos Pendientes"
              value={loading ? "..." : stats?.pending_payments}
              detail="Por procesar" accent="var(--warning-color)" />
            <KpiCard icon={FiUsers}       label="Miembros Activos"
              value={loading ? "..." : stats?.active_members}
              detail="Total en el gimnasio" accent="var(--accent)" />
            <KpiCard icon={FiCalendar}    label="Membresias por Vencer"
              value={loading ? "..." : stats?.expiring_soon}
              detail="Proximos 7 dias" accent="var(--error-color)" />
          </motion.div>

          {/* Check-ins + Acciones rapidas */}
          <div className="charts-row" style={{ marginTop: 24 }}>
            {/* Check-ins */}
            <motion.div className="chart-card"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}>
              <div className="chart-header">
                <h3><FiClock style={{ marginRight: 8 }} />Check-ins Hoy</h3>
                <span className="trend">{checkins.length} registros</span>
              </div>

              {loading ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)" }}>
                  Cargando...
                </div>
              ) : checkins.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)" }}>
                  <FiUserCheck size={36} style={{ opacity: 0.35, marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>Sin check-ins registrados hoy</p>
                </div>
              ) : (
                <div className="exercises-list" style={{ maxHeight: 400, overflowY: "auto" }}>
                  {checkins.map((c, i) => (
                    <motion.div key={c.id} className="exercise-item"
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}>
                      <div className="exercise-checkbox">
                        <div style={{
                          width: 44, height: 44, borderRadius: "50%",
                          background: "var(--accent)", color: "var(--bg-input)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: 13,
                        }}>
                          {c.nombre?.split(" ").map(n => n[0]).join("").slice(0, 2) || "??"}
                        </div>
                      </div>
                      <div className="exercise-details">
                        <span className="exercise-name">{c.nombre}</span>
                        <span className="exercise-sets"
                          style={{ color: MEM_COLOR[c.membership_status] || "var(--text-secondary)" }}>
                          {c.membership_status} &bull; {c.hora_entrada}
                          {c.hora_salida ? ` - ${c.hora_salida}` : ""}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Acciones rapidas */}
            <motion.div className="chart-card"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}>
              <div className="chart-header"><h3>Acciones Rapidas</h3></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "12px 0" }}>
                {[
                  { icon: FiCalendar,    label: "Citas",    path: "/receptionist/appointments", color: "var(--accent)" },
                  { icon: FiUsers,       label: "Miembros", path: "/receptionist/members",      color: "var(--success-color)" },
                  { icon: FiDollarSign,  label: "Pagos",    path: "/receptionist/payments",     color: "var(--warning-color)" },
                  { icon: FiAlertCircle, label: "Tareas",   path: "/receptionist/tasks",        color: "var(--error-color)" },
                ].map((a, i) => (
                  <motion.button key={i} onClick={() => navigate(a.path)}
                    style={{
                      padding: "22px 12px",
                      background: "var(--bg-input-dark)",
                      border: "1px solid var(--border-dark)",
                      borderRadius: 10, cursor: "pointer",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 10,
                    }}
                    whileHover={{ scale: 1.04, borderColor: a.color, boxShadow: `0 0 18px ${a.color}25` }}
                    whileTap={{ scale: 0.97 }}>
                    <a.icon size={22} style={{ color: a.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
