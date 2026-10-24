/**
 * AdminAnalytics.jsx — Dashboard unificado de Analytics con Recharts
 * Sprint 4 / US17
 *
 * Tabs: MapReduce (ingresos + asistencia) | K-Means (clusters) | Regresion | Cancelaciones
 * Los datos se cargan desde los endpoints existentes de Spark.
 */
import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import "../../css/CSSUnificado.css";

const API_BASE   = "";
const ACCENT     = "#fbe379";
const SUCCESS    = "#4cd964";
const INFO       = "#38bdf8";
const DANGER     = "#ff6b9d";
const WARNING    = "#ffbd2e";
const PURPLE     = "#a78bfa";
const PALETTE    = [ACCENT, SUCCESS, INFO, DANGER, WARNING, PURPLE, "#fb923c", "#34d399"];

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

const LoadingSpinner = () => (
  <div style={{ textAlign: "center", padding: 48, color: "var(--text-secondary)" }}>
    <div style={{ fontSize: 32, marginBottom: 8 }}>⟳</div>
    Cargando datos de Spark…
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
  const headers = { Authorization: `Bearer ${token}` };

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

  const resumenMetodos = data
    ? (data.resumen_ingresos || [])
        .map(r => ({ name: r.metodo_pago, value: r.total_ingresos || 0 }))
    : [];

  const asistenciaDia = data
    ? (data.asistencia_por_dia_semana || [])
        .map(r => ({ dia: r.dia_semana, visitas: r.total_visitas }))
    : [];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox msg={error} />;
  if (!data) return null;

  const totalIngresos = ingresosAgrupados.reduce((s, r) => s + r.total, 0);
  const totalPagos    = ingresosAgrupados.reduce((s, r) => s + r.pagos, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Ingresos totales (12 meses)" value={`$${totalIngresos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`} />
        <StatCard label="Pagos procesados" value={totalPagos} color={SUCCESS} />
        <StatCard label="Métodos de pago" value={resumenMetodos.length} color={INFO} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <TrainBtn loading={trainLoading} onClick={handleTrain} label="Actualizar MapReduce" />
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
function TabKMeans() {
  const [kValue, setKValue]       = useState(3);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [trainLoading, setTL]     = useState(false);
  const [error, setError]         = useState(null);
  const [trainMsg, setTrainMsg]   = useState(null);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

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
      setData(j); setTrainMsg(`K=${kValue} reentrenado (silhouette ${j.silhouette?.toFixed(3)})`);
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
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  const silConfig = {
    color: data.silhouette >= 0.5 ? SUCCESS : data.silhouette >= 0.3 ? WARNING : DANGER,
    label: data.silhouette >= 0.7 ? "Excelente" : data.silhouette >= 0.5 ? "Bueno"
         : data.silhouette >= 0.3 ? "Aceptable" : "Bajo",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
        <StatCard label="Silhouette Score" value={data.silhouette?.toFixed(3)} color={silConfig.color} suffix={` (${silConfig.label})`} />
        <StatCard label="Clusters" value={kValue} color={INFO} />
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
          <TrainBtn loading={trainLoading} onClick={handleTrain} />
          {trainMsg && <span style={{ color: SUCCESS, fontSize: 13 }}>{trainMsg}</span>}
        </div>
      </div>

      <SectionTitle>Distribución de miembros por cluster</SectionTitle>
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

      <SectionTitle>Métricas promedio por cluster</SectionTitle>
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

      <SectionTitle>Detalle de clusters</SectionTitle>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-input)" }}>
              {["Cluster","Etiqueta","Miembros","IMC Prom.","Peso Prom.","Grasa Prom.","Músculo Prom."].map(h => (
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
function TabRegresion() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [trainLoading, setTL]     = useState(false);
  const [error, setError]         = useState(null);
  const [trainMsg, setTrainMsg]   = useState(null);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

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
      setData(j); setTrainMsg("Modelo reentrenado");
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
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
        <StatCard label="R² Score"  value={(metricas.r2   || 0).toFixed(4)} color={metricas.r2 > 0.7 ? SUCCESS : WARNING} />
        <StatCard label="RMSE"      value={(metricas.rmse || 0).toFixed(2)} color={INFO} suffix=" kg" />
        <StatCard label="MAE"       value={(metricas.mae  || 0).toFixed(2)} color={INFO} suffix=" kg" />
        <StatCard label="Muestras"  value={metricas.num_muestras || "—"} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <TrainBtn loading={trainLoading} onClick={handleTrain} />
          {trainMsg && <span style={{ color: SUCCESS, fontSize: 13 }}>{trainMsg}</span>}
        </div>
      </div>

      <SectionTitle>Coeficientes del modelo Ridge (importancia de features)</SectionTitle>
      {coeficientesArr.length > 0 ? (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={coeficientesArr} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
            <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
            <YAxis type="category" dataKey="feature" width={140}
                   tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="valor" name="Coeficiente" fill={ACCENT} radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No hay coeficientes disponibles.</p>
      )}

      {data.coeficientes?.intercepto != null && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
          Intercepto: <strong style={{ color: "var(--text-primary)" }}>
            {Number(data.coeficientes.intercepto).toFixed(4)}
          </strong>
        </p>
      )}

      <SectionTitle>Modelo de predicción de peso corporal</SectionTitle>
      <div style={{ background: "var(--bg-input)", borderRadius: 10, padding: "16px 20px", fontSize: 13, lineHeight: 1.7 }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
          Regresión Ridge entrenada con datos históricos de progreso físico del gimnasio.
          Predice el peso futuro del miembro en función de días de entrenamiento, grasa corporal y BMI.
        </p>
        <p style={{ color: SUCCESS }}>
          R² = {(metricas.r2 || 0).toFixed(4)} —
          {metricas.r2 > 0.8 ? " Excelente ajuste"
           : metricas.r2 > 0.6 ? " Buen ajuste"
           : metricas.r2 > 0.4 ? " Ajuste moderado" : " Ajuste bajo"}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Cancelaciones
// ─────────────────────────────────────────────────────────────────────────────
function TabCancelaciones() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [trainLoading, setTL]   = useState(false);
  const [error, setError]       = useState(null);
  const [trainMsg, setTrainMsg] = useState(null);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

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
      setData(j); setTrainMsg("Modelo actualizado correctamente");
    } catch (e) { setError(e.message); }
    finally { setTL(false); }
  };

  // ── Exportar reporte PDF via ventana de impresión ─────────────────────────
  const exportPDF = () => {
    if (!data) return;
    const now = new Date().toLocaleString();
    const acc = ((data.metricas?.accuracy || 0) * 100).toFixed(1);
    const auc = ((data.metricas?.auc_roc || 0)).toFixed(3);
    const preds = (data.predicciones || []).slice(0, 50);

    const distRows = [
      { label: "Riesgo Alto",   value: data.resumen?.riesgo_alto || 0,  color: "#ef4444" },
      { label: "Riesgo Medio",  value: data.resumen?.riesgo_medio || 0, color: "#f59e0b" },
      { label: "Activos",       value: data.resumen?.activos || 0,       color: "#10b981" },
    ];
    const featRows = (data.importancia_features || []).slice(0, 8);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Reporte Cancelaciones IA — ${now}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 30px 40px; }
  h1 { font-size: 20px; color: #1a1a2e; margin-bottom: 4px; }
  .sub { color: #666; font-size: 11px; margin-bottom: 24px; }
  h2 { font-size: 14px; color: #1a1a2e; margin: 20px 0 8px; border-bottom: 2px solid #6366f1; padding-bottom: 4px; }
  .explain { background: #f5f5ff; border-left: 3px solid #6366f1; padding: 8px 12px; font-size: 11px; color: #444; margin-bottom: 12px; border-radius: 0 4px 4px 0; }
  .kpis { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .kpi { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 16px; flex: 1; min-width: 120px; }
  .kpi-v { font-size: 22px; font-weight: 700; color: #1a1a2e; }
  .kpi-l { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #1a1a2e; color: #fff; padding: 7px 10px; text-align: left; font-size: 11px; }
  td { padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
  tr:nth-child(even) td { background: #fafafa; }
  .badge-alto  { background:#fee2e2; color:#b91c1c; border-radius:4px; padding:2px 8px; font-weight:700; }
  .badge-medio { background:#fef3c7; color:#92400e; border-radius:4px; padding:2px 8px; font-weight:700; }
  .badge-bajo  { background:#d1fae5; color:#065f46; border-radius:4px; padding:2px 8px; font-weight:700; }
  .bar-wrap { background:#e5e7eb; border-radius:4px; height:12px; }
  .bar { background:#6366f1; border-radius:4px; height:12px; }
  footer { margin-top: 32px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
  @media print { body { padding: 20px; } }
</style></head><body>
<h1>Reporte de Riesgo de Cancelación — IA</h1>
<p class="sub">Generado el ${now} &nbsp;|&nbsp; Algoritmo: Random Forest Classifier</p>

<div class="kpis">
  <div class="kpi"><div class="kpi-v" style="color:#ef4444">${data.resumen?.riesgo_alto || 0}</div><div class="kpi-l">Riesgo Alto</div></div>
  <div class="kpi"><div class="kpi-v" style="color:#f59e0b">${data.resumen?.riesgo_medio || 0}</div><div class="kpi-l">Riesgo Medio</div></div>
  <div class="kpi"><div class="kpi-v" style="color:#10b981">${data.resumen?.activos || 0}</div><div class="kpi-l">Activos Estables</div></div>
  <div class="kpi"><div class="kpi-v" style="color:#6366f1">${acc}%</div><div class="kpi-l">Precisión Modelo</div></div>
  <div class="kpi"><div class="kpi-v" style="color:#6366f1">${auc}</div><div class="kpi-l">AUC-ROC</div></div>
</div>

<h2>¿Qué mide este modelo?</h2>
<div class="explain">
  El modelo <strong>Random Forest Classifier</strong> analiza el comportamiento de cada miembro para predecir la probabilidad de que
  cancele o no renueve su membresía en los próximos días.<br><br>
  <strong>Criterio de riesgo:</strong> un miembro se clasifica como "en riesgo" si lleva más de 21 días sin asistir
  o si su membresía está vencida. El modelo aprende de 5 variables (features) y produce una probabilidad entre 0 y 1.<br><br>
  <strong>Precisión (accuracy):</strong> porcentaje de predicciones correctas en el conjunto de prueba.<br>
  <strong>AUC-ROC:</strong> capacidad del modelo de distinguir entre miembros en riesgo y activos (1.0 = perfecto, 0.5 = azar).
</div>

<h2>Distribución de Riesgo</h2>
<table>
  <thead><tr><th>Categoría</th><th>Miembros</th><th>%</th><th>Barra</th></tr></thead>
  <tbody>
    ${distRows.map(r => {
      const total = (data.resumen?.riesgo_alto||0)+(data.resumen?.riesgo_medio||0)+(data.resumen?.activos||0);
      const pct = total > 0 ? ((r.value / total)*100).toFixed(1) : "0.0";
      return `<tr>
        <td><span style="color:${r.color};font-weight:700">${r.label}</span></td>
        <td>${r.value}</td><td>${pct}%</td>
        <td><div class="bar-wrap"><div class="bar" style="background:${r.color};width:${pct}%"></div></div></td>
      </tr>`;
    }).join("")}
  </tbody>
</table>

<h2>Importancia de Variables (Features)</h2>
<div class="explain">
  Indica qué tan decisiva es cada variable para la predicción. Valores más altos = mayor influencia en el resultado.
  <ul style="margin-top:6px;padding-left:18px">
    <li><strong>dias_sin_asistir</strong>: días desde la última asistencia registrada</li>
    <li><strong>num_asistencias_ult60</strong>: cuántas veces asistió en los últimos 60 días</li>
    <li><strong>tiene_membresia_activa</strong>: 1 si la membresía está vigente, 0 si venció</li>
    <li><strong>total_pagos</strong>: total de pagos históricos del miembro</li>
    <li><strong>meses_activo</strong>: meses desde que se registró en el gimnasio</li>
  </ul>
</div>
<table>
  <thead><tr><th>Variable</th><th>Importancia</th><th>Barra</th></tr></thead>
  <tbody>
    ${featRows.map(f => `<tr>
      <td>${f.feature}</td><td>${(f.importancia*100).toFixed(1)}%</td>
      <td><div class="bar-wrap"><div class="bar" style="width:${(f.importancia*100).toFixed(1)}%"></div></div></td>
    </tr>`).join("")}
  </tbody>
</table>

<h2>Miembros en Riesgo (top ${Math.min(50, preds.length)})</h2>
<div class="explain">
  Lista ordenada de mayor a menor probabilidad de cancelación. Prioriza contactar a los de <strong>Riesgo Alto</strong> primero.
</div>
<table>
  <thead><tr><th>#</th><th>Miembro</th><th>Días sin asistir</th><th>Membresía activa</th><th>Prob. cancelación</th><th>Riesgo</th></tr></thead>
  <tbody>
    ${preds.map((p, i) => `<tr>
      <td>${i+1}</td>
      <td>${p.nombre || p.id_miembro}</td>
      <td>${p.dias_sin_asistir ?? "—"}</td>
      <td>${p.membresia_activa ? "Sí" : "No"}</td>
      <td style="font-weight:700;color:${p.riesgo==="alto"?"#b91c1c":p.riesgo==="medio"?"#92400e":"#065f46"}">
        ${((p.probabilidad||0)*100).toFixed(1)}%
      </td>
      <td><span class="badge-${p.riesgo}">${(p.riesgo||"").toUpperCase()}</span></td>
    </tr>`).join("")}
  </tbody>
</table>

<footer>GymPro — Análisis de Cancelaciones IA &nbsp;|&nbsp; ${now} &nbsp;|&nbsp; Random Forest · ${data.resumen?.total || 0} miembros analizados</footer>
</body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const distribucion = [
    { name: "Riesgo Alto",  value: data?.resumen?.riesgo_alto || 0,  fill: DANGER  },
    { name: "Riesgo Medio", value: data?.resumen?.riesgo_medio || 0, fill: WARNING },
    { name: "Activos",      value: data?.resumen?.activos || 0,      fill: SUCCESS },
  ];

  const importancia = (data?.importancia_features || [])
    .map(f => ({ feature: f.feature, valor: parseFloat((f.importancia||0).toFixed(3)) }));

  const altaRiesgo = (data?.predicciones || [])
    .filter(p => p.riesgo === "alto")
    .slice(0, 10);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  return (
    <div>
      {/* KPIs + acciones */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard label="En riesgo alto"   value={data.resumen?.riesgo_alto || 0}  color={DANGER} />
        <StatCard label="En riesgo medio"  value={data.resumen?.riesgo_medio || 0} color={WARNING} />
        <StatCard label="Activos estables" value={data.resumen?.activos || 0}      color={SUCCESS} />
        <StatCard label="Precisión (acc)"  value={`${((data.metricas?.accuracy||0)*100).toFixed(1)}%`} color={INFO} />
        <StatCard label="AUC-ROC"          value={(data.metricas?.auc_roc||0).toFixed(3)} color={PURPLE} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <TrainBtn loading={trainLoading} onClick={handleTrain} label="Reentrenar Random Forest" />
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

      {/* Explicación del modelo */}
      <div style={{ background: "rgba(99,102,241,.07)", border: "1px solid rgba(99,102,241,.2)",
        borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--text-secondary)",
        lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-primary)" }}>¿Qué estás viendo?</strong>{" "}
        Este análisis usa un <strong>Random Forest Classifier</strong> entrenado con el historial de asistencia,
        pagos y estado de membresía de tus miembros. El modelo predice la probabilidad de que un miembro
        cancele o no renueve. Un miembro se considera "en riesgo" si lleva más de 21 días sin asistir
        o si su membresía está vencida. La <strong>precisión</strong> indica qué tan acertado es el modelo
        en datos de prueba; el <strong>AUC-ROC</strong> mide su capacidad de distinguir entre activos
        y en riesgo (1.0 = perfecto).
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SectionTitle>Distribución de riesgo</SectionTitle>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "-4px 0 8px" }}>
            Porcentaje de tu base de miembros por nivel de riesgo de cancelación.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={distribucion} dataKey="value" nameKey="name"
                   cx="50%" cy="50%" outerRadius={75}
                   label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}>
                {distribucion.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {importancia.length > 0 && (
          <div style={{ flex: 1, minWidth: 260 }}>
            <SectionTitle>Importancia de variables (Random Forest)</SectionTitle>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "-4px 0 8px" }}>
              Qué tan determinante es cada variable para la predicción. Mayor valor = más influencia.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={importancia} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
                <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <YAxis type="category" dataKey="feature" width={155}
                       tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" name="Importancia" fill={PURPLE} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {altaRiesgo.length > 0 && (
        <>
          <SectionTitle>Miembros con mayor riesgo de cancelación</SectionTitle>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "-8px 0 10px" }}>
            Ordenados de mayor a menor probabilidad. Contáctalos para evitar que se vayan.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg-input)" }}>
                  {["Miembro","Días sin asistir","Membresía activa","Prob. cancelación","Riesgo"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {altaRiesgo.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-dark)" }}>
                    <td style={{ padding: "8px 12px" }}>{p.nombre || p.id_miembro}</td>
                    <td style={{ padding: "8px 12px" }}>{p.dias_sin_asistir ?? "—"}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ color: p.membresia_activa ? SUCCESS : DANGER, fontWeight: 600 }}>
                        {p.membresia_activa ? "Sí" : "No"}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", color: DANGER, fontWeight: 600 }}>
                      {((p.probabilidad || 0) * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{
                        background: p.riesgo === "alto" ? "rgba(255,77,77,0.15)" : "rgba(255,189,46,0.15)",
                        color: p.riesgo === "alto" ? DANGER : WARNING,
                        borderRadius: 6, padding: "2px 10px", fontWeight: 600, fontSize: 12,
                      }}>
                        {p.riesgo?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

const TABS = [
  { id: "mapreduce",     label: "MapReduce",     Icon: IconMapReduce,     Component: TabMapReduce     },
  { id: "kmeans",        label: "K-Means",        Icon: IconKMeans,        Component: TabKMeans        },
  { id: "regresion",     label: "Regresión",      Icon: IconRegresion,     Component: TabRegresion     },
  { id: "cancelaciones", label: "Cancelaciones",  Icon: IconCancelaciones, Component: TabCancelaciones },
];

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("mapreduce");

  const ActiveComp = TABS.find(t => t.id === activeTab)?.Component;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: 24, fontWeight: 700, margin: 0 }}>
          Analytics Dashboard
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 6 }}>
          Análisis distribuido con Apache Spark — datos en tiempo real con caché TTL
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
