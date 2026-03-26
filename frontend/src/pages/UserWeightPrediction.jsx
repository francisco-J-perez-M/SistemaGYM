import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../css/CSSUnificado.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DIAS_OPTIONS = [
  { label: "3 meses", value: 90 },
  { label: "6 meses", value: 180 },
  { label: "1 año", value: 365 },
];

const TENDENCIA_CONFIG = {
  bajando: {
    label: "Bajando",
    desc: "¡Vas por buen camino! Tu peso sigue una tendencia a la baja.",
    color: "var(--success-color)",
    bg: "rgba(76,217,100,0.08)",
    border: "rgba(76,217,100,0.25)",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m7 7 10 10" />
        <path d="M17 7v10H7" />
      </svg>
    ),
  },
  subiendo: {
    label: "Subiendo",
    desc: "Tu peso muestra una tendencia al alza. Considera ajustar tu plan.",
    color: "var(--danger-color)",
    bg: "rgba(255,77,77,0.08)",
    border: "rgba(255,77,77,0.25)",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m17 17-10-10" />
        <path d="M7 17V7h10" />
      </svg>
    ),
  },
  estable: {
    label: "Estable",
    desc: "Tu peso se mantiene sin cambios significativos.",
    color: "var(--warning-color)",
    bg: "rgba(255,189,46,0.08)",
    border: "rgba(255,189,46,0.25)",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    ),
  },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-dark)",
      borderRadius: 8, padding: "10px 14px", fontSize: 13,
    }}>
      <p style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) =>
        p.value != null ? (
          <p key={i} style={{ color: p.color, fontWeight: 500 }}>
            {p.name}: {parseFloat(p.value).toFixed(1)} kg
          </p>
        ) : null
      )}
    </div>
  );
};

