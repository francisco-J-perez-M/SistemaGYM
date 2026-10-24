import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardKPIs } from "../../api/dashboard";
import { getMembresiasPorExpirar } from "../../api/miembroMembresias";

// ── helpers ─────────────────────────────────────────────────────
const MES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const fmt  = (n) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });
const fmtM = (n) => "$" + fmt(n);

function last6Labels() {
  const m = new Date().getMonth();
  return Array.from({ length: 6 }, (_, i) => MES[(m - 5 + i + 12) % 12]);
}

// ── Estilos inline reutilizables ────────────────────────────────
const card = (extra = {}) => ({
  background: "var(--bg-card, #1a1d2e)",
  border: "1px solid var(--border, rgba(255,255,255,.08))",
  borderRadius: 14,
  padding: "20px 22px",
  ...extra,
});

const badge = (type = "pos") => {
  const map = {
    pos:  { bg: "rgba(16,185,129,.15)", color: "#10b981" },
    warn: { bg: "rgba(234,179,8,.15)",  color: "#eab308" },
    neg:  { bg: "rgba(239,68,68,.15)",  color: "#ef4444" },
    info: { bg: "rgba(99,102,241,.15)", color: "#818cf8" },
  };
  const c = map[type] || map.pos;
  return {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700,
    background: c.bg, color: c.color,
  };
};

// ── Sub-componentes ─────────────────────────────────────────────
function KpiCard({ label, value, valueColor, meta, badgeText, badgeType, progress, top }) {
  return (
    <div style={{ ...card(), borderTop: `3px solid ${top || "var(--accent, #6366f1)"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", letterSpacing: ".06em" }}>
          {label}
        </span>
        {badgeText && <span style={badge(badgeType)}>{badgeText}</span>}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: valueColor || "var(--text-primary, #f1f5f9)", letterSpacing: "-.02em", margin: "4px 0" }}>
        {value}
      </div>
      {meta && <p style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)", marginTop: 2 }}>{meta}</p>}
      {progress !== undefined && (
        <>
          <div style={{ height: 5, background: "var(--border, rgba(255,255,255,.08))", borderRadius: 99, overflow: "hidden", marginTop: 10 }}>
            <div style={{ width: `${Math.min(progress, 100)}%`, height: "100%", background: top || "var(--accent, #6366f1)", borderRadius: 99, transition: "width 1s ease" }} />
          </div>
          <span style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", float: "right", marginTop: 3 }}>{progress}%</span>
        </>
      )}
    </div>
  );
}

function RetentionCard({ retention, churn }) {
  const R = 36, C = 2 * Math.PI * R, filled = (retention / 100) * C;
  return (
    <div style={{ ...card(), borderTop: "3px solid #eab308" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", letterSpacing: ".06em" }}>
          Retención de clientes
        </span>
        <span style={badge("pos")}>+2.4%</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10 }}>
        <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={R} fill="none" stroke="var(--border, rgba(255,255,255,.08))" strokeWidth="9" />
            <circle cx="44" cy="44" r={R} fill="none" stroke="#6366f1" strokeWidth="9"
              strokeDasharray={`${filled} ${C}`} strokeDashoffset={C / 4} strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1.2s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "var(--text-primary, #f1f5f9)" }}>
            {retention}%
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: `Renuevan (${retention}%)`, color: "#6366f1" },
            { label: `Se van (${churn}%)`,       color: "var(--border, rgba(255,255,255,.15))" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChart({ revenues, expenses, labels }) {
  const max = Math.max(...revenues, 1);
  const avg = Math.round(revenues.reduce((a, v) => a + v, 0) / (revenues.length || 1));
  const best = Math.max(...revenues);
  return (
    <div style={card({ flex: "1 1 0" })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)" }}>Ingresos vs. Gastos — últimos 6 meses</span>
        <div style={{ display: "flex", gap: 12 }}>
          {[{ color: "#6366f1", label: "Ingresos" }, { color: "#475569", label: "Gastos" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary, #94a3b8)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: "inline-block" }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, paddingBottom: 4 }}>
        {revenues.map((rev, i) => {
          const rh = Math.round((rev / max) * 100);
          const eh = expenses[i] ? Math.round((expenses[i] / max) * 60) : 0;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 2, height: "100%" }}>
              <div style={{ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2, flex: 1 }}>
                <div title={`$${fmt(rev)}`} style={{ width: "45%", height: `${rh}%`, background: "#6366f1", borderRadius: "4px 4px 0 0", minHeight: 2, cursor: "pointer", transition: "opacity .2s" }} />
                <div title="Gastos est." style={{ width: "45%", height: `${eh}%`, background: "#475569", borderRadius: "4px 4px 0 0", minHeight: 2, opacity: .7 }} />
              </div>
              <span style={{ fontSize: 10, color: "var(--text-secondary, #94a3b8)" }}>{labels[i]}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border, rgba(255,255,255,.08))", marginTop: 8 }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Promedio mensual</p>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#818cf8" }}>{fmtM(avg)}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Mejor mes</p>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#10b981" }}>{fmtM(best)}</p>
        </div>
      </div>
    </div>
  );
}

function PeakChart({ data }) {
  const max = Math.max(...data, 1);
  const labels = data.map((_, i) => `${6 + i * 2}h`);
  const peakIdx = data.indexOf(max);
  return (
    <div style={card({ width: 280, flexShrink: 0 })}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)", display: "block", marginBottom: 18 }}>Horas pico del día</span>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
        {data.map((h, i) => {
          const pct = Math.round((h / max) * 100);
          const isPeak = i === peakIdx;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <div style={{ width: "100%", height: `${pct}%`, background: isPeak ? "#6366f1" : "#334155", borderRadius: "3px 3px 0 0", minHeight: 2, opacity: isPeak ? 1 : .55 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        {labels.map((l, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "var(--text-secondary, #94a3b8)" }}>{l}</div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--bg-input, rgba(255,255,255,.05))", borderRadius: 8, fontSize: 12, color: "var(--text-secondary, #94a3b8)" }}>
        Pico máximo: <strong style={{ color: "var(--text-primary, #f1f5f9)" }}>
          {labels[peakIdx]} – {labels[Math.min(peakIdx + 1, labels.length - 1)]}
        </strong>
      </div>
    </div>
  );
}

function ExpiringTable({ members }) {
  const rows = Array.isArray(members) ? members : members?.data || [];
  if (!rows.length) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-secondary, #94a3b8)", fontSize: 13 }}>
        ✓ Sin membresías por vencer en los próximos 7 días
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.08))" }}>
            {["Miembro", "Plan", "Vencimiento", "Estado"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => (
            <tr key={m.id || i} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.05))" }}>
              <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary, #f1f5f9)" }}>{m.miembro}</td>
              <td style={{ padding: "10px 12px", color: "var(--text-secondary, #94a3b8)" }}>{m.plan}</td>
              <td style={{ padding: "10px 12px", color: "var(--text-secondary, #94a3b8)" }}>{m.fecha_fin}</td>
              <td style={{ padding: "10px 12px" }}>
                <span style={badge(m.status === "urgent" ? "neg" : "warn")}>
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

function Skeleton({ h = 20, w = "100%", mb = 0 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6, marginBottom: mb,
      background: "linear-gradient(90deg, rgba(255,255,255,.05) 25%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.05) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ── MAIN ────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    retention: 87, churn: 13,
    activeMembers: 0, monthlyRevenue: 0, revenueGoal: 50000,
    kpiRevenue: [0,0,0,0,0,0], kpiExpenses: [15,20,18,25,22,28],
    peakHours: [10,30,80,50,20,40,90,100,60,20],
    expiringMembers: [],
  });

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  })();
  const initials = (user.nombre || "A").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/", { replace: true }); return; }
    (async () => {
      try {
        const [kpiRes, expRes] = await Promise.all([
          getDashboardKPIs(),
          getMembresiasPorExpirar(7),
        ]);
        const rev = Array.isArray(kpiRes?.revenue_6_months) ? kpiRes.revenue_6_months : [];
        const exp = Array.isArray(expRes?.data) ? expRes.data : Array.isArray(expRes) ? expRes : [];
        setData(prev => ({
          ...prev,
          activeMembers:  kpiRes?.active_members  ?? 0,
          monthlyRevenue: kpiRes?.monthly_revenue  ?? 0,
          kpiRevenue:     rev.length ? rev : prev.kpiRevenue,
          expiringMembers: exp,
        }));
      } catch (e) {
        console.error("Dashboard error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const labels  = last6Labels();
  const goalPct = Math.min(Math.round((data.monthlyRevenue / data.revenueGoal) * 100), 100);
  const dateStr = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <>
      {/* Shimmer keyframe */}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 28px", borderBottom: "1px solid var(--border, rgba(255,255,255,.08))",
        background: "var(--bg-dark, #0f1117)", flexShrink: 0, position: "sticky", top: 0, zIndex: 50,
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary, #f1f5f9)", margin: 0 }}>Panel Administrativo</h1>
          <p style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)", margin: "2px 0 0" }}>Resumen en tiempo real</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)", padding: "5px 12px", border: "1px solid var(--border, rgba(255,255,255,.08))", borderRadius: 8 }}>
            {dateStr}
          </span>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
            {initials}
          </div>
        </div>
      </header>

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <main style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, minHeight: 0 }}>

        {/* KPI Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={card()}>
                <Skeleton h={12} w="60%" mb={12} />
                <Skeleton h={32} w="50%" mb={8} />
                <Skeleton h={10} w="40%" />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            <RetentionCard retention={data.retention} churn={data.churn} />
            <KpiCard
              label="Ingresos mes actual"
              value={fmtM(data.monthlyRevenue)}
              valueColor="#10b981"
              meta={`Meta: ${fmtM(data.revenueGoal)}`}
              badgeText={`${goalPct}% meta`}
              badgeType={goalPct >= 90 ? "pos" : goalPct >= 60 ? "warn" : "neg"}
              progress={goalPct}
              top="#10b981"
            />
            <KpiCard
              label="Miembros activos"
              value={fmt(data.activeMembers)}
              valueColor="#818cf8"
              meta="Con membresía vigente"
              badgeText="↑ 12%"
              badgeType="pos"
              top="#6366f1"
            />
            <KpiCard
              label="Ocupación promedio"
              value="74%"
              valueColor="#eab308"
              meta="Basado en última semana"
              badgeText="↔ estable"
              badgeType="warn"
              top="#eab308"
            />
          </div>
        )}

        {/* Charts Row */}
        {loading ? (
          <div style={{ display: "flex", gap: 16 }}>
            <div style={card({ flex: "1 1 0" })}><Skeleton h={160} /></div>
            <div style={card({ width: 280, flexShrink: 0 })}><Skeleton h={160} /></div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
            <BarChart revenues={data.kpiRevenue} expenses={data.kpiExpenses} labels={labels} />
            <PeakChart data={data.peakHours} />
          </div>
        )}

        {/* Expiring Memberships */}
        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)" }}>
              Membresías próximas a vencer
            </span>
            <span style={badge("warn")}>
              {data.expiringMembers.length} membresía(s)
            </span>
          </div>
          {loading ? <Skeleton h={80} /> : <ExpiringTable members={data.expiringMembers} />}
        </div>

      </main>
    </>
  );
}
