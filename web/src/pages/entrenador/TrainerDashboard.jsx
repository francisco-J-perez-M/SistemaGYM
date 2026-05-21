/**
 * TrainerDashboard.jsx — Landing principal del entrenador.
 * Muestra: KPIs del día/semana, sesiones de hoy, próximas sesiones y accesos rápidos.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers, FiCalendar, FiActivity, FiCheckCircle,
  FiClock, FiChevronRight, FiAlertCircle, FiBookOpen,
  FiBarChart2, FiUser,
} from "react-icons/fi";
import trainerService from "../../services/entrenador/trainerService";
import "../../css/CSSUnificado.css";

/* ── Helpers ── */
const DIAS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function fechaHoy() {
  const d = new Date();
  return `${DIAS_ES[d.getDay()]}, ${d.getDate()} de ${MESES_ES[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_META = {
  scheduled:   { label: "Programada",  color: "#6366f1", bg: "rgba(99,102,241,.12)" },
  "in-progress":{ label: "En curso",   color: "#f59e0b", bg: "rgba(245,158,11,.12)" },
  completed:   { label: "Completada",  color: "#22c55e", bg: "rgba(34,197,94,.12)"  },
  cancelled:   { label: "Cancelada",   color: "#ef4444", bg: "rgba(239,68,68,.12)"  },
};

/* ── KPI Card ── */
function KpiCard({ icon, label, value, sub, accent = "#6366f1" }) {
  return (
    <div className="stat-card" style={{ padding: "20px 22px", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".05em" }}>
          {label}
        </span>
        <div style={{
          width: 34, height: 34, borderRadius: "var(--r-md)",
          background: `${accent}18`, display: "flex", alignItems: "center",
          justifyContent: "center", color: accent, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ── Skeleton ── */
function KpiSkeleton() {
  return (
    <div className="stat-card" style={{ padding: "20px 22px", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="skeleton" style={{ height: 11, width: "55%", borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 8 }} />
      </div>
      <div className="skeleton" style={{ height: 30, width: "40%", borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 10, width: "65%", borderRadius: 6 }} />
    </div>
  );
}

/* ── Fila de sesión ── */
function SessionRow({ s, showDate = false }) {
  const meta = STATUS_META[s.status] || STATUS_META.scheduled;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 0",
      borderBottom: "1px solid var(--border)",
    }}>
      {/* Hora */}
      <div style={{
        minWidth: 52, textAlign: "center",
        background: "var(--bg-input)", borderRadius: 8, padding: "6px 4px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{s.time || "—"}</div>
        {showDate && (
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 1 }}>
            {(s.date || "").slice(5)}
          </div>
        )}
      </div>

      {/* Detalles */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {s.client || "Cliente sin asignar"}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
          {s.type || "Personal"} · {s.duration || "60 min"} · {s.location || "Sin ubicación"}
        </div>
      </div>

      {/* Badge */}
      <span style={{
        padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700,
        background: meta.bg, color: meta.color, whiteSpace: "nowrap", flexShrink: 0,
      }}>
        {meta.label}
      </span>
    </div>
  );
}

/* ── Acceso rápido ── */
function QuickLink({ icon, label, to, color = "#6366f1" }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 8, padding: "18px 12px", borderRadius: "var(--r-md)",
        background: "var(--bg-input)", border: "1px solid var(--border)",
        cursor: "pointer", transition: "border-color .15s, background .15s",
        flex: 1, minWidth: 80,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}10`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-input)"; }}
    >
      <div style={{ color, fontSize: 20 }}>{icon}</div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textAlign: "center" }}>{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════ */
export default function TrainerDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    trainerService.getDashboard()
      .then(d  => setData(d))
      .catch(e => setError(e.message || "Error al cargar el dashboard"))
      .finally(() => setLoading(false));
  }, []);

  /* ── Error ── */
  if (error) {
    return (
      <div className="dashboard-content">
        <div className="empty-state" style={{ padding: "60px 24px" }}>
          <FiAlertCircle size={40} style={{ color: "var(--danger)", marginBottom: 12 }} />
          <h3>No se pudo cargar el dashboard</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>{error}</p>
          <button className="btn-compact-primary" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { stats = {}, today_sessions = [], upcoming_sessions = [], trainer_name = "" } = data || {};
  const firstName = trainer_name.split(" ")[0] || "Entrenador";

  return (
    <div className="dashboard-content">

      {/* ── Encabezado ── */}
      <div className="section-header" style={{ marginBottom: 24, alignItems: "flex-end" }}>
        <div>
          <h2 className="page-title" style={{ marginBottom: 4 }}>
            {loading ? "Cargando..." : `Bienvenido, ${firstName}`}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            {fechaHoy()} · Tu resumen del día
          </p>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", marginBottom: 24 }}>
        {loading ? (
          [0,1,2,3].map(i => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              icon={<FiUsers size={16} />}
              label="Clientes activos"
              value={stats.total_clients ?? "—"}
              sub="Asignados a ti"
              accent="#6366f1"
            />
            <KpiCard
              icon={<FiCalendar size={16} />}
              label="Sesiones hoy"
              value={stats.sessions_today ?? "—"}
              sub={stats.sessions_today === 1 ? "sesión programada" : "sesiones programadas"}
              accent="#f59e0b"
            />
            <KpiCard
              icon={<FiActivity size={16} />}
              label="Esta semana"
              value={stats.sessions_week ?? "—"}
              sub="sesiones en la semana"
              accent="#14b8a6"
            />
            <KpiCard
              icon={<FiCheckCircle size={16} />}
              label="Completadas"
              value={`${stats.completion_rate ?? 0}%`}
              sub="tasa de completación"
              accent="#22c55e"
            />
          </>
        )}
      </div>

      {/* ── Grid inferior: sesiones de hoy + próximas + accesos rápidos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Sesiones de hoy */}
        <div className="stat-card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              <FiClock size={14} style={{ marginRight: 8, verticalAlign: "middle", color: "#f59e0b" }} />
              Sesiones de hoy
            </h3>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 10px",
              borderRadius: 999, background: "rgba(245,158,11,.12)", color: "#f59e0b",
            }}>
              {loading ? "—" : today_sessions.length}
            </span>
          </div>

          {loading ? (
            [0,1,2].map(i => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="skeleton" style={{ width: 52, height: 40, borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 12, width: "70%", borderRadius: 5, marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 10, width: "50%", borderRadius: 5 }} />
                </div>
              </div>
            ))
          ) : today_sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-tertiary)", fontSize: 13 }}>
              No hay sesiones programadas para hoy
            </div>
          ) : (
            today_sessions.map(s => <SessionRow key={s.id_sesion} s={s} />)
          )}
        </div>

        {/* Panel derecho: próximas sesiones + accesos rápidos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Próximas sesiones */}
          <div className="stat-card" style={{ padding: "20px 22px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                <FiCalendar size={14} style={{ marginRight: 8, verticalAlign: "middle", color: "#6366f1" }} />
                Próximas sesiones
              </h3>
            </div>

            {loading ? (
              [0,1].map(i => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div className="skeleton" style={{ width: 52, height: 40, borderRadius: 8 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 12, width: "70%", borderRadius: 5, marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 10, width: "50%", borderRadius: 5 }} />
                  </div>
                </div>
              ))
            ) : upcoming_sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-tertiary)", fontSize: 13 }}>
                No hay sesiones próximas
              </div>
            ) : (
              upcoming_sessions.map(s => <SessionRow key={s.id_sesion} s={s} showDate />)
            )}
          </div>

          {/* Accesos rápidos */}
          <div className="stat-card" style={{ padding: "18px 22px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>
              Accesos rápidos
            </h3>
            <div style={{ display: "flex", gap: 10 }}>
              <QuickLink icon={<FiUsers />}    label="Clientes"  to="/trainer/clients"  color="#6366f1" />
              <QuickLink icon={<FiCalendar />} label="Agenda"    to="/trainer/schedule" color="#f59e0b" />
              <QuickLink icon={<FiBookOpen />} label="Rutinas"   to="/trainer/routines" color="#14b8a6" />
              <QuickLink icon={<FiBarChart2 />}label="Reportes"  to="/trainer/reports"  color="#22c55e" />
              <QuickLink icon={<FiUser />}     label="Perfil"    to="/trainer/profile"  color="#94a3b8" />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