export default function UserWeightPrediction() {
  const [dias, setDias] = useState(180);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrediction = async (diasParam) => {
    setLoading(true);
    setError(null);

    try {
      // Leer el ID del usuario desde localStorage
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = user?.id_miembro || user?.id || user?.user_id;

      if (!userId) throw new Error("No se encontró tu ID de usuario. Por favor, vuelve a iniciar sesión.");

      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/analytics/regresion/predecir/${userId}?dias=${diasParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrediction(dias); }, []);

  const handleDiasChange = (newDias) => {
    setDias(newDias);
    fetchPrediction(newDias);
  };

  // Construir datos del gráfico
  const buildChartData = () => {
    if (!data) return [];
    const historial = data.historial_peso || [];
    const predicciones = data.predicciones_futuras || [];

    const histData = historial.map((item, i) => ({
      label: item.fecha || item.mes || `M${i + 1}`,
      real: item.peso ?? item.valor ?? (typeof item === "number" ? item : null),
      prediccion: null,
    }));

    const predData = predicciones.map((item, i) => ({
      label: item.fecha || item.mes || `F+${i + 1}`,
      real: null,
      prediccion: item.peso ?? item.valor ?? (typeof item === "number" ? item : null),
    }));

    // Conectar desde el último punto real
    if (histData.length > 0 && predData.length > 0) {
      return [
        ...histData,
        { ...predData[0], real: histData[histData.length - 1].real },
        ...predData.slice(1),
      ];
    }
    return [...histData, ...predData];
  };

  const chartData = buildChartData();

  // Estadísticas rápidas
  const historial = data?.historial_peso || [];
  const predicciones = data?.predicciones_futuras || [];
  const pesoActual = historial.length > 0
    ? (historial[historial.length - 1]?.peso ?? historial[historial.length - 1]?.valor ?? historial[historial.length - 1])
    : null;
  const pesoInicial = historial.length > 0
    ? (historial[0]?.peso ?? historial[0]?.valor ?? historial[0])
    : null;
  const pesoMeta = predicciones.length > 0
    ? (predicciones[predicciones.length - 1]?.peso ?? predicciones[predicciones.length - 1]?.valor ?? predicciones[predicciones.length - 1])
    : null;
  const cambioReal = pesoActual !== null && pesoInicial !== null ? (pesoActual - pesoInicial) : null;
  const cambioEstimado = pesoMeta !== null && pesoActual !== null ? (pesoMeta - pesoActual) : null;

  const tendencia = data?.tendencia || "";
  const tConfig = TENDENCIA_CONFIG[tendencia];
  const disclaimer = data?.disclaimer || data?.advertencia || null;

  if (loading) return (
    <div className="loading-spinner" style={{ height: "60vh" }}>
      <div className="dashboard-spinner" />
      <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>Cargando tu predicción...</p>
    </div>
  );

  if (error) return (
    <div className="dashboard-content">
      <div className="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--danger-color)" strokeWidth="1.5" style={{ margin: "0 auto 12px" }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" /><circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
        <h3>No se pudo cargar la predicción</h3>
        <p>{error}</p>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => fetchPrediction(dias)}>
          Reintentar
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-content">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Mi predicción de peso</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Análisis de IA basado en tu historial registrado
        </p>
      </div>

      {/* Tendencia + Estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, marginBottom: 24, alignItems: "start" }}>
        {/* Tarjeta de tendencia */}
        {tConfig && (
          <div
            className="stat-card"
            style={{
              alignItems: "center", justifyContent: "center", gap: 10,
              textAlign: "center", minWidth: 170, padding: 28,
              background: tConfig.bg, borderColor: tConfig.border,
            }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: tConfig.bg, border: `1px solid ${tConfig.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: tConfig.color,
            }}>
              {tConfig.icon}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: tConfig.color }}>{tConfig.label}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 140 }}>{tConfig.desc}</div>
          </div>
        )}

        {/* Estadísticas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div className="stat-card" style={{ padding: 16 }}>
              <h3>Peso actual</h3>
              <div className="stat-value highlight" style={{ fontSize: 22 }}>
                {pesoActual !== null ? `${parseFloat(pesoActual).toFixed(1)} kg` : "—"}
              </div>
            </div>
            <div className="stat-card" style={{ padding: 16 }}>
              <h3>Meta estimada</h3>
              <div className="stat-value" style={{ fontSize: 22 }}>
                {pesoMeta !== null ? `${parseFloat(pesoMeta).toFixed(1)} kg` : "—"}
              </div>
            </div>
            <div className="stat-card" style={{ padding: 16 }}>
              <h3>Cambio estimado</h3>
              <div
                className="stat-value"
                style={{
                  fontSize: 22,
                  color: cambioEstimado === null ? "var(--text-primary)"
                    : cambioEstimado < 0 ? "var(--success-color)"
                    : cambioEstimado > 0 ? "var(--danger-color)"
                    : "var(--warning-color)",
                }}
              >
                {cambioEstimado !== null
                  ? `${cambioEstimado > 0 ? "+" : ""}${parseFloat(cambioEstimado).toFixed(1)} kg`
                  : "—"}
              </div>
            </div>
          </div>

          {/* Selector de días */}
          <div className="stat-card" style={{
            flexDirection: "row", alignItems: "center", gap: 10, padding: "12px 16px", flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Proyección:</span>
            {DIAS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleDiasChange(opt.value)}
                style={{
                  padding: "7px 16px", borderRadius: 20, border: "1px solid",
                  borderColor: dias === opt.value ? "var(--accent)" : "var(--border-dark)",
                  background: dias === opt.value ? "var(--accent)" : "var(--input-bg-dark)",
                  color: dias === opt.value ? "var(--text-on-accent)" : "var(--text-secondary)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico principal */}
      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div className="chart-header" style={{ marginBottom: 16 }}>
          <h3>Historial real y proyección de IA</h3>
        </div>

        <div style={{ display: "flex", gap: 20, marginBottom: 14, fontSize: 12, color: "var(--text-secondary)", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 24, height: 3, background: "#38bdf8", borderRadius: 2, display: "inline-block" }} />
            Historial real (datos medidos)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 24, height: 0, borderTop: "3px dashed #a78bfa", display: "inline-block" }} />
            Predicción IA (estimación futura)
          </span>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v.toFixed(0)} kg`}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="real" name="Historial"
                stroke="#38bdf8" strokeWidth={2.5}
                dot={{ r: 4, fill: "#38bdf8", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              <Line
                type="monotone" dataKey="prediccion" name="Predicción"
                stroke="#a78bfa" strokeWidth={2.5} strokeDasharray="6 4"
                dot={{ r: 4, fill: "#a78bfa", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
            No hay datos suficientes para mostrar el gráfico.
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{
        display: "flex", gap: 14, alignItems: "flex-start",
        background: "rgba(255,189,46,0.07)", border: "1px solid rgba(255,189,46,0.2)",
        borderRadius: 12, padding: "14px 18px",
      }}>
        <svg style={{ flexShrink: 0, color: "var(--warning-color)", marginTop: 2 }}
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: "var(--warning-color)" }}>Aviso importante: </strong>
          {disclaimer ||
            "Esta predicción es una estimación calculada por inteligencia artificial basada en tu historial de peso registrado. No constituye un diagnóstico médico ni un plan nutricional. Los resultados reales pueden variar según factores como dieta, niveles de estrés, hidratación y actividad física. Consulta a tu entrenador o nutriólogo para un seguimiento personalizado."}
        </p>
      </div>
    </div>
  );
}