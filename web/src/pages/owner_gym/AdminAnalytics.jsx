/**
 * AdminAnalytics.jsx — Dashboard unificado de Analytics con Recharts
 * Sprint 4 / US17
 *
 * Tabs: MapReduce (ingresos + asistencia) | K-Means (clusters) | Regresion | Cancelaciones
 * Los datos se cargan desde los endpoints existentes de Spark.
 */
import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { FiDollarSign, FiUsers, FiTrendingUp, FiBell, FiClock, FiActivity } from "react-icons/fi";
import "../../css/CSSUnificado.css";

const API_BASE   = "";
const ACCENT     = "#fbe379";
const SUCCESS    = "#4cd964";
const INFO       = "#38bdf8";
const DANGER     = "#ff6b9d";
const WARNING    = "#ffbd2e";
const PURPLE     = "#a78bfa";
const PALETTE    = [ACCENT, SUCCESS, INFO, DANGER, WARNING, PURPLE, "#fb923c", "#34d399"];

// Cuando el superadmin analiza un gimnasio concreto, guarda su id en
// localStorage("sa_gym_id"). Este helper añade la cabecera X-Gym-ID sólo en ese
// caso; para un usuario de gimnasio (sin sa_gym_id) no cambia nada.
export const gymHeader = () => {
  const g = typeof localStorage !== "undefined" ? localStorage.getItem("sa_gym_id") : null;
  return g ? { "X-Gym-ID": g } : {};
};

// ─── Tooltip personalizado ────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-dark)",
      borderRadius: 8, padding: "10px 14px", fontSize: 13,
    }}>
      {label && <p style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => p.value != null && (
        <p key={i} style={{ color: p.color || ACCENT, fontWeight: 500, margin: "2px 0" }}>
          {p.name}: {prefix}{typeof p.value === "number"
            ? p.value.toLocaleString("es-MX", { maximumFractionDigits: 2 })
            : p.value}{suffix}
        </p>
      ))}
    </div>
  );
};

// ─── Helpers UI ───────────────────────────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <h3 style={{ color: ACCENT, fontSize: 15, fontWeight: 600, marginBottom: 12, marginTop: 24 }}>
    {children}
  </h3>
);

const StatCard = ({ label, value, color = ACCENT, suffix = "" }) => (
  <div style={{
    background: "var(--bg-card)", border: "1px solid var(--border-dark)",
    borderRadius: 10, padding: "14px 18px", flex: 1, minWidth: 130,
  }}>
    <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}>{label}</div>
    <div style={{ color, fontSize: 22, fontWeight: 700 }}>{value}{suffix}</div>
  </div>
);

const ErrorBox = ({ msg }) => (
  <div style={{
    background: "rgba(255,77,77,0.1)", border: "1px solid var(--danger-color)",
    borderRadius: 8, padding: "14px 18px", color: "var(--danger-color)", fontSize: 14,
  }}>
    {msg}
  </div>
);

// Mensaje amigable cuando faltan datos (no es un error real del sistema)
const NoDataBox = ({ icon, title, description, onRetry }) => (
  <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-secondary)" }}>
    <div style={{ fontSize: 44, marginBottom: 14, opacity: .35 }}>{icon}</div>
    <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", margin: "0 0 8px" }}>{title}</p>
    <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 380, margin: "0 auto 20px", lineHeight: 1.6 }}>{description}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{ padding: "8px 20px", background: "var(--accent-dim)", border: "1px solid var(--accent)", color: "var(--accent-soft)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
      >
        Volver a intentar
      </button>
    )}
  </div>
);

const LoadingSpinner = () => (
  <div style={{ textAlign: "center", padding: 48, color: "var(--text-secondary)" }}>
    <div style={{ fontSize: 32, marginBottom: 8 }}>⟳</div>
    Cargando análisis…
  </div>
);

