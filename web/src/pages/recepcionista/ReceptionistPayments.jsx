import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiDollarSign, FiSearch, FiRefreshCw,
  FiCheckCircle, FiClock, FiAlertCircle, FiFilter,
  FiChevronLeft, FiChevronRight,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const API_URL = "/api/recepcionista";
const PAGE_SIZE = 15;

const STATUS_BADGE = {
  completado: { bg: "rgba(34,197,94,0.15)",  color: "#22c55e",  label: "Pagado"    },
  pendiente:  { bg: "rgba(234,179,8,0.15)",  color: "#eab308",  label: "Pendiente" },
  fallido:    { bg: "rgba(239,68,68,0.15)",  color: "#ef4444",  label: "Fallido"   },
};

function Badge({ status }) {
  const s = STATUS_BADGE[status] || { bg: "rgba(100,116,139,0.15)", color: "var(--text-secondary)", label: status || "—" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const btnStyle = (active) => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "32px", height: "32px", borderRadius: "var(--r-sm)",
    border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
    background: active ? "var(--accent-dim)" : "transparent",
    color: active ? "var(--accent-soft)" : "var(--text-secondary)",
    cursor: "pointer", fontSize: "12px", fontWeight: 600,
    transition: "all 0.15s",
  });

  // Rango de páginas a mostrar (max 5 botones)
  let start = Math.max(1, page - 2);
  let end   = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "16px" }}>
      <button style={btnStyle(false)} disabled={page === 1} onClick={() => onPage(page - 1)}>
        <FiChevronLeft size={14} />
      </button>
      {start > 1 && <>
        <button style={btnStyle(page === 1)} onClick={() => onPage(1)}>1</button>
        {start > 2 && <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>…</span>}
      </>}
      {pages.map(p => (
        <button key={p} style={btnStyle(p === page)} onClick={() => onPage(p)}>{p}</button>
      ))}
      {end < totalPages && <>
        {end < totalPages - 1 && <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>…</span>}
        <button style={btnStyle(page === totalPages)} onClick={() => onPage(totalPages)}>{totalPages}</button>
      </>}
      <button style={btnStyle(false)} disabled={page === totalPages} onClick={() => onPage(page + 1)}>
        <FiChevronRight size={14} />
      </button>
    </div>
  );
}

export default function ReceptionistPayments() {
  const navigate = useNavigate();

  // Paginación y filtros server-side
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [search,       setSearch]       = useState("");
  const [searchInput,  setSearchInput]  = useState("");

  // Datos
  const [payments, setPayments] = useState([]);
  const [kpis,     setKpis]     = useState({ total: 0, cobrado: 0, pendientes: 0, fallidos: 0 });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  /* ── Fetch paginado ─────────────────────────────────────────────────────── */
  const fetchPayments = useCallback(async (pg = 1, estado = "todos", q = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pg, limit: PAGE_SIZE };
      if (estado !== "todos") params.estado = estado;
      if (q) params.q = q;

      const res = await axios.get(`${API_URL}/payments`, { headers: hdrs(), params });
      const data = res.data;
      setPayments(data.pagos || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch {
      setError("No se pudo cargar el historial de pagos.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── KPIs via endpoint de agregacion en servidor (eficiente) ────────────── */
  const fetchKpis = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/payments/kpis`, { headers: hdrs() });
      const d = res.data;
      setKpis({
        total:      d.total_monto  || 0,
        cobrado:    d.cobrado      || 0,
        pendientes: d.pendientes   || 0,
        fallidos:   d.fallidos     || 0,
      });
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/", { replace: true }); return; }
    fetchKpis();
  }, [fetchKpis, navigate]);

  useEffect(() => {
    fetchPayments(page, statusFilter, search);
  }, [page, statusFilter, search, fetchPayments]);

  /* ── Cambio de filtro/búsqueda: volver a pág 1 ─────────────────────────── */
  const handleStatusChange = (s) => { setStatusFilter(s); setPage(1); };

  // Debounce de búsqueda (500ms)
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleRefresh = () => { fetchKpis(); fetchPayments(page, statusFilter, search); };

  return (
    <div className="dashboard-content">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Pagos</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Historial y gestión de cobros del gimnasio
          </p>
        </div>
        <motion.button
          onClick={handleRefresh}
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
          { label: "Total registrado", value: `$${kpis.total.toLocaleString("es-MX")}`,    color: "var(--accent-soft)", icon: <FiDollarSign /> },
          { label: "Cobrado",          value: `$${kpis.cobrado.toLocaleString("es-MX")}`,  color: "#22c55e",            icon: <FiCheckCircle /> },
          { label: "Pendientes",       value: kpis.pendientes,                              color: "#eab308",            icon: <FiClock /> },
          { label: "Fallidos",         value: kpis.fallidos,                                color: "#ef4444",            icon: <FiAlertCircle /> },
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
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
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
              onClick={() => handleStatusChange(s)}
              style={{
                padding: "8px 14px", borderRadius: "var(--r-md)", fontSize: "12px",
                fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                background: statusFilter === s ? "var(--accent-dim)" : "transparent",
                border: statusFilter === s ? "1px solid var(--accent)" : "1px solid var(--border)",
                color: statusFilter === s ? "var(--accent-soft)" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              {s === "completado" ? "Completado" : s === "pendiente" ? "Pendiente" : s === "fallido" ? "Fallido" : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="chart-card">
        {loading ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px" }}>Cargando…</p>
        ) : error ? (
          <p style={{ color: "#ef4444", textAlign: "center", padding: "40px" }}>{error}</p>
        ) : payments.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px" }}>
            No hay pagos que coincidan con los filtros.
          </p>
        ) : (
          <>
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
                  <AnimatePresence mode="wait">
                    {payments.map((p, i) => (
                      <motion.tr
                        key={p._id || i}
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
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Footer: total de registros + paginación */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 4px 4px", borderTop: "1px solid var(--border)", marginTop: "8px",
            }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {totalCount} registro{totalCount !== 1 ? "s" : ""} ·{" "}
                página {page} de {totalPages}
              </span>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
