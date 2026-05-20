import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers, FiDollarSign, FiTrendingUp, FiTrendingDown,
  FiAlertTriangle, FiShoppingCart, FiUserCheck, FiRefreshCw,
  FiAward, FiActivity,
} from "react-icons/fi";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getOwnerDashboard, getOwnerIngresos, getOwnerActividad } from "../../api/owner_gym";

// ─── helpers ───────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

const S = {
  page: {
    padding: "28px 32px",
    background: "var(--bg-dark,#0f1117)",
    minHeight: "100vh",
    color: "var(--text-primary,#f1f5f9)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 28,
  },
  title: { fontSize: 26, fontWeight: 700, margin: 0, color: "var(--text-primary,#f1f5f9)" },
  sub:   { fontSize: 13, color: "var(--text-secondary,#94a3b8)", marginTop: 4 },
  refreshBtn: {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
    background: "var(--bg-card,#1e2233)", border: "1px solid var(--border,rgba(255,255,255,.08))",
    borderRadius: 8, color: "var(--text-secondary,#94a3b8)", cursor: "pointer",
    fontSize: 13, transition: "all .2s",
  },
  grid4: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
    gap: 16, marginBottom: 28,
  },
  card: {
    background: "var(--bg-card,#1e2233)",
    border: "1px solid var(--border,rgba(255,255,255,.08))",
    borderRadius: 12, padding: "20px 22px",
  },
  cardLabel: { fontSize: 12, color: "var(--text-secondary,#94a3b8)", textTransform: "uppercase", letterSpacing: ".06em" },
  cardValue: { fontSize: 28, fontWeight: 700, margin: "8px 0 4px", color: "var(--text-primary,#f1f5f9)" },
  cardSub:   { fontSize: 12, color: "var(--text-tertiary,#64748b)" },
  grid2: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24,
  },
  section: {
    background: "var(--bg-card,#1e2233)",
    border: "1px solid var(--border,rgba(255,255,255,.08))",
    borderRadius: 12, padding: "20px 22px",
  },
  sectionTitle: { fontSize: 15, fontWeight: 600, marginBottom: 16, color: "var(--text-primary,#f1f5f9)" },
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
    background: "var(--bg-dark,#0f1117)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, flexShrink: 0,
  },
  actText: { flex: 1, fontSize: 13, color: "var(--text-primary,#f1f5f9)" },
  actDate: { fontSize: 11, color: "var(--text-tertiary,#64748b)" },
};

// ─── Tarjeta KPI ───────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accent = "#6366f1", loading }) {
  return (
    <div style={{ ...S.card, borderTop: `3px solid ${accent}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={S.cardLabel}>{label}</span>
        <span style={{ color: accent, fontSize: 20 }}>{icon}</span>
      </div>
      {loading
        ? <div style={{ height: 36, background: "var(--bg-dark,#0f1117)", borderRadius: 6, margin: "8px 0 4px", animation: "pulse 1.5s infinite" }} />
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
    <div style={{ background: "#1e2233", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ margin: 0, fontWeight: 600, marginBottom: 6, color: "#f1f5f9", fontSize: 13 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ margin: "3px 0", color: p.color, fontSize: 12 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [kpis,      setKpis]      = useState(null);
  const [ingresos,  setIngresos]  = useState([]);
  const [actividad, setActividad] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [kRes, iRes, aRes] = await Promise.all([
        getOwnerDashboard(),
        getOwnerIngresos(6),
        getOwnerActividad(8),
      ]);
      setKpis(kRes.data);
      setIngresos(iRes.data);
      setActividad(aRes.data);
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
          accent="#6366f1"
          loading={loading}
        />
        <KpiCard
          label="Ingresos del Mes"
          value={fmt(kpis?.ingresos?.mes_actual)}
          sub={
            <span style={{ color: varPositive ? "#22c55e" : "#ef4444" }}>
              {varPositive ? "▲" : "▼"} {Math.abs(variacion)}% vs mes anterior
            </span>
          }
          icon={<FiDollarSign />}
          accent="#22c55e"
          loading={loading}
        />
        <KpiCard
          label="Ventas POS (Mes)"
          value={fmt(kpis?.ventas_pos?.total_mes)}
          sub={`${kpis?.ventas_pos?.transacciones ?? 0} transacciones`}
          icon={<FiShoppingCart />}
          accent="#f59e0b"
          loading={loading}
        />
        <KpiCard
          label="Membresías por Vencer"
          value={kpis?.miembros?.por_vencer ?? "—"}
          sub="Próximos 7 días"
          icon={<FiAlertTriangle />}
          accent={kpis?.miembros?.por_vencer > 0 ? "#ef4444" : "#64748b"}
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
          accent="#64748b"
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              <Line type="monotone" dataKey="pagos"  name="Membresías" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ventas" name="POS"         stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Barras por mes */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Total por mes</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ingresos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actividad reciente + accesos rápidos */}
      <div style={S.grid2}>
        {/* Actividad */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Actividad Reciente</div>
          {loading
            ? [1,2,3,4].map(i => (
                <div key={i} style={{ height: 44, background: "var(--bg-dark,#0f1117)", borderRadius: 6, marginBottom: 8, opacity: 0.5 }} />
              ))
            : actividad.length === 0
              ? <p style={{ color: "#64748b", fontSize: 13 }}>Sin actividad reciente</p>
              : actividad.map((a, i) => (
                <div key={i} style={{ ...S.actRow, borderBottom: i === actividad.length - 1 ? "none" : undefined }}>
                  <div style={S.actIcon}>{a.icono}</div>
                  <div style={{ flex: 1 }}>
                    <div style={S.actText}>{a.texto}</div>
                    {a.metodo && <div style={S.actDate}>{a.metodo}</div>}
                  </div>
                  <div style={S.actDate}>{a.fecha ? a.fecha.slice(0, 10) : ""}</div>
                </div>
              ))
          }
        </div>

        {/* Accesos rápidos */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Accesos Rápidos</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Ver Miembros",      path: "/owner/members",     color: "#6366f1", icon: <FiUsers /> },
              { label: "Registrar Pago",    path: "/dashboard/payments", color: "#22c55e", icon: <FiDollarSign /> },
              { label: "Punto de Venta",    path: "/dashboard/pos",      color: "#f59e0b", icon: <FiShoppingCart /> },
              { label: "Staff",             path: "/owner/staff",        color: "#a855f7", icon: <FiAward /> },
              { label: "Membresías",        path: "/owner/memberships",  color: "#14b8a6", icon: <FiActivity /> },
              { label: "Perfil del Gym",    path: "/owner/profile",      color: "#0ea5e9", icon: <FiUserCheck /> },
            ].map(({ label, path, color, icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  background: `${color}11`, border: `1px solid ${color}33`,
                  borderRadius: 10, padding: "14px 12px",
                  cursor: "pointer", color,
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: 13, fontWeight: 600, transition: "all .2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${color}22`}
                onMouseLeave={e => e.currentTarget.style.background = `${color}11`}
              >
                <span style={{ fontSize: 18 }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:.4 } 50% { opacity:.8 } }
      `}</style>
    </div>
  );
}
