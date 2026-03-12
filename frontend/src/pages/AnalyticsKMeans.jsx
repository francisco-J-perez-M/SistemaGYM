import { useState, useEffect, useCallback } from "react";
import "../css/CSSUnificado.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const RISK_CONFIG = {
  default: {
    borderColor: "var(--accent-color)",
    badgeBg: "rgba(251,227,121,0.12)",
    badgeColor: "var(--accent-color)",
    tagBg: "rgba(251,227,121,0.12)",
    tagColor: "var(--accent-color)",
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
  if (score >= 0.5) return { label: "Bueno", color: "var(--accent-color)", bg: "rgba(251,227,121,0.12)" };
  if (score >= 0.3) return { label: "Aceptable", color: "var(--warning-color)", bg: "rgba(255,189,46,0.12)" };
  return { label: "Bajo", color: "var(--danger-color)", bg: "rgba(255,77,77,0.12)" };
}

const ITEMS_PER_PAGE = 10;

export default function AnalyticsKMeans() {
  const [kValue, setKValue] = useState(3);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (k, isRecalc = false) => {
    if (isRecalc) setRecalcLoading(true);
    else setLoading(true);
    setError(null);

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
      setRecalcLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(kValue); }, []);

  const handleRecalculate = () => fetchData(kValue, true);

  if (loading) return (
    <div className="loading-spinner" style={{ height: "60vh" }}>
      <div className="dashboard-spinner" />
      <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>Calculando clusters...</p>
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

  const clusters = data?.resumen_clusters || [];
  const recomendaciones = data?.recomendaciones || [];
  const asignaciones = data?.asignaciones || [];
  const silhouette = data?.silhouette_score ?? 0;
  const interpretacion = data?.interpretacion_silhouette || "";
  const silConfig = getSilhouetteConfig(silhouette);

  // Paginar asignaciones
  const totalPages = Math.max(1, Math.ceil(asignaciones.length / ITEMS_PER_PAGE));
  const pageData = asignaciones.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Merge cluster info con recomendaciones
  const clustersEnriquecidos = clusters.map((c, i) => {
    const rec = recomendaciones.find(
      (r) => r.cluster === c.cluster || r.cluster === i || r.cluster_id === c.cluster_id
    ) || recomendaciones[i] || {};
    return { ...c, perfil: rec.perfil || rec.tipo || `Cluster ${i + 1}`, accion: rec.accion || rec.recomendacion || "" };
  });

  const getClusterPill = (clusterRef) => {
    const idx = typeof clusterRef === "number" ? clusterRef : clusters.findIndex((c) => c.cluster === clusterRef);
    const perfil = clustersEnriquecidos[idx]?.perfil || `Cluster ${idx + 1}`;
    const cfg = getRiskConfig(perfil);
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

      {/* Control Bar */}
      <div className="stat-card" style={{ marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Número de clusters (k):</span>
        <div style={{ display: "flex", gap: 8 }}>
          {[2, 3, 4, 5].map((k) => (
            <button
              key={k}
              onClick={() => setKValue(k)}
              style={{
                width: 40, height: 40, borderRadius: 8, border: "1px solid",
                borderColor: kValue === k ? "var(--accent-color)" : "var(--border-dark)",
                background: kValue === k ? "var(--accent-color)" : "var(--input-bg-dark)",
                color: kValue === k ? "var(--text-on-accent)" : "var(--text-secondary)",
                fontWeight: 600, fontSize: 15, cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {k}
            </button>
          ))}
        </div>
        <button
          className="btn-compact-primary"
          onClick={handleRecalculate}
          disabled={recalcLoading}
          style={{ marginLeft: "auto" }}
        >
          {recalcLoading ? <span className="spinner" /> : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          )}
          Recalcular
        </button>
      </div>

      {/* Silhouette Score Gauge */}
      <div className="stat-card" style={{ marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: 4 }}>
            Precisión del modelo
          </p>
          <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>Silhouette Score</p>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{
            background: "var(--input-bg-dark)", borderRadius: 6, height: 12, overflow: "hidden", position: "relative",
          }}>
            <div style={{
              height: "100%",
              width: `${Math.min(100, silhouette * 100)}%`,
              background: `linear-gradient(90deg, var(--danger-color), var(--warning-color), var(--success-color))`,
              borderRadius: 6,
              transition: "width 0.8s ease",
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
        gap: 16,
        marginBottom: 24,
      }}>
        {clustersEnriquecidos.map((c, i) => {
          const cfg = getRiskConfig(c.perfil);
          return (
            <div
              key={i}
              className="stat-card member-card-hover"
              style={{ borderTop: `3px solid ${cfg.borderColor}`, position: "relative" }}
            >
              <span style={{
                position: "absolute", top: 14, right: 14, fontSize: 11,
                color: "var(--text-secondary)", fontWeight: 500,
              }}>
                {c.num_miembros ?? c.cantidad ?? 0} miembros
              </span>

              <div style={{ marginBottom: 12 }}>
                <span style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: cfg.badgeBg, color: cfg.badgeColor,
                }}>
                  {c.perfil}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Peso prom.", value: c.peso_promedio ?? c.peso ?? "—", unit: "kg" },
                  { label: "IMC prom.", value: c.imc_promedio ?? c.imc ?? "—", unit: "" },
                  { label: "% Grasa", value: c.grasa_promedio ?? c.grasa ?? "—", unit: "%" },
                  { label: "% Músculo", value: c.musculo_promedio ?? c.musculo ?? "—", unit: "%" },
                ].map((m) => (
                  <div key={m.label} style={{
                    background: "var(--input-bg-dark)", borderRadius: 8, padding: "8px 10px",
                  }}>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: 2 }}>
                      {m.label}
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 700 }}>
                      {typeof m.value === "number" ? m.value.toFixed(1) : m.value}{m.unit}
                    </p>
                  </div>
                ))}
              </div>

              {c.accion && (
                <span style={{
                  display: "inline-block", padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: cfg.tagBg, color: cfg.tagColor,
                }}>
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
                    <td className="font-bold">{m.nombre || m.name || `Miembro ${m.id_miembro || m.id}`}</td>
                    <td style={{ color: "var(--text-secondary)" }}>#{m.id_miembro || m.id || "—"}</td>
                    <td>{m.peso ? `${parseFloat(m.peso).toFixed(1)} kg` : "—"}</td>
                    <td>{m.imc ? parseFloat(m.imc).toFixed(1) : "—"}</td>
                    <td>{m.grasa ? `${parseFloat(m.grasa).toFixed(1)}%` : "—"}</td>
                    <td>{m.musculo ? `${parseFloat(m.musculo).toFixed(1)}%` : "—"}</td>
                    <td>{getClusterPill(m.cluster ?? m.cluster_id ?? 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls">
            <button
              className="btn-outline-small"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Anterior
            </button>
            <span className="page-info">Página {page} de {totalPages}</span>
            <button
              className="btn-outline-small"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}