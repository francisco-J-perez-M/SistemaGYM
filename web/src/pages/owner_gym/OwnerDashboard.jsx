import { useEffect, useState, useCallback } from "react";
import {
  FiUsers, FiDollarSign, FiTrendingUp, FiTrendingDown,
  FiAlertTriangle, FiShoppingCart, FiUserCheck, FiRefreshCw,
  FiAward, FiActivity, FiChevronLeft, FiChevronRight,
  FiXCircle, FiCheckCircle, FiBell, FiCreditCard, FiUserPlus,
  FiPackage, FiCalendar, FiSlash,
} from "react-icons/fi";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getOwnerDashboard, getOwnerIngresos, getOwnerActividad, getOwnerAlertas } from "../../api/owner_gym";

// ─── helpers ───────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

const S = {
  page: {
    padding: "28px 32px",
    background: "var(--bg-main)",
    minHeight: "100vh",
    color: "var(--text-primary,var(--text-primary))",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 28,
  },
  title: { fontSize: 26, fontWeight: 700, margin: 0, color: "var(--text-primary,var(--text-primary))" },
  sub:   { fontSize: 13, color: "var(--text-secondary,var(--text-secondary))", marginTop: 4 },
  refreshBtn: {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 8, color: "var(--text-secondary,var(--text-secondary))", cursor: "pointer",
    fontSize: 13, transition: "all .2s",
  },
  grid4: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
    gap: 16, marginBottom: 28,
  },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px 22px",
  },
  cardLabel: { fontSize: 12, color: "var(--text-secondary,var(--text-secondary))", textTransform: "uppercase", letterSpacing: ".06em" },
  cardValue: { fontSize: 28, fontWeight: 700, margin: "8px 0 4px", color: "var(--text-primary,var(--text-primary))" },
  cardSub:   { fontSize: 12, color: "var(--text-tertiary,var(--text-tertiary))" },
  grid2: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24,
  },
  section: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px 22px",
  },
  sectionTitle: { fontSize: 15, fontWeight: 600, marginBottom: 16, color: "var(--text-primary,var(--text-primary))" },
  badge: (color) => ({
    display: "inline-block", padding: "2px 8px", borderRadius: 20,
    fontSize: 11, fontWeight: 600, background: `${color}22`, color: color,
  }),
  actRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 0", borderBottom: "1px solid var(--border,rgba(255,255,255,.06))",
  },
  actIcon: {
    width: 36, height: 36, borderRadius: "50%",
    background: "var(--bg-main)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, flexShrink: 0,
  },
  actText: { flex: 1, fontSize: 13, color: "var(--text-primary,var(--text-primary))" },
  actDate: { fontSize: 11, color: "var(--text-tertiary,var(--text-tertiary))" },
};

