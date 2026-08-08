import { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../../css/CSSUnificado.css";
import InfoGrafico, {
  COLORES_GRAFICO, COLOR_REJILLA, ejeX, ejeY,
} from "../../components/compartido/InfoGrafico";

const API_BASE = "";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-dark)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
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

// ── Modal de predicción individual ────────────────────────────────────────────
function PredictionModal({ member, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [dias, setDias]     = useState(180);

  const fetchPrediction = useCallback(async (diasParam) => {
    setLoading(true); setError(null);
    const token = localStorage.getItem("token");
    const id    = member.id_miembro || member.id;
    try {
      const res  = await fetch(
        `${API_BASE}/api/analytics/regresion/predecir/${id}?dias=${diasParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [member]);

  useEffect(() => { fetchPrediction(dias); }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDias = (d) => { setDias(d); fetchPrediction(d); };

  const chartData = (() => {
    if (!data) return [];
    const hist = (data.historial_peso || []).map((item, i) => ({
      label: item.fecha || `M${i + 1}`, real: item.peso ?? null, prediccion: null,
    }));
    const pred = (data.predicciones_futuras || []).map((item, i) => ({
      label: item.fecha_estimada || `F+${i + 1}`, real: null, prediccion: item.peso_predicho_kg ?? null,
    }));
    const ultimo = hist[hist.length - 1];
    if (ultimo && pred.length > 0) return [...hist, { ...pred[0], real: ultimo.real }, ...pred.slice(1)];
    return [...hist, ...pred];
  })();

  const tendencia = data?.tendencia || "";
  const tCfg = {
    bajando:  { icon: "↙", color: "var(--success-color)", bg: "rgba(76,217,100,0.12)",  label: "Bajando de peso" },
    subiendo: { icon: "↗", color: "var(--danger-color)",  bg: "rgba(255,77,77,0.12)",   label: "Subiendo de peso" },
    estable:  { icon: "→", color: "var(--warning-color)", bg: "rgba(255,189,46,0.12)",  label: "Peso estable" },
  }[tendencia] || {};

  const nombre = member.nombre || member.name || `Miembro #${member.id_miembro || member.id}`;
  const initials = nombre.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border-dark)",
          borderRadius: 16, width: "100%", maxWidth: 780, maxHeight: "90vh",
          overflowY: "auto", padding: "28px 28px 24px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header modal */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div className="avatar" style={{ width: 42, height: 42, fontSize: 15, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{nombre}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "2px 0 0" }}>
              Predicción de evolución de peso
            </p>
          </div>
          {tCfg.label && (
            <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: tCfg.bg, color: tCfg.color, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>{tCfg.icon}</span>
              {tCfg.label}
            </span>
          )}
          <button
            onClick={onClose}
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-dark)", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)", flexShrink: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Selector de horizonte */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[{ label: "3 meses", value: 90 }, { label: "6 meses", value: 180 }, { label: "1 año", value: 365 }].map(opt => (
            <button key={opt.value} onClick={() => handleDias(opt.value)}
              style={{
                padding: "7px 16px", borderRadius: 20, border: "1px solid",
                borderColor: dias === opt.value ? "var(--accent)" : "var(--border-dark)",
                background: dias === opt.value ? "var(--accent)" : "var(--bg-input)",
                color: dias === opt.value ? "#000" : "var(--text-secondary)",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
            <div className="dashboard-spinner" />
            <p style={{ color: "var(--text-secondary)", marginTop: 16, fontSize: 13 }}>Calculando predicción...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" style={{ margin: "0 auto 12px" }}>
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <h3 style={{ marginBottom: 8 }}>Sin registros de progreso</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, maxWidth: 340 }}>
              Este miembro aún no tiene mediciones registradas. Cuando el entrenador ingrese datos de progreso físico, podrás ver la predicción aquí.
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="empty-state">
            <p>Sin datos de progreso registrados para este miembro.</p>
          </div>
        ) : (
          <>
            <InfoGrafico
              titulo="Evolución del peso"
              subtitulo={
                data?.modelo === "personal"
                  ? "Proyección calculada con las mediciones de este miembro."
                  : "Proyección calculada con el modelo del gimnasio."
              }
              series={[
                {
                  color: COLORES_GRAFICO.real,
                  nombre: "Historial real",
                  descripcion: "Cada punto es una medición registrada en Progreso Físico. Dato medido, no estimado.",
                },
                {
                  color: COLORES_GRAFICO.prediccion,
                  nombre: "Predicción",
                  descripcion: "Línea discontinua: hacia dónde apunta la tendencia si se mantiene el ritmo actual.",
                },
              ]}
              notas={[
                data?.registros ? `Basado en ${data.registros} medicion${data.registros === 1 ? "" : "es"}.` : null,
                data?.calidad_ajuste != null
                  ? `Ajuste del modelo: ${(data.calidad_ajuste * 100).toFixed(0)} %. Cuanto más alto, más regular ha sido la evolución y más fiable la proyección.`
                  : null,
                "El eje vertical está en kilogramos. El tramo punteado empieza donde acaban las mediciones reales.",
              ].filter(Boolean)}
            />

            {/* Leyenda */}
            <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, color: "var(--text-secondary)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 24, height: 3, background: COLORES_GRAFICO.real, borderRadius: 2, display: "inline-block" }} />
                Historial real
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 24, height: 0, borderTop: `3px dashed ${COLORES_GRAFICO.prediccion}`, display: "inline-block" }} />
                Predicción IA
              </span>
            </div>
            <ResponsiveContainer width="100%" height={295}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 6, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLOR_REJILLA} />
                <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false}
                  label={ejeX("Fecha de la medición")} />
                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)} kg`}
                  label={ejeY("Peso corporal (kg)")} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="real" name="Historial" stroke={COLORES_GRAFICO.real} strokeWidth={2.5} dot={{ r: 4, fill: COLORES_GRAFICO.real, strokeWidth: 0 }} connectNulls={false} />
                <Line type="monotone" dataKey="prediccion" name="Predicción" stroke={COLORES_GRAFICO.prediccion} strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 4, fill: COLORES_GRAFICO.prediccion, strokeWidth: 0 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>

            {/* Métricas de contexto */}
            {data && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
                {data.peso_actual_kg != null && (
                  <div style={{ flex: 1, minWidth: 110, background: "var(--bg-input)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: 11, marginBottom: 4 }}>Peso actual</div>
                    <div style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700 }}>{parseFloat(data.peso_actual_kg).toFixed(1)} kg</div>
                  </div>
                )}
                {(() => {
                  const preds = data.predicciones_futuras || [];
                  const pesoFinal = preds.length > 0 ? preds[preds.length - 1].peso_predicho_kg : null;
                  return pesoFinal != null ? (
                    <div style={{ flex: 1, minWidth: 110, background: "var(--bg-input)", borderRadius: 10, padding: "12px 16px" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: 11, marginBottom: 4 }}>Proyección final</div>
                      <div style={{ color: "#a78bfa", fontSize: 20, fontWeight: 700 }}>{parseFloat(pesoFinal).toFixed(1)} kg</div>
                    </div>
                  ) : null;
                })()}
                {(() => {
                  const preds = data.predicciones_futuras || [];
                  const hist  = data.historial_peso || [];
                  if (!preds.length || !hist.length) return null;
                  const variacion = preds[preds.length - 1].peso_predicho_kg - hist[hist.length - 1].peso;
                  return (
                    <div style={{ flex: 1, minWidth: 110, background: "var(--bg-input)", borderRadius: 10, padding: "12px 16px" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: 11, marginBottom: 4 }}>Variación estimada</div>
                      <div style={{ color: variacion < 0 ? "var(--success-color)" : variacion > 0 ? "var(--danger-color)" : "var(--text-primary)", fontSize: 20, fontWeight: 700 }}>
                        {variacion > 0 ? "+" : ""}{parseFloat(variacion).toFixed(1)} kg
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsRegresion() {
  const [globalData, setGlobalData]       = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError]     = useState(null);
  const [trainLoading, setTrainLoading]   = useState(false);
  const [trainMsg, setTrainMsg]           = useState(null);

  // Lista de miembros
  const [members, setMembers]             = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersPage, setMembersPage]     = useState(1);
  const [membersTotal, setMembersTotal]   = useState(0);
  const [membersPages, setMembersPages]   = useState(1);
  const [searchQuery, setSearchQuery]     = useState("");

  // Modal de predicción
  const [modalMember, setModalMember]     = useState(null);

  // ── Cargar datos globales ─────────────────────────────────────────────────
  const fetchGlobal = useCallback(async () => {
    setGlobalLoading(true); setGlobalError(null); setTrainMsg(null);
    const token = localStorage.getItem("token");
    try {
      const r = await fetch(`${API_BASE}/api/analytics/regresion`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      setGlobalData(await r.json());
    } catch (e) {
      setGlobalError(e.message);
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  // ── Reentrenar modelo ─────────────────────────────────────────────────────
  const handleTrain = useCallback(async () => {
    setTrainLoading(true); setTrainMsg(null); setGlobalError(null);
    const token = localStorage.getItem("token");
    try {
      const r = await fetch(`${API_BASE}/api/analytics/regresion/train`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const json = await r.json();
      setGlobalData(json);
      setTrainMsg(json.mensaje || "Tendencias actualizadas correctamente.");
    } catch (e) {
      setGlobalError(e.message);
    } finally {
      setTrainLoading(false);
    }
  }, []);

  // ── Cargar lista de miembros (paginada, per_page=6 en el backend) ──────────
  const fetchMembers = useCallback(async (query = "", page = 1) => {
    setMembersLoading(true);
    const token = localStorage.getItem("token");
    try {
      const params = new URLSearchParams({ page });
      if (query) params.set("search", query);
      const r = await fetch(`${API_BASE}/api/miembros?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      const json = await r.json();
      setMembers(json.miembros || []);
      setMembersTotal(json.total || 0);
      setMembersPages(json.pages || 1);
      setMembersPage(page);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => { fetchGlobal(); fetchMembers(); }, []);

  // Debounce búsqueda — resetea a página 1
  const debounceRef = useRef(null);
  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchMembers(q, 1), 350);
  };

  // ── Datos para gráfico global ──────────────────────────────────────────────
  const tendenciaGlobal = globalData?.tendencia_peso_global || [];
  const metricas        = globalData?.metricas || {};
  const r2              = metricas.r2 ?? null;
  const rmse            = metricas.rmse ?? null;
  const desdeCache      = globalData?.desde_cache ?? false;
  const ejecutadoEn     = globalData?.ejecutado_en;

  const globalChartData = tendenciaGlobal.map(item => ({
    mes:  item.mes || item.periodo || "",
    peso: item.peso_promedio ?? item.peso ?? null,
  }));

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Tendencias y Predicción</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Tendencia de peso del gimnasio y proyección individual por miembro
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {ejecutadoEn && (
            <span style={{ fontSize: 11, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: desdeCache ? "var(--success-color)" : "var(--warning-color)", display: "inline-block" }} />
              {desdeCache ? "Desde caché" : "Recién entrenado"} · {new Date(ejecutadoEn).toLocaleString("es-MX")}
            </span>
          )}
          <button className="btn-compact-primary" onClick={handleTrain} disabled={trainLoading || globalLoading}>
            {trainLoading ? <span className="spinner" /> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
            )}
            {trainLoading ? "Actualizando..." : "Actualizar tendencias"}
          </button>
        </div>
      </div>

      {trainMsg && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, background: "rgba(76,217,100,0.1)", border: "1px solid var(--success-color)", color: "var(--success-color)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          {trainMsg}
        </div>
      )}

      {/* ── Tendencia Global ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
          ¿Cómo está evolucionando el peso de tus miembros?
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          Promedio del gimnasio en los últimos meses y predicción de la tendencia
        </p>
      </div>

      {globalLoading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-dark)" }}>
          <div className="dashboard-spinner" />
          <h3 style={{ marginTop: 20, marginBottom: 8 }}>Calculando tendencia…</h3>
        </div>
      ) : globalError ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 32px", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-dark)", marginBottom: 20 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)", marginBottom: 16 }}>
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Todavía no hay suficientes datos</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "0 0 16px", maxWidth: 360, lineHeight: 1.6 }}>
            Para ver la tendencia de peso del gimnasio necesitamos que tus miembros
            tengan registros de progreso físico. Cuando haya información suficiente,
            la gráfica aparecerá aquí automáticamente.
          </p>
          <button className="btn-primary" onClick={fetchGlobal}>
            Volver a intentar
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 28 }}>
          <div className="chart-card">
            <InfoGrafico
              titulo="Peso promedio del gimnasio"
              subtitulo="Cómo evoluciona el peso medio de todos los miembros con mediciones."
              series={[
                {
                  color: COLORES_GRAFICO.real,
                  nombre: "Promedio global",
                  descripcion: "Media de todas las mediciones registradas en ese mes por el conjunto de miembros.",
                },
              ]}
              notas={[
                "Es un promedio del gimnasio, no de una persona: un miembro nuevo con peso muy distinto puede mover la línea sin que nadie haya cambiado.",
                "Los meses sin mediciones no aparecen en el eje.",
              ]}
            />
            <ResponsiveContainer width="100%" height={255}>
              <LineChart data={globalChartData} margin={{ top: 5, right: 10, left: 6, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLOR_REJILLA} />
                <XAxis dataKey="mes" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false}
                  label={ejeX("Mes")} />
                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)} kg`}
                  label={ejeY("Peso promedio (kg)")} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="peso" name="Promedio global" stroke={COLORES_GRAFICO.real} strokeWidth={2.5} dot={{ r: 4, fill: COLORES_GRAFICO.real, strokeWidth: 0 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="stat-card" style={{ justifyContent: "center", alignItems: "center", gap: 10 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>Confiabilidad del análisis</p>
            <div style={{ fontSize: 52, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>
              {r2 !== null ? r2.toFixed(2) : "—"}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Qué tan precisa es la predicción</p>
            {r2 !== null && (
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: r2 >= 0.8 ? "rgba(76,217,100,0.12)" : "rgba(255,189,46,0.12)", color: r2 >= 0.8 ? "var(--success-color)" : "var(--warning-color)" }}>
                {r2 >= 0.9 ? "Muy confiable" : r2 >= 0.7 ? "Confiable" : "Moderadamente confiable"}
              </span>
            )}
            {rmse !== null && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Margen de error: <strong style={{ color: "var(--text-primary)" }}>{parseFloat(rmse).toFixed(2)} kg</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Predicción individual: lista de miembros ─────────────────────── */}
      <div style={{ marginBottom: 14, marginTop: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
          ¿Qué pasará con el peso de cada miembro?
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          Predicción individual basada en su historial de progreso físico
        </p>
      </div>

      {/* Buscador */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar miembro por nombre..."
          style={{ width: "100%", padding: "11px 16px 11px 40px", background: "var(--bg-input)", border: "1px solid var(--border-dark)", borderRadius: 10, outline: "none", color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box" }}
        />
      </div>

      {/* Tabla de miembros */}
      {membersLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "32px 20px" }}>
          <div className="dashboard-spinner" />
        </div>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <p>No se encontraron miembros.</p>
        </div>
      ) : (
        <>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-dark)", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "var(--bg-input)", borderBottom: "1px solid var(--border-dark)" }}>
                  {["Miembro", "Estado", "Registro", "Predicción"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  // El modelo devuelve: id, nombre, activo (bool), registrationDate
                  const nombre   = m.nombre || `Miembro #${m.id}`;
                  const initials = nombre.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  const isActivo = m.activo === true;
                  const fechaStr = m.registrationDate
                    ? new Date(m.registrationDate).toLocaleDateString("es-MX")
                    : null;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-dark)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{nombre}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                              {m.email && m.email !== "Sin Email" ? m.email : `ID: ${(m.id || "").slice(-8)}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: isActivo ? "rgba(76,217,100,0.12)" : "rgba(255,77,77,0.12)", color: isActivo ? "var(--success-color)" : "var(--danger-color)" }}>
                          {isActivo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: 13 }}>
                        {fechaStr || "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => setModalMember(m)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                          </svg>
                          Ver predicción
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {membersPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, fontSize: 13 }}>
              <span style={{ color: "var(--text-secondary)" }}>
                {membersTotal} miembros · página {membersPage} de {membersPages}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  disabled={membersPage <= 1}
                  onClick={() => fetchMembers(searchQuery, membersPage - 1)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border-dark)", background: "var(--bg-input)", color: membersPage <= 1 ? "var(--text-secondary)" : "var(--text-primary)", cursor: membersPage <= 1 ? "not-allowed" : "pointer", fontSize: 13 }}
                >
                  ← Anterior
                </button>
                <button
                  disabled={membersPage >= membersPages}
                  onClick={() => fetchMembers(searchQuery, membersPage + 1)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border-dark)", background: "var(--bg-input)", color: membersPage >= membersPages ? "var(--text-secondary)" : "var(--text-primary)", cursor: membersPage >= membersPages ? "not-allowed" : "pointer", fontSize: 13 }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de predicción */}
      {modalMember && (
        <PredictionModal member={modalMember} onClose={() => setModalMember(null)} />
      )}
    </div>
  );
}