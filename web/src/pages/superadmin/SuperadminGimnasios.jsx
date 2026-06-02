import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { getGimnasios, getGimnasio, toggleGimnasio } from "../../api/superadmin";

const card = (extra = {}) => ({
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "20px 22px",
  ...extra,
});

const badge = (type = "pos") => {
  const map = {
    pos:   { bg: "rgba(16,185,129,.15)",  color: "var(--success)" },
    neg:   { bg: "rgba(239,68,68,.15)",   color: "var(--danger)" },
    info:  { bg: "var(--accent-dim)",  color: "var(--accent-soft)" },
    warn:  { bg: "rgba(234,179,8,.15)",   color: "var(--warning)" },
  };
  const c = map[type] || map.info;
  return { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color };
};

const btnStyle = (variant = "primary") => {
  const v = {
    primary: { background: "var(--accent, var(--accent))", color: "#fff" },
    ghost:   { background: "rgba(255,255,255,.06)",  color: "var(--text-secondary)" },
    danger:  { background: "rgba(239,68,68,.1)",     color: "var(--danger)" },
    success: { background: "rgba(16,185,129,.1)",    color: "var(--success)" },
  };
  return { border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .15s", ...(v[variant] || v.primary) };
};

const PLAN_LABELS = { basico: "Básico", pro: "Pro", enterprise: "Enterprise" };
const PLAN_COLORS = { basico: "info", pro: "warn", enterprise: "pos" };

function GymDetailModal({ gym, onClose }) {
  const [detail,   setDetail]   = useState(null);
  const [loadingM, setLoadingM] = useState(true);

  useEffect(() => {
    if (!gym) return;
    getGimnasio(gym.id)
      .then(r => setDetail(r.data))
      .catch(() => {})
      .finally(() => setLoadingM(false));
  }, [gym]);

  const metricas = detail?.metricas ?? null;

  if (!gym) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
      <div style={{ ...card(), width: "100%", maxWidth: 680, maxHeight: "85vh", overflowY: "auto", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--text-secondary)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>{detail?.nombre ?? gym.nombre}</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>ID: {gym.id} · {detail?.email ?? gym.email}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            ["Plan", <span style={badge(PLAN_COLORS[(detail?.plan ?? gym.plan)] || "info")}>{PLAN_LABELS[(detail?.plan ?? gym.plan)] || (detail?.plan ?? gym.plan)}</span>],
            ["Estado", <span style={badge((detail?.activo ?? gym.activo) ? "pos" : "neg")}>{(detail?.activo ?? gym.activo) ? "Activo" : "Inactivo"}</span>],
            ["Teléfono", detail?.telefono ?? gym.telefono ?? "—"],
          ].map(([k, v]) => (
            <div key={k} style={{ background: "var(--bg-input)", borderRadius: 8, padding: "10px 14px" }}>
              <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>{k}</p>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Suscripción */}
        {detail?.suscripcion && (
          <>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Suscripción
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                ["Plan SaaS",       detail.suscripcion.plan ?? "—"],
                ["Estado",          <span style={badge(detail.suscripcion.estado === "active" ? "pos" : "warn")}>{detail.suscripcion.estado}</span>],
                ["Precio Mensual",  detail.suscripcion.precio_mensual_mxn ? `$${Number(detail.suscripcion.precio_mensual_mxn).toLocaleString()} MXN` : "—"],
                ["Inicio",          detail.suscripcion.fecha_inicio ? new Date(detail.suscripcion.fecha_inicio).toLocaleDateString("es-MX") : "—"],
                ["Próximo Cobro",   detail.suscripcion.fecha_proximo_cobro ? new Date(detail.suscripcion.fecha_proximo_cobro).toLocaleDateString("es-MX") : "—"],
                ["Stripe ID",       <span style={{ fontSize: 11, color: "var(--text-secondary)", wordBreak: "break-all" }}>{detail.suscripcion.stripe_subscription_id ?? "—"}</span>],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "var(--bg-input)", borderRadius: 8, padding: "10px 14px" }}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>{k}</p>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{v}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Métricas */}
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Métricas Operativas
        </h3>
        {loadingM ? (
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Cargando métricas…</p>
        ) : metricas ? (
          <>
            {/* Miembros */}
            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Miembros</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                ["Total",    metricas.total_miembros    ?? "—", "var(--text-primary)"],
                ["Activos",  metricas.miembros_activos  ?? "—", "var(--success)"],
                ["Inactivos",metricas.miembros_inactivos?? "—", "var(--danger)"],
                ["Nuevos 30d",metricas.nuevos_30d       ?? "—", "var(--accent-soft)"],
              ].map(([k, v, color]) => (
                <div key={k} style={{ background: "var(--bg-input)", borderRadius: 8, padding: "10px 14px" }}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>{k}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color }}>{v}</p>
                </div>
              ))}
            </div>

            {/* Asistencias */}
            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Asistencias</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                ["Este Mes",  metricas.asistencias_mes   ?? "—"],
                ["Últimos 30d",metricas.asistencias_30d  ?? "—"],
                ["Total",    metricas.asistencias_total  ?? "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "var(--bg-input)", borderRadius: 8, padding: "10px 14px" }}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>{k}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{v}</p>
                </div>
              ))}
            </div>

            {/* Ingresos */}
            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Ingresos</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: metricas.ingresos_12m?.length ? 16 : 0 }}>
              {[
                ["Este Mes",    "$" + (metricas.ingresos_mes_mxn   ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 0 })],
                ["Últimos 30d", "$" + (metricas.ingresos_30d_mxn   ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 0 })],
                ["Total Hist.", "$" + (metricas.ingresos_total_mxn ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 0 })],
                ["Ticket Prom.","$" + (metricas.ticket_promedio     ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "var(--bg-input)", borderRadius: 8, padding: "10px 14px" }}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>{k}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "var(--success)" }}>{v}</p>
                </div>
              ))}
            </div>

            {/* Sparkline ingresos 12m */}
            {metricas.ingresos_12m?.length > 0 && (
              <div style={{ background: "var(--bg-input)", borderRadius: 8, padding: "12px 14px", marginBottom: 4 }}>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10, fontWeight: 600 }}>INGRESOS ÚLTIMOS 12 MESES</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48, overflowX: "auto" }}>
                  {(() => {
                    const max = Math.max(...metricas.ingresos_12m.map(d => d.ingresos), 1);
                    return metricas.ingresos_12m.map((d, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                        <div
                          title={`${d.periodo}: $${d.ingresos.toLocaleString()}`}
                          style={{ width: 18, height: Math.max(3, (d.ingresos / max) * 40), background: "var(--success)", borderRadius: "3px 3px 0 0", opacity: .8 }}
                        />
                        <span style={{ fontSize: 8, color: "var(--text-secondary)", transform: "rotate(-40deg)", transformOrigin: "top center", whiteSpace: "nowrap" }}>
                          {d.periodo.slice(5)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Última actividad */}
            {metricas.ultima_actividad && (
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 10 }}>
                Última asistencia registrada: <b style={{ color: "var(--text-primary)" }}>{new Date(metricas.ultima_actividad).toLocaleDateString("es-MX")}</b>
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Sin datos disponibles</p>
        )}

        {/* Staff */}
        {detail?.staff?.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", margin: "20px 0 12px", textTransform: "uppercase", letterSpacing: ".06em" }}>
              Staff ({detail.staff.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {detail.staff.map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-input)", borderRadius: 7, fontSize: 13 }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{s.nombre}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{s.rol} · {s.email}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuperadminGimnasios() {
  const [gyms,     setGyms]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters,  setFilters]  = useState({ activo: "", plan: "", q: "" });
  const perPage = 15;

  const load = useCallback((p = 1, f = filters) => {
    setLoading(true);
    const params = { page: p, per_page: perPage };
    if (f.activo !== "") params.activo = f.activo;
    if (f.plan)  params.plan = f.plan;
    if (f.q)     params.q    = f.q;
    getGimnasios(params)
      .then(r => {
        setGyms(r.data.gimnasios || []);
        setTotal(r.data.total  || 0);
        setPage(p);
      })
      .catch(() => setGyms([]))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(1, filters); }, []);

  const handleToggle = async (gym) => {
    const { isConfirmed } = await Swal.fire({
      title: `${gym.activo ? "Desactivar" : "Activar"} "${gym.nombre}"`,
      text: gym.activo
        ? "Los usuarios de este gimnasio no podrán iniciar sesión."
        : "El gimnasio recuperará acceso completo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: gym.activo ? "Desactivar" : "Activar",
      confirmButtonColor: gym.activo ? "var(--danger)" : "var(--success)",
      cancelButtonText: "Cancelar",
      background: "var(--bg-card)",
      color: "var(--text-primary)",
    });
    if (!isConfirmed) return;
    try {
      await toggleGimnasio(gym.id);
      setGyms(prev => prev.map(g => g.id === gym.id ? { ...g, activo: !g.activo } : g));
      Swal.fire({ icon: "success", title: gym.activo ? "Gimnasio desactivado" : "Gimnasio activado", timer: 1500, showConfirmButton: false, background: "var(--bg-card)", color: "var(--text-primary)" });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e?.response?.data?.msg || "No se pudo cambiar el estado", background: "var(--bg-card)", color: "var(--text-primary)" });
    }
  };

  const pages = Math.ceil(total / perPage);

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "var(--bg-input)", fontFamily: "inherit" }}>
      {selected && <GymDetailModal gym={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Gimnasios</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {total} gimnasios registrados en la plataforma
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={filters.q}
          onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && load(1, { ...filters, q: e.target.value })}
          placeholder="Buscar gimnasio…"
          style={{ flex: 1, minWidth: 200, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", color: "var(--text-primary)", fontSize: 13 }}
        />
        <select
          value={filters.activo}
          onChange={e => { const v = { ...filters, activo: e.target.value }; setFilters(v); load(1, v); }}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <select
          value={filters.plan}
          onChange={e => { const v = { ...filters, plan: e.target.value }; setFilters(v); load(1, v); }}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
        >
          <option value="">Todos los planes</option>
          <option value="basico">Básico</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <button style={btnStyle("ghost")} onClick={() => load(1, filters)}>Buscar</button>
      </div>

      {/* Table */}
      <div style={card({ padding: 0, overflow: "hidden" })}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-input)" }}>
              {["Gimnasio", "Email", "Plan", "Estado", "Teléfono", "Acciones"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Cargando…</td></tr>
            ) : gyms.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Sin resultados</td></tr>
            ) : gyms.map(gym => (
              <tr key={gym.id} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{gym.nombre}</span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{gym.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={badge(PLAN_COLORS[gym.plan] || "info")}>{PLAN_LABELS[gym.plan] || gym.plan}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={badge(gym.activo ? "pos" : "neg")}>{gym.activo ? "Activo" : "Inactivo"}</span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{gym.telefono || "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={btnStyle("ghost")} onClick={() => setSelected(gym)}>Ver</button>
                    <button
                      style={btnStyle(gym.activo ? "danger" : "success")}
                      onClick={() => handleToggle(gym)}
                    >
                      {gym.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button style={btnStyle("ghost")} disabled={page === 1} onClick={() => load(page - 1)}>← Anterior</button>
          <span style={{ padding: "7px 14px", fontSize: 13, color: "var(--text-secondary)" }}>
            {page} / {pages}
          </span>
          <button style={btnStyle("ghost")} disabled={page === pages} onClick={() => load(page + 1)}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}
