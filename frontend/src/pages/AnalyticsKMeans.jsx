import { useState, useEffect, useCallback } from "react";
import "../css/CSSUnificado.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const RISK_CONFIG = {
  default: {
    borderColor: "var(--accent)",
    badgeBg: "rgba(251,227,121,0.12)",
    badgeColor: "var(--accent)",
    tagBg: "rgba(251,227,121,0.12)",
    tagColor: "var(--accent)",
  },
};

function getRiskConfig(perfil = "") {
  const p = perfil.toLowerCase();
  if (p.includes("alto") || p.includes("riesgo") || p.includes("critico"))
    return {
      borderColor: "var(--danger-color)",
      badgeBg: "rgba(255,77,77,0.12)",
      badgeColor: "var(--danger-color)",
      tagBg: "rgba(255,77,77,0.12)",
      tagColor: "var(--danger-color)",
    };
  if (p.includes("medio") || p.includes("progreso") || p.includes("moderado"))
    return {
      borderColor: "var(--warning-color)",
      badgeBg: "rgba(255,189,46,0.12)",
      badgeColor: "var(--warning-color)",
      tagBg: "rgba(255,189,46,0.12)",
      tagColor: "var(--warning-color)",
    };
  if (p.includes("optimo") || p.includes("óptimo") || p.includes("bajo") || p.includes("normal"))
    return {
      borderColor: "var(--success-color)",
      badgeBg: "rgba(76,217,100,0.12)",
      badgeColor: "var(--success-color)",
      tagBg: "rgba(76,217,100,0.12)",
      tagColor: "var(--success-color)",
    };
  return RISK_CONFIG.default;
}

function getSilhouetteConfig(score) {
  if (score >= 0.7) return { label: "Excelente", color: "var(--success-color)", bg: "rgba(76,217,100,0.12)" };
  if (score >= 0.5) return { label: "Bueno", color: "var(--accent)", bg: "rgba(251,227,121,0.12)" };
  if (score >= 0.3) return { label: "Aceptable", color: "var(--warning-color)", bg: "rgba(255,189,46,0.12)" };
  return { label: "Bajo", color: "var(--danger-color)", bg: "rgba(255,77,77,0.12)" };
}

const ITEMS_PER_PAGE = 10;

