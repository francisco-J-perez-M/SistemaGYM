import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import {
  getAnalyticsPlataforma,
  refreshAnalytics,
  getProyeccion,
  getChurnGimnasios,
  getCrecimiento,
  getGimnasios,
} from "../../api/superadmin";

const card = (extra = {}) => ({
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "20px 22px",
  ...extra,
});

const badge = (type = "pos") => {
  const map = {
    pos:    { bg: "rgba(16,185,129,.15)",  color: "var(--success)" },
    neg:    { bg: "rgba(239,68,68,.15)",   color: "var(--danger)" },
    info:   { bg: "var(--accent-dim)",  color: "var(--accent-soft)" },
    warn:   { bg: "rgba(234,179,8,.15)",   color: "var(--warning)" },
    cache:  { bg: "rgba(100,116,139,.15)", color: "var(--text-secondary)" },
  };
  const c = map[type] || map.info;
  return { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color };
};

const btnStyle = (variant = "primary", extra = {}) => {
  const v = {
    primary: { background: "var(--accent, var(--accent))", color: "#fff" },
    ghost:   { background: "rgba(255,255,255,.06)",  color: "var(--text-secondary)" },
    warn:    { background: "rgba(234,179,8,.1)",     color: "var(--warning)" },
    neg:     { background: "rgba(239,68,68,.1)",     color: "var(--danger)" },
  };
  return { border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .15s", ...(v[variant] || v.primary), ...extra };
};

// ── Mini Bar Chart ──────────────────────────────────────────────
function MiniBarChart({ data, valueKey, labelKey, color = "var(--accent)", height = 140 }) {
  if (!data?.length) return <p style={{ fontSize: 13, color: "var(--text-secondary)", padding: "20px 0" }}>Sin datos</p>;
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
            <span style={{ fontSize: 9, color: "var(--text-secondary)", transform: "rotate(-40deg)", transformOrigin: "top center", whiteSpace: "nowrap" }}>
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
  if (!hist?.length) return <p style={{ fontSize: 13, color: "var(--text-secondary)", padding: "20px 0" }}>Sin datos</p>;
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
      <polyline points={histPts.join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      {proj?.length > 0 && <polyline points={projPts.join(" ")} fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="6,3" />}
    </svg>
  );
}

const PAGE_SIZE = 15;

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

  // Selector de gimnasio + paginación
  const [gyms,       setGyms]       = useState([]);
  const [selGym,     setSelGym]     = useState("all");   // "all" | gym_id (número)
  const [pageIngresos, setPageIngresos] = useState(1);
  const [pageResumen,  setPageResumen]  = useState(1);

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
    getGimnasios({ per_page: 100 })
      .then(r => setGyms(r.data.gimnasios || []))
      .catch(() => {});
  }, []);

  // Datos filtrados por gimnasio seleccionado
  const ingresosFiltered = useMemo(() => {
    const rows = plat?.ingresos_por_periodo_gym || [];
    if (selGym === "all") return rows;
    return rows.filter(r => String(r.id_gimnasio) === String(selGym));
  }, [plat, selGym]);

  const resumenFiltered = useMemo(() => {
    const rows = plat?.resumen_por_gimnasio || [];
    if (selGym === "all") return rows;
    return rows.filter(r => String(r.id_gimnasio) === String(selGym));
  }, [plat, selGym]);

  // Reset páginas al cambiar filtro
  useEffect(() => { setPageIngresos(1); setPageResumen(1); }, [selGym]);

  // Lookup id_gimnasio → nombre
  const gymName = useMemo(() => {
    const map = {};
    (plat?.resumen_por_gimnasio || []).forEach(r => {
      if (r.id_gimnasio && r.gimnasio) map[r.id_gimnasio] = r.gimnasio;
    });
    gyms.forEach(g => { if (!map[g.id]) map[g.id] = g.nombre; });
    return (id) => map[id] || `Gym ${id}`;
  }, [plat, gyms]);

  const handleRefresh = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Forzar recálculo?",
      text: "Ejecutará Spark sobre todos los datos de la plataforma. Puede tardar varios segundos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Recalcular",
      confirmButtonColor: "var(--accent)",
      cancelButtonText: "Cancelar",
      background: "var(--bg-card)",
      color: "var(--text-primary)",
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
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "var(--bg-input)", fontFamily: "inherit" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Analytics de Plataforma</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Motor Spark — agregación multi-gimnasio</p>
        </div>
        <button style={btnStyle("warn")} onClick={handleRefresh} disabled={loadingPlat}>
          {loadingPlat ? "⏳ Calculando…" : "↺ Recalcular Spark"}
        </button>
      </div>

      {/* Selector de gimnasio */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", width: "fit-content" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Filtrar por gimnasio</span>
        <select
          value={selGym}
          onChange={e => setSelGym(e.target.value)}
          style={{ minWidth: 220 }}
        >
          <option value="all">Todos los gimnasios</option>
          {gyms.map(g => (
            <option key={g.id} value={g.id}>{g.nombre}</option>
          ))}
        </select>
        {selGym !== "all" && (
          <button
            style={{ border: "none", background: "rgba(239,68,68,.12)", color: "var(--danger)", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            onClick={() => setSelGym("all")}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-card)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            style={{ border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", background: tab === t.id ? "var(--accent, var(--accent))" : "transparent", color: tab === t.id ? "#fff" : "var(--text-secondary)", transition: "all .15s" }}
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

          {/* Ingresos por periodo/gym */}
          <div style={card()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                Ingresos Mensuales por Gimnasio
                {selGym !== "all" && <span style={{ fontSize: 12, fontWeight: 400, color: "var(--accent-soft)", marginLeft: 8 }}>— {gymName(selGym)}</span>}
              </h3>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{ingresosFiltered.length} registros</span>
            </div>
            {loadingPlat ? (
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Calculando con Spark…</p>
            ) : (
              <PlatformTable
                data={ingresosFiltered}
                page={pageIngresos}
                setPage={setPageIngresos}
                gymName={gymName}
              />
            )}
          </div>

          {/* Resumen */}
          <div style={card()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                Resumen Acumulado
                {selGym !== "all" && <span style={{ fontSize: 12, fontWeight: 400, color: "var(--accent-soft)", marginLeft: 8 }}>— {gymName(selGym)}</span>}
              </h3>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{resumenFiltered.length} gimnasios</span>
            </div>
            {loadingPlat ? <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Calculando…</p> : (
              <SummaryTable
                data={resumenFiltered}
                page={pageResumen}
                setPage={setPageResumen}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Proyección tab ── */}
      {tab === "proyeccion" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={card()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Proyección de Ingresos (6 meses)</h3>
              {proyeccion && <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                <span style={{ color: "var(--text-secondary)" }}>R²: <b style={{ color: "var(--accent-soft)" }}>{proyeccion.r2}</b></span>
                <span style={{ color: "var(--text-secondary)" }}>RMSE: <b style={{ color: "var(--accent-soft)" }}>{proyeccion.rmse?.toLocaleString()}</b></span>
              </div>}
            </div>
            {loadingProy ? <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Calculando regresión lineal…</p>
            : proyeccion?.error ? <p style={{ fontSize: 13, color: "var(--danger)" }}>{proyeccion.error}</p>
            : (
              <>
                <LineChart hist={proyeccion?.datos_historicos} proj={proyeccion?.proyeccion_6m} height={160} />
                <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}><span style={{ width: 20, height: 2, background: "var(--accent)", display: "inline-block" }} /> Histórico</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}><span style={{ width: 20, height: 2, background: "#a855f7", display: "inline-block", borderTop: "2px dashed #a855f7", borderBottom: "none", marginTop: 0 }} /> Proyectado</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginTop: 16 }}>
                  {(proyeccion?.proyeccion_6m || []).map(p => (
                    <div key={p.periodo} style={{ background: "rgba(168,85,247,.08)", border: "1px solid rgba(168,85,247,.2)", borderRadius: 8, padding: "10px 14px" }}>
                      <p style={{ fontSize: 11, color: "#a855f7", marginBottom: 4 }}>{p.periodo}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>${p.proyectado?.toLocaleString()}</p>
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
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Gimnasios en Riesgo de Churn ({churn?.total_riesgo ?? "—"})
            </h3>
            <button style={btnStyle("ghost", { padding: "5px 10px", fontSize: 12 })} onClick={loadChurn}>↺</button>
          </div>
          {loadingChurn ? <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Cargando…</p>
          : !churn?.gimnasios_riesgo?.length ? (
            <p style={{ fontSize: 14, color: "var(--success)", textAlign: "center", padding: "30px 0" }}>✓ Sin gimnasios en riesgo</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Gimnasio", "Plan", "Estado Sub", "Próximo Cobro", "Última Actividad", "Días Inactivo", "Riesgo"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {churn.gimnasios_riesgo.map(g => (
                  <tr key={g.gym_id} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary)" }}>{g.gimnasio}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{g.plan || "—"}</td>
                    <td style={{ padding: "10px 12px" }}><span style={badge(g.estado_sub === "unpaid" ? "neg" : "warn")}>{g.estado_sub}</span></td>
                    <td style={{ padding: "10px 12px", color: "var(--danger)" }}>{g.fecha_proximo_cobro ? new Date(g.fecha_proximo_cobro).toLocaleDateString("es-MX") : "—"}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{g.ultima_actividad ? new Date(g.ultima_actividad).toLocaleDateString("es-MX") : "—"}</td>
                    <td style={{ padding: "10px 12px", color: g.dias_inactivo > 30 ? "var(--danger)" : "var(--text-secondary)" }}>{g.dias_inactivo != null ? `${g.dias_inactivo}d` : "—"}</td>
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
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Nuevos Miembros por Mes / Gimnasio</h3>
            <button style={btnStyle("ghost", { padding: "5px 10px", fontSize: 12 })} onClick={loadCrec}>↺</button>
          </div>
          {loadingCrec ? <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Calculando con Spark…</p>
          : !crec?.crecimiento?.length ? (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", padding: "30px 0" }}>Sin datos disponibles</p>
          ) : (
            <CrecimientoTable data={crec.crecimiento} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Pagination helper ──────────────────────────────────────────

function Pagination({ total, page, setPage, pageSize = PAGE_SIZE }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const btn = (label, target, disabled) => (
    <button
      key={label}
      onClick={() => !disabled && setPage(target)}
      style={{
        border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "4px 10px",
        background: page === target ? "var(--accent, var(--accent))" : "rgba(255,255,255,.04)",
        color: disabled ? "rgba(255,255,255,.2)" : (page === target ? "#fff" : "var(--text-secondary)"),
        fontSize: 12, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      }}
    >{label}</button>
  );
  const visible = Array.from({ length: pages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, justifyContent: "flex-end" }}>
      <span style={{ fontSize: 11, color: "var(--text-secondary)", marginRight: 4 }}>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
      </span>
      {btn("‹", page - 1, page === 1)}
      {visible.map((p, i, arr) => {
        const prev = arr[i - 1];
        return [
          prev && p - prev > 1 ? <span key={`gap-${p}`} style={{ color: "rgba(255,255,255,.2)", fontSize: 12 }}>…</span> : null,
          btn(p, p, false),
        ];
      })}
      {btn("›", page + 1, page === pages)}
    </div>
  );
}

// ── Sub-tables ─────────────────────────────────────────────────

function PlatformTable({ data, page, setPage, gymName }) {
  if (!data.length) return <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Sin datos de Spark</p>;
  const slice = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["Gimnasio", "Período", "Ingresos", "# Pagos"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
                <td style={{ padding: "8px 12px", color: "var(--text-primary)", fontWeight: 600 }}>{gymName ? gymName(r.id_gimnasio) : r.id_gimnasio}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{r.periodo}</td>
                <td style={{ padding: "8px 12px", color: "var(--success)", fontWeight: 600 }}>${(r.ingresos || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{r.num_pagos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination total={data.length} page={page} setPage={setPage} />
    </>
  );
}

function SummaryTable({ data, page, setPage }) {
  if (!data.length) return <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Sin datos de Spark</p>;
  const slice = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["Gimnasio", "Plan", "Ingresos", "Transacciones", "Ticket Prom.", "Miembros", "Activos"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--text-primary)" }}>{r.gimnasio || r.id_gimnasio}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{r.plan || "—"}</td>
                <td style={{ padding: "8px 12px", color: "var(--success)", fontWeight: 600 }}>${(r.ingresos_totales || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{r.total_transacciones}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>${(r.ticket_promedio || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{r.total_miembros}</td>
                <td style={{ padding: "8px 12px", color: "var(--accent-soft)" }}>{r.miembros_activos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination total={data.length} page={page} setPage={setPage} />
    </>
  );
}

function CrecimientoTable({ data }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["Gimnasio", "Período", "Nuevos Miembros"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 80).map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
              <td style={{ padding: "8px 12px", color: "var(--text-primary)", fontWeight: 500 }}>{r.gimnasio || `Gym ${r.gym_id}`}</td>
              <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{r.periodo}</td>
              <td style={{ padding: "8px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,.06)", borderRadius: 99, overflow: "hidden", maxWidth: 100 }}>
                    <div style={{ width: `${Math.min((r.nuevos_miembros / 50) * 100, 100)}%`, height: "100%", background: "var(--accent-soft)", borderRadius: 99 }} />
                  </div>
                  <span style={{ color: "var(--accent-soft)", fontWeight: 700 }}>{r.nuevos_miembros}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