// ─── Tarjeta KPI ───────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accent = "var(--accent)", loading }) {
  return (
    <div style={{ ...S.card, borderTop: `3px solid ${accent}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={S.cardLabel}>{label}</span>
        <span style={{ color: accent, fontSize: 20 }}>{icon}</span>
      </div>
      {loading
        ? <div style={{ height: 36, background: "var(--bg-main)", borderRadius: 6, margin: "8px 0 4px", animation: "pulse 1.5s infinite" }} />
        : <div style={S.cardValue}>{value}</div>
      }
      {sub && <div style={S.cardSub}>{sub}</div>}
    </div>
  );
}

// ─── Tooltip custom para gráficas ─────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ margin: 0, fontWeight: 600, marginBottom: 6, color: "var(--text-primary)", fontSize: 13 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ margin: "3px 0", color: p.color, fontSize: 12 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

const ACT_PER_PAGE   = 6;
const ALERT_PER_PAGE = 5;

// ─── Mini paginador reutilizable ──────────────────────────────────────────────
function Pager({ page, total, onChange }) {
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border,rgba(255,255,255,.06))" }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ background: "none", border: "1px solid var(--border,rgba(255,255,255,.1))", borderRadius: 6, color: page === 1 ? "var(--border)" : "var(--text-secondary)", cursor: page === 1 ? "not-allowed" : "pointer", padding: "4px 8px", display: "flex", alignItems: "center" }}>
        <FiChevronLeft size={13} />
      </button>
      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{page} / {total}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === total}
        style={{ background: "none", border: "1px solid var(--border,rgba(255,255,255,.1))", borderRadius: 6, color: page === total ? "var(--border)" : "var(--text-secondary)", cursor: page === total ? "not-allowed" : "pointer", padding: "4px 8px", display: "flex", alignItems: "center" }}>
        <FiChevronRight size={13} />
      </button>
    </div>
  );
}

export default function OwnerDashboard() {
  const [kpis,      setKpis]      = useState(null);
  const [ingresos,  setIngresos]  = useState([]);
  const [actividad, setActividad] = useState([]);
  const [alertas,   setAlertas]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [actPage,   setActPage]   = useState(1);
  const [alertPage, setAlertPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [kRes, iRes, aRes, alRes] = await Promise.all([
        getOwnerDashboard(),
        getOwnerIngresos(6),
        getOwnerActividad(20),
        getOwnerAlertas(),
      ]);
      setKpis(kRes.data);
      setIngresos(iRes.data);
      setActividad(aRes.data);
      setAlertas(alRes.data?.alertas || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const variacion = kpis?.ingresos?.variacion_pct ?? 0;
  const varPositive = variacion >= 0;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Dashboard</h1>
          <p style={S.sub}>Resumen general de tu gimnasio</p>
        </div>
        <button style={S.refreshBtn} onClick={load}>
          <FiRefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          Actualizar
        </button>
      </div>

      {/* KPIs principales */}
      <div style={S.grid4}>
        <KpiCard
          label="Miembros Activos"
          value={kpis?.miembros?.activos ?? "—"}
          sub={`${kpis?.miembros?.nuevos_mes ?? 0} nuevos este mes`}
          icon={<FiUsers />}
          accent="var(--accent)"
          loading={loading}
        />
        <KpiCard
          label="Ingresos del Mes"
          value={fmt(kpis?.ingresos?.mes_actual)}
          sub={
            <span style={{ color: varPositive ? "var(--success)" : "var(--danger)" }}>
              {varPositive ? "▲" : "▼"} {Math.abs(variacion)}% vs mes anterior
            </span>
          }
          icon={<FiDollarSign />}
          accent="var(--success)"
          loading={loading}
        />
        <KpiCard
          label="Ventas POS (Mes)"
          value={fmt(kpis?.ventas_pos?.total_mes)}
          sub={`${kpis?.ventas_pos?.transacciones ?? 0} transacciones`}
          icon={<FiShoppingCart />}
          accent="var(--warning)"
          loading={loading}
        />
        <KpiCard
          label="Membresías por Vencer"
          value={kpis?.miembros?.por_vencer ?? "—"}
          sub="Próximos 7 días"
          icon={<FiAlertTriangle />}
          accent={kpis?.miembros?.por_vencer > 0 ? "var(--danger)" : "var(--text-tertiary)"}
          loading={loading}
        />
        <KpiCard
          label="Total Miembros"
          value={kpis?.miembros?.total ?? "—"}
          sub={`${kpis?.miembros?.inactivos ?? 0} inactivos`}
          icon={<FiUserCheck />}
          accent="#0ea5e9"
          loading={loading}
        />
        <KpiCard
          label="Entrenadores"
          value={kpis?.staff?.entrenadores ?? "—"}
          sub={`${kpis?.staff?.recepcionistas ?? 0} recepcionistas`}
          icon={<FiAward />}
          accent="#a855f7"
          loading={loading}
        />
        <KpiCard
          label="Tipos de Membresía"
          value={kpis?.tipos_membresia ?? "—"}
          sub="Planes activos"
          icon={<FiActivity />}
          accent="#14b8a6"
          loading={loading}
        />
        <KpiCard
          label="Ingresos Mes Anterior"
          value={fmt(kpis?.ingresos?.mes_anterior)}
          sub="Para comparación"
          icon={varPositive ? <FiTrendingUp /> : <FiTrendingDown />}
          accent="var(--text-tertiary)"
          loading={loading}
        />
      </div>

      {/* Gráficas */}
      <div style={{ ...S.grid2, "@media(maxWidth:768px)": { gridTemplateColumns: "1fr" } }}>
        {/* Ingresos históricos */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Ingresos últimos 6 meses</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ingresos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
              <Line type="monotone" dataKey="pagos"  name="Membresías" stroke="var(--accent)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ventas" name="POS"         stroke="var(--warning)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Barras por mes */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Total por mes</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ingresos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actividad reciente + Alertas */}
      <div style={S.grid2}>

        {/* ── Actividad Reciente (paginada) ── */}
        <div style={S.section}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={S.sectionTitle}>Actividad Reciente</div>
            {actividad.length > 0 && (
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{actividad.length} registros</span>
            )}
          </div>
          {loading
            ? [1,2,3,4].map(i => (
                <div key={i} style={{ height: 44, background: "var(--bg-main)", borderRadius: 6, marginBottom: 8, opacity: 0.5 }} />
              ))
            : actividad.length === 0
              ? <p style={{ color: "var(--text-tertiary)", fontSize: 13 }}>Sin actividad reciente</p>
              : (() => {
                  const totalPagesAct = Math.ceil(actividad.length / ACT_PER_PAGE);
                  const slice = actividad.slice((actPage - 1) * ACT_PER_PAGE, actPage * ACT_PER_PAGE);
                  const tipoMeta = (tipo) => {
                    if (tipo === "pago")     return { bg: "var(--accent-dim)",  color: "var(--accent-soft)", icon: <FiCreditCard  size={16} />, prefix: ""              };
                    if (tipo === "venta")    return { bg: "rgba(245,158,11,.12)",  color: "var(--warning)", icon: <FiShoppingCart size={16} />, prefix: ""              };
                    /* registro */           return { bg: "rgba(16,185,129,.12)",  color: "var(--success)", icon: <FiUserPlus    size={16} />, prefix: "Nuevo miembro: " };
                  };
                  return (
                    <>
                      {slice.map((a, i) => {
                        const meta = tipoMeta(a.tipo);
                        const showMonto = (a.tipo === "pago" || a.tipo === "venta") && a.monto != null;
                        return (
                          <div key={i} style={{ ...S.actRow, borderBottom: i === slice.length - 1 ? "none" : undefined }}>
                            <div style={{ ...S.actIcon, background: meta.bg, color: meta.color }}>
                              {meta.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ ...S.actText, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {meta.prefix}{a.titulo}
                              </div>
                              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                                {showMonto && (
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--success)" }}>{fmt(a.monto)}</span>
                                )}
                                {a.sub && (
                                  <span style={{ fontSize: 11, color: "var(--text-tertiary)", background: "rgba(255,255,255,.05)", borderRadius: 4, padding: "1px 6px" }}>{a.sub}</span>
                                )}
                              </div>
                            </div>
                            <div style={{ ...S.actDate, flexShrink: 0, textAlign: "right" }}>
                              {a.fecha ? a.fecha.slice(0, 10) : ""}
                            </div>
                          </div>
                        );
                      })}
                      <Pager page={actPage} total={totalPagesAct} onChange={setActPage} />
                    </>
                  );
                })()
          }
        </div>

        {/* ── Alertas del sistema (paginadas) ── */}
        <div style={S.section}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FiBell size={15} color={alertas.some(a => a.nivel === "error") ? "var(--danger)" : "var(--warning)"} />
              <span style={S.sectionTitle}>Alertas del Sistema</span>
            </div>
            {alertas.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                background: alertas.some(a => a.nivel === "error") ? "rgba(239,68,68,.15)" : "rgba(234,179,8,.15)",
                color: alertas.some(a => a.nivel === "error") ? "var(--danger)" : "var(--warning)",
              }}>
                {alertas.length} alerta{alertas.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading
            ? [1,2,3].map(i => (
                <div key={i} style={{ height: 52, background: "var(--bg-main)", borderRadius: 8, marginBottom: 8, opacity: 0.5 }} />
              ))
            : alertas.length === 0
              ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 10, color: "var(--text-tertiary)" }}>
                  <FiCheckCircle size={32} color="var(--success)" style={{ opacity: 0.6 }} />
                  <p style={{ fontSize: 13, margin: 0, color: "var(--success)" }}>Todo en orden — sin alertas activas</p>
                </div>
              )
              : (() => {
                  const totalPagesAl = Math.ceil(alertas.length / ALERT_PER_PAGE);
                  const slice = alertas.slice((alertPage - 1) * ALERT_PER_PAGE, alertPage * ALERT_PER_PAGE);
                  return (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {slice.map((al, i) => {
                          const isError = al.nivel === "error";
                          const color   = isError ? "var(--danger)" : "var(--warning)";
                          return (
                            <div key={i} style={{
                              display: "flex", alignItems: "flex-start", gap: 12,
                              padding: "10px 12px", borderRadius: 10,
                              background: isError ? "rgba(239,68,68,.07)" : "rgba(234,179,8,.07)",
                              border: `1px solid ${isError ? "rgba(239,68,68,.2)" : "rgba(234,179,8,.2)"}`,
                            }}>
                              <span style={{ flexShrink: 0, marginTop: 2, color }}>
                                {al.tipo === "stock"    ? <FiPackage size={16} />
                                : al.tipo === "vencimiento" ? <FiCalendar size={16} />
                                : al.tipo === "inactivo"    ? <FiSlash size={16} />
                                : isError ? <FiXCircle size={16} /> : <FiAlertTriangle size={16} />}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 2 }}>{al.titulo}</div>
                                <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.4 }}>{al.detalle}</div>
                              </div>
                              {isError
                                ? <FiXCircle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                                : <FiAlertTriangle size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                              }
                            </div>
                          );
                        })}
                      </div>
                      <Pager page={alertPage} total={totalPagesAl} onChange={setAlertPage} />
                    </>
                  );
                })()
          }
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:.4 } 50% { opacity:.8 } }
      `}</style>
    </div>
  );
}
