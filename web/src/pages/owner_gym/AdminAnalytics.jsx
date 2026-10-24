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
        <StatCard label="Separación entre grupos" value={data.silhouette?.toFixed(3)} color={silConfig.color} suffix={` (${silConfig.label})`} />
        <StatCard label="Grupos" value={kValue} color={INFO} />
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
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
        <StatCard label="Confiabilidad"      value={(metricas.r2   || 0).toFixed(4)} color={metricas.r2 > 0.7 ? SUCCESS : WARNING} />
        <StatCard label="Margen de error"   value={(metricas.rmse || 0).toFixed(2)} color={INFO} suffix=" kg" />
        <StatCard label="Error promedio"    value={(metricas.mae  || 0).toFixed(2)} color={INFO} suffix=" kg" />
        <StatCard label="Muestras"          value={metricas.num_muestras || "—"} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <TrainBtn loading={trainLoading} onClick={handleTrain} label="Actualizar tendencias" />
          {trainMsg && <span style={{ color: SUCCESS, fontSize: 13 }}>{trainMsg}</span>}
        </div>
      </div>

      <SectionTitle>¿Qué factores influyen más en el peso?</SectionTitle>
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

      <SectionTitle>Resumen de la predicción</SectionTitle>
      <div style={{ background: "var(--bg-input)", borderRadius: 10, padding: "16px 20px", fontSize: 13, lineHeight: 1.7 }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
          El análisis utiliza el historial de progreso físico de tus miembros para proyectar
          cómo evolucionará su peso. Tiene en cuenta días de entrenamiento, porcentaje de grasa e IMC.
        </p>
        <p style={{ color: SUCCESS }}>
          Confiabilidad: {(metricas.r2 || 0).toFixed(4)} —
          {metricas.r2 > 0.8 ? " Muy confiable"
           : metricas.r2 > 0.6 ? " Confiable"
           : metricas.r2 > 0.4 ? " Moderadamente confiable" : " Datos insuficientes"}
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
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

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

      {/* Tabla de miembros en riesgo */}
      {enRiesgo.length > 0 && (
        <>
          <SectionTitle>Miembros que necesitan atención</SectionTitle>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "-8px 0 10px" }}>
            Ordenados por prioridad. Contacta primero a los de <strong style={{ color: DANGER }}>Atención urgente</strong>.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg-input)" }}>
                  {["Miembro", "Sin visitar", "Membresía", "Estado", "Acción sugerida"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enRiesgo.map((p, i) => {
                  const isAlto   = p.riesgo === "alto";
                  const badgeBg  = isAlto ? "rgba(255,77,77,0.15)" : "rgba(255,189,46,0.15)";
                  const badgeFg  = isAlto ? DANGER : WARNING;
                  const badgeTxt = isAlto ? "URGENTE" : "ATENCIÓN";
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-dark)" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 600 }}>{p.nombre || p.id_miembro}</td>
                      <td style={{ padding: "8px 12px", color: p.dias_sin_asistir > 21 ? DANGER : "var(--text-primary)" }}>
                        {p.dias_sin_asistir != null ? `${p.dias_sin_asistir} días` : "—"}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ color: p.membresia_activa ? SUCCESS : DANGER, fontWeight: 600 }}>
                          {p.membresia_activa ? "Vigente" : "Vencida"}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ background: badgeBg, color: badgeFg, borderRadius: 6, padding: "3px 10px", fontWeight: 700, fontSize: 11 }}>
                          {badgeTxt}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", color: badgeFg, fontWeight: 600 }}>
                        {ACCION_POR_RIESGO[p.riesgo] || "—"}
                      </td>
                    </tr>
                  );
                })}
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
          Análisis inteligente de tu gimnasio — datos en tiempo real con caché automático
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
