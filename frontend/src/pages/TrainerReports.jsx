import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart2, FiTrendingUp, FiUsers, FiCalendar,
  FiDollarSign, FiAward, FiDownload, FiFilter,
  FiAlertCircle, FiX, FiLoader, FiRefreshCw,
} from "react-icons/fi";
import trainerService from "../services/trainerService";
import "../css/CSSUnificado.css";

/* ─── helpers ─────────────────────────────────────────────── */
const fadeUp  = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };

function formatMXN(n) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 0 });
}

/* ─── sub-components ────────────────────────────────────────── */

/** KPI card compacta */
function StatCard({ icon, label, value, detail, growth, accentColor }) {
  const isPositive = growth >= 0;
  return (
    <motion.div
      className="stat-card"
      variants={fadeUp}
      style={{ borderTop: `2px solid ${accentColor || "var(--accent)"}` }}
    >
      <div className="stat-header">
        <h3 style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {icon}
          {label}
        </h3>
        {growth !== undefined && (
          <span
            className={`trend ${isPositive ? "positive" : "negative"}`}
          >
            {isPositive ? "+" : ""}{growth}%
          </span>
        )}
      </div>
      <p className="stat-value" style={{ color: accentColor }}>
        {value}
      </p>
      <p className="stat-detail">{detail}</p>
    </motion.div>
  );
}

