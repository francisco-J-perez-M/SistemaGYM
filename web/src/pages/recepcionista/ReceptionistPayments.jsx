import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FiDollarSign, FiSearch, FiRefreshCw,
  FiCheckCircle, FiClock, FiAlertCircle, FiFilter,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const API_URL = "/api";

const STATUS_BADGE = {
  completado: { bg: "rgba(34,197,94,0.15)",  color: "#22c55e" },
  pendiente:  { bg: "rgba(234,179,8,0.15)",  color: "#eab308" },
  fallido:    { bg: "rgba(239,68,68,0.15)",  color: "#ef4444" },
};

function Badge({ status }) {
  const s = STATUS_BADGE[status] || { bg: "rgba(100,116,139,0.15)", color: "#64748b" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: s.bg, color: s.color,
      padding: "3px 9px", borderRadius: "99px", fontSize: "11px", fontWeight: 600,
    }}>
      {status || "—"}
    </span>
  );
}

export default function ReceptionistPayments() {
  const navigate = useNavigate();
  const [payments,  setPayments]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [search,    setSearch]    = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/pagos/historial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data.pagos || res.data || [];
      setPayments(list);
      setFiltered(list);
    } catch (err) {
      setError("No se pudo cargar el historial de pagos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/", { replace: true }); return; }
    fetchPayments();
  }, [fetchPayments, navigate]);

  useEffect(() => {
    let list = payments;
    if (statusFilter !== "todos") list = list.filter(p => p.estado === statusFilter);
    const q = search.toLowerCase();
    if (q) list = list.filter(p =>
      (p.nombre_miembro || "").toLowerCase().includes(q) ||
      (p.concepto || "").toLowerCase().includes(q)
    );
    setFiltered(list);
  }, [search, statusFilter, payments]);

  const total = payments.reduce((s, p) => s + (p.monto || 0), 0);
  const totalCompletados = payments
    .filter(p => p.estado === "completado")
    .reduce((s, p) => s + (p.monto || 0), 0);

  return (
    <div className="dashboard-content">
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Pagos
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Historial y gestión de cobros del gimnasio
          </p>
        </div>
        <motion.button
          onClick={fetchPayments}
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

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: "24px" }}>
        {[
          { label: "Total registrado",  value: `$${total.toLocaleString("es-MX")}`,             color: "var(--accent-soft)", icon: <FiDollarSign /> },
          { label: "Cobrado",           value: `$${totalCompletados.toLocaleString("es-MX")}`,   color: "#22c55e",            icon: <FiCheckCircle /> },
          { label: "Pendientes",        value: payments.filter(p => p.estado === "pendiente").length,  color: "#eab308", icon: <FiClock /> },
          { label: "Fallidos",          value: payments.filter(p => p.estado === "fallido").length,    color: "#ef4444", icon: <FiAlertCircle /> },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label} className="stat-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div className="stat-header">
              <h3>{kpi.label}</h3>
              <div className="card-icon-wrapper" style={{ color: kpi.color }}>{kpi.icon}</div>
            </div>
            <div className="stat-value" style={{ color: kpi.color }}>{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <FiSearch style={{
            position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
            color: "var(--text-secondary)", pointerEvents: "none",
          }} />
          <input
            type="text"
            placeholder="Buscar por miembro o concepto…"
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
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <FiFilter size={14} style={{ color: "var(--text-secondary)" }} />
          {["todos", "completado", "pendiente", "fallido"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "8px 14px", borderRadius: "var(--r-md)", fontSize: "12px",
                fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                background: statusFilter === s ? "var(--accent-dim)" : "transparent",
                border: statusFilter === s ? "1px solid var(--accent)" : "1px solid var(--border)",
                color: statusFilter === s ? "var(--accent-soft)" : "var(--text-secondary)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="chart-card">
        {loading ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "32px" }}>Cargando…</p>
        ) : error ? (
          <p style={{ color: "#ef4444", textAlign: "center", padding: "32px" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "32px" }}>
            No hay pagos que coincidan con los filtros.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Miembro", "Concepto", "Monto", "Fecha", "Estado"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left", fontWeight: 700,
                      color: "var(--text-secondary)", fontSize: "11px",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr
                    key={p._id || p.id || i}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 500 }}>
                      {p.nombre_miembro || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>
                      {p.concepto || p.tipo || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#22c55e", fontWeight: 700 }}>
                      ${(p.monto || 0).toLocaleString("es-MX")}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>
                      {p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString("es-MX") : "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge status={p.estado} />
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
