import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FiUsers, FiSearch, FiCheckCircle, FiAlertCircle,
  FiXCircle, FiRefreshCw, FiUser, FiPhone, FiMail,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const API_URL = "/api/recepcionista";

const BADGE_STYLES = {
  activa:     { bg: "rgba(34,197,94,0.15)",  color: "#22c55e", icon: <FiCheckCircle size={12} /> },
  vencida:    { bg: "rgba(239,68,68,0.15)",   color: "#ef4444", icon: <FiXCircle size={12} /> },
  por_vencer: { bg: "rgba(234,179,8,0.15)",   color: "#eab308", icon: <FiAlertCircle size={12} /> },
  sin_membresia: { bg: "rgba(100,116,139,0.15)", color: "#64748b", icon: <FiUser size={12} /> },
};

function StatusBadge({ status }) {
  const s = BADGE_STYLES[status] || BADGE_STYLES.sin_membresia;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: s.bg, color: s.color,
      padding: "3px 9px", borderRadius: "99px", fontSize: "11px", fontWeight: 600,
    }}>
      {s.icon}
      {status?.replace("_", " ") || "—"}
    </span>
  );
}

export default function ReceptionistMembers() {
  const navigate   = useNavigate();
  const [members,  setMembers]  = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data.miembros || res.data || [];
      setMembers(list);
      setFiltered(list);
    } catch (err) {
      setError("No se pudo cargar la lista de miembros.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/", { replace: true }); return; }
    fetchMembers();
  }, [fetchMembers, navigate]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? members.filter(m =>
            (m.nombre || "").toLowerCase().includes(q) ||
            (m.email  || "").toLowerCase().includes(q) ||
            (m.telefono || "").includes(q)
          )
        : members
    );
  }, [search, members]);

  const stats = {
    total:      members.length,
    activos:    members.filter(m => m.mem_status === "activa").length,
    por_vencer: members.filter(m => m.mem_status === "por_vencer").length,
    vencidos:   members.filter(m => m.mem_status === "vencida").length,
  };

  return (
    <div className="dashboard-content">
      {/* ── Header ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Miembros
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Consulta y gestión de membresías — recepción
          </p>
        </div>
        <motion.button
          onClick={fetchMembers}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "9px 16px", background: "var(--accent-dim)",
            border: "1px solid var(--accent)", color: "var(--accent-soft)",
            borderRadius: "var(--r-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600,
          }}
        >
          <FiRefreshCw size={14} /> Actualizar
        </motion.button>
      </motion.div>

      {/* ── KPIs ───────────────────────────────────── */}
      <div className="kpi-grid" style={{ marginBottom: "24px" }}>
        {[
          { label: "Total Miembros", value: stats.total,      color: "var(--accent-soft)", icon: <FiUsers /> },
          { label: "Activos",        value: stats.activos,    color: "#22c55e",            icon: <FiCheckCircle /> },
          { label: "Por Vencer",     value: stats.por_vencer, color: "#eab308",            icon: <FiAlertCircle /> },
          { label: "Vencidos",       value: stats.vencidos,   color: "#ef4444",            icon: <FiXCircle /> },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div className="stat-header">
              <h3>{kpi.label}</h3>
              <div className="card-icon-wrapper" style={{ color: kpi.color }}>
                {kpi.icon}
              </div>
            </div>
            <div className="stat-value" style={{ color: kpi.color }}>{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Search ─────────────────────────────────── */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <FiSearch style={{
          position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
          color: "var(--text-secondary)", pointerEvents: "none",
        }} />
        <input
          type="text"
          placeholder="Buscar por nombre, correo o teléfono…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px 10px 40px",
            background: "var(--bg-input)", border: "1px solid var(--border)",
            borderRadius: "var(--r-md)", color: "var(--text-primary)", fontSize: "13px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* ── Table ──────────────────────────────────── */}
      <div className="chart-card">
        {loading ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "32px" }}>
            Cargando…
          </p>
        ) : error ? (
          <p style={{ color: "#ef4444", textAlign: "center", padding: "32px" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "32px" }}>
            No se encontraron miembros.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Nombre", "Correo", "Teléfono", "Membresía", "Estado"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left", fontWeight: 700,
                      color: "var(--text-secondary)", fontSize: "11px",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <motion.tr
                    key={m._id || m.id || i}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "50%",
                          background: "var(--accent-dim)", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          color: "var(--accent-soft)", fontWeight: 700, fontSize: "12px", flexShrink: 0,
                        }}>
                          {(m.nombre || "?")[0].toUpperCase()}
                        </div>
                        {m.nombre || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiMail size={12} />{m.email || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiPhone size={12} />{m.telefono || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>
                      {m.nombre_membresia || m.tipo_membresia || "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge status={m.mem_status} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
