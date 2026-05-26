import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import "../../css/CSSUnificado.css";

const API = "";
const token = () => localStorage.getItem("token");

/* ─── Colores ──────────────────────────────────────────────────────────── */
const COLORS = ["#fbe379", "#4cd964", "#38bdf8", "#ff6b9d", "#a78bfa", "#fb8c00"];
const DIAS   = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/* ─── Tooltip personalizado ────────────────────────────────────────────── */
const CTip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-dark)",
      borderRadius: 8, padding: "10px 14px", fontSize: 13,
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

/* ─── Sección con título y subtítulo amigable ──────────────────────────── */
function Section({ icon, title, subtitle, children, loading, error, onRetry }) {
  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: 16,
      border: "1px solid var(--border-dark)", padding: "28px 28px 24px",
      marginBottom: 28,
    }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h2>
        </div>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.5 }}>{subtitle}</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "32px 0", color: "var(--text-secondary)" }}>
          <div className="dashboard-spinner" style={{ width: 22, height: 22 }} />
          <span>Calculando datos, un momento…</span>
        </div>
      ) : error ? (
        <div style={{ padding: "20px 0" }}>
          <p style={{ color: "var(--danger-color)", marginBottom: 12 }}>No se pudo cargar esta sección.</p>
          {onRetry && (
            <button className="btn-outline" onClick={onRetry} style={{ fontSize: 13 }}>
              Intentar de nuevo
            </button>
          )}
        </div>
      ) : children}
    </div>
  );
}

