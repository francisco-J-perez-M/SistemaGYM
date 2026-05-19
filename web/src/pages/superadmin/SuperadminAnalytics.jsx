import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  getAnalyticsPlataforma,
  refreshAnalytics,
  getProyeccion,
  getChurnGimnasios,
  getCrecimiento,
} from "../../api/superadmin";

const card = (extra = {}) => ({
  background: "var(--bg-card, #1a1d2e)",
  border: "1px solid var(--border, rgba(255,255,255,.08))",
  borderRadius: 14,
  padding: "20px 22px",
  ...extra,
});

const badge = (type = "pos") => {
  const map = {
    pos:    { bg: "rgba(16,185,129,.15)",  color: "#10b981" },
    neg:    { bg: "rgba(239,68,68,.15)",   color: "#ef4444" },
    info:   { bg: "rgba(99,102,241,.15)",  color: "#818cf8" },
    warn:   { bg: "rgba(234,179,8,.15)",   color: "#eab308" },
    cache:  { bg: "rgba(100,116,139,.15)", color: "#94a3b8" },
  };
  const c = map[type] || map.info;
  return { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color };
};

const btnStyle = (variant = "primary", extra = {}) => {
  const v = {
    primary: { background: "var(--accent, #6366f1)", color: "#fff" },
    ghost:   { background: "rgba(255,255,255,.06)",  color: "var(--text-secondary, #94a3b8)" },
    warn:    { background: "rgba(234,179,8,.1)",     color: "#eab308" },
    neg:     { background: "rgba(239,68,68,.1)",     color: "#ef4444" },
  };
  return { border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .15s", ...(v[variant] || v.primary), ...extra };
};

// ── Mini Bar Chart ──────────────────────────────────────────────
function MiniBarChart({ data, valueKey, labelKey, color = "#6366f1", height = 140 }) {
  if (!data?.length) return <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)", padding: "20px 0" }}>Sin datos</p>;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, overflowX: "auto", paddingBottom: 4 }}>
      {data.map((d, i) => {
        const h = Math.max(2, ((d[valueKey] || 0) / max) * (height - 24));
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
            <div
              title={`${d[labelKey]}: ${d[valueKey]}`}
              style={{ width: 22, height: h, background: color, borderRadius: "4px 4px 0 0", opacity: .85 }}
            />
            <span style={{ fontSize: 9, color: "var(--text-secondary, #94a3b8)", transform: "rotate(-40deg)", transformOrigin: "top center", whiteSpace: "nowrap" }}>
              {String(d[labelKey] || "").slice(-5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Line Chart SVG ─────────────────────────────────────────────
function LineChart({ hist, proj, height = 160 }) {
  if (!hist?.length) return <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)", padding: "20px 0" }}>Sin datos</p>;
  const all  = [...(hist || []), ...(proj || [])];
  const vals = all.map(d => d.ingresos ?? d.proyectado ?? 0);
  const max  = Math.max(...vals, 1);
  const W = 520, H = height, PAD = 20;
  const pts = (arr, key) => arr.map((d, i) => {
    const x = PAD + (i / (all.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d[key] || 0) / max) * (H - PAD * 2);
    return `${x},${y}`;
  });
  const histPts = pts(hist, "ingresos");
  const projStartX = PAD + ((hist.length - 1) / (all.length - 1)) * (W - PAD * 2);
  const projPts = hist.length > 0
    ? [`${projStartX},${H - PAD - ((hist.at(-1)?.ingresos || 0) / max) * (H - PAD * 2)}`, ...pts(proj, "proyectado")]
    : pts(proj, "proyectado");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <polyline points={histPts.join(" ")} fill="none" stroke="#6366f1" strokeWidth="2.5" />
      {proj?.length > 0 && <polyline points={projPts.join(" ")} fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="6,3" />}
    </svg>
  );
}

export default function SuperadminAnalytics() {
  const [tab,        setTab]        = useState("plataforma");
  const [plat,       setPlat]       = useState(null);
  const [proyeccion, setProyeccion] = useState(null);
  const [churn,      setChurn]      = useState(null);
  const [crec,       setCrec]       = useState(null);
  const [loadingPlat, setLoadingPlat] = useState(false);
  const [loadingProy, setLoadingProy] = useState(false);
  const [loadingChurn,setLoadingChurn]= useState(false);
  const [loadingCrec, setLoadingCrec] = useState(false);

  const loadPlat = (force = false) => {
    setLoadingPlat(true);
    const fn = force ? refreshAnalytics : getAnalyticsPlataforma;
    fn().then(r => setPlat(r.data)).catch(() => {}).finally(() => setLoadingPlat(false));
  };
  const loadProy  = () => { setLoadingProy(true);  getProyeccion().then(r => setProyeccion(r.data)).catch(() => {}).finally(() => setLoadingProy(false)); };
  const loadChurn = () => { setLoadingChurn(true); getChurnGimnasios().then(r => setChurn(r.data)).catch(() => {}).finally(() => setLoadingChurn(false)); };
  const loadCrec  = () => { setLoadingCrec(true);  getCrecimiento().then(r => setCrec(r.data)).catch(() => {}).finally(() => setLoadingCrec(false)); };

  useEffect(() => {
    loadPlat();
    loadProy();
    loadChurn();
    loadCrec();
  }, []);

  const handleRefresh = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Forzar recálculo?",
      text: "Ejecutará Spark sobre todos los datos de la plataforma. Puede tardar varios segundos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Recalcular",
      confirmButtonColor: "#6366f1",
      cancelButtonText: "Cancelar",
      background: "var(--bg-card, #1e2233)",
      color: "var(--text-primary, #f1f5f9)",
    });
    if (isConfirmed) loadPlat(true);
  };

  const TABS = [
    { id: "plataforma", label: "Resumen Plataforma" },
    { id: "proyeccion",  label: "Proyección"         },
    { id: "churn",       label: "Churn SaaS"          },
    { id: "crecimiento", label: "Crecimiento"         },
  ];

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "var(--bg-dark, #0f1117)", fontFamily: "inherit" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary, #f1f5f9)", marginBottom: 4 }}>Analytics de Plataforma</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary, #94a3b8)" }}>Motor Spark — agregación multi-gimnasio</p>
        </div>
        <button style={btnStyle("warn")} onClick={handleRefresh} disabled={loadingPlat}>
          {loadingPlat ? "⏳ Calculando…" : "↺ Recalcular Spark"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-card, #1a1d2e)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            style={{ border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", background: tab === t.id ? "var(--accent, #6366f1)" : "transparent", color: tab === t.id ? "#fff" : "var(--text-secondary, #94a3b8)", transition: "all .15s" }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Plataforma tab ── */}
      {tab === "plataforma" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {plat?.desde_cache && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <span style={badge("cache")}>Desde caché · {new Date(plat.ejecutado_en).toLocaleString("es-MX")}</span>
            </div>
          )}

          {/* Ingresos por periodo/gym heatmap */}
          <div style={card()}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)", marginBottom: 16 }}>
              Ingresos Mensuales por Gimnasio
            </h3>
            {loadingPlat ? (
              <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)" }}>Calculando con Spark…</p>
            ) : (
              <PlatformTable data={plat?.ingresos_por_periodo_gym || []} />
            )}
          </div>

          {/* Resumen */}
          <div style={card()}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)", marginBottom: 16 }}>Resumen Acumulado</h3>
            {loadingPlat ? <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)" }}>Calculando…</p> : (
              <SummaryTable data={plat?.resumen_por_gimnasio || []} />
            )}
          </div>
        </div>
      )}

      {/* ── Proyección tab ── */}
      {tab === "proyeccion" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={card()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)" }}>Proyección de Ingresos (6 meses)</h3>
              {proyeccion && <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                <span style={{ color: "var(--text-secondary, #94a3b8)" }}>R²: <b style={{ color: "#818cf8" }}>{proyeccion.r2}</b></span>
                <span style={{ color: "var(--text-secondary, #94a3b8)" }}>RMSE: <b style={{ color: "#818cf8" }}>{proyeccion.rmse?.toLocaleString()}</b></span>
              </div>}
            </div>
            {loadingProy ? <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)" }}>Calculando regresión lineal…</p>
            : proyeccion?.error ? <p style={{ fontSize: 13, color: "#ef4444" }}>{proyeccion.error}</p>
            : (
              <>
                <LineChart hist={proyeccion?.datos_historicos} proj={proyeccion?.proyeccion_6m} height={160} />
                <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary, #94a3b8)" }}><span style={{ width: 20, height: 2, background: "#6366f1", display: "inline-block" }} /> Histórico</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary, #94a3b8)" }}><span style={{ width: 20, height: 2, background: "#a855f7", display: "inline-block", borderTop: "2px dashed #a855f7", borderBottom: "none", marginTop: 0 }} /> Proyectado</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginTop: 16 }}>
                  {(proyeccion?.proyeccion_6m || []).map(p => (
                    <div key={p.periodo} style={{ background: "rgba(168,85,247,.08)", border: "1px solid rgba(168,85,247,.2)", borderRadius: 8, padding: "10px 14px" }}>
                      <p style={{ fontSize: 11, color: "#a855f7", marginBottom: 4 }}>{p.periodo}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary, #f1f5f9)" }}>${p.proyectado?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Churn tab ── */}
      {tab === "churn" && (
        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)" }}>
              Gimnasios en Riesgo de Churn ({churn?.total_riesgo ?? "—"})
            </h3>
            <button style={btnStyle("ghost", { padding: "5px 10px", fontSize: 12 })} onClick={loadChurn}>↺</button>
          </div>
          {loadingChurn ? <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)" }}>Cargando…</p>
          : !churn?.gimnasios_riesgo?.length ? (
            <p style={{ fontSize: 14, color: "#10b981", textAlign: "center", padding: "30px 0" }}>✓ Sin gimnasios en riesgo</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Gimnasio", "Plan", "Estado Sub", "Próximo Cobro", "Última Actividad", "Días Inactivo", "Riesgo"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary, #94a3b8)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border, rgba(255,255,255,.08))" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {churn.gimnasios_riesgo.map(g => (
                  <tr key={g.gym_id} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary, #f1f5f9)" }}>{g.gimnasio}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary, #94a3b8)" }}>{g.plan || "—"}</td>
                    <td style={{ padding: "10px 12px" }}><span style={badge(g.estado_sub === "unpaid" ? "neg" : "warn")}>{g.estado_sub}</span></td>
                    <td style={{ padding: "10px 12px", color: "#ef4444" }}>{g.fecha_proximo_cobro ? new Date(g.fecha_proximo_cobro).toLocaleDateString("es-MX") : "—"}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary, #94a3b8)" }}>{g.ultima_actividad ? new Date(g.ultima_actividad).toLocaleDateString("es-MX") : "—"}</td>
                    <td style={{ padding: "10px 12px", color: g.dias_inactivo > 30 ? "#ef4444" : "var(--text-secondary, #94a3b8)" }}>{g.dias_inactivo != null ? `${g.dias_inactivo}d` : "—"}</td>
                    <td style={{ padding: "10px 12px" }}><span style={badge(g.nivel_riesgo === "ALTO" ? "neg" : "warn")}>{g.nivel_riesgo}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Crecimiento tab ── */}
      {tab === "crecimiento" && (
        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)" }}>Nuevos Miembros por Mes / Gimnasio</h3>
            <button style={btnStyle("ghost", { padding: "5px 10px", fontSize: 12 })} onClick={loadCrec}>↺</button>
          </div>
          {loadingCrec ? <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)" }}>Calculando con Spark…</p>
          : !crec?.crecimiento?.length ? (
            <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)", textAlign: "center", padding: "30px 0" }}>Sin datos disponibles</p>
          ) : (
            <CrecimientoTable data={crec.crecimiento} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-tables ─────────────────────────────────────────────────

function PlatformTable({ data }) {
  if (!data.length) return <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)" }}>Sin datos de Spark</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["Gimnasio", "Período", "Ingresos", "# Pagos"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-secondary, #94a3b8)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border, rgba(255,255,255,.08))" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 60).map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
              <td style={{ padding: "8px 12px", color: "var(--text-primary, #f1f5f9)" }}>{r.id_gimnasio}</td>
              <td style={{ padding: "8px 12px", color: "var(--text-secondary, #94a3b8)" }}>{r.periodo}</td>
              <td style={{ padding: "8px 12px", color: "#10b981", fontWeight: 600 }}>${(r.ingresos || 0).toLocaleString()}</td>
              <td style={{ padding: "8px 12px", color: "var(--text-secondary, #94a3b8)" }}>{r.num_pagos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryTable({ data }) {
  if (!data.length) return <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)" }}>Sin datos de Spark</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["Gimnasio", "Plan", "Ingresos", "Transacciones", "Ticket Prom.", "Miembros", "Activos"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-secondary, #94a3b8)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border, rgba(255,255,255,.08))" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
              <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--text-primary, #f1f5f9)" }}>{r.gimnasio || r.id_gimnasio}</td>
              <td style={{ padding: "8px 12px", color: "var(--text-secondary, #94a3b8)" }}>{r.plan || "—"}</td>
              <td style={{ padding: "8px 12px", color: "#10b981", fontWeight: 600 }}>${(r.ingresos_totales || 0).toLocaleString()}</td>
              <td style={{ padding: "8px 12px", color: "var(--text-secondary, #94a3b8)" }}>{r.total_transacciones}</td>
              <td style={{ padding: "8px 12px", color: "var(--text-secondary, #94a3b8)" }}>${(r.ticket_promedio || 0).toLocaleString()}</td>
              <td style={{ padding: "8px 12px", color: "var(--text-secondary, #94a3b8)" }}>{r.total_miembros}</td>
              <td style={{ padding: "8px 12px", color: "#818cf8" }}>{r.miembros_activos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CrecimientoTable({ data }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["Gimnasio", "Período", "Nuevos Miembros"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-secondary, #94a3b8)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border, rgba(255,255,255,.08))" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 80).map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
              <td style={{ padding: "8px 12px", color: "var(--text-primary, #f1f5f9)", fontWeight: 500 }}>{r.gimnasio || `Gym ${r.gym_id}`}</td>
              <td style={{ padding: "8px 12px", color: "var(--text-secondary, #94a3b8)" }}>{r.periodo}</td>
              <td style={{ padding: "8px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,.06)", borderRadius: 99, overflow: "hidden", maxWidth: 100 }}>
                    <div style={{ width: `${Math.min((r.nuevos_miembros / 50) * 100, 100)}%`, height: "100%", background: "#818cf8", borderRadius: 99 }} />
                  </div>
                  <span style={{ color: "#818cf8", fontWeight: 700 }}>{r.nuevos_miembros}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
