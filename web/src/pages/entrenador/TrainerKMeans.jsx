/**
 * TrainerKMeans.jsx — Segmentación IA para entrenadores.
 * Misma API que AnalyticsKMeans, presentación orientada al usuario no técnico.
 * Sin emojis: usa react-icons/fi. Nombres de miembros resueltos desde
 * /api/trainer/members y limpiados si son IDs autogenerados.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import {
  FiInfo, FiBarChart2, FiCpu, FiTarget, FiRefreshCw,
  FiAlertTriangle, FiCheckCircle, FiAlertCircle, FiZap,
  FiActivity, FiTrendingUp, FiDroplet, FiChevronDown, FiChevronUp,
  FiUsers, FiLoader,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const API_BASE      = "";
const ITEMS_PER_PAGE = 12;

/* ─── Paleta de urgencia ──────────────────────────────────────────────── */
const URGENCIA = {
  alta:  { color: "var(--danger)",  bg: "rgba(255,77,77,0.10)",   label: "Atención prioritaria" },
  media: { color: "var(--warning)", bg: "rgba(255,189,46,0.10)",  label: "En progreso"           },
  baja:  { color: "var(--success)", bg: "rgba(76,217,100,0.10)",  label: "Buen nivel"            },
};

/* ─── Indicador visual de IMC (icono + color) ────────────────────────── */
function ImcIcon({ imc }) {
  if (imc < 18.5) return <FiZap        size={16} color="var(--accent)"  />;
  if (imc < 25)   return <FiCheckCircle size={16} color="var(--success)" />;
  if (imc < 30)   return <FiAlertTriangle size={16} color="var(--warning)" />;
  return              <FiAlertCircle   size={16} color="var(--danger)"  />;
}

/* ─── Interpretar cluster en lenguaje llano ──────────────────────────── */
function interpretarCluster(c, total) {
  const imc     = c.imc_promedio     ?? 0;
  const grasa   = c.grasa_promedio   ?? 0;
  const musculo = c.musculo_promedio ?? 0;

  // IMC
  let descIMC;
  if      (imc < 18.5) descIMC = "Bajo peso";
  else if (imc < 25)   descIMC = "Peso saludable";
  else if (imc < 30)   descIMC = "Sobrepeso moderado";
  else                 descIMC = "Sobrepeso elevado";

  // Músculo
  let descMusculo;
  if      (musculo >= 38) descMusculo = "Masa muscular alta";
  else if (musculo >= 28) descMusculo = "Masa muscular normal";
  else                    descMusculo = "Masa muscular baja";

  // Grasa
  let descGrasa;
  if      (grasa > 30) descGrasa = "Grasa corporal elevada";
  else if (grasa > 20) descGrasa = "Grasa corporal moderada";
  else                 descGrasa = "Grasa corporal controlada";

  // Acción + urgencia
  let accion, urgencia;
  if (imc >= 30 || grasa > 30) {
    accion   = "Cardio progresivo y ajuste nutricional para bajar grasa corporal";
    urgencia = "alta";
  } else if (musculo < 28) {
    accion   = "Entrenamiento de fuerza para desarrollar masa muscular";
    urgencia = "media";
  } else if (imc < 18.5) {
    accion   = "Plan de ganancia de peso con fuerza progresiva y superávit calórico";
    urgencia = "media";
  } else {
    accion   = "Mantenimiento y optimización del rendimiento actual";
    urgencia = "baja";
  }

  const pct = total > 0 ? Math.round((c.num_miembros / total) * 100) : 0;
  return { descIMC, descMusculo, descGrasa, accion, urgencia, pct, imc };
}

/* ─── Interpretar Silhouette Score ───────────────────────────────────── */
function interpretarCalidad(score) {
  if (score >= 0.7) return {
    nivel: "Excelente", color: "var(--success)", bg: "rgba(76,217,100,0.10)",
    texto: "Los grupos están muy bien diferenciados. El análisis es muy confiable.",
    barra: score,
  };
  if (score >= 0.5) return {
    nivel: "Bueno", color: "var(--accent)", bg: "rgba(251,227,121,0.10)",
    texto: "Los grupos están bien separados. Puedes confiar en estas agrupaciones.",
    barra: score,
  };
  if (score >= 0.3) return {
    nivel: "Aceptable", color: "var(--warning)", bg: "rgba(255,189,46,0.10)",
    texto: "Los grupos son detectables aunque algunos miembros son similares entre sí. Considera actualizar el análisis cuando tengas más datos.",
    barra: score,
  };
  return {
    nivel: "Mejorable", color: "var(--danger)", bg: "rgba(255,77,77,0.10)",
    texto: "Los grupos se parecen mucho entre sí. Suele ocurrir cuando hay pocos miembros o pocos datos de progreso físico registrados.",
    barra: Math.max(score, 0.05),
  };
}