/** Barra de progreso con nombre y porcentaje */
function ClientProgressBar({ rank, name, sessions, improvement, isTop }) {
  const colorMap = [
    "var(--success)",
    "var(--accent-soft)",
    "var(--warning)",
    "var(--text-secondary)",
    "var(--text-tertiary)",
  ];
  const color = improvement >= 85 ? "var(--success)" : colorMap[rank] || "var(--accent-soft)";

  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--bg-input)",
        borderRadius: "var(--r-md)",
        border: `1px solid ${isTop ? "var(--accent)" : "var(--border)"}`,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 26, height: 26, borderRadius: "50%",
              background: isTop ? "var(--accent)" : "var(--bg-card)",
              color: isTop ? "var(--text-on-accent)" : "var(--text-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 12, flexShrink: 0,
            }}
          >
            {rank + 1}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{name}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{sessions} sesiones completadas</div>
          </div>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color }}>{improvement}%</span>
      </div>

      <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", background: color, borderRadius: 3 }}
          initial={{ width: 0 }}
          animate={{ width: `${improvement}%` }}
          transition={{ delay: 0.5 + rank * 0.08, duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/** Tarjeta de métrica detallada */
function MetricTile({ label, value, trend, color }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, borderColor: color }}
      style={{
        background: "var(--bg-input)",
        padding: 18, borderRadius: "var(--r-md)",
        border: "1px solid var(--border)",
        transition: "border-color .2s, transform .2s",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{trend}</div>
    </motion.div>
  );
}

/** Selector de rango de tiempo */
function RangeSelector({ value, onChange }) {
  const options = [
    { value: "week",    label: "Semana" },
    { value: "month",   label: "Mes" },
    { value: "quarter", label: "Trimestre" },
    { value: "year",    label: "Año" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <FiFilter size={16} style={{ color: "var(--text-secondary)" }} />
      {options.map((o) => (
        <motion.button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="btn-outline-small"
          style={{
            background:  value === o.value ? "var(--accent)"          : "transparent",
            color:       value === o.value ? "var(--text-on-accent)"  : "var(--text-secondary)",
            borderColor: value === o.value ? "var(--accent)"          : "var(--border)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {o.label}
        </motion.button>
      ))}
    </div>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export default function TrainerReports() {
  const [timeRange, setTimeRange] = useState("month");
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await trainerService.getReports(timeRange);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleExport = () => {
    if (!data) return;
    const rows = [
      ["Mes", "Ingresos", "Sesiones", "Clientes"],
      ...(data.monthlyData || []).map((d) => [d.month, d.revenue, d.sessions, d.clients]),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url,
      download: `reporte_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── derived data ── */
  const stats         = data?.stats         || {};
  const growth        = stats.growth        || {};
  const monthlyData   = data?.monthlyData   || [];
  const clientProgress = data?.clientProgress || [];
  const metrics       = data?.metrics       || {};
  const maxRevenue    = Math.max(...monthlyData.map((d) => d.revenue), 1);

  return (
    <div className="dashboard-content">

      {/* ── WELCOME ── */}
      <motion.div
        className="welcome-section"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
      >
        <div className="welcome-content">
          <div className="welcome-text">
            <h2>Reportes y estadísticas</h2>
            <p>Analiza tu desempeño y el progreso de tus clientes</p>
          </div>
          <FiBarChart2 size={46} style={{ color: "var(--accent)", opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* ── ERROR BANNER ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "var(--danger-bg)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--r-md)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "var(--danger)",
          }}
        >
          <FiAlertCircle />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={loadReports}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}
          >
            <FiRefreshCw size={14} /> Reintentar
          </button>
          <button
            onClick={() => setError(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            <FiX />
          </button>
        </motion.div>
      )}

      {/* ── TOOLBAR ── */}
      <motion.div
        className="chart-card"
        style={{ marginTop: 20 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <RangeSelector value={timeRange} onChange={setTimeRange} />
          <motion.button
            className="btn-compact-primary"
            onClick={handleExport}
            disabled={loading || !data}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <FiDownload size={15} /> Exportar CSV
          </motion.button>
        </div>
      </motion.div>

      {/* ── SPINNER ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ display: "inline-block" }}
          >
            <FiLoader size={34} />
          </motion.div>
          <p style={{ marginTop: 14 }}>Cargando estadísticas…</p>
        </div>
      )}

      {/* ── CONTENT ── */}
      {!loading && data && (
        <>
          {/* KPIs */}
          <motion.div
            className="kpi-grid"
            style={{ marginTop: 22 }}
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <StatCard
              icon={<FiDollarSign size={14} />}
              label="Ingresos"
              value={`$${formatMXN(stats.revenue || 0)}`}
              detail="Este período"
              growth={growth.revenue}
              accentColor="var(--success)"
            />
            <StatCard
              icon={<FiCalendar size={14} />}
              label="Sesiones"
              value={stats.sessions || 0}
              detail="Completadas"
              growth={growth.sessions}
              accentColor="var(--accent-soft)"
            />
            <StatCard
              icon={<FiUsers size={14} />}
              label="Clientes"
              value={stats.clients || 0}
              detail="Activos"
              accentColor="var(--text-secondary)"
            />
            <StatCard
              icon={<FiAward size={14} />}
              label="Calificación"
              value={stats.avgRating ? `${stats.avgRating}/5` : "N/A"}
              detail="Promedio general"
              accentColor="var(--warning)"
            />
          </motion.div>

          {/* Gráficas */}
          <div className="charts-row" style={{ marginTop: 20 }}>
            {/* Ingresos */}
            <motion.div
              className="chart-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="chart-header">
                <h3>
                  <FiTrendingUp style={{ marginRight: 7 }} />
                  Evolución de ingresos
                </h3>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="color-box income" />
                    Ingresos mensuales
                  </div>
                </div>
              </div>

              {monthlyData.length > 0 ? (
                <>
                  <div className="css-bar-chart" style={{ height: 200 }}>
                    {monthlyData.map((d, idx) => (
                      <div key={idx} className="bar-group">
                        <motion.div
                          className="bar income"
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.round((d.revenue / maxRevenue) * 100)}%` }}
                          transition={{ delay: 0.35 + idx * 0.07, duration: 0.55 }}
                        >
                          <span className="tooltip">${formatMXN(d.revenue)}</span>
                        </motion.div>
                        <div className="bar-label">{d.month}</div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    {[
                      {
                        label: "Promedio mensual",
                        value: `$${formatMXN(Math.round(monthlyData.reduce((a, d) => a + d.revenue, 0) / monthlyData.length))}`,
                        color: "var(--accent-soft)",
                      },
                      {
                        label: "Crecimiento",
                        value: `${growth.revenue >= 0 ? "+" : ""}${growth.revenue || 0}%`,
                        color: (growth.revenue || 0) >= 0 ? "var(--success)" : "var(--danger)",
                      },
                    ].map((s) => (
                      <div key={s.label} style={{ background: "var(--bg-input)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
                  Sin datos de ingresos para este período
                </div>
              )}
            </motion.div>

            {/* Top clientes */}
            <motion.div
              className="chart-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="chart-header">
                <h3>
                  <FiAward style={{ marginRight: 7 }} />
                  Top clientes por asistencia
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                {clientProgress.length > 0 ? (
                  clientProgress.map((client, idx) => (
                    <ClientProgressBar
                      key={idx}
                      rank={idx}
                      name={client.name}
                      sessions={client.sessions}
                      improvement={client.improvement}
                      isTop={idx === 0}
                    />
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
                    Sin datos de clientes para este período
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Métricas detalladas */}
          <motion.div
            className="chart-card"
            style={{ marginTop: 18 }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="chart-header">
              <h3>Métricas detalladas</h3>
            </div>

            <motion.div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                marginTop: 16,
              }}
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {[
                { label: "Tasa de asistencia", value: `${metrics.attendanceRate || 0}%`,              trend: "Del período actual",         color: "var(--success)"       },
                { label: "Satisfacción",        value: metrics.satisfaction ? `${metrics.satisfaction}/5` : "N/A", trend: "Promedio evaluaciones", color: "var(--accent-soft)"   },
                { label: "Retención",           value: `${metrics.retentionRate || 0}%`,              trend: "Clientes que regresan",     color: "var(--success)"       },
                { label: "Sesiones / cliente",  value: metrics.sessionsPerClient || 0,                trend: "Promedio del período",      color: "var(--accent-soft)"   },
                { label: "Nuevos clientes",     value: metrics.newClients || 0,                       trend: "Este período",              color: "var(--warning)"       },
                {
                  label: "Cancelaciones",
                  value: `${metrics.cancellationRate || 0}%`,
                  trend: "Del total programado",
                  color: (metrics.cancellationRate || 0) > 10 ? "var(--danger)" : "var(--success)",
                },
              ].map((m) => (
                <MetricTile key={m.label} {...m} />
              ))}
            </motion.div>
          </motion.div>

          {/* Tabla resumen mensual */}
          {monthlyData.length > 0 && (
            <motion.div
              className="chart-card"
              style={{ marginTop: 18 }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="chart-header">
                <h3>Resumen mensual</h3>
              </div>

              <div style={{ marginTop: 14, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Mes", "Ingresos", "Sesiones", "Clientes"].map((col) => (
                        <th
                          key={col}
                          style={{
                            textAlign: "left",
                            padding: "9px 14px",
                            borderBottom: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                            fontWeight: 700,
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: ".06em",
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((row, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + idx * 0.04 }}
                        style={{
                          borderBottom: idx < monthlyData.length - 1 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <td style={{ padding: "11px 14px", fontWeight: 600 }}>{row.month}</td>
                        <td style={{ padding: "11px 14px", color: "var(--accent-soft)", fontWeight: 700 }}>
                          ${formatMXN(row.revenue)}
                        </td>
                        <td style={{ padding: "11px 14px" }}>{row.sessions}</td>
                        <td style={{ padding: "11px 14px" }}>{row.clients}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !data && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
          <FiBarChart2 size={44} style={{ opacity: 0.25, marginBottom: 14 }} />
          <h3 style={{ marginBottom: 8 }}>No hay datos disponibles</h3>
          <p>Aún no se han registrado sesiones o pagos en este período.</p>
        </div>
      )}
    </div>
  );
}