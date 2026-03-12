import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import "../css/CSSUnificado.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const COLORS_PIE = ["#fbe379", "#4cd964", "#38bdf8", "#ff6b9d", "#a78bfa"];

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card-dark)",
      border: "1px solid var(--border-dark)",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 13,
    }}>
      <p style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 500 }}>
          {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString("es-MX") : p.value}{suffix}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsMapReduce() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/api/analytics/mapreduce`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="loading-spinner" style={{ height: "60vh" }}>
      <div className="dashboard-spinner" />
      <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>Cargando analytics...</p>
    </div>
  );

  if (error) return (
    <div className="empty-state">
      <h3>Error al cargar datos</h3>
      <p>{error}</p>
    </div>
  );

  // --- Procesamiento de datos del backend ---
  const resumenIngresos = data?.resumen_ingresos || [];
  const ingresosPorPeriodo = data?.ingresos_por_periodo || [];
  const asistenciaMes = data?.asistencia_por_mes || [];
  const asistenciaDia = data?.asistencia_por_dia_semana || [];

  // Mes actual
  const mesActual = resumenIngresos[resumenIngresos.length - 1];
  const mesAnterior = resumenIngresos[resumenIngresos.length - 2];
  const totalMesActual = mesActual?.total || 0;
  const variacion = mesAnterior?.total
    ? (((totalMesActual - mesAnterior.total) / mesAnterior.total) * 100).toFixed(1)
    : null;

  // Día con más asistencia
  const diaTopObj = [...asistenciaDia].sort((a, b) => b.total - a.total)[0];
  const diaTop = diaTopObj?.dia_semana || diaTopObj?.dia || "—";
  const diaTopTotal = diaTopObj?.total || 0;

  // Métodos de pago (agrupar ingresos_por_periodo por metodo_pago)
  const metodosMap = {};
  ingresosPorPeriodo.forEach((item) => {
    const metodo = item.metodo_pago || item.metodo || "Otro";
    metodosMap[metodo] = (metodosMap[metodo] || 0) + (item.total || 0);
  });
  const metodosData = Object.entries(metodosMap).map(([name, value]) => ({ name, value }));

  // Asistencia por día ordenada
  const asistenciaDiaOrdenada = DIAS_SEMANA.map((dia) => {
    const found = asistenciaDia.find(
      (d) => (d.dia_semana || d.dia || "").toLowerCase().includes(dia.toLowerCase().slice(0, 3))
    );
    return { dia, total: found?.total || 0 };
  });

  // Ingresos globales para gráfico de línea
  const lineData = resumenIngresos.map((item) => ({
    mes: item.mes || item.periodo || "",
    total: item.total || 0,
  }));

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Finanzas y Flujo</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Análisis MapReduce · Ingresos y asistencia del gimnasio
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card highlight-border">
          <div className="stat-header">
            <div>
              <h3>Ingresos del mes actual</h3>
              <div className="stat-value highlight">
                ${totalMesActual.toLocaleString("es-MX")}
              </div>
            </div>
            <div className="card-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          {variacion !== null && (
            <span className={`trend ${parseFloat(variacion) >= 0 ? "positive" : "warning"}`}>
              {parseFloat(variacion) >= 0 ? "▲" : "▼"} {Math.abs(variacion)}% vs mes anterior
            </span>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <h3>Mejor día de asistencia</h3>
              <div className="stat-value">{diaTop}</div>
            </div>
            <div className="card-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <span className="stat-detail">{diaTopTotal} asistencias promedio</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <h3>Total acumulado</h3>
              <div className="stat-value">
                ${resumenIngresos.reduce((s, i) => s + (i.total || 0), 0).toLocaleString("es-MX")}
              </div>
            </div>
            <div className="card-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
          </div>
          <span className="stat-detail">{resumenIngresos.length} meses registrados</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <h3>Método principal</h3>
              <div className="stat-value" style={{ fontSize: 18 }}>
                {metodosData[0]?.name || "—"}
              </div>
            </div>
            <div className="card-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
          </div>
          <span className="stat-detail">
            {metodosData[0]
              ? `$${metodosData[0].value.toLocaleString("es-MX")} en pagos`
              : "Sin datos"}
          </span>
        </div>
      </div>

      {/* Gráfico de líneas + Pie */}
      <div className="charts-row" style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <div className="chart-header">
            <h3>Evolución de ingresos</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="color-box income" />
                Ingresos mensuales
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="mes"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip prefix="$" />} />
              <Line
                type="monotone"
                dataKey="total"
                name="Ingresos"
                stroke="var(--accent-color)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--accent-color)", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Métodos de pago</h3>
          </div>
          {metodosData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={metodosData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {metodosData.map((_, i) => (
                      <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`$${v.toLocaleString("es-MX")}`, ""]}
                    contentStyle={{
                      background: "var(--bg-card-dark)",
                      border: "1px solid var(--border-dark)",
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {metodosData.map((m, i) => {
                  const pct = ((m.value / metodosData.reduce((s, x) => s + x.value, 0)) * 100).toFixed(1);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: 2,
                        background: COLORS_PIE[i % COLORS_PIE.length], flexShrink: 0,
                      }} />
                      <span style={{ color: "var(--text-secondary)", flex: 1 }}>{m.name}</span>
                      <span style={{ fontWeight: 600 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", paddingTop: 40 }}>
              Sin datos de métodos de pago
            </p>
          )}
        </div>
      </div>

      {/* Asistencia por día y por mes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="chart-card">
          <div className="chart-header">
            <h3>Asistencia por día de la semana</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={asistenciaDiaOrdenada}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="dia"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip suffix=" visitas" />} />
              <Bar dataKey="total" name="Asistencias" radius={[0, 4, 4, 0]}>
                {asistenciaDiaOrdenada.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.dia === diaTop ? "var(--accent-color)" : "rgba(251,227,121,0.2)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Asistencia por mes</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={asistenciaMes}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="mes"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip suffix=" visitas" />} />
              <Bar dataKey="total" name="Asistencias" fill="rgba(251,227,121,0.3)" radius={[4, 4, 0, 0]}>
                {(asistenciaMes).map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === asistenciaMes.length - 1 ? "var(--accent-color)" : "rgba(251,227,121,0.25)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}