/* ─── KPI Card pequeña ─────────────────────────────────────────────────── */
function KPICard({ label, value, sub, color = "var(--accent)" }) {
  return (
    <div style={{
      background: "var(--bg-input)", borderRadius: 12,
      border: "1px solid var(--border-dark)", padding: "16px 20px",
      flex: "1 1 160px", minWidth: 150,
    }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ReceptionistAnalytics() {
  /* ── Estado MapReduce ── */
  const [mrData,    setMrData]    = useState(null);
  const [mrLoad,    setMrLoad]    = useState(true);
  const [mrErr,     setMrErr]     = useState(null);

  /* ── Estado K-Means ── */
  const [kmData,    setKmData]    = useState(null);
  const [kmLoad,    setKmLoad]    = useState(true);
  const [kmErr,     setKmErr]     = useState(null);

  /* ── Estado Regresión ── */
  const [regData,   setRegData]   = useState(null);
  const [regLoad,   setRegLoad]   = useState(true);
  const [regErr,    setRegErr]    = useState(null);

  /* ─── Fetchers ─────────────────────────────────────────────────────────── */
  const fetchMapReduce = useCallback(async () => {
    setMrLoad(true); setMrErr(null);
    try {
      const r = await fetch(`${API}/api/analytics/mapreduce`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!r.ok) throw new Error(`${r.status}`);
      setMrData(await r.json());
    } catch (e) { setMrErr(e.message); }
    finally { setMrLoad(false); }
  }, []);

  const fetchKMeans = useCallback(async () => {
    setKmLoad(true); setKmErr(null);
    try {
      const r = await fetch(`${API}/api/analytics/kmeans?k=3`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!r.ok) throw new Error(`${r.status}`);
      setKmData(await r.json());
    } catch (e) { setKmErr(e.message); }
    finally { setKmLoad(false); }
  }, []);

  const fetchRegresion = useCallback(async () => {
    setRegLoad(true); setRegErr(null);
    try {
      const r = await fetch(`${API}/api/analytics/regresion`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!r.ok) throw new Error(`${r.status}`);
      setRegData(await r.json());
    } catch (e) { setRegErr(e.message); }
    finally { setRegLoad(false); }
  }, []);

  useEffect(() => {
    fetchMapReduce();
    fetchKMeans();
    fetchRegresion();
  }, [fetchMapReduce, fetchKMeans, fetchRegresion]);

  /* ─── Datos derivados — MapReduce ─────────────────────────────────────── */
  const resumenIngresos   = mrData?.resumen_ingresos          || [];
  const ingresosPorPeriodo = mrData?.ingresos_por_periodo     || [];
  const asistenciaDia     = mrData?.asistencia_por_dia_semana || [];
  const asistenciaMes     = mrData?.asistencia_por_mes        || [];

  const mesActual  = resumenIngresos[resumenIngresos.length - 1];
  const mesAnterior = resumenIngresos[resumenIngresos.length - 2];
  const totalMes   = mesActual?.total_periodo || mesActual?.total || 0;
  const totalPrev  = mesAnterior?.total_periodo || mesAnterior?.total || 0;
  const varPct     = totalPrev ? (((totalMes - totalPrev) / totalPrev) * 100).toFixed(1) : null;

  const lineData = resumenIngresos.map(i => ({
    mes: (i.periodo || i.mes || "").slice(0, 7),
    total: i.total_periodo || i.total || 0,
  }));

  const metodosMap = {};
  ingresosPorPeriodo.forEach(item => {
    const m = item.metodo_pago || "Otro";
    metodosMap[m] = (metodosMap[m] || 0) + (item.total_ingresos || item.total || 0);
  });
  const metodosData = Object.entries(metodosMap).map(([name, value]) => ({ name, value }));

  const diasOrdenados = DIAS.map(dia => {
    const found = asistenciaDia.find(d =>
      (d.dia_semana || d.dia || "").toLowerCase().startsWith(dia.toLowerCase().slice(0, 3).normalize("NFD").replace(/[̀-ͯ]/g, ""))
    );
    return { dia, total: found?.total_visitas || found?.total || 0 };
  });
  const diaMasConcurrido = [...asistenciaDia].sort((a, b) =>
    (b.total_visitas || b.total || 0) - (a.total_visitas || a.total || 0)
  )[0];
  const diaNombre = diaMasConcurrido?.dia_semana || diaMasConcurrido?.dia || "—";

  const totalAsistenciaMes = asistenciaMes.reduce((s, m) => s + (m.total_visitas || m.total || 0), 0);

  /* ─── Datos derivados — K-Means ───────────────────────────────────────── */
  const clusters     = kmData?.clusters || [];
  const totalMiembros = clusters.reduce((s, c) => s + (c.tamaño || c.size || 0), 0);
  const silhouette   = kmData?.silhouette_score ?? null;

  /* Etiquetas amigables: mapea el nombre técnico del cluster a texto claro */
  function clusterLabel(nombre = "") {
    const n = nombre.toLowerCase();
    if (n.includes("principi") || n.includes("alta prioridad")) return "Nuevos / Necesitan atención";
    if (n.includes("intermedio") || n.includes("mantenimiento")) return "En progreso / Regulares";
    if (n.includes("avanzado") || n.includes("optimización") || n.includes("optimizacion")) return "Veteranos / Autónomos";
    if (n.includes("elite") || n.includes("rendimiento")) return "Élite / Alto rendimiento";
    if (n.includes("senior") || n.includes("bajo impacto")) return "Senior / Ritmo suave";
    if (n.includes("recuper")) return "En recuperación";
    if (n.includes("hipertrofia") || n.includes("volumen")) return "Ganancia muscular";
    if (n.includes("corte") || n.includes("definición") || n.includes("definicion")) return "Pérdida de peso";
    return nombre; // fallback
  }

  const clusterColors = ["#4cd964", "#38bdf8", "#fbe379", "#ff6b9d", "#a78bfa"];

  /* ─── Datos derivados — Regresión ─────────────────────────────────────── */
  const metricas   = regData?.metricas || {};
  const r2         = metricas?.r2 ?? null;
  const rmse       = metricas?.rmse ?? null;
  const maeVal     = metricas?.mae ?? null;
  const nRegistros = metricas?.n_registros || metricas?.n || 0;

  function r2Label(r2) {
    if (r2 === null) return { text: "Sin datos", color: "var(--text-secondary)" };
    if (r2 >= 0.85) return { text: "Muy preciso ✓", color: "var(--success-color)" };
    if (r2 >= 0.65) return { text: "Buena precisión", color: "var(--accent)" };
    if (r2 >= 0.4)  return { text: "Precisión moderada", color: "var(--warning-color)" };
    return { text: "Se necesitan más datos", color: "var(--danger-color)" };
  }
  const r2Info = r2Label(r2);

  /* ─── Render ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Encabezado */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>
          📊 Análisis del Gimnasio
        </h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
          Aquí encontrarás un resumen claro de cómo va tu gimnasio: ingresos, tipos de clientes y
          predicciones de progreso. Toda la información está presentada en lenguaje sencillo.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECCIÓN 1 — INGRESOS Y ASISTENCIA
          ══════════════════════════════════════════════════════════════════════ */}
      <Section
        icon="💰"
        title="Ingresos y Visitas"
        subtitle="¿Cuánto dinero está entrando al gimnasio y cuándo vienen más tus clientes?"
        loading={mrLoad}
        error={mrErr}
        onRetry={fetchMapReduce}
      >
        {/* KPIs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 28 }}>
          <KPICard
            label="Ingresos este mes"
            value={`$${totalMes.toLocaleString("es-MX")}`}
            sub={varPct !== null
              ? varPct > 0
                ? `▲ ${varPct}% vs. mes anterior`
                : `▼ ${Math.abs(varPct)}% vs. mes anterior`
              : "Primer mes registrado"}
            color={varPct !== null && varPct > 0 ? "var(--success-color)" : "var(--accent)"}
          />
          <KPICard
            label="Visitas totales registradas"
            value={totalAsistenciaMes.toLocaleString("es-MX")}
            sub="Suma de todos los check-ins"
          />
          <KPICard
            label="Día más concurrido"
            value={diaNombre}
            sub="El día que más clientes llegan"
            color="var(--accent)"
          />
          {metodosData[0] && (
            <KPICard
              label="Forma de pago más usada"
              value={metodosData[0].name}
              sub={`$${metodosData[0].value.toLocaleString("es-MX")} acumulado`}
              color="#38bdf8"
            />
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Ingresos por mes */}
          <div>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              Ingresos por mes
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
                <XAxis dataKey="mes" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <Tooltip content={<CTip prefix="$" />} />
                <Line type="monotone" dataKey="total" name="Ingreso" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Visitas por día de semana */}
          <div>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              ¿Qué días vienen más clientes?
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={diasOrdenados}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
                <XAxis dataKey="dia" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <Tooltip content={<CTip suffix=" visitas" />} />
                <Bar dataKey="total" name="Visitas" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Formas de pago */}
        {metodosData.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              ¿Cómo pagan tus clientes?
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={metodosData} dataKey="value" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                    {metodosData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v.toLocaleString("es-MX")}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {metodosData.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{
                      width: 12, height: 12, borderRadius: "50%",
                      background: COLORS[i % COLORS.length], flexShrink: 0,
                    }} />
                    <span style={{ color: "var(--text-primary)" }}>{m.name}</span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      — ${m.value.toLocaleString("es-MX")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECCIÓN 2 — TIPOS DE CLIENTES
          ══════════════════════════════════════════════════════════════════════ */}
      <Section
        icon="👥"
        title="Tipos de Clientes"
        subtitle="El sistema agrupa automáticamente a tus miembros según su nivel de actividad y condición física. Esto te ayuda a saber a quién darle más atención."
        loading={kmLoad}
        error={kmErr}
        onRetry={fetchKMeans}
      >
        {/* Calidad del análisis */}
        {silhouette !== null && (
          <div style={{
            background: "var(--bg-input)", borderRadius: 10,
            border: "1px solid var(--border-dark)", padding: "12px 18px",
            marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Confiabilidad del análisis:</span>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: silhouette >= 0.5 ? "var(--success-color)"
                : silhouette >= 0.3 ? "var(--warning-color)" : "var(--danger-color)",
            }}>
              {silhouette >= 0.7 ? "Muy alta ✓"
                : silhouette >= 0.5 ? "Alta"
                : silhouette >= 0.3 ? "Media — necesitas más datos"
                : "Baja — agrega más registros físicos"}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              ({(silhouette * 100).toFixed(0)}%)
            </span>
          </div>
        )}

        {clusters.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            No hay suficientes datos de composición corporal para analizar grupos. Pide a los miembros que registren su peso y estatura.
          </p>
        ) : (
          <>
            {/* Gráfico de distribución */}
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 28, alignItems: "center", marginBottom: 24 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={clusters.map(c => ({
                    name: clusterLabel(c.perfil || c.label || `Grupo ${c.cluster_id + 1}`),
                    value: c.tamaño || c.size || 0,
                  }))} dataKey="value" cx="50%" cy="50%" outerRadius={85} paddingAngle={3}>
                    {clusters.map((_, i) => <Cell key={i} fill={clusterColors[i % clusterColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} miembros`} />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {clusters.map((c, i) => {
                  const label   = clusterLabel(c.perfil || c.label || `Grupo ${c.cluster_id + 1}`);
                  const size    = c.tamaño || c.size || 0;
                  const pct     = totalMiembros ? ((size / totalMiembros) * 100).toFixed(0) : 0;
                  const color   = clusterColors[i % clusterColors.length];
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: "var(--bg-input)", borderRadius: 10,
                      border: `1px solid ${color}33`, padding: "12px 16px",
                    }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          {size} miembros · {pct}% del total
                        </div>
                      </div>
                      {/* Barra de progreso */}
                      <div style={{ width: 80, height: 6, background: "var(--border-dark)", borderRadius: 4 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consejo accionable */}
            <div style={{
              background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.25)",
              borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}>
              💡 <strong style={{ color: "var(--text-primary)" }}>¿Para qué sirve esto?</strong>{" "}
              Conociendo qué tipo de clientes tienes, puedes enfocar promociones y atención.
              Por ejemplo, los clientes del grupo <em>"{clusters[0] && clusterLabel(clusters[0].perfil || clusters[0].label || "Grupo 1")}"</em>{" "}
              pueden necesitar más seguimiento por parte del equipo.
            </div>
          </>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECCIÓN 3 — PREDICCIÓN DE PROGRESO
          ══════════════════════════════════════════════════════════════════════ */}
      <Section
        icon="📈"
        title="Predicción de Progreso de Miembros"
        subtitle="Con base en los registros de peso de tus clientes, el sistema puede estimar cómo evolucionará su peso en el tiempo. Esto te ayuda a detectar quién está progresando bien y quién necesita apoyo."
        loading={regLoad}
        error={regErr}
        onRetry={fetchRegresion}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
          <KPICard
            label="Precisión del modelo"
            value={r2 !== null ? `${(r2 * 100).toFixed(0)}%` : "—"}
            sub={r2Info.text}
            color={r2Info.color}
          />
          <KPICard
            label="Registros de progreso"
            value={nRegistros.toLocaleString("es-MX")}
            sub="Mediciones de peso guardadas"
            color="#38bdf8"
          />
          {rmse !== null && (
            <KPICard
              label="Margen de error promedio"
              value={`±${rmse.toFixed(1)} kg`}
              sub="Diferencia típica entre predicción y realidad"
              color="var(--warning-color)"
            />
          )}
        </div>

        {/* Explicación en lenguaje simple */}
        <div style={{
          background: "var(--bg-input)", borderRadius: 12,
          border: "1px solid var(--border-dark)", padding: "18px 22px",
        }}>
          <p style={{ margin: "0 0 10px", fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
            ¿Qué significa esto?
          </p>
          {r2 === null || nRegistros < 10 ? (
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7 }}>
              Todavía no hay suficientes registros de progreso para hacer predicciones confiables.
              Anima a tus miembros a registrar su peso regularmente desde su perfil. Con al menos
              10–20 mediciones por miembro, el sistema comenzará a funcionar.
            </p>
          ) : r2 >= 0.65 ? (
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7 }}>
              ✅ El modelo tiene suficientes datos para hacer predicciones útiles. Los entrenadores
              pueden usarlo para saber si un miembro va en buen camino o si necesita ajustar su
              rutina de alimentación y ejercicio.{" "}
              {rmse && `La predicción puede tener una diferencia de ±${rmse.toFixed(1)} kg respecto al peso real.`}
            </p>
          ) : (
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7 }}>
              ⚠️ El modelo funciona, pero aún necesita más datos para mejorar su precisión.
              Cuantos más miembros registren su progreso de peso, más exactas serán las
              predicciones.{" "}
              {rmse && `Por ahora, el margen de error es de ±${rmse.toFixed(1)} kg.`}
            </p>
          )}
        </div>

        <div style={{
          marginTop: 16, background: "rgba(251,227,121,0.07)",
          border: "1px solid rgba(251,227,121,0.2)", borderRadius: 10,
          padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6,
        }}>
          💡 Para ver la predicción de un miembro específico, ve al módulo de <strong style={{ color: "var(--text-primary)" }}>Predicción de peso</strong> en el panel del usuario o pide al entrenador que la consulte desde su panel.
        </div>
      </Section>

      {/* ── Nota al pie ─────────────────────────────────────────────────────── */}
      <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
        Los datos se actualizan automáticamente cada 24 horas. Si acabas de registrar nuevo contenido,
        los cambios se verán reflejados al día siguiente.
      </p>
    </div>
  );
}