export default function AnalyticsKMeans() {
  const [kValue, setKValue]           = useState(3);
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [trainLoading, setTrainLoading] = useState(false);
  const [error, setError]             = useState(null);
  const [trainMsg, setTrainMsg]       = useState(null);
  const [page, setPage]               = useState(1);

  // ── GET: carga desde caché ─────────────────────────────────────────────────
  const fetchData = useCallback(async (k) => {
    setLoading(true);
    setError(null);
    setTrainMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/analytics/kmeans?k=${k}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(json);
      setPage(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── POST /train: re-entrena y guarda en caché ──────────────────────────────
  const handleTrain = useCallback(async () => {
    setTrainLoading(true);
    setTrainMsg(null);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/analytics/kmeans/train`,
        {
          method:  "POST",
          headers: {
            Authorization:  `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ k: kValue, max_iter: 20 }),
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(json);
      setPage(1);
      setTrainMsg(json.mensaje || "Modelo reentrenado correctamente.");
    } catch (e) {
      setError(e.message);
    } finally {
      setTrainLoading(false);
    }
  }, [kValue]);

  useEffect(() => { fetchData(kValue); }, []);

  // ── Cambio de k: recarga desde caché ──────────────────────────────────────
  const handleKChange = (k) => {
    setKValue(k);
    fetchData(k);
  };

  // ── Loading inicial ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="loading-spinner" style={{ height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div className="dashboard-spinner" />
      <h3 style={{ marginTop: 24, marginBottom: 8, color: "var(--text-primary)" }}>Cargando segmentación...</h3>
      <p style={{ color: "var(--text-secondary)", maxWidth: 450, fontSize: 14, lineHeight: 1.5 }}>
        Obteniendo los resultados del modelo <b>K-Means</b> desde la base de datos.
        Si es la primera vez, el algoritmo se ejecutará ahora.
      </p>
    </div>
  );

  if (error) return (
    <div className="empty-state">
      <h3>Error al cargar datos</h3>
      <p>{error}</p>
      <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => fetchData(kValue)}>
        Reintentar
      </button>
    </div>
  );

  const clusters          = data?.resumen_clusters || [];
  const recomendaciones   = data?.recomendaciones  || [];
  const asignaciones      = data?.asignaciones     || [];
  const silhouette        = data?.silhouette_score ?? 0;
  const interpretacion    = data?.interpretacion_silhouette || "";
  const silConfig         = getSilhouetteConfig(silhouette);
  const desdeCache        = data?.desde_cache ?? false;
  const ejecutadoEn       = data?.ejecutado_en;

  const totalPages = Math.max(1, Math.ceil(asignaciones.length / ITEMS_PER_PAGE));
  const pageData   = asignaciones.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const clustersEnriquecidos = clusters.map((c, i) => {
    const rec = recomendaciones.find(
      (r) => r.cluster === c.cluster || r.cluster === i
    ) || recomendaciones[i] || {};
    return { ...c, perfil: rec.perfil || `Cluster ${i + 1}`, accion: rec.accion_sugerida || "" };
  });

  const getClusterPill = (clusterRef) => {
    const idx    = typeof clusterRef === "number" ? clusterRef : clusters.findIndex((c) => c.cluster === clusterRef);
    const perfil = clustersEnriquecidos[idx]?.perfil || `Cluster ${idx + 1}`;
    const cfg    = getRiskConfig(perfil);
    return (
      <span style={{
        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: cfg.badgeBg, color: cfg.badgeColor, display: "inline-block",
      }}>
        {perfil}
      </span>
    );
  };

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Segmentación IA</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          K-Means Clustering · Agrupación inteligente de miembros
        </p>
      </div>

      {/* Notificación de reentrenamiento exitoso */}
      {trainMsg && (
        <div style={{
          marginBottom: 16, padding: "12px 16px", borderRadius: 8,
          background: "rgba(76,217,100,0.1)", border: "1px solid var(--success-color)",
          color: "var(--success-color)", fontSize: 13, display: "flex",
          alignItems: "center", gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {trainMsg}
        </div>
      )}

      {/* Control Bar */}
      <div className="stat-card" style={{ marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Número de clusters (k):</span>

        <div style={{ display: "flex", gap: 8 }}>
          {[2, 3, 4, 5].map((k) => (
            <button
              key={k}
              onClick={() => handleKChange(k)}
              style={{
                width: 40, height: 40, borderRadius: 8, border: "1px solid",
                borderColor: kValue === k ? "var(--accent)" : "var(--border-dark)",
                background: kValue === k ? "var(--accent)" : "var(--input-bg-dark)",
                color: kValue === k ? "var(--text-on-accent)" : "var(--text-secondary)",
                fontWeight: 600, fontSize: 15, cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Badge: desde caché / fecha */}
        {ejecutadoEn && (
          <span style={{
            fontSize: 11, color: "var(--text-secondary)", display: "flex",
            alignItems: "center", gap: 4,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: desdeCache ? "var(--success-color)" : "var(--warning-color)",
              display: "inline-block",
            }} />
            {desdeCache ? "Desde caché" : "Recién entrenado"} · {new Date(ejecutadoEn).toLocaleString("es-MX")}
          </span>
        )}

        {/* Botón Reentrenar */}
        <button
          className="btn-compact-primary"
          onClick={handleTrain}
          disabled={trainLoading}
          style={{ marginLeft: "auto" }}
          title="Re-ejecuta el algoritmo con los datos actuales y actualiza la caché"
        >
          {trainLoading ? (
            <span className="spinner" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
          )}
          {trainLoading ? "Entrenando..." : "Reentrenar modelo"}
        </button>
      </div>

      {/* Loading overlay durante reentrenamiento */}
      {trainLoading && (
        <div style={{
          marginBottom: 16, padding: "20px 24px", borderRadius: 12,
          background: "var(--bg-card)", border: "1px solid var(--border-dark)",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div className="dashboard-spinner" style={{ width: 28, height: 28 }} />
          <div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Reentrenando K-Means con k={kValue}...</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              PySpark está procesando las métricas corporales. Esto puede tardar unos segundos.
            </p>
          </div>
        </div>
      )}

      {/* Silhouette Score */}
      <div className="stat-card" style={{ marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: 4 }}>
            Precisión del modelo
          </p>
          <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>Silhouette Score</p>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ background: "var(--input-bg-dark)", borderRadius: 6, height: 12, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(100, silhouette * 100)}%`,
              background: "linear-gradient(90deg, var(--danger-color), var(--warning-color), var(--success-color))",
              borderRadius: 6, transition: "width 0.8s ease",
            }} />
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: silConfig.color, minWidth: 56 }}>
          {silhouette.toFixed(2)}
        </div>
        <span style={{
          padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
          background: silConfig.bg, color: silConfig.color,
        }}>
          {interpretacion || silConfig.label}
        </span>
      </div>

      {/* Cluster Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(clustersEnriquecidos.length, 3)}, 1fr)`,
        gap: 16, marginBottom: 24,
      }}>
        {clustersEnriquecidos.map((c, i) => {
          const cfg = getRiskConfig(c.perfil);
          return (
            <div key={i} className="stat-card member-card-hover"
              style={{ borderTop: `3px solid ${cfg.borderColor}`, position: "relative" }}>
              <span style={{ position: "absolute", top: 14, right: 14, fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
                {c.num_miembros ?? 0} miembros
              </span>
              <div style={{ marginBottom: 12 }}>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.badgeBg, color: cfg.badgeColor }}>
                  {c.perfil}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Peso prom.", value: c.peso_promedio, unit: "kg" },
                  { label: "IMC prom.",  value: c.imc_promedio,  unit: "" },
                  { label: "% Grasa",    value: c.grasa_promedio, unit: "%" },
                  { label: "% Músculo",  value: c.musculo_promedio, unit: "%" },
                ].map((m) => (
                  <div key={m.label} style={{ background: "var(--input-bg-dark)", borderRadius: 8, padding: "8px 10px" }}>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: 2 }}>
                      {m.label}
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 700 }}>
                      {typeof m.value === "number" ? m.value.toFixed(1) : "—"}{m.unit}
                    </p>
                  </div>
                ))}
              </div>
              {c.accion && (
                <span style={{ display: "inline-block", padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: cfg.tagBg, color: cfg.tagColor }}>
                  {c.accion}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tabla de asignaciones */}
      <div className="table-section">
        <div className="section-header" style={{ marginBottom: 0, padding: "16px 20px", borderBottom: "1px solid var(--border-dark)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Asignación de miembros
          </h3>
          <span className="total-count">{asignaciones.length} miembros</span>
        </div>
        <div className="custom-table-container" style={{ borderRadius: 0, border: "none" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>ID</th>
                <th>Peso</th>
                <th>IMC</th>
                <th>% Grasa</th>
                <th>% Músculo</th>
                <th>Cluster</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--text-secondary)", padding: 32 }}>
                    Sin datos de asignación
                  </td>
                </tr>
              ) : (
                pageData.map((m, i) => (
                  <tr key={i}>
                    <td className="font-bold">{m.nombre || `Miembro ${m.id_miembro || m.id}`}</td>
                    <td style={{ color: "var(--text-secondary)" }}>#{m.id_miembro || m.id || "—"}</td>
                    <td>{m.peso ? `${parseFloat(m.peso).toFixed(1)} kg` : "—"}</td>
                    <td>{m.imc ? parseFloat(m.imc).toFixed(1) : "—"}</td>
                    <td>{m.grasa ? `${parseFloat(m.grasa).toFixed(1)}%` : "—"}</td>
                    <td>{m.musculo ? `${parseFloat(m.musculo).toFixed(1)}%` : "—"}</td>
                    <td>{getClusterPill(m.cluster ?? 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pagination-controls">
            <button className="btn-outline-small" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              ← Anterior
            </button>
            <span className="page-info">Página {page} de {totalPages}</span>
            <button className="btn-outline-small" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}