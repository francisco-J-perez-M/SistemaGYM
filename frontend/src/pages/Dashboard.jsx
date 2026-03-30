import { useState, useEffect } from "react";
import "../css/CSSUnificado.css";

import { getDashboardKPIs } from "../api/dashboard";
import { getMembresiasPorExpirar } from "../api/miembroMembresias";

/* ─── helpers ─────────────────────────────────────────────── */
function getLast6MonthsLabels() {
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const cur = new Date().getMonth();
  return Array.from({ length: 6 }, (_, i) => months[(cur - 5 + i + 12) % 12]);
}

/* ─── sub-components ────────────────────────────────────────── */

/** Tarjeta KPI con barra de progreso opcional */
function KpiCard({ label, value, meta, badge, badgeType = "positive", accentColor, progress }) {
  const colors = {
    positive: { bg: "var(--success-bg)", text: "var(--success)" },
    warning:  { bg: "var(--warning-bg)", text: "var(--warning)" },
    negative: { bg: "var(--danger-bg)",  text: "var(--danger)"  },
    info:     { bg: "var(--accent-dim)", text: "var(--accent-soft)" },
  };
  const bc = colors[badgeType] || colors.positive;

  return (
    <div
      className="stat-card"
      style={{ borderTop: `2px solid ${accentColor || "var(--accent)"}` }}
    >
      <div className="stat-header">
        <h3>{label}</h3>
        {badge && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 9px",
              borderRadius: "var(--r-full)",
              fontSize: 11,
              fontWeight: 700,
              background: bc.bg,
              color: bc.text,
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <p className="stat-value" style={{ color: accentColor }}>
        {value}
      </p>

      {meta && <p className="stat-detail">{meta}</p>}

      {progress !== undefined && (
        <>
          <div
            style={{
              height: 4,
              background: "var(--border)",
              borderRadius: 2,
              overflow: "hidden",
              marginTop: 6,
            }}
          >
            <div
              style={{
                width: `${Math.min(progress, 100)}%`,
                height: "100%",
                background: accentColor || "var(--accent)",
                borderRadius: 2,
                transition: "width 1.2s var(--ease)",
              }}
            />
          </div>
          <p className="stat-detail" style={{ textAlign: "right", marginTop: 2 }}>
            {progress}%
          </p>
        </>
      )}
    </div>
  );
}

/** Anillo SVG de retención */
function RetentionRing({ retention, churn }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const filled = (retention / 100) * circ;

  return (
    <div className="stat-card" style={{ borderTop: "2px solid var(--warning)" }}>
      <div className="stat-header">
        <h3>Retención de clientes</h3>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 9px",
            borderRadius: "var(--r-full)",
            fontSize: 11,
            fontWeight: 700,
            background: "var(--success-bg)",
            color: "var(--success)",
          }}
        >
          +2.4%
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 8 }}>
        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r={r}
              fill="none"
              stroke="var(--border)"
              strokeWidth="8"
            />
            <circle
              cx="40" cy="40" r={r}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="8"
              strokeDasharray={`${filled} ${circ}`}
              strokeDashoffset={circ / 4}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s var(--ease)" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 10,
              background: "var(--bg-card)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              {retention}%
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: `Renuevan (${retention}%)`, color: "var(--accent)" },
            { label: `Se van (${churn}%)`,       color: "var(--border)" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: item.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Gráfica de barras CSS (ingresos vs gastos) */
function RevenueChart({ revenues, expenses, labels }) {
  const max = Math.max(...revenues, 1);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Ingresos vs. Gastos — últimos 6 meses</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="color-box income" />
            Ingresos
          </div>
          <div className="legend-item">
            <span className="color-box expense" />
            Gastos
          </div>
        </div>
      </div>

      <div className="css-bar-chart">
        {revenues.map((rev, i) => {
          const rh = Math.round((rev / max) * 100);
          const eh = expenses[i] || 0;
          return (
            <div key={i} className="bar-group">
              <div className="bar income" style={{ height: `${rh}%` }}>
                <span className="tooltip">${rev.toLocaleString()}</span>
              </div>
              <div className="bar expense" style={{ height: `${eh}%` }}>
                <span className="tooltip">Gastos estimados</span>
              </div>
              <span className="bar-label">{labels[i]}</span>
            </div>
          );
        })}
      </div>

      {/* Resumen debajo del gráfico */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 0 0",
          borderTop: "1px solid var(--border)",
          marginTop: 8,
        }}
      >
        <div>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>
            Promedio mensual
          </p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-soft)" }}>
            ${Math.round(revenues.reduce((a, v) => a + v, 0) / revenues.length).toLocaleString()}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>
            Mejor mes
          </p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--success)" }}>
            ${Math.max(...revenues).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Gráfica de horas pico */
function PeakHoursChart({ data }) {
  const max = Math.max(...data, 1);
  const labels = Array.from({ length: data.length }, (_, i) => `${6 + i * 2}h`);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Horas pico del día</h3>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          height: 130,
          paddingTop: 8,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {data.map((h, i) => {
          const pct = Math.round((h / max) * 100);
          const isPeak = h === max;
          return (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 3, height: "100%", justifyContent: "flex-end" }}
            >
              <div
                title={`${h}% — ${labels[i]}`}
                style={{
                  width: "100%",
                  height: `${pct}%`,
                  background: isPeak ? "var(--accent)" : "var(--text-tertiary)",
                  opacity: isPeak ? 1 : 0.45,
                  borderRadius: "3px 3px 0 0",
                  cursor: "pointer",
                  transition: "opacity .2s",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Etiquetas debajo */}
      <div style={{ display: "flex", gap: 4, paddingTop: 4 }}>
        {labels.map((l, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "var(--text-tertiary)" }}>
            {l}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 10,
          padding: "8px 12px",
          background: "var(--bg-input)",
          borderRadius: "var(--r-md)",
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        Pico máximo:{" "}
        <strong style={{ color: "var(--text-primary)" }}>18:00 – 20:00</strong>
      </div>
    </div>
  );
}

/** Tabla de membresías por vencer */
function ExpiringTable({ members }) {
  // Normaliza: acepta array directo, { data: [] }, o undefined/null
  const rows = Array.isArray(members)
    ? members
    : Array.isArray(members?.data)
    ? members.data
    : [];

  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <p> No hay membresías por vencer en los próximos 7 días.</p>
      </div>
    );
  }

  return (
    <div className="custom-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Miembro</th>
            <th>Plan</th>
            <th>Fecha vencimiento</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id}>
              <td className="font-bold">{m.miembro}</td>
              <td>{m.plan}</td>
              <td>{m.fecha_fin}</td>
              <td>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 10px",
                    borderRadius: "var(--r-full)",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    background: m.status === "urgent" ? "var(--danger-bg)"  : "var(--warning-bg)",
                    color:      m.status === "urgent" ? "var(--danger)"     : "var(--warning)",
                  }}
                >
                  {m.status === "urgent" ? "Crítico" : "Pendiente"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user")) || { nombre: "Admin" };

  const [adminData, setAdminData] = useState({
    retention: 87,
    churn: 13,
    activeMembers: 0,
    monthlyRevenue: 0,
    revenueGoal: 50000,
    expiringMembers: [],
    kpiRevenue: [],
    kpiExpenses: [20, 25, 22, 30, 28, 35],
    peakHours: [10, 30, 80, 50, 20, 40, 90, 100, 60, 20],
  });

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      window.location.href = "/";
      return;
    }
    (async () => {
      try {
        const [kpiRes, expiringRes] = await Promise.all([
          getDashboardKPIs(),
          getMembresiasPorExpirar(7),
        ]);
        // Normaliza la respuesta: puede llegar como array directo o { data: [] }
        const rawExpiring = expiringRes?.data ?? expiringRes;
        const safeExpiring = Array.isArray(rawExpiring) ? rawExpiring : [];

        const rawRevenue = kpiRes?.revenue_6_months ?? [];
        const safeRevenue = Array.isArray(rawRevenue) ? rawRevenue : [];

        setAdminData((prev) => ({
          ...prev,
          activeMembers:   kpiRes?.active_members  ?? prev.activeMembers,
          monthlyRevenue:  kpiRes?.monthly_revenue ?? prev.monthlyRevenue,
          kpiRevenue:      safeRevenue,
          expiringMembers: safeExpiring,
        }));
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const monthLabels  = getLast6MonthsLabels();
  const revenueGoalPct = Math.round((adminData.monthlyRevenue / adminData.revenueGoal) * 100);

  const initials = user.nombre
    ? user.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2)
    : "A";

  return (
    <>
      {/* ── HEADER ── */}
      <header className="top-header">
        <h2 className="page-title">Panel Administrativo</h2>
        <div className="header-right">
          <div className="date-display">
            {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
          </div>
          <div className="user-profile">
            <div className="avatar">{initials}</div>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="dashboard-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="dashboard-spinner" />
            <p>Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* ── KPIs ── */}
            <div className="kpi-grid">
              <RetentionRing
                retention={adminData.retention}
                churn={adminData.churn}
              />

              <KpiCard
                label="Ingresos mes actual"
                value={`$${adminData.monthlyRevenue.toLocaleString()}`}
                meta={`Meta: $${adminData.revenueGoal.toLocaleString()}`}
                badge={`${revenueGoalPct}% meta`}
                badgeType={revenueGoalPct >= 90 ? "positive" : revenueGoalPct >= 70 ? "warning" : "negative"}
                accentColor="var(--success)"
                progress={revenueGoalPct}
              />

              <KpiCard
                label="Miembros activos"
                value={adminData.activeMembers.toLocaleString()}
                meta="Con membresía vigente"
                badge="↑ 12%"
                badgeType="positive"
                accentColor="var(--accent-soft)"
              />

              <KpiCard
                label="Ocupación promedio"
                value="74%"
                meta="Basado en última semana"
                badge="↔ estable"
                badgeType="warning"
                accentColor="var(--warning)"
              />
            </div>

            {/* ── GRÁFICAS ── */}
            <div className="charts-row" style={{ marginTop: 18 }}>
              {adminData.kpiRevenue.length > 0 ? (
                <RevenueChart
                  revenues={adminData.kpiRevenue}
                  expenses={adminData.kpiExpenses.map((e) => e)}
                  labels={monthLabels}
                />
              ) : (
                <div className="chart-card">
                  <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px 0" }}>
                    Sin datos de ingresos disponibles.
                  </p>
                </div>
              )}

              <PeakHoursChart data={adminData.peakHours} />
            </div>

            {/* ── TABLA ── */}
            <div className="table-section" style={{ marginTop: 18 }}>
              <div className="section-header">
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>
                  Membresías próximas a vencer
                </h3>
                <span className="total-count">
                  {adminData.expiringMembers.length} membresía(s)
                </span>
              </div>
              <ExpiringTable members={adminData.expiringMembers} />
            </div>
          </>
        )}
      </main>
    </>
  );
}