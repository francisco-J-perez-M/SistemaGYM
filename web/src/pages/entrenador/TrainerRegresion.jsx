/**
 * TrainerRegresion.jsx — Predicción de peso para entrenadores.
 * Misma API que AnalyticsRegresion, presentación orientada al usuario no técnico.
 * Sin emojis: usa react-icons/fi. Miembros listados con paginación + modal de predicción.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import {
  FiInfo, FiChevronDown, FiChevronUp, FiRefreshCw, FiLoader,
  FiAlertTriangle, FiCheckCircle, FiTrendingDown, FiTrendingUp,
  FiMinus, FiEye, FiX, FiActivity, FiBarChart2, FiUsers,
  FiArrowLeft, FiArrowRight, FiSearch,
} from "react-icons/fi";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import InfoGrafico, {
  COLORES_GRAFICO, COLOR_REJILLA, ejeX, ejeY,
} from "../../components/compartido/InfoGrafico";
import "../../css/CSSUnificado.css";

const API_BASE       = "";
const MEMBERS_PER_PAGE = 12;

/* ─── Tooltip del gráfico ────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      <p style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => p.value != null ? (
        <p key={i} style={{ color: p.color, fontWeight: 500 }}>
          {p.name}: {parseFloat(p.value).toFixed(1)} kg
        </p>
      ) : null)}
    </div>
  );
};

/* ─── Calidad del modelo en lenguaje llano ───────────────────────────── */
function interpretarR2(r2) {
  if (r2 >= 0.85) return { nivel: "Muy alta", color: "var(--success)", bg: "rgba(76,217,100,0.10)",
    texto: "El modelo predice con mucha precisión. Puedes confiar en las proyecciones." };
  if (r2 >= 0.65) return { nivel: "Buena",    color: "var(--accent)",  bg: "rgba(251,227,121,0.10)",
    texto: "El modelo predice bien en general. Las proyecciones son orientativas." };
  if (r2 >= 0.45) return { nivel: "Moderada", color: "var(--warning)", bg: "rgba(255,189,46,0.10)",
    texto: "El modelo es orientativo. Con más registros de progreso la precisión mejorará." };
  return              { nivel: "Baja",      color: "var(--danger)",  bg: "rgba(255,77,77,0.10)",
    texto: "Hay pocos datos de progreso físico. Agrega más registros para mejorar las predicciones." };
}

/* ─── Icono de tendencia ─────────────────────────────────────────────── */
function TendenciaIcon({ tendencia, size = 14 }) {
  if (tendencia === "bajando")  return <FiTrendingDown size={size} color="var(--success)" />;
  if (tendencia === "subiendo") return <FiTrendingUp   size={size} color="var(--danger)"  />;
  return <FiMinus size={size} color="var(--warning)" />;
}

function tendenciaLabel(tendencia) {
  if (tendencia === "bajando")  return { label: "Bajando", color: "var(--success)", bg: "rgba(76,217,100,0.10)"  };
  if (tendencia === "subiendo") return { label: "Subiendo", color: "var(--danger)",  bg: "rgba(255,77,77,0.10)"   };
  return                               { label: "Estable",  color: "var(--warning)", bg: "rgba(255,189,46,0.10)"  };
}