/* ─── Helpers de nombre ──────────────────────────────────────────────── */
const AUTO_NAME_RE = /^miembro\s+[0-9a-f]{16,}$/i;

function isAutoName(name) {
  return !name || AUTO_NAME_RE.test(name.trim());
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function TrainerKMeans() {
  const [kValue, setKValue]         = useState(3);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [showInfo, setShowInfo]     = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const initialFetched              = useRef(false);

  /* ── Fetch kmeans ── */
  const fetchData = useCallback(async (k) => {
    setLoading(true); setError(null); setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_BASE}/api/analytics/kmeans?k=${k}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setData(await res.json()); setPage(1);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const handleTrain = useCallback(async () => {
    setTrainLoading(true); setError(null); setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_BASE}/api/analytics/kmeans/train`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ k: kValue, max_iter: 20 }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setData(await res.json()); setPage(1);
      setSuccessMsg("Análisis actualizado correctamente con los datos más recientes.");
    } catch (e) { setError(e.message); }
    finally { setTrainLoading(false); }
  }, [kValue]);

  /* ── Carga inicial ── */
  useEffect(() => {
    if (initialFetched.current) return;
    initialFetched.current = true;
    fetchData(kValue);
  }, []); // eslint-disable-line

  /* ── Datos derivados ── */
  const clusters      = data?.resumen_clusters || [];
  const asignaciones  = data?.asignaciones    || [];
  const silhouette    = data?.silhouette ?? 0;
  const desdeCache    = data?.desde_cache ?? false;
  const ejecutadoEn   = data?.ejecutado_en;
  const totalMiembros = asignaciones.length;
  const totalPages    = Math.max(1, Math.ceil(totalMiembros / ITEMS_PER_PAGE));
  const pageData      = asignaciones.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const calidad       = interpretarCalidad(silhouette);

  /* ── Estado de carga ── */
  if (loading) return (
    <div style={{ height: "60vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center", gap: 16 }}>
      <div className="dashboard-spinner" />
      <h3 style={{ color: "var(--text-primary)", fontWeight: 600 }}>Analizando a tus miembros…</h3>
      <p style={{ color: "var(--text-secondary)", maxWidth: 400, fontSize: 14, lineHeight: 1.6 }}>
        La IA está procesando los datos de composición corporal. Si es la primera vez, puede tardar unos segundos.
      </p>
    </div>
  );

  if (error && !data) return (
    <div className="empty-state">
      <FiAlertTriangle size={40} color="var(--danger)" style={{ marginBottom: 12 }} />
      <h3>No se pudo cargar el análisis</h3>
      <p style={{ color: "var(--text-secondary)" }}>{error}</p>
      <button className="btn-compact-primary" style={{ marginTop: 16 }} onClick={() => fetchData(kValue)}>
        Reintentar
      </button>
    </div>
  );

  return (
    <div className="dashboard-content">

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Análisis de grupos de miembros</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.5 }}>
          La IA analizó los datos físicos de tus miembros y los organizó en grupos según su composición corporal.
          Úsalo para diseñar planes más personalizados.
        </p>
      </div>

      {/* ── ¿Cómo funciona? ── */}
      <div style={{
        marginBottom: 20, borderRadius: 12, border: "1px solid var(--border)",
        background: "var(--bg-input)", overflow: "hidden",
      }}>
        <button
          onClick={() => setShowInfo(v => !v)}
          style={{
            width: "100%", padding: "13px 18px", background: "none", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
          }}
        >
          <FiInfo size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", flex: 1 }}>
            ¿Cómo funciona esta herramienta?
          </span>
          {showInfo
            ? <FiChevronUp   size={16} color="var(--text-secondary)" />
            : <FiChevronDown size={16} color="var(--text-secondary)" />
          }
        </button>

        {showInfo && (
          <div style={{ padding: "0 18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { Icon: FiBarChart2, texto: "La herramienta toma los datos de peso, grasa corporal, masa muscular e IMC de cada miembro." },
              { Icon: FiCpu,       texto: "Una IA los analiza y forma grupos de personas con características físicas similares, de forma automática." },
              { Icon: FiTarget,    texto: "Cada grupo recibe una recomendación de entrenamiento basada en su perfil promedio." },
              { Icon: FiRefreshCw, texto: "Puedes actualizar el análisis en cualquier momento para reflejar los últimos datos registrados." },
            ].map(({ Icon, texto }, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Icon size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                  {texto}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mensajes ── */}
      {successMsg && (
        <div style={{
          marginBottom: 16, padding: "12px 16px", borderRadius: 8,
          background: "rgba(76,217,100,0.10)", border: "1px solid var(--success)",
          color: "var(--success)", fontSize: 13,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <FiCheckCircle size={14} />
          {successMsg}
        </div>
      )}
      {error && data && (
        <div style={{
          marginBottom: 16, padding: "12px 16px", borderRadius: 8,
          background: "rgba(255,77,77,0.10)", border: "1px solid var(--danger)",
          color: "var(--danger)", fontSize: 13,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <FiAlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* ── Controles ── */}
      <div className="stat-card" style={{ marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)",
            textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
            ¿Cuántos grupos quieres ver?
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { k: 2, label: "2 — Simple"    },
              { k: 3, label: "3 — Normal"    },
              { k: 4, label: "4 — Detallado" },
              { k: 5, label: "5 — Preciso"   },
            ].map(({ k, label }) => (
              <button key={k} onClick={() => { setKValue(k); fetchData(k); }}
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "1px solid",
                  borderColor: kValue === k ? "var(--accent)" : "var(--border)",
                  background:  kValue === k ? "var(--accent)" : "var(--bg-input)",
                  color:       kValue === k ? "#fff" : "var(--text-secondary)",
                  fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {ejecutadoEn && (
          <span style={{ fontSize: 11, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: desdeCache ? "var(--success)" : "var(--warning)", display: "inline-block",
            }} />
            {desdeCache ? "Datos guardados en caché" : "Recién calculado"} ·{" "}
            {new Date(ejecutadoEn).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}

        <button className="btn-compact-primary" onClick={handleTrain}
          disabled={trainLoading} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {trainLoading
            ? <FiLoader size={13} style={{ animation: "spin 1s linear infinite" }} />
            : <FiRefreshCw size={13} />
          }
          {trainLoading ? "Actualizando…" : "Actualizar análisis"}
        </button>
      </div>

      {/* Overlay actualizando */}
      {trainLoading && (
        <div style={{
          marginBottom: 16, padding: "18px 22px", borderRadius: 12,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div className="dashboard-spinner" style={{ width: 24, height: 24 }} />
          <div>
            <p style={{ fontWeight: 600, marginBottom: 3, fontSize: 14 }}>
              Analizando datos de {kValue} grupos…
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              La IA está procesando el peso, grasa corporal y masa muscular de tus miembros. Esto puede tardar unos segundos.
            </p>
          </div>
        </div>
      )}

      {/* ── Calidad del análisis ── */}
      {data && (
        <div style={{
          marginBottom: 24, padding: "16px 20px", borderRadius: 12,
          background: calidad.bg, border: `1px solid ${calidad.color}33`,
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: ".05em", color: "var(--text-secondary)", margin: 0 }}>
                Calidad del análisis
              </p>
              <span style={{
                padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: calidad.color + "22", color: calidad.color,
              }}>{calidad.nivel}</span>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 8 }}>
              <div style={{
                height: "100%", width: `${Math.max(calidad.barra * 100, 4)}%`,
                background: calidad.color, borderRadius: 6, transition: "width 0.8s ease",
              }} />
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              {calidad.texto}
            </p>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <p style={{ fontSize: 32, fontWeight: 800, color: calidad.color, margin: 0, lineHeight: 1 }}>
              {totalMiembros}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              miembros analizados
            </p>
          </div>
        </div>
      )}

      {/* ── Tarjetas de grupos ── */}
      {clusters.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)",
            textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 14 }}>
            Grupos detectados
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(clusters.length, 3)}, 1fr)`,
            gap: 14, marginBottom: 28,
          }}>
            {clusters.map((c, i) => {
              const interp   = interpretarCluster(c, totalMiembros);
              const urg      = URGENCIA[interp.urgencia];
              const etiqueta = c.etiqueta || `Grupo ${i + 1}`;
              return (
                <div key={i} style={{
                  background: "var(--bg-card)", borderRadius: 14,
                  border: "1px solid var(--border)",
                  borderTop: `4px solid ${urg.color}`,
                  padding: "18px 18px 16px", display: "flex", flexDirection: "column", gap: 12,
                }}>
                  {/* Cabecera */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ marginBottom: 6 }}>
                        <ImcIcon imc={interp.imc} />
                      </div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.2 }}>
                        {etiqueta}
                      </h4>
                      <span style={{
                        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: urg.bg, color: urg.color,
                      }}>{urg.label}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: urg.color, margin: 0, lineHeight: 1 }}>
                        {c.num_miembros ?? 0}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                        miembros · {interp.pct}%
                      </p>
                    </div>
                  </div>

                  {/* Descriptores */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { Icon: FiActivity,   texto: `${interp.descIMC} (IMC ${(c.imc_promedio ?? 0).toFixed(1)})` },
                      { Icon: FiTrendingUp, texto: `${interp.descMusculo} (${(c.musculo_promedio ?? 0).toFixed(1)}%)` },
                      { Icon: FiDroplet,    texto: `${interp.descGrasa} (${(c.grasa_promedio ?? 0).toFixed(1)}%)` },
                    ].map(({ Icon, texto }, j) => (
                      <div key={j} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Icon size={13} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.3 }}>
                          {texto}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Recomendación */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: ".05em", color: "var(--text-secondary)", marginBottom: 6 }}>
                      Qué trabajar con este grupo
                    </p>
                    <p style={{
                      fontSize: 12, lineHeight: 1.5, color: "var(--text-primary)",
                      background: urg.bg, borderRadius: 8, padding: "8px 10px", margin: 0,
                    }}>
                      {interp.accion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Tabla de miembros ── */}
      {asignaciones.length > 0 && (
        <div className="table-section">
          <div className="section-header" style={{ marginBottom: 0, padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)",
              textTransform: "uppercase", letterSpacing: ".05em",
              display: "flex", alignItems: "center", gap: 8 }}>
              <FiUsers size={14} />
              Tus miembros y su grupo
            </h3>
            <span className="total-count">{totalMiembros} miembros</span>
          </div>

          <div className="custom-table-container" style={{ borderRadius: 0, border: "none" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Grupo</th>
                  <th style={{ minWidth: 160 }}>Condición física</th>
                  <th style={{ minWidth: 200 }}>Recomendación</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((m, i) => {
                  // Nombre resuelto en el backend (PostgreSQL via id_usuario_pg)
                  const globalIdx = (page - 1) * ITEMS_PER_PAGE + i;
                  const nombre    = (!m.nombre || isAutoName(m.nombre))
                    ? `Miembro #${globalIdx + 1}`
                    : m.nombre;

                  const clIdx   = m.cluster ?? 0;
                  const clData  = clusters[clIdx] || clusters[0] || {};
                  const clSynth = {
                    imc_promedio:     m.imc     ?? clData.imc_promedio     ?? 25,
                    grasa_promedio:   m.grasa   ?? clData.grasa_promedio   ?? 25,
                    musculo_promedio: m.musculo ?? clData.musculo_promedio ?? 30,
                    num_miembros:     1,
                  };
                  const interp   = interpretarCluster(clSynth, 1);
                  const urg      = URGENCIA[interp.urgencia];
                  const etiqueta = clusters[clIdx]?.etiqueta || `Grupo ${clIdx + 1}`;

                  return (
                    <tr key={i}>
                      <td className="font-bold">
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {nombre}
                          {m.sexo && (
                            <span style={{ fontSize: 10, color: "var(--text-secondary)",
                              background: "var(--bg-input)", padding: "1px 6px",
                              borderRadius: 10, border: "1px solid var(--border)" }}>
                              {m.sexo}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: urg.bg, color: urg.color, whiteSpace: "nowrap",
                        }}>
                          {etiqueta}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                          <ImcIcon imc={clSynth.imc_promedio} />
                          <span>{interp.descIMC}{m.imc ? ` · IMC ${parseFloat(m.imc).toFixed(1)}` : ""}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                          <FiTrendingUp size={11} color="var(--text-secondary)" />
                          <span>{interp.descMusculo}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <FiDroplet size={11} color="var(--text-secondary)" />
                          <span>{interp.descGrasa}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                        {interp.accion}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button className="btn-outline-small"
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                ← Anterior
              </button>
              <span className="page-info">Página {page} de {totalPages}</span>
              <button className="btn-outline-small"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && data && asignaciones.length === 0 && (
        <div className="empty-state">
          <FiBarChart2 size={40} color="var(--text-secondary)" style={{ marginBottom: 12 }} />
          <h3>Sin datos suficientes</h3>
          <p>Registra el progreso físico de tus miembros (peso, grasa, músculo) para activar el análisis de grupos.</p>
        </div>
      )}

      {/* Animación spinner para FiLoader */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