const TrainBtn = ({ loading, onClick, label = "Reentrenar modelo" }) => (
  <button
    onClick={onClick}
    disabled={loading}
    style={{
      background: loading ? "var(--bg-input)" : ACCENT,
      color: loading ? "var(--text-secondary)" : "#000",
      border: "none", borderRadius: 8, padding: "8px 20px",
      fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
    }}
  >
    {loading ? "Procesando…" : label}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// TAB: MapReduce
// ─────────────────────────────────────────────────────────────────────────────
function TabMapReduce() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [trainLoading, setTL]     = useState(false);
  const [error, setError]         = useState(null);
  const [trainMsg, setTrainMsg]   = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, ...gymHeader() };

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null); setTrainMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/analytics/mapreduce`, { headers });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const handleTrain = async () => {
    setTL(true); setTrainMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/analytics/mapreduce/train`, { method: "POST", headers });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setData(j); setTrainMsg("Modelo actualizado");
    } catch (e) { setError(e.message); }
    finally { setTL(false); }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  // Preparar datos: agrupar ingresos por periodo sumando todos los metodos
  const ingresosAgrupados = data
    ? Object.values(
        (data.ingresos_por_periodo || []).reduce((acc, row) => {
          const k = row.periodo;
          if (!acc[k]) acc[k] = { periodo: k, total: 0, pagos: 0 };
          acc[k].total += row.total_ingresos || 0;
          acc[k].pagos += row.num_pagos || 0;
          return acc;
        }, {})
      ).sort((a, b) => a.periodo.localeCompare(b.periodo)).slice(-12)
    : [];

  // Agrega ingresos por metodo_pago sumando todos los periodos
  const resumenMetodos = data
    ? Object.values(
        (data.ingresos_por_periodo || []).reduce((acc, row) => {
          const k = row.metodo_pago || "Sin especificar";
          if (!acc[k]) acc[k] = { name: k, value: 0 };
          acc[k].value += row.total_ingresos || 0;
          return acc;
        }, {})
      )
    : [];

  const asistenciaDia = data
    ? (data.asistencia_por_dia_semana || [])
        .map(r => ({ dia: r.dia_semana, visitas: r.total_visitas }))
    : [];

  if (loading) return <LoadingSpinner />;
  if (error || !data) return (
    <NoDataBox
      icon={<FiDollarSign />}
      title="Todavía no hay datos de ingresos y visitas"
      description="Registra pagos y asistencias de tus miembros para ver aquí el resumen de ingresos, métodos de pago y días con más actividad en el gimnasio."
      onRetry={fetchData}
    />
  );

  const totalIngresos = ingresosAgrupados.reduce((s, r) => s + r.total, 0);
  const totalPagos    = ingresosAgrupados.reduce((s, r) => s + r.pagos, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Ingresos totales (12 meses)" value={`$${totalIngresos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`} />
        <StatCard label="Pagos procesados" value={totalPagos} color={SUCCESS} />
        <StatCard label="Métodos de pago" value={resumenMetodos.length} color={INFO} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <TrainBtn loading={trainLoading} onClick={handleTrain} label="Actualizar datos" />
          {trainMsg && <span style={{ color: SUCCESS, fontSize: 13 }}>{trainMsg}</span>}
        </div>
      </div>

      <SectionTitle>Ingresos mensuales (últimos 12 meses)</SectionTitle>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={ingresosAgrupados} margin={{ left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
          <XAxis dataKey="periodo" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                 tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip prefix="$" />} />
          <Bar dataKey="total" name="Ingresos" fill={ACCENT} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 8 }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <SectionTitle>Ingresos por método de pago</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={resumenMetodos} dataKey="value" nameKey="name"
                   cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) =>
                     `${name} ${(percent*100).toFixed(0)}%`}>
                {resumenMetodos.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={v => [`$${v.toLocaleString("es-MX")}`, "Ingresos"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <SectionTitle>Asistencia por día de la semana</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={asistenciaDia} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
              <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <YAxis type="category" dataKey="dia" width={80}
                     tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip suffix=" visitas" />} />
              <Bar dataKey="visitas" name="Visitas" fill={SUCCESS} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: K-Means
// ─────────────────────────────────────────────────────────────────────────────
export function TabKMeans() {
  const [kValue, setKValue]       = useState(3);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [trainLoading, setTL]     = useState(false);
  const [error, setError]         = useState(null);
  const [trainMsg, setTrainMsg]   = useState(null);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, ...gymHeader() };

  const fetchData = useCallback(async (k) => {
    setLoading(true); setError(null); setTrainMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/analytics/kmeans?k=${k}`, { headers });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const handleTrain = async () => {
    setTL(true); setTrainMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/analytics/kmeans/train?k=${kValue}`, {
        method: "POST", headers,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setData(j); setTrainMsg("Grupos actualizados correctamente.");
    } catch (e) { setError(e.message); }
    finally { setTL(false); }
  };

  useEffect(() => { fetchData(kValue); }, [kValue, fetchData]);

  const resumen = data?.resumen_clusters || [];

  const clusterBarData = resumen.map(c => ({
    name:    c.etiqueta || `Cluster ${c.cluster_id}`,
    Miembros: c.num_miembros,
    IMC:     parseFloat((c.imc_promedio || 0).toFixed(1)),
    Peso:    parseFloat((c.peso_promedio || 0).toFixed(1)),
    Grasa:   parseFloat((c.grasa_promedio || 0).toFixed(1)),
  }));

  if (loading) return <LoadingSpinner />;
  if (error || !data) return (
    <NoDataBox
      icon={<FiUsers />}
      title="Se necesitan más miembros con datos de progreso"
      description="El análisis de grupos requiere que varios miembros tengan registradas medidas físicas (peso, grasa corporal). Una vez que haya suficientes registros, aquí verás cómo se clasifican según su condición física."
      onRetry={() => fetchData(kValue)}
    />
  );

  const sil = data.silhouette ?? 0;
  const silConfig = {
    color: sil >= 0.5 ? SUCCESS : sil >= 0.3 ? WARNING : DANGER,
    label: sil >= 0.7 ? "Grupos muy bien definidos"
         : sil >= 0.5 ? "Grupos bien definidos"
         : sil >= 0.3 ? "Grupos moderados"
         : "Grupos poco diferenciados",
  };

  return (
    <div>
      {/* Explicación para el dueño */}
      <div style={{ background: "rgba(251,227,121,.07)", border: "1px solid rgba(251,227,121,.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-primary)" }}>¿Qué hace este análisis?</strong>{" "}
        Agrupa a tus miembros según su condición física (peso, grasa corporal, IMC) para que puedas diseñar
        rutinas y planes de nutrición más personalizados para cada grupo.
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
        <StatCard label="Calidad de los grupos" value={silConfig.label} color={silConfig.color} />
        <StatCard label="Grupos detectados" value={kValue} color={INFO} />
        <StatCard label="Miembros analizados" value={(data.asignaciones || []).length} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ color: "var(--text-secondary)", fontSize: 13 }}>K =</label>
          {[2,3,4,5,6].map(k => (
            <button key={k} onClick={() => setKValue(k)} style={{
              background: k === kValue ? ACCENT : "var(--bg-input)",
              color: k === kValue ? "#000" : "var(--text-primary)",
              border: "none", borderRadius: 6, padding: "6px 14px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>{k}</button>
          ))}
          <TrainBtn loading={trainLoading} onClick={handleTrain} label="Actualizar grupos" />
          {trainMsg && <span style={{ color: SUCCESS, fontSize: 13 }}>{trainMsg}</span>}
        </div>
      </div>

      <SectionTitle>Distribución de miembros por grupo</SectionTitle>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={clusterBarData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
          <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
          <Bar dataKey="Miembros" fill={ACCENT} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      <SectionTitle>Métricas promedio por grupo</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={clusterBarData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
          <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
          <Bar dataKey="IMC"   fill={INFO}    radius={[4,4,0,0]} />
          <Bar dataKey="Peso"  fill={SUCCESS} radius={[4,4,0,0]} />
          <Bar dataKey="Grasa" fill={DANGER}  radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      <SectionTitle>Detalle de grupos</SectionTitle>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-input)" }}>
              {["#","Perfil","Miembros","IMC Prom.","Peso Prom.","Grasa Prom.","Músculo Prom."].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resumen.map((c, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border-dark)" }}>
                <td style={{ padding: "8px 12px" }}>{c.cluster_id}</td>
                <td style={{ padding: "8px 12px", color: PALETTE[i % PALETTE.length], fontWeight: 600 }}>{c.etiqueta}</td>
                <td style={{ padding: "8px 12px" }}>{c.num_miembros}</td>
                <td style={{ padding: "8px 12px" }}>{parseFloat(c.imc_promedio||0).toFixed(1)}</td>
                <td style={{ padding: "8px 12px" }}>{parseFloat(c.peso_promedio||0).toFixed(1)} kg</td>
                <td style={{ padding: "8px 12px" }}>{parseFloat(c.grasa_promedio||0).toFixed(1)}%</td>
                <td style={{ padding: "8px 12px" }}>{parseFloat(c.musculo_promedio||0).toFixed(1)} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Regresion
// ─────────────────────────────────────────────────────────────────────────────

// Traduce nombres técnicos de coeficientes a lenguaje común
const COEF_LABELS = {
  dias:           "Días de entrenamiento",
  cintura:        "Circunferencia de cintura",
  grasa_corporal: "% Grasa corporal",
  masa_muscular:  "Masa muscular",
  bmi:            "Índice de masa corporal",
  peso:           "Peso actual",
  intercepto:     "Base del modelo",
};

export function TabRegresion() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [trainLoading, setTL]     = useState(false);
  const [error, setError]         = useState(null);
  const [trainMsg, setTrainMsg]   = useState(null);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, ...gymHeader() };

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/analytics/regresion`, { headers });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const handleTrain = async () => {
    setTL(true); setTrainMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/analytics/regresion/train`, { method: "POST", headers });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setData(j); setTrainMsg("Tendencias actualizadas correctamente.");
    } catch (e) { setError(e.message); }
    finally { setTL(false); }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const metricas = data?.metricas || {};

  // coeficientes llega del backend como dict {dias: 0.003, cintura: 0.12, ...}
  // Se normaliza a array para Recharts — se excluye el intercepto de la barra
  const coeficientesArr = data?.coeficientes
    ? Object.entries(data.coeficientes)
        .filter(([key]) => key !== "intercepto")
        .map(([feature, valor]) => ({
          feature,
          valor: parseFloat(Number(valor).toFixed(4)),
        }))
    : [];

  if (loading) return <LoadingSpinner />;
  if (error || !data) return (
    <NoDataBox
      icon={<FiTrendingUp />}
      title="Todavía no hay suficientes datos"
      description="Para ver las tendencias y predicciones de peso necesitamos que tus miembros tengan registros de progreso físico (peso, grasa corporal). Cuando haya datos suficientes, el análisis aparecerá aquí automáticamente."
      onRetry={fetchData}
    />
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
        <StatCard label="Precisión del modelo"  value={`${((metricas.r2 || 0) * 100).toFixed(1)}%`} color={metricas.r2 > 0.7 ? SUCCESS : WARNING} />
        <StatCard label="Margen de error prom." value={(metricas.rmse || 0).toFixed(1)} color={INFO} suffix=" kg" />
        <StatCard label="Registros analizados"  value={metricas.num_muestras || "—"} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <TrainBtn loading={trainLoading} onClick={handleTrain} label="Actualizar tendencias" />
          {trainMsg && <span style={{ color: SUCCESS, fontSize: 13 }}>{trainMsg}</span>}
        </div>
      </div>

      <SectionTitle>¿Qué factores afectan más el peso de tus miembros?</SectionTitle>
      {coeficientesArr.length > 0 ? (
        <>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Las barras más largas indican los factores que más impactan el peso. Un valor positivo significa que ese factor tiende a aumentarlo; negativo, que lo reduce.
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={coeficientesArr.map(c => ({ ...c, feature: COEF_LABELS[c.feature] || c.feature }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
              <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <YAxis type="category" dataKey="feature" width={160} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="valor" name="Impacto" fill={ACCENT} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No hay factores disponibles aún.</p>
      )}

      <SectionTitle>¿Qué tan confiables son estas predicciones?</SectionTitle>
      <div style={{ background: "var(--bg-input)", borderRadius: 10, padding: "16px 20px", fontSize: 13, lineHeight: 1.7 }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: 10 }}>
          El modelo analiza el historial de progreso físico de tus miembros (peso, grasa corporal, días de entrenamiento)
          para estimar cómo evolucionará su peso en el futuro.
        </p>
        <p style={{ color: metricas.r2 > 0.6 ? SUCCESS : WARNING, fontWeight: 600 }}>
          Precisión actual: {((metricas.r2 || 0) * 100).toFixed(1)}% —
          {metricas.r2 > 0.8 ? " Muy confiable. Las predicciones son bastante exactas."
           : metricas.r2 > 0.6 ? " Confiable. Útil como referencia general."
           : metricas.r2 > 0.4 ? " Moderada. Agrega más registros de progreso para mejorarla."
           : " Necesita más datos. Registra el progreso físico de tus miembros regularmente."}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Cancelaciones
// ─────────────────────────────────────────────────────────────────────────────

// Traduce los nombres de features técnicos a etiquetas legibles para el dueño
const FEATURE_LABELS = {
  dias_sin_asistir:        "Días sin asistir",
  num_asistencias_ult60:   "Visitas en los últimos 2 meses",
  tiene_membresia_activa:  "Membresía vigente",
  total_pagos:             "Historial de pagos",
  meses_activo:            "Tiempo como miembro",
};

const ACCION_POR_RIESGO = {
  alto:  "Contactar urgente",
  medio: "Hacer seguimiento",
  bajo:  "Activo — sin acción",
};

function TabCancelaciones() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [trainLoading, setTL]   = useState(false);
  const [error, setError]       = useState(null);
  const [trainMsg, setTrainMsg] = useState(null);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, ...gymHeader() };

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/analytics/cancelaciones`, { headers });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const handleTrain = async () => {
    setTL(true); setTrainMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/analytics/cancelaciones/train`, { method: "POST", headers });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setData(j); setTrainMsg("Análisis actualizado correctamente");
    } catch (e) { setError(e.message); }
    finally { setTL(false); }
  };

  // ── Exportar reporte PDF via ventana de impresión ─────────────────────────
  const exportPDF = () => {
    if (!data) return;
    const now   = new Date().toLocaleString("es-MX");
    const preds = (data.predicciones || []).slice(0, 50);
    const total = (data.resumen?.riesgo_alto||0) + (data.resumen?.riesgo_medio||0) + (data.resumen?.activos||0);

    const distRows = [
      { label: "Atención urgente",   value: data.resumen?.riesgo_alto  || 0, color: "#ef4444" },
      { label: "Seguimiento",        value: data.resumen?.riesgo_medio || 0, color: "#f59e0b" },
      { label: "Activos y estables", value: data.resumen?.activos      || 0, color: "#10b981" },
    ];
    const featRows = (data.importancia_features || []).slice(0, 5);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Reporte de Retención — ${now}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 30px 40px; }
  h1 { font-size: 20px; color: #1a1a2e; margin-bottom: 4px; }
  .sub { color: #666; font-size: 11px; margin-bottom: 24px; }
  h2 { font-size: 14px; color: #1a1a2e; margin: 20px 0 8px; border-bottom: 2px solid #f59e0b; padding-bottom: 4px; }
  .info { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 8px 12px; font-size: 11px; color: #444; margin-bottom: 12px; border-radius: 0 4px 4px 0; }
  .kpis { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .kpi { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 16px; flex: 1; min-width: 120px; }
  .kpi-v { font-size: 22px; font-weight: 700; color: #1a1a2e; }
  .kpi-l { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #1a1a2e; color: #fff; padding: 7px 10px; text-align: left; font-size: 11px; }
  td { padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
  tr:nth-child(even) td { background: #fafafa; }
  .badge-alto  { background:#fee2e2; color:#b91c1c; border-radius:4px; padding:2px 8px; font-weight:700; font-size:10px; }
  .badge-medio { background:#fef3c7; color:#92400e; border-radius:4px; padding:2px 8px; font-weight:700; font-size:10px; }
  .badge-bajo  { background:#d1fae5; color:#065f46; border-radius:4px; padding:2px 8px; font-weight:700; font-size:10px; }
  .bar-wrap { background:#e5e7eb; border-radius:4px; height:10px; }
  .bar { border-radius:4px; height:10px; }
  footer { margin-top: 32px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
  @media print { body { padding: 20px; } }
</style></head><body>
<h1>Reporte de Retención de Miembros</h1>
<p class="sub">Generado el ${now} &nbsp;|&nbsp; ${total} miembros analizados</p>

<div class="kpis">
  <div class="kpi"><div class="kpi-v" style="color:#ef4444">${data.resumen?.riesgo_alto || 0}</div><div class="kpi-l">Atención urgente</div></div>
  <div class="kpi"><div class="kpi-v" style="color:#f59e0b">${data.resumen?.riesgo_medio || 0}</div><div class="kpi-l">Hacer seguimiento</div></div>
  <div class="kpi"><div class="kpi-v" style="color:#10b981">${data.resumen?.activos || 0}</div><div class="kpi-l">Activos y estables</div></div>
  <div class="kpi"><div class="kpi-v" style="color:#1a1a2e">${total}</div><div class="kpi-l">Total analizados</div></div>
</div>

<h2>¿Cómo funciona este análisis?</h2>
<div class="info">
  El sistema revisa automáticamente el historial de cada miembro — sus visitas, pagos y estado de membresía —
  para detectar quiénes tienen mayor probabilidad de no renovar o dejar de asistir.<br><br>
  <strong>Atención urgente:</strong> llevan más de 3 semanas sin venir o su membresía ya venció.<br>
  <strong>Hacer seguimiento:</strong> señales tempranas de alejamiento; un contacto a tiempo puede retenerlos.
</div>

<h2>Distribución de tu base de miembros</h2>
<table>
  <thead><tr><th>Estado</th><th>Miembros</th><th>Del total</th><th>Proporción</th></tr></thead>
  <tbody>
    ${distRows.map(r => {
      const pct = total > 0 ? ((r.value / total) * 100).toFixed(1) : "0.0";
      return `<tr>
        <td><span style="color:${r.color};font-weight:700">${r.label}</span></td>
        <td>${r.value}</td><td>${pct}%</td>
        <td><div class="bar-wrap"><div class="bar" style="background:${r.color};width:${pct}%"></div></div></td>
      </tr>`;
    }).join("")}
  </tbody>
</table>

<h2>¿Qué influye más en el riesgo?</h2>
<div class="info">Factores ordenados por su peso en la detección de riesgo.</div>
<table>
  <thead><tr><th>Factor</th><th>Peso</th><th>Barra</th></tr></thead>
  <tbody>
    ${featRows.map(f => {
      const label = FEATURE_LABELS[f.feature] || f.feature;
      const pct   = (f.importancia * 100).toFixed(1);
      return `<tr>
        <td>${label}</td><td>${pct}%</td>
        <td><div class="bar-wrap"><div class="bar" style="background:#f59e0b;width:${pct}%"></div></div></td>
      </tr>`;
    }).join("")}
  </tbody>
</table>

<h2>Miembros prioritarios (top ${Math.min(50, preds.length)})</h2>
<div class="info">Prioriza los de <strong>Atención urgente</strong>. Un mensaje o llamada puede hacer la diferencia.</div>
<table>
  <thead><tr><th>#</th><th>Miembro</th><th>Sin visitar</th><th>Membresía</th><th>Nivel de riesgo</th><th>Acción sugerida</th></tr></thead>
  <tbody>
    ${preds.map((p, i) => {
      const accion = p.riesgo === "alto" ? "Contactar urgente" : p.riesgo === "medio" ? "Hacer seguimiento" : "Sin acción";
      const dias = p.dias_sin_asistir != null ? `${p.dias_sin_asistir} días` : "—";
      return `<tr>
        <td>${i + 1}</td>
        <td>${p.nombre || p.id_miembro}</td>
        <td>${dias}</td>
        <td>${p.membresia_activa ? "Vigente" : "Vencida"}</td>
        <td><span class="badge-${p.riesgo}">${p.riesgo === "alto" ? "URGENTE" : p.riesgo === "medio" ? "ATENCIÓN" : "ESTABLE"}</span></td>
        <td style="color:${p.riesgo==="alto"?"#b91c1c":p.riesgo==="medio"?"#92400e":"#065f46"};font-weight:600">${accion}</td>
      </tr>`;
    }).join("")}
  </tbody>
</table>

<footer>GymPro — Reporte de Retención &nbsp;|&nbsp; ${now} &nbsp;|&nbsp; ${total} miembros analizados</footer>
</body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const distribucion = [
    { name: "Atención urgente",   value: data?.resumen?.riesgo_alto  || 0, fill: DANGER  },
    { name: "Hacer seguimiento",  value: data?.resumen?.riesgo_medio || 0, fill: WARNING },
    { name: "Activos y estables", value: data?.resumen?.activos      || 0, fill: SUCCESS },
  ];

  // Feature importance con etiquetas legibles
  const importancia = (data?.importancia_features || []).map(f => ({
    feature: FEATURE_LABELS[f.feature] || f.feature,
    valor:   parseFloat((f.importancia || 0).toFixed(3)),
  }));

  // Top miembros en riesgo (alto + medio)
  const enRiesgo = (data?.predicciones || [])
    .filter(p => p.riesgo === "alto" || p.riesgo === "medio")
    .slice(0, 15);

  if (loading) return <LoadingSpinner />;
  if (error || !data || data.error) return (
    <NoDataBox
      icon={<FiBell />}
      title="Todavía no hay datos para mostrar"
      description={data?.error || "Para detectar qué miembros están en riesgo de dejar el gimnasio necesitamos su historial de visitas y pagos. En cuanto haya miembros con actividad, el análisis aparecerá aquí automáticamente."}
      onRetry={fetchData}
    />
  );

  const totalAnalizado = (data.resumen?.riesgo_alto || 0) + (data.resumen?.riesgo_medio || 0) + (data.resumen?.activos || 0);

  return (
    <div>
      {/* KPIs + acciones */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard label="Atención urgente"   value={data.resumen?.riesgo_alto  || 0} color={DANGER}  />
        <StatCard label="Hacer seguimiento"  value={data.resumen?.riesgo_medio || 0} color={WARNING} />
        <StatCard label="Activos y estables" value={data.resumen?.activos      || 0} color={SUCCESS} />
        <StatCard label="Total analizados"   value={totalAnalizado}                  color={INFO}    />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <TrainBtn loading={trainLoading} onClick={handleTrain} label="Actualizar análisis" />
          <button onClick={exportPDF}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8,
              background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.4)",
              color: "#818cf8", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Exportar PDF
          </button>
          {trainMsg && <span style={{ color: SUCCESS, fontSize: 13 }}>{trainMsg}</span>}
        </div>
      </div>

      {/* Explicación en lenguaje de negocio */}
      <div style={{ background: "rgba(251,227,121,.07)", border: "1px solid rgba(251,227,121,.25)",
        borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--text-secondary)",
        lineHeight: 1.7 }}>
        <strong style={{ color: "var(--text-primary)" }}>¿Qué estás viendo?</strong>{" "}
        El sistema revisó el historial de tus <strong style={{ color: "var(--text-primary)" }}>{totalAnalizado} miembros</strong> —
        asistencias, pagos y estado de membresía — para detectar quiénes tienen mayor probabilidad de no renovar.
        Los de <strong style={{ color: DANGER }}>Atención urgente</strong> llevan más de 3 semanas sin venir
        o su membresía ya venció. Los de <strong style={{ color: WARNING }}>Seguimiento</strong> muestran señales
        tempranas; un contacto a tiempo puede retenerlos.
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Gráfica de pastel */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <SectionTitle>Estado de tu base de miembros</SectionTitle>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "-4px 0 8px" }}>
            Distribución actual de los {totalAnalizado} miembros analizados.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={distribucion} dataKey="value" nameKey="name"
                   cx="50%" cy="50%" outerRadius={75}
                   label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                {distribucion.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Factores de riesgo */}
        {importancia.length > 0 && (
          <div style={{ flex: 1, minWidth: 260 }}>
            <SectionTitle>¿Por qué están en riesgo?</SectionTitle>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "-4px 0 8px" }}>
              Factores que más influyen en detectar si un miembro podría irse.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={importancia} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
                <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                       tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="feature" width={180}
                       tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <Tooltip formatter={v => [`${(v * 100).toFixed(1)}%`, "Influencia"]} />
                <Bar dataKey="valor" name="Influencia" fill={WARNING} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Lista priorizada de miembros en riesgo */}
      {enRiesgo.length > 0 && (
        <>
          <SectionTitle>Miembros que necesitan atención</SectionTitle>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "-8px 0 12px" }}>
            Ordenados por prioridad. Contacta primero a los de <strong style={{ color: DANGER }}>Atención urgente</strong>.
            La barra muestra qué tan probable es que el miembro deje de venir.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {enRiesgo.map((p, i) => {
              const isAlto = p.riesgo === "alto";
              const col    = isAlto ? DANGER : WARNING;
              const pct    = Math.round((p.probabilidad || 0) * 100);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                  background: "var(--bg-input)", borderRadius: 10, borderLeft: `3px solid ${col}`,
                }}>
                  <div style={{ width: 24, textAlign: "center", fontWeight: 800, color: col, fontSize: 15 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>{p.nombre || p.id_miembro}</span>
                      <span style={{
                        background: isAlto ? "rgba(255,107,157,.15)" : "rgba(255,189,46,.15)",
                        color: col, borderRadius: 6, padding: "2px 9px", fontWeight: 700, fontSize: 11,
                      }}>
                        {isAlto ? "Atención urgente" : "Hacer seguimiento"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 5, fontSize: 12, color: "var(--text-secondary)", flexWrap: "wrap" }}>
                      <span>{p.dias_sin_asistir != null ? `${p.dias_sin_asistir} días sin venir` : "Sin visitas registradas"}</span>
                      <span>{p.asistencias_60d ?? 0} visitas en 60 días</span>
                      <span style={{ color: p.membresia_activa ? SUCCESS : DANGER, fontWeight: 600 }}>
                        {p.membresia_activa ? "Membresía vigente" : "Membresía vencida"}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, height: 6, background: "var(--border-dark)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 118 }}>
                    <div style={{ color: col, fontWeight: 800, fontSize: 17 }}>{pct}%</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                      {ACCION_POR_RIESGO[p.riesgo] || "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Horarios concurridos (mapa de calor de asistencia)
// ─────────────────────────────────────────────────────────────────────────────
function TabHeatmap() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`${API_BASE}/api/analytics/heatmap-asistencia`, { headers: { Authorization: `Bearer ${token}`, ...gymHeader() } });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingSpinner />;
  if (error || !data || data.error) return (
    <NoDataBox icon={<FiClock />} title="Todavía no hay visitas para mostrar"
      description={data?.error || "Cuando tus miembros registren entradas al gimnasio, aquí verás los horarios más concurridos."}
      onRetry={fetchData} />
  );

  const { dias, franjas, celdas, max, pico, total_visitas, dia_mas_concurrido } = data;
  const cellMap = {};
  celdas.forEach(c => { cellMap[`${c.franja_idx}-${c.dia_idx}`] = c.total; });
  const bg = (v) => {
    if (!v) return "var(--bg-input)";
    const a = 0.18 + 0.72 * (v / (max || 1));
    return `rgba(56,189,248,${a.toFixed(2)})`;
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard label="Visitas analizadas" value={total_visitas}        color={INFO}    />
        <StatCard label="Día más concurrido" value={dia_mas_concurrido}    color={SUCCESS} />
        <StatCard label="Franja pico"        value={pico ? pico.franja : "—"} color={ACCENT} />
      </div>

      <div style={{ background: "rgba(56,189,248,.07)", border: "1px solid rgba(56,189,248,.25)",
        borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
        <strong style={{ color: "var(--text-primary)" }}>¿Qué estás viendo?</strong>{" "}
        Cada casilla indica cuántas personas vienen ese día a esa hora. Mientras más intenso el color, más llena está tu sala.
        Útil para reforzar personal en las horas pico y crear promociones en las horas vacías.
        {pico && <> Tu momento más concurrido es el <strong style={{ color: "var(--text-primary)" }}>{pico.dia}</strong> en la franja <strong style={{ color: "var(--text-primary)" }}>{pico.franja}</strong>.</>}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 4, width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: 110 }} />
              {dias.map(d => <th key={d} style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, padding: "4px 2px" }}>{d.slice(0, 3)}</th>)}
            </tr>
          </thead>
          <tbody>
            {franjas.map((f, fi) => (
              <tr key={f}>
                <td style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap", paddingRight: 8, textAlign: "right" }}>{f}</td>
                {dias.map((d, di) => {
                  const v = cellMap[`${fi}-${di}`] || 0;
                  return (
                    <td key={di} title={`${d} ${f}: ${v} visitas`}
                      style={{ background: bg(v), borderRadius: 6, textAlign: "center", padding: "12px 0",
                        fontSize: 12, fontWeight: 700, color: v > max * 0.5 ? "#06283d" : "var(--text-secondary)", minWidth: 40 }}>
                      {v || ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Clientes por valor (RFM)
// ─────────────────────────────────────────────────────────────────────────────
function TabRFM() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`${API_BASE}/api/analytics/rfm`, { headers: { Authorization: `Bearer ${token}`, ...gymHeader() } });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingSpinner />;
  if (error || !data || data.error) return (
    <NoDataBox icon={<FiUsers />} title="Todavía no hay datos para mostrar"
      description={data?.error || "Cuando haya miembros con visitas y pagos, aquí verás cómo se reparten por valor."}
      onRetry={fetchData} />
  );

  const { segmentos, miembros, total, promedios } = data;
  const pie = segmentos.filter(s => s.total > 0).map(s => ({ name: s.nombre, value: s.total, fill: s.color }));
  const money = (n) => `$${Number(n || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard label="Miembros analizados"     value={total}                    color={INFO}    />
        <StatCard label="Visitas promedio"        value={promedios.visitas}        color={SUCCESS} />
        <StatCard label="Gasto promedio"          value={money(promedios.gastado)} color={ACCENT}  />
        <StatCard label="Días sin venir (prom.)"  value={promedios.recency_dias}   color={WARNING} />
      </div>

      <div style={{ background: "rgba(167,139,250,.08)", border: "1px solid rgba(167,139,250,.28)",
        borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
        <strong style={{ color: "var(--text-primary)" }}>¿Qué estás viendo?</strong>{" "}
        Agrupamos a tus miembros según qué tan reciente fue su última visita, cuántas veces vienen y cuánto han pagado.
        Así sabes a quién premiar y a quién reactivar antes de que se vaya.
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
        {segmentos.map(s => (
          <div key={s.nombre} style={{ flex: 1, minWidth: 150, background: "var(--bg-input)",
            borderRadius: 10, padding: "12px 14px", borderTop: `3px solid ${s.color}` }}>
            <div style={{ color: s.color, fontSize: 22, fontWeight: 800 }}>{s.total}</div>
            <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 700, margin: "2px 0 4px" }}>{s.nombre}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 11, lineHeight: 1.5 }}>{s.descripcion}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SectionTitle>Reparto de tu base</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78}
                   label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                {pie.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1.4, minWidth: 300 }}>
          <SectionTitle>Tus miembros</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
            {miembros.slice(0, 40).map((m, i) => {
              const seg = segmentos.find(s => s.nombre === m.segmento);
              const col = seg ? seg.color : "var(--text-secondary)";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px",
                  background: "var(--bg-input)", borderRadius: 8, borderLeft: `3px solid ${col}` }}>
                  <span style={{ flex: 1, fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{m.nombre}</span>
                  <span style={{ background: `${col}22`, color: col, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{m.segmento}</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 70, textAlign: "right" }}>{m.visitas} visitas</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 70, textAlign: "right" }}>{money(m.gastado)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Fuerza estimada de los miembros (1RM)
// ─────────────────────────────────────────────────────────────────────────────
function TabFuerza() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`${API_BASE}/api/analytics/fuerza`, { headers: { Authorization: `Bearer ${token}`, ...gymHeader() } });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingSpinner />;
  if (error || !data || data.error) return (
    <NoDataBox icon={<FiActivity />} title="Todavía no hay entrenamientos para mostrar"
      description={data?.error || "Cuando tus miembros registren sus series (peso y repeticiones), aquí verás su fuerza estimada por ejercicio."}
      onRetry={fetchData} />
  );

  const { ejercicios, mejor, total_series, ejercicios_distintos } = data;
  const chart = ejercicios.map(e => ({ nombre: e.nombre, kg: e.prom_kg }));

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard label="Ejercicios registrados" value={ejercicios_distintos} color={INFO}    />
        <StatCard label="Series analizadas"       value={total_series}         color={SUCCESS} />
        <StatCard label="Mejor levantamiento"     value={mejor ? `${mejor.kg} kg` : "—"} color={ACCENT} />
      </div>

      <div style={{ background: "rgba(76,217,100,.07)", border: "1px solid rgba(76,217,100,.25)",
        borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
        <strong style={{ color: "var(--text-primary)" }}>¿Qué estás viendo?</strong>{" "}
        A partir del peso y las repeticiones que registran tus miembros, estimamos cuánto podrían levantar en un solo intento máximo.
        Es una referencia para medir su progreso de fuerza.
        {mejor && <> El mejor registro hasta ahora es de <strong style={{ color: "var(--text-primary)" }}>{mejor.miembro}</strong> en <strong style={{ color: "var(--text-primary)" }}>{mejor.ejercicio}</strong> con {mejor.kg} kg estimados.</>}
      </div>

      <SectionTitle>Fuerza promedio estimada por ejercicio</SectionTitle>
      <ResponsiveContainer width="100%" height={Math.max(220, chart.length * 38)}>
        <BarChart data={chart} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
          <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickFormatter={v => `${v} kg`} />
          <YAxis type="category" dataKey="nombre" width={150} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip formatter={v => [`${v} kg estimados`, "Promedio"]} />
          <Bar dataKey="kg" name="Promedio" fill={SUCCESS} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <SectionTitle>Detalle por ejercicio</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ejercicios.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
            background: "var(--bg-input)", borderRadius: 8 }}>
            <span style={{ flex: 1, fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{e.nombre}</span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 90, textAlign: "right" }}>Prom. {e.prom_kg} kg</span>
            <span style={{ fontSize: 12, color: ACCENT, minWidth: 80, textAlign: "right", fontWeight: 600 }}>Máx. {e.max_kg} kg</span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 80, textAlign: "right" }}>{e.miembros} {e.miembros === 1 ? "miembro" : "miembros"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Laboratorio de Modelos
// ─────────────────────────────────────────────────────────────────────────────
const ConfusionMatrix = ({ matrix, clases }) => {
  if (!matrix || !matrix.length) return null;
  const max = Math.max(1, ...matrix.flat());
  return (
    <table style={{ borderCollapse: "separate", borderSpacing: 3, marginTop: 8 }}>
      <thead>
        <tr>
          <th />
          {clases.map((c, i) => <th key={i} style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600, padding: "2px 6px" }}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, ri) => (
          <tr key={ri}>
            <td style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600, paddingRight: 6, textAlign: "right" }}>{clases[ri]}</td>
            {row.map((v, ci) => {
              const a = 0.15 + 0.7 * (v / max);
              const diag = ri === ci;
              return (
                <td key={ci} style={{
                  background: diag ? `rgba(76,217,100,${a.toFixed(2)})` : `rgba(255,107,157,${a.toFixed(2)})`,
                  color: "var(--text-primary)", borderRadius: 4, minWidth: 34, textAlign: "center",
                  padding: "6px 8px", fontSize: 12, fontWeight: 700,
                }}>{v}</td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export function TabModelos() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tl, setTL]           = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`${API_BASE}/api/analytics/modelos`, { headers: { Authorization: `Bearer ${token}`, ...gymHeader() } });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const retrain = async () => {
    setTL(true); setError(null);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`${API_BASE}/api/analytics/modelos/train`, { method: "POST", headers: { Authorization: `Bearer ${token}`, ...gymHeader() } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setData(j);
    } catch (e) { setError(e.message); }
    finally { setTL(false); }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingSpinner />;
  if (error || !data || data.error) return (
    <NoDataBox icon={<FiActivity />} title="Todavía no hay datos para los modelos"
      description={data?.error || "Cuando haya suficiente historial de miembros, aquí verás la comparación de algoritmos."}
      onRetry={fetchData} />
  );

  const hintP     = { fontSize: 12, color: "var(--text-secondary)", margin: "-4px 0 12px", lineHeight: 1.6 };
  const DESC_MODELO = {
    "Arbol de Decision":         "Sigue reglas tipo sí / no",
    "Random Forest":             "Junta muchas opiniones y vota",
    "Regresion Logistica":       "Calcula una probabilidad",
    "SVM Lineal":                "Separa los grupos con una línea",
    "SVM No Lineal (RBF)":       "Separa los grupos con una curva",
    "Random Forest (multiclase)": "Junta muchas opiniones y vota",
  };
  const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
  const thS = { padding: "8px 10px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-dark)" };
  const tdS = { padding: "8px 10px", color: "var(--text-primary)", fontWeight: 600 };

  const reg = data.regresion, clf = data.clasificacion, mc = data.multiclase;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
          <strong style={{ color: "var(--text-primary)" }}>Laboratorio de Modelos.</strong>{" "}
          Entrenamos varios algoritmos sobre los mismos datos de tu gimnasio y comparamos qué tan bien predice cada uno.
          Muestra distintas técnicas de inteligencia artificial y cómo se evalúan.
        </div>
        <TrainBtn loading={tl} onClick={retrain} label="Actualizar modelos" />
      </div>

      {/* Regresión */}
      <SectionTitle>Predecir el peso corporal</SectionTitle>
      {reg?.error ? <p style={hintP}>{reg.error}</p> : (
        <>
          <p style={hintP}>Comparamos una recta simple, una con varias variables y una curva. Un R² más cercano a 1 y un error (RMSE / MAE) más bajo indican mejor predicción. Datos usados: {reg.n} registros.</p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <table style={tableStyle}>
                <thead><tr>{["Modelo", "R²", "RMSE", "MAE"].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {reg.modelos.map((m, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-dark)" }}>
                      <td style={tdS}>{m.nombre}<div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 400 }}>{m.descripcion}</div></td>
                      <td style={tdS}>{m.metricas.r2}</td>
                      <td style={tdS}>{m.metricas.rmse}</td>
                      <td style={tdS}>{m.metricas.mae}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reg.curva?.length > 0 && (
              <div style={{ flex: 1, minWidth: 300 }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 6px" }}>Recta vs curva (peso estimado según el tiempo)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={reg.curva}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
                    <XAxis dataKey="dias" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickFormatter={v => `${v}d`} />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} domain={["auto", "auto"]} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="lineal" name="Lineal" stroke={INFO} dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="polinomica" name="Polinómica" stroke={ACCENT} dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {/* Clasificación binaria */}
      <SectionTitle>Detectar quién podría dejar el gimnasio</SectionTitle>
      {clf?.error ? <p style={hintP}>{clf.error}</p> : (
        <>
          <p style={hintP}>
            Cinco algoritmos deciden si un miembro está "en riesgo" o "estable".{" "}
            {clf.holdout ? "Evaluados con datos que no vieron al entrenar." : "Muestra pequeña: evaluados sobre los mismos datos, tómalo como referencia."} Datos: {clf.n} miembros.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {clf.modelos.map((m, i) => (
              <div key={i} style={{ flex: 1, minWidth: 230, background: "var(--bg-input)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13 }}>{m.nombre}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>{DESC_MODELO[m.nombre] || ""}</div>
                {m.error ? <div style={{ fontSize: 12, color: DANGER }}>No se pudo entrenar</div> : (
                  <>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--text-secondary)" }}>
                      <span>Acierto <strong style={{ color: SUCCESS }}>{(m.metricas.accuracy * 100).toFixed(0)}%</strong></span>
                      <span>Precisión {(m.metricas.precision * 100).toFixed(0)}%</span>
                      <span>Detección {(m.metricas.recall * 100).toFixed(0)}%</span>
                      <span>Balance {m.metricas.f1}</span>
                    </div>
                    <ConfusionMatrix matrix={m.metricas.confusion} clases={clf.clases} />
                  </>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>
            Tabla de aciertos y errores — las filas son lo que pasó de verdad y las columnas lo que predijo el sistema.
            Los recuadros verdes (en diagonal) son aciertos; los rosas son equivocaciones.
          </p>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.6 }}>
            <strong>Acierto:</strong> de cada 100 casos, cuántos predijo bien.{" "}
            <strong>Precisión:</strong> cuando dice "en riesgo", qué tan seguido acierta.{" "}
            <strong>Detección:</strong> de los que sí estaban en riesgo, cuántos encontró.{" "}
            <strong>Balance:</strong> mezcla de precisión y detección.
          </p>
          {clf.reglas_arbol?.length > 0 && (
            <>
              <SectionTitle>Cómo decide el sistema, paso a paso</SectionTitle>
              <p style={hintP}>Estas son las reglas que sigue, en orden:</p>
              <pre style={{ background: "var(--bg-input)", border: "1px solid var(--border-dark)", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "var(--text-primary)", overflowX: "auto", lineHeight: 1.5, margin: 0 }}>{clf.reglas_arbol.join("\n")}</pre>
            </>
          )}
        </>
      )}

      {/* Clasificación múltiple */}
      <SectionTitle>Adivinar el objetivo de cada miembro</SectionTitle>
      {mc?.error ? <p style={hintP}>{mc.error}</p> : (
        <>
          <p style={hintP}>El modelo intenta adivinar el objetivo (perder peso, ganar músculo o mantener) a partir de la composición corporal. Datos: {mc.n} miembros, {mc.clases.length} objetivos.</p>
          {mc.modelos.map((m, i) => (
            <div key={i} style={{ background: "var(--bg-input)", borderRadius: 10, padding: "12px 14px", maxWidth: 540 }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13 }}>{m.nombre}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>{DESC_MODELO[m.nombre] || ""}</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--text-secondary)", marginBottom: 2 }}>
                <span>Acierto <strong style={{ color: SUCCESS }}>{(m.metricas.accuracy * 100).toFixed(0)}%</strong></span>
                <span>Balance {m.metricas.f1}</span>
              </div>
              <ConfusionMatrix matrix={m.metricas.confusion} clases={mc.clases} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
// Iconos SVG inline para los tabs (sin emojis)
const IconMapReduce = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2"/><path d="M6 16V8m4 8v-4m4 4V6m4 10v-2"/>
  </svg>
);
const IconKMeans = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/>
    <circle cx="18" cy="18" r="2"/><circle cx="12" cy="12" r="3"/>
    <line x1="8" y1="7" x2="10" y2="10"/><line x1="16" y1="7" x2="14" y2="10"/>
    <line x1="8" y1="17" x2="10" y2="14"/><line x1="16" y1="17" x2="14" y2="14"/>
  </svg>
);
const IconRegresion = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
);
const IconCancelaciones = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconHeatmap = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>
  </svg>
);
const IconRFM = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.6 6.6L22 9.2l-5 4.6 1.4 7.2L12 17.8 5.6 21l1.4-7.2-5-4.6 7.4-.6z"/>
  </svg>
);
const IconFuerza = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5l11 11"/><path d="M21 21l-1-1"/><path d="M3 3l1 1"/>
    <path d="M18 22l4-4"/><path d="M2 6l4-4"/><path d="M3 10l7-7"/><path d="M14 21l7-7"/>
  </svg>
);
const IconModelos = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3 3 3 0 0 0-3 3 3 3 0 0 0 0 6 3 3 0 0 0 3 3 3 3 0 0 0 6 0 3 3 0 0 0 3-3 3 3 0 0 0 0-6 3 3 0 0 0-3-3 3 3 0 0 0-3-3z"/>
    <path d="M12 8v8M9 12h6"/>
  </svg>
);

// Pestañas de negocio para el owner del gimnasio. Los módulos técnicos de ML
// (K-Means, Regresión y Laboratorio de Modelos) se movieron al panel de
// superadmin (web/src/pages/superadmin/SuperadminModelos.jsx), donde se reutilizan
// los componentes exportados TabKMeans / TabRegresion / TabModelos.
const TABS = [
  { id: "mapreduce",     label: "Finanzas y Flujo",     Icon: IconMapReduce,     Component: TabMapReduce     },
  { id: "cancelaciones", label: "Riesgo de Abandono",   Icon: IconCancelaciones, Component: TabCancelaciones },
  { id: "heatmap",       label: "Horarios Concurridos", Icon: IconHeatmap,       Component: TabHeatmap       },
  { id: "rfm",           label: "Clientes por Valor",   Icon: IconRFM,           Component: TabRFM           },
  { id: "fuerza",        label: "Fuerza de Miembros",   Icon: IconFuerza,        Component: TabFuerza        },
];

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("mapreduce");

  const ActiveComp = TABS.find(t => t.id === activeTab)?.Component;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: 24, fontWeight: 700, margin: 0 }}>
          Inteligencia de tu Gimnasio
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 6 }}>
          Datos reales de tus ingresos, miembros y tendencias — actualizados automáticamente
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 28,
        borderBottom: "2px solid var(--border-dark)", paddingBottom: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none", border: "none",
              borderBottom: activeTab === tab.id ? `2px solid ${ACCENT}` : "2px solid transparent",
              color: activeTab === tab.id ? ACCENT : "var(--text-secondary)",
              padding: "10px 20px", fontSize: 14, fontWeight: 600,
              cursor: "pointer", marginBottom: -2, transition: "color 0.2s",
              display: "flex", alignItems: "center", gap: 7,
            }}
          >
            <tab.Icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-dark)", borderRadius: 12, padding: "24px 24px" }}>
        {ActiveComp && <ActiveComp />}
      </div>
    </div>
  );
}