/* ─── Modal de predicción individual ────────────────────────────────── */
function PredictionModal({ member, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [dias, setDias]     = useState(180);

  const fetchPred = useCallback(async (d) => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem("token");
      const id    = member.id_miembro || member.id;
      const res   = await fetch(`${API_BASE}/api/analytics/regresion/predecir/${id}?dias=${d}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const err  = new Error(json.error || `Error ${res.status}`);
        err.status = res.status;
        throw err;
      }
      setData(await res.json());
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [member]);

  useEffect(() => { fetchPred(dias); }, []); // eslint-disable-line

  const handleDias = (d) => { setDias(d); fetchPred(d); };

  // Construir datos del gráfico
  const chartData = (() => {
    if (!data) return [];
    const hist = (data.historial_peso || []).map((r, i) => ({
      label: r.fecha || `M${i + 1}`, real: r.peso, prediccion: null,
    }));
    const pred = (data.predicciones_futuras || []).map((r, i) => ({
      label: r.fecha_estimada || `F+${i + 1}`, real: null,
      prediccion: r.peso_predicho_kg,
    }));
    const last = hist[hist.length - 1];
    if (last && pred.length > 0) {
      return [...hist, { ...pred[0], real: last.real }, ...pred.slice(1)];
    }
    return [...hist, ...pred];
  })();

  const pesoActual   = data?.peso_actual_kg;
  const pesoFuturo   = data?.predicciones_futuras?.slice(-1)[0]?.peso_predicho_kg;
  const diff         = pesoActual && pesoFuturo ? parseFloat((pesoFuturo - pesoActual).toFixed(1)) : null;
  const tc           = data ? tendenciaLabel(data.tendencia) : {};
  const nombre       = member.nombre || `Miembro #${member.id_miembro || member.id}`;
  const initials     = nombre.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "var(--bg-card)", borderRadius: 16,
        border: "1px solid var(--border)", width: "100%", maxWidth: 760,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Header del modal */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="avatar" style={{ width: 38, height: 38, fontSize: 13, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{nombre}</h3>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Predicción de peso corporal
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-secondary)", padding: 6, borderRadius: 8,
          }}>
            <FiX size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 22px" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "50px 20px", gap: 14 }}>
              <div className="dashboard-spinner" />
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                Calculando predicción…
              </p>
            </div>
          )}

          {error && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
              gap: 10, padding: "30px 20px", textAlign: "center" }}>
              {error?.status === 404 || error?.status === 400
                ? <FiBarChart2 size={40} color="var(--accent)" />
                : <FiAlertTriangle size={32} color="var(--danger)" />}
              <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                {error?.status === 404
                  ? "Sin registros de progreso"
                  : error?.status === 400
                  ? "Datos insuficientes"
                  : "No se pudo cargar la predicción"}
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, maxWidth: 340, lineHeight: 1.5 }}>
                {error?.status === 404 || error?.status === 400
                  ? "Este miembro aún no tiene suficientes registros de peso corporal para generar una predicción."
                  : error?.message || String(error)}
              </p>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "var(--bg-input)", borderRadius: 10, padding: "14px 16px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: ".05em", color: "var(--text-secondary)", marginBottom: 4 }}>
                    Peso actual
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
                    {pesoActual ? `${pesoActual} kg` : "—"}
                  </p>
                </div>
                <div style={{ background: "var(--bg-input)", borderRadius: 10, padding: "14px 16px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: ".05em", color: "var(--text-secondary)", marginBottom: 4 }}>
                    Peso estimado al final
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
                    {pesoFuturo ? `${pesoFuturo} kg` : "—"}
                  </p>
                </div>
                <div style={{ background: tc.bg || "var(--bg-input)", borderRadius: 10, padding: "14px 16px",
                  border: `1px solid ${tc.color || "var(--border)"}22` }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: ".05em", color: "var(--text-secondary)", marginBottom: 4 }}>
                    Tendencia
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <TendenciaIcon tendencia={data.tendencia} size={18} />
                    <span style={{ fontSize: 18, fontWeight: 800, color: tc.color }}>
                      {tc.label}
                    </span>
                    {diff !== null && (
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        ({diff > 0 ? "+" : ""}{diff} kg)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Selector horizonte */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginRight: 4 }}>
                  Proyección a:
                </p>
                {[{ label: "3 meses", value: 90 }, { label: "6 meses", value: 180 }, { label: "1 año", value: 365 }].map(opt => (
                  <button key={opt.value} onClick={() => handleDias(opt.value)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, border: "1px solid",
                      borderColor: dias === opt.value ? "var(--accent)" : "var(--border)",
                      background:  dias === opt.value ? "var(--accent)" : "var(--bg-input)",
                      color:       dias === opt.value ? "#fff" : "var(--text-secondary)",
                      fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Cabecera del gráfico con la explicación de qué es cada trazo */}
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
                    descripcion: "Cada punto es una medición que el miembro registró en Progreso Físico. Es dato medido, no estimado.",
                  },
                  {
                    color: COLORES_GRAFICO.prediccion,
                    nombre: "Predicción",
                    descripcion: "Línea discontinua: hacia dónde apunta su tendencia si mantiene el ritmo actual. No es un dato observado.",
                  },
                ]}
                notas={[
                  data?.registros
                    ? `Basado en ${data.registros} medicion${data.registros === 1 ? "" : "es"} registradas.`
                    : null,
                  data?.calidad_ajuste != null
                    ? `Ajuste del modelo: ${(data.calidad_ajuste * 100).toFixed(0)} %. Cuanto más alto, más regular ha sido la evolución del peso y más fiable la proyección.`
                    : null,
                  "El eje vertical está en kilogramos y el horizontal en fechas. El tramo punteado empieza donde terminan las mediciones reales.",
                ].filter(Boolean)}
              />

              {/* Leyenda compacta junto al gráfico */}
              <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 12, color: "var(--text-secondary)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 24, height: 3, background: COLORES_GRAFICO.real, borderRadius: 2, display: "inline-block" }} />
                  Historial real
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 24, height: 0, borderTop: `3px dashed ${COLORES_GRAFICO.prediccion}`, display: "inline-block" }} />
                  Predicción
                </span>
              </div>

              {/* Gráfico */}
              <ResponsiveContainer width="100%" height={275}>
                <LineChart data={chartData} margin={{ top: 5, right: 16, left: 6, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLOR_REJILLA} />
                  <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} axisLine={false} tickLine={false}
                    label={ejeX("Fecha de la medición")} />
                  <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)} kg`}
                    label={ejeY("Peso corporal (kg)")} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="real" name="Historial" stroke={COLORES_GRAFICO.real} strokeWidth={2.5}
                    dot={{ r: 3, fill: COLORES_GRAFICO.real, strokeWidth: 0 }} connectNulls={false} />
                  <Line type="monotone" dataKey="prediccion" name="Predicción" stroke={COLORES_GRAFICO.prediccion} strokeWidth={2.5}
                    strokeDasharray="6 4" dot={{ r: 3, fill: COLORES_GRAFICO.prediccion, strokeWidth: 0 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>

              {/* Advertencia */}
              <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 12, lineHeight: 1.5,
                padding: "8px 12px", background: "var(--bg-input)", borderRadius: 8 }}>
                La predicción se basa en la tendencia histórica de este miembro. Cambios en dieta,
                rutina o estilo de vida pueden alterar el resultado real.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function TrainerRegresion() {
  const [globalData, setGlobalData]       = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError]     = useState(null);
  const [trainLoading, setTrainLoading]   = useState(false);
  const [trainMsg, setTrainMsg]           = useState(null);

  const [members, setMembers]             = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [searchQuery, setSearchQuery]     = useState("");
  const [page, setPage]                   = useState(1);

  const [showInfo, setShowInfo]           = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const initialFetched = useRef(false);

  /* ── Fetch modelo global ── */
  const fetchGlobal = useCallback(async () => {
    setGlobalLoading(true); setGlobalError(null); setTrainMsg(null);
    try {
      const token = localStorage.getItem("token");
      const r     = await fetch(`${API_BASE}/api/analytics/regresion`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        const json = await r.json().catch(() => ({}));
        const err  = new Error(json.error || `Error ${r.status}`);
        err.status = r.status;
        throw err;
      }
      setGlobalData(await r.json());
    } catch (e) { setGlobalError(e); }
    finally { setGlobalLoading(false); }
  }, []);

  /* ── Reentrenar ── */
  const handleTrain = useCallback(async () => {
    setTrainLoading(true); setTrainMsg(null); setGlobalError(null);
    try {
      const token = localStorage.getItem("token");
      const r     = await fetch(`${API_BASE}/api/analytics/regresion/train`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        const json = await r.json().catch(() => ({}));
        const err  = new Error(json.error || `Error ${r.status}`);
        err.status = r.status;
        throw err;
      }
      const json = await r.json();
      setGlobalData(json);
      setTrainMsg("Análisis actualizado con los datos más recientes.");
    } catch (e) { setGlobalError(e); }
    finally { setTrainLoading(false); }
  }, []);

  /* ── Fetch miembros del entrenador ── */
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const token = localStorage.getItem("token");
      const r     = await fetch(`${API_BASE}/api/trainer/members?my_clients=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      const json = await r.json();
      setMembers(json.members || []);
    } catch { setMembers([]); }
    finally { setMembersLoading(false); }
  }, []);

  useEffect(() => {
    if (initialFetched.current) return;
    initialFetched.current = true;
    fetchGlobal();
    fetchMembers();
  }, []); // eslint-disable-line

  /* ── Datos derivados ── */
  const metricas     = globalData?.metricas || {};
  const r2           = metricas.r2 ?? null;
  const rmse         = metricas.rmse ?? null;
  const desdeCache   = globalData?.desde_cache ?? false;
  const ejecutadoEn  = globalData?.ejecutado_en;
  const calidad      = r2 !== null ? interpretarR2(r2) : null;

  const tendenciaGlobal = (globalData?.tendencia_peso_global || []).map(item => ({
    mes:  item.mes || "",
    peso: item.peso_promedio ?? item.peso ?? null,
  }));

  /* ── Filtro + paginación de miembros ── */
  const filteredMembers = members.filter(m =>
    !searchQuery || (m.nombre || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages   = Math.max(1, Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE));
  const currentPage  = Math.min(page, totalPages);
  const pagedMembers = filteredMembers.slice(
    (currentPage - 1) * MEMBERS_PER_PAGE,
    currentPage * MEMBERS_PER_PAGE,
  );

  const handleSearch = (v) => { setSearchQuery(v); setPage(1); };

  return (
    <div className="dashboard-content">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            Predicción de peso de mis miembros
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.5 }}>
            La IA analiza el historial físico de tus miembros y proyecta cómo evolucionará su peso.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {ejecutadoEn && (
            <span style={{ fontSize: 11, color: "var(--text-secondary)",
              display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", display: "inline-block",
                background: desdeCache ? "var(--success)" : "var(--warning)" }} />
              {desdeCache ? "Datos en caché" : "Recién calculado"} ·{" "}
              {new Date(ejecutadoEn).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button className="btn-compact-primary" onClick={handleTrain}
            disabled={trainLoading || globalLoading}
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {trainLoading
              ? <FiLoader size={13} style={{ animation: "spin 1s linear infinite" }} />
              : <FiRefreshCw size={13} />
            }
            {trainLoading ? "Actualizando…" : "Actualizar análisis"}
          </button>
        </div>
      </div>

      {/* ── ¿Cómo funciona? ── */}
      <div style={{ marginBottom: 20, borderRadius: 12, border: "1px solid var(--border)",
        background: "var(--bg-input)", overflow: "hidden" }}>
        <button onClick={() => setShowInfo(v => !v)}
          style={{ width: "100%", padding: "13px 18px", background: "none", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
          <FiInfo size={15} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", flex: 1 }}>
            ¿Cómo funciona esta herramienta?
          </span>
          {showInfo ? <FiChevronUp size={15} color="var(--text-secondary)" />
                    : <FiChevronDown size={15} color="var(--text-secondary)" />}
        </button>
        {showInfo && (
          <div style={{ padding: "0 18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { Icon: FiActivity,   texto: "La herramienta analiza el historial de peso, grasa corporal e IMC de cada miembro." },
              { Icon: FiBarChart2,  texto: "Detecta la tendencia general del gimnasio: si los miembros bajan, suben o mantienen su peso en el tiempo." },
              { Icon: FiTrendingDown, texto: "Para cada miembro puedes ver una proyección individual: cómo evolucionará su peso en los próximos 3, 6 o 12 meses." },
              { Icon: FiRefreshCw,  texto: "Actualiza el análisis cuando quieras para reflejar los datos de progreso más recientes." },
            ].map(({ Icon, texto }, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Icon size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                  {texto}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mensajes ── */}
      {trainMsg && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8,
          background: "rgba(76,217,100,0.10)", border: "1px solid var(--success)",
          color: "var(--success)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <FiCheckCircle size={14} /> {trainMsg}
        </div>
      )}
      {globalError && (
        globalError?.status === 400 || globalError?.message?.toLowerCase().includes("insuficiente")
          ? (
            <div style={{ marginBottom: 16, padding: "14px 18px", borderRadius: 10,
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)",
              color: "var(--text-secondary)", fontSize: 13, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <FiBarChart2 size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                  Aún no hay suficientes datos para el análisis global
                </p>
                <p style={{ margin: 0, lineHeight: 1.5 }}>
                  El modelo necesita registros de progreso de al menos varios miembros. Los datos aparecerán
                  aquí automáticamente conforme los miembros registren su progreso físico.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8,
              background: "rgba(255,77,77,0.10)", border: "1px solid var(--danger)",
              color: "var(--danger)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <FiAlertTriangle size={14} /> {globalError?.message || String(globalError)}
            </div>
          )
      )}

      {/* Overlay reentrenando */}
      {trainLoading && (
        <div style={{ marginBottom: 16, padding: "18px 22px", borderRadius: 12,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 16 }}>
          <div className="dashboard-spinner" style={{ width: 24, height: 24 }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
              Actualizando el análisis de tendencias…
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              La IA está procesando el historial de peso de todos los miembros. Esto puede tardar unos segundos.
            </p>
          </div>
        </div>
      )}

      {/* ── Tendencia global + calidad ── */}
      {!globalLoading && !globalError && globalData && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>

          {/* Gráfico tendencia */}
          <div className="chart-card">
            <div className="chart-header" style={{ marginBottom: 4 }}>
              <h3>Tendencia de peso promedio del gimnasio</h3>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
              Evolución histórica del peso corporal promedio de todos los miembros.
            </p>
            <ResponsiveContainer width="100%" height={235}>
              <LineChart data={tendenciaGlobal} margin={{ top: 5, right: 10, left: 6, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLOR_REJILLA} />
                <XAxis dataKey="mes" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} axisLine={false} tickLine={false}
                  label={ejeX("Mes")} />
                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)} kg`}
                  label={ejeY("Peso promedio (kg)")} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="peso" name="Promedio" stroke={COLORES_GRAFICO.real} strokeWidth={2.5}
                  dot={{ r: 3.5, fill: COLORES_GRAFICO.real, strokeWidth: 0 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Calidad del análisis */}
          {calidad && (
            <div style={{ background: "var(--bg-card)", borderRadius: 14,
              border: "1px solid var(--border)", padding: "20px",
              display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: ".05em", color: "var(--text-secondary)" }}>
                Precisión del análisis
              </p>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: calidad.color }}>
                    {calidad.nivel}
                  </span>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: calidad.bg, color: calidad.color }}>
                    {r2 !== null ? `${(r2 * 100).toFixed(0)}%` : "—"}
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 6, background: "rgba(0,0,0,0.2)", overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ height: "100%", borderRadius: 6, background: calidad.color,
                    width: `${Math.max((r2 ?? 0) * 100, 4)}%`, transition: "width 0.8s ease" }} />
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {calidad.texto}
                </p>
              </div>
              {rmse !== null && (
                <div style={{ padding: "10px 12px", background: "var(--bg-input)",
                  borderRadius: 8, border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 3 }}>
                    Margen de error estimado
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                    ± {parseFloat(rmse).toFixed(1)} kg
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                    El modelo puede desviarse en promedio este valor respecto al peso real.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {globalLoading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
          padding: "60px 20px", gap: 14, background: "var(--bg-card)", borderRadius: 12,
          border: "1px solid var(--border)", marginBottom: 24 }}>
          <div className="dashboard-spinner" />
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Cargando análisis global…</p>
        </div>
      )}

      {/* ── Tabla de miembros ── */}
      <div className="table-section">
        <div className="section-header" style={{ padding: "14px 20px",
          borderBottom: "1px solid var(--border)", marginBottom: 0 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)",
            textTransform: "uppercase", letterSpacing: ".05em",
            display: "flex", alignItems: "center", gap: 8 }}>
            <FiUsers size={14} />
            Mis miembros
          </h3>
          <span className="total-count">{filteredMembers.length} miembros</span>
        </div>

        {/* Búsqueda */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
            background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <FiSearch size={14} color="var(--text-secondary)" />
            <input
              style={{ background: "transparent", border: "none", flex: 1, outline: "none",
                color: "var(--text-primary)", fontSize: 13 }}
              placeholder="Buscar miembro…"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {membersLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 12 }}>
            <div className="dashboard-spinner" style={{ width: 20, height: 20 }} />
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Cargando miembros…</p>
          </div>
        ) : pagedMembers.length === 0 ? (
          <div className="empty-state">
            <FiUsers size={36} color="var(--text-secondary)" style={{ marginBottom: 12 }} />
            <h3>Sin miembros</h3>
            <p>No se encontraron miembros{searchQuery ? " con esa búsqueda" : ""}.</p>
          </div>
        ) : (
          <div className="custom-table-container" style={{ borderRadius: 0, border: "none" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th style={{ width: 120, textAlign: "center" }}>Ver predicción</th>
                </tr>
              </thead>
              <tbody>
                {pagedMembers.map((m, i) => {
                  const nombre   = m.nombre || `Miembro #${m.id_miembro || m.id}`;
                  const initials = nombre.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <tr key={i}>
                      <td className="font-bold">
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>
                            {initials}
                          </div>
                          {nombre}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                        {m.email || "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => setSelectedMember(m)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "5px 12px", borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "var(--bg-input)",
                            color: "var(--text-secondary)",
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = "var(--accent)";
                            e.currentTarget.style.color = "var(--accent)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text-secondary)";
                          }}
                        >
                          <FiEye size={13} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-controls">
     
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 20px" }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8, fontSize: 13,
                  border: "1px solid var(--border)", background: "var(--bg-input)",
                  color: currentPage <= 1 ? "var(--text-muted)" : "var(--text-primary)",
                  cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                }}
              >
                <FiArrowLeft size={13} /> Anterior
              </button>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", padding: "0 8px" }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8, fontSize: 13,
                  border: "1px solid var(--border)", background: "var(--bg-input)",
                  color: currentPage >= totalPages ? "var(--text-muted)" : "var(--text-primary)",
                  cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                Siguiente <FiArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal predicción individual ── */}
      {selectedMember && (
        <PredictionModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

    </div>
  );
}
