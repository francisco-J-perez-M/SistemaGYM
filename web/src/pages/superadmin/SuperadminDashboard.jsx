import { useState, useEffect } from "react";
import {
  getAnalyticsPlataforma,
  getChurnGimnasios,
  getGimnasios,
  getSuscripciones,
} from "../../api/superadmin";

const fmt  = (n) => Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 0 });
const fmtM = (n) => "$" + fmt(n);

const card = (extra = {}) => ({
  background: "var(--bg-card, #1a1d2e)",
  border: "1px solid var(--border, rgba(255,255,255,.08))",
  borderRadius: 14,
  padding: "20px 22px",
  ...extra,
});

const badge = (type = "pos") => {
  const map = {
    pos:  { bg: "rgba(16,185,129,.15)",  color: "#10b981" },
    warn: { bg: "rgba(234,179,8,.15)",   color: "#eab308" },
    neg:  { bg: "rgba(239,68,68,.15)",   color: "#ef4444" },
    info: { bg: "rgba(99,102,241,.15)",  color: "#818cf8" },
    purple:{ bg: "rgba(168,85,247,.15)", color: "#a855f7" },
  };
  const c = map[type] || map.pos;
  return {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700,
    background: c.bg, color: c.color,
  };
};

function KpiCard({ label, value, meta, badgeText, badgeType, top, icon }) {
  return (
    <div style={{ ...card(), borderTop: `3px solid ${top || "var(--accent, #6366f1)"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", letterSpacing: ".06em" }}>
          {label}
        </span>
        {badgeText && <span style={badge(badgeType || "info")}>{badgeText}</span>}
        {icon && !badgeText && <span style={{ fontSize: 22, opacity: .5 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary, #f1f5f9)", letterSpacing: "-.02em", margin: "4px 0" }}>
        {value}
      </div>
      {meta && <p style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)", marginTop: 2 }}>{meta}</p>}
    </div>
  );
}

function ChurnRow({ gym }) {
  const colorMap = { ALTO: "#ef4444", MEDIO: "#eab308" };
  const c = colorMap[gym.nivel_riesgo] || "#94a3b8";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,.03)", marginBottom: 4 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary, #f1f5f9)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {gym.gimnasio}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)" }}>
          {gym.plan} · {gym.estado_sub}
          {gym.dias_inactivo != null && ` · ${gym.dias_inactivo}d sin actividad`}
        </p>
      </div>
      <span style={{ ...badge(gym.nivel_riesgo === "ALTO" ? "neg" : "warn"), flexShrink: 0 }}>
        {gym.nivel_riesgo}
      </span>
    </div>
  );
}

function GymRow({ gym }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,.03)", marginBottom: 4 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-dim, rgba(99,102,241,.18))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15, fontWeight: 700, color: "var(--accent, #6366f1)" }}>
        {(gym.nombre || "G").charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary, #f1f5f9)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {gym.nombre}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)" }}>
          {gym.plan} · {gym.total_miembros ?? "—"} miembros
        </p>
      </div>
      <span style={{ ...badge(gym.activo ? "pos" : "neg"), flexShrink: 0 }}>
        {gym.activo ? "Activo" : "Inactivo"}
      </span>
    </div>
  );
}

export default function SuperadminDashboard() {
  const [analytics,  setAnalytics]  = useState(null);
  const [churn,      setChurn]      = useState(null);
  const [gymsTotal,  setGymsTotal]  = useState(null);
  const [subsTotal,  setSubsTotal]  = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getAnalyticsPlataforma(),
      getChurnGimnasios(),
      getGimnasios({ per_page: 5 }),
      getSuscripciones({ per_page: 1 }),
    ]).then(([a, c, g, s]) => {
      if (a.status === "fulfilled") setAnalytics(a.value.data);
      if (c.status === "fulfilled") setChurn(c.value.data);
      if (g.status === "fulfilled") setGymsTotal(g.value.data);
      if (s.status === "fulfilled") setSubsTotal(s.value.data);
    }).finally(() => setLoading(false));
  }, []);

  const resumen = analytics?.resumen_por_gimnasio || [];
  const totalIngresos  = resumen.reduce((acc, g) => acc + (g.ingresos_totales || 0), 0);
  const totalMiembros  = resumen.reduce((acc, g) => acc + (g.total_miembros  || 0), 0);
  const totalActivos   = resumen.reduce((acc, g) => acc + (g.miembros_activos|| 0), 0);

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "var(--bg-dark, #0f1117)", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary, #f1f5f9)", marginBottom: 4 }}>
          Panel de Plataforma
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary, #94a3b8)" }}>
          Visión global de todos los gimnasios registrados en GymPro
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text-secondary, #94a3b8)", fontSize: 15 }}>
          Cargando métricas de plataforma…
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <KpiCard
              label="Ingresos Totales"
              value={fmtM(totalIngresos)}
              meta="Suma histórica de todos los gimnasios"
              top="#10b981"
              badgeText="Plataforma" badgeType="pos"
            />
            <KpiCard
              label="Gimnasios"
              value={fmt(gymsTotal?.total || resumen.length)}
              meta={`${gymsTotal?.activos ?? gymsTotal?.total ?? "—"} activos`}
              top="#6366f1"
              badgeText="Registrados" badgeType="info"
            />
            <KpiCard
              label="Miembros Totales"
              value={fmt(totalMiembros)}
              meta={`${fmt(totalActivos)} activos`}
              top="#a855f7"
              badgeText="Plataforma" badgeType="purple"
            />
            <KpiCard
              label="Suscripciones"
              value={fmt(subsTotal?.total || "—")}
              meta="Planes activos de gimnasios"
              top="#eab308"
              badgeText="SaaS" badgeType="warn"
            />
            <KpiCard
              label="Riesgo de Churn"
              value={fmt(churn?.total_riesgo ?? "—")}
              meta="Gimnasios en estado crítico"
              top="#ef4444"
              badgeText="Alerta" badgeType="neg"
            />
          </div>

          {/* Two-column section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* Top gyms by revenue */}
            <div style={card()}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)", marginBottom: 16, letterSpacing: ".03em" }}>
                Top Gimnasios por Ingresos
              </h3>
              {resumen.slice(0, 5).map((g, i) => (
                <GymRow key={g.id_gimnasio || i} gym={g} />
              ))}
              {resumen.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)", textAlign: "center", padding: "20px 0" }}>
                  Sin datos de Spark disponibles
                </p>
              )}
            </div>

            {/* Churn risk */}
            <div style={card()}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)", marginBottom: 16, letterSpacing: ".03em" }}>
                Gimnasios en Riesgo de Churn
              </h3>
              {(churn?.gimnasios_riesgo || []).slice(0, 6).map((g, i) => (
                <ChurnRow key={g.gym_id || i} gym={g} />
              ))}
              {!churn?.gimnasios_riesgo?.length && (
                <p style={{ fontSize: 13, color: "#10b981", textAlign: "center", padding: "20px 0" }}>
                  ✓ Sin gimnasios en riesgo
                </p>
              )}
            </div>
          </div>

          {/* Ingresos por plan */}
          <div style={card()}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)", marginBottom: 16, letterSpacing: ".03em" }}>
              Resumen por Gimnasio
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Gimnasio", "Plan", "Ingresos", "Transacciones", "Ticket Prom.", "Miembros", "Activos", "Estado"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-secondary, #94a3b8)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border, rgba(255,255,255,.08))", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resumen.map((g, i) => (
                    <tr key={g.id_gimnasio || i} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
                      <td style={{ padding: "10px 12px", color: "var(--text-primary, #f1f5f9)", fontWeight: 600 }}>{g.gimnasio || "—"}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text-secondary, #94a3b8)" }}>{g.plan || "—"}</td>
                      <td style={{ padding: "10px 12px", color: "#10b981", fontWeight: 700 }}>{fmtM(g.ingresos_totales)}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text-secondary, #94a3b8)" }}>{fmt(g.total_transacciones)}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text-secondary, #94a3b8)" }}>{fmtM(g.ticket_promedio)}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text-secondary, #94a3b8)" }}>{fmt(g.total_miembros)}</td>
                      <td style={{ padding: "10px 12px", color: "#818cf8" }}>{fmt(g.miembros_activos)}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={badge(g.activo ? "pos" : "neg")}>{g.activo ? "Activo" : "Inactivo"}</span>
                      </td>
                    </tr>
                  ))}
                  {resumen.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary, #94a3b8)" }}>
                        Ejecuta Spark analytics para ver datos aquí
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {analytics?.desde_cache && (
              <p style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", marginTop: 12, textAlign: "right" }}>
                Datos desde caché · Ejecutado: {new Date(analytics.ejecutado_en).toLocaleString("es-MX")}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
