import { useState, useEffect, useCallback } from "react";
import { getSuscripciones } from "../../api/superadmin";

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
    purple: { bg: "rgba(168,85,247,.15)",  color: "#a855f7" },
    muted:  { bg: "rgba(100,116,139,.15)", color: "var(--text-tertiary)" },
  };
  const c = map[type] || map.info;
  return { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color };
};

const btnStyle = (variant = "primary") => {
  const v = {
    primary: { background: "var(--accent, var(--accent))", color: "#fff" },
    ghost:   { background: "rgba(255,255,255,.06)",  color: "var(--text-secondary)" },
    danger:  { background: "rgba(239,68,68,.1)",     color: "var(--danger)" },
    warn:    { background: "rgba(234,179,8,.1)",     color: "var(--warning)" },
  };
  return { border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .15s", ...(v[variant] || v.primary) };
};

const ESTADO_BADGE = {
  active:    "pos",
  trialing:  "info",
  paused:    "warn",
  past_due:  "warn",
  unpaid:    "neg",
  cancelled: "muted",
};

const ESTADO_LABELS = {
  active: "Activa", trialing: "Trial", paused: "Pausada",
  past_due: "Vencida", unpaid: "Sin Pago", cancelled: "Cancelada",
};

const PLAN_LABELS = { starter: "Starter", basico: "Básico", pro: "Pro", enterprise: "Enterprise" };
const planLabel = (nombre) => PLAN_LABELS[(nombre || "").toLowerCase()] || nombre || "—";

export default function SuperadminSuscripciones() {
  const [subs,    setSubs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({});
  const [filter,  setFilter]  = useState({ estado: "", q: "" });
  const perPage = 20;

  const load = useCallback((p = 1, f = filter) => {
    setLoading(true);
    const params = { page: p, per_page: perPage };
    if (f.estado) params.estado = f.estado;
    if (f.q)      params.q      = f.q;
    getSuscripciones(params)
      .then(r => {
        setSubs(r.data.suscripciones || []);
        setTotal(r.data.total  || 0);
        setResumen(r.data.resumen_estados || {});
        setPage(p);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load(1, filter);
  }, []);

  const pages = Math.ceil(total / perPage);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-MX") : "—";

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "var(--bg-input)", fontFamily: "inherit" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Suscripciones</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{total} suscripciones en la plataforma</p>
      </div>

      {/* Resumen por estado */}
      {Object.keys(resumen).length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {Object.entries(resumen).map(([estado, count]) => (
            <div key={estado} style={{ ...card({ padding: "10px 16px" }), display: "flex", alignItems: "center", gap: 10 }}>
              <span style={badge(ESTADO_BADGE[estado] || "muted")}>{ESTADO_LABELS[estado] || estado}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={filter.q}
          onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && load(1, { ...filter, q: e.target.value })}
          placeholder="Buscar gimnasio…"
          style={{ flex: 1, minWidth: 200, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", color: "var(--text-primary)", fontSize: 13 }}
        />
        <select
          value={filter.estado}
          onChange={e => { const v = { ...filter, estado: e.target.value }; setFilter(v); load(1, v); }}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button style={btnStyle("ghost")} onClick={() => load(1, filter)}>Buscar</button>
      </div>

      {/* Table */}
      <div style={card({ padding: 0, overflow: "hidden" })}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-input)" }}>
              {["Gimnasio", "Plan", "Estado", "Inicio", "Próximo Cobro"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Cargando…</td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Sin resultados</td></tr>
            ) : subs.map(sub => (
              <tr key={sub.id} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-primary)" }}>{sub.gimnasio}</td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{planLabel(sub.plan)}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={badge(ESTADO_BADGE[sub.estado] || "muted")}>{ESTADO_LABELS[sub.estado] || sub.estado}</span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{fmtDate(sub.fecha_inicio)}</td>
                <td style={{ padding: "12px 16px", color: sub.estado === "past_due" || sub.estado === "unpaid" ? "var(--danger)" : "var(--text-secondary)" }}>
                  {fmtDate(sub.fecha_proximo_cobro)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button style={btnStyle("ghost")} disabled={page === 1} onClick={() => load(page - 1)}>← Anterior</button>
          <span style={{ padding: "7px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{page} / {pages}</span>
          <button style={btnStyle("ghost")} disabled={page === pages} onClick={() => load(page + 1)}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}
