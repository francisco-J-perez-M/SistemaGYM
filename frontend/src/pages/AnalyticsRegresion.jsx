import { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../css/CSSUnificado.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

export default function AnalyticsRegresion() {
  const [globalData, setGlobalData]       = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError]     = useState(null);
  const [trainLoading, setTrainLoading]   = useState(false);
  const [trainMsg, setTrainMsg]           = useState(null);

  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberData, setMemberData]       = useState(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError]     = useState(null);
  const [dias, setDias]                   = useState(180);
  const [showDropdown, setShowDropdown]   = useState(false);

  const searchRef  = useRef(null);
  const debounceRef = useRef(null);

  // ── GET: carga global desde caché ─────────────────────────────────────────
  const fetchGlobal = useCallback(async () => {
    setGlobalLoading(true);
    setGlobalError(null);
    setTrainMsg(null);
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

  // ── POST /train: re-entrena y actualiza caché ─────────────────────────────
  const handleTrain = useCallback(async () => {
    setTrainLoading(true);
    setTrainMsg(null);
    setGlobalError(null);
    const token = localStorage.getItem("token");
    try {
      const r = await fetch(`${API_BASE}/api/analytics/regresion/train`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const json = await r.json();
      setGlobalData(json);
      setTrainMsg(json.mensaje || "Modelo reentrenado correctamente.");
    } catch (e) {
      setGlobalError(e.message);
    } finally {
      setTrainLoading(false);
    }
  }, []);

  useEffect(() => { fetchGlobal(); }, []);

  // ── Búsqueda de miembros con debounce ─────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE}/api/miembros?search=${encodeURIComponent(searchQuery)}&limit=8`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error();
        const json = await res.json();
        const list = json.miembros || json.data || json || [];
        setSearchResults(list);
        setShowDropdown(list.length > 0);
      } catch {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchMemberPrediction = useCallback(async (member, diasParam) => {
    setMemberLoading(true);
    setMemberError(null);
    const token = localStorage.getItem("token");
    const id    = member.id_miembro || member.id;
    try {
      const res = await fetch(
        `${API_BASE}/api/analytics/regresion/predecir/${id}?dias=${diasParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      setMemberData(await res.json());
    } catch (e) {
      setMemberError(e.message);
    } finally {
      setMemberLoading(false);
    }
  }, []);

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setSearchQuery(member.nombre || member.name || `ID #${member.id_miembro || member.id}`);
    setShowDropdown(false);
    fetchMemberPrediction(member, dias);
  };

  const handleDiasChange = (newDias) => {
    setDias(newDias);
    if (selectedMember) fetchMemberPrediction(selectedMember, newDias);
  };

  // ── Datos para gráfico global ──────────────────────────────────────────────
  const tendenciaGlobal = globalData?.tendencia_peso_global || [];
  const metricas        = globalData?.metricas || {};
  const r2              = metricas.r2 ?? null;
  const rmse            = metricas.rmse ?? null;
  const desdeCache      = globalData?.desde_cache ?? false;
  const ejecutadoEn     = globalData?.ejecutado_en;

  const globalChartData = tendenciaGlobal.map((item) => ({
    mes:  item.mes || item.periodo || "",
    peso: item.peso_promedio ?? item.peso ?? null,
  }));

  // ── Datos para gráfico de miembro ─────────────────────────────────────────
  const buildMemberChartData = () => {
    if (!memberData) return [];
    const historial    = memberData.historial_peso       || [];
    const predicciones = memberData.predicciones_futuras || [];

    const histData = historial.map((item, i) => ({
      label: item.fecha || `M${i + 1}`,
      real:       item.peso ?? null,
      prediccion: null,
    }));

    const predData = predicciones.map((item, i) => ({
      label: item.fecha_estimada || `F+${i + 1}`,
      real:       null,
      prediccion: item.peso_predicho_kg ?? null,
    }));

    const ultimoReal = histData[histData.length - 1];
    if (ultimoReal && predData.length > 0) {
      return [...histData, { ...predData[0], real: ultimoReal.real }, ...predData.slice(1)];
    }
    return [...histData, ...predData];
  };

  const memberChartData = buildMemberChartData();
  const tendencia       = memberData?.tendencia || "";
  const tendenciaConfig = {
    bajando: { icon: "↙", color: "var(--success-color)", bg: "rgba(76,217,100,0.12)",  label: "Bajando" },
    subiendo: { icon: "↗", color: "var(--danger-color)",  bg: "rgba(255,77,77,0.12)",   label: "Subiendo" },
    estable:  { icon: "→", color: "var(--warning-color)", bg: "rgba(255,189,46,0.12)",  label: "Estable" },
  };
  const tConfig = tendenciaConfig[tendencia] || {};

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Tendencias y Predicción</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Regresión Lineal · Tendencia global y predicción individual
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Badge caché */}
          {ejecutadoEn && (
            <span style={{ fontSize: 11, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
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
            disabled={trainLoading || globalLoading}
            title="Re-entrena el modelo con los datos actuales y actualiza la caché"
          >
            {trainLoading ? <span className="spinner" /> : (
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
      </div>

      {/* Notificación exitosa */}
      {trainMsg && (
        <div style={{
          marginBottom: 16, padding: "12px 16px", borderRadius: 8,
          background: "rgba(76,217,100,0.1)", border: "1px solid var(--success-color)",
          color: "var(--success-color)", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {trainMsg}
        </div>
      )}

      {/* Loading overlay reentrenamiento */}
      {trainLoading && (
        <div style={{
          marginBottom: 16, padding: "20px 24px", borderRadius: 12,
          background: "var(--bg-card)", border: "1px solid var(--border-dark)",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div className="dashboard-spinner" style={{ width: 28, height: 28 }} />
          <div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Reentrenando modelo de Regresión Lineal...</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Spark está ajustando los coeficientes sobre el historial completo del gimnasio.
            </p>
          </div>
        </div>
      )}

      {/* ── Tendencia Global ─────────────────────────────────────────────────── */}
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-secondary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        Tendencia global del gimnasio
        <div style={{ flex: 1, height: 1, background: "var(--border-dark)" }} />
      </div>

      {globalLoading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-dark)" }}>
          <div className="dashboard-spinner" />
          <h3 style={{ marginTop: 20, marginBottom: 8, color: "var(--text-primary)" }}>Cargando modelo...</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: 500, fontSize: 14, lineHeight: 1.5 }}>
            Recuperando los resultados de la regresión lineal desde la base de datos.
          </p>
        </div>
      ) : globalError ? (
        <div className="empty-state" style={{ marginBottom: 20 }}>
          <h3>Error cargando tendencia global</h3>
          <p>{globalError}</p>
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={fetchGlobal}>Reintentar</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
          <div className="chart-card">
            <div className="chart-header"><h3>Peso promedio del gimnasio</h3></div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={globalChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="mes" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)} kg`}/>
                <Tooltip content={<CustomTooltip />}/>
                <Line type="monotone" dataKey="peso" name="Promedio global" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, fill: "#38bdf8", strokeWidth: 0 }} connectNulls={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="stat-card" style={{ justifyContent: "center", alignItems: "center", gap: 10 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>Precisión del modelo</p>
            <div style={{ fontSize: 52, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>
              {r2 !== null ? r2.toFixed(2) : "—"}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Coeficiente R²</p>
            {r2 !== null && (
              <span style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: r2 >= 0.8 ? "rgba(76,217,100,0.12)" : "rgba(255,189,46,0.12)",
                color: r2 >= 0.8 ? "var(--success-color)" : "var(--warning-color)",
              }}>
                {r2 >= 0.9 ? "Excelente ajuste" : r2 >= 0.7 ? "Buen ajuste" : "Ajuste moderado"}
              </span>
            )}
            {rmse !== null && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                RMSE: <strong style={{ color: "var(--text-primary)" }}>{parseFloat(rmse).toFixed(2)} kg</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Predicción individual ─────────────────────────────────────────────── */}
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-secondary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        Herramienta del entrenador — predicción individual
        <div style={{ flex: 1, height: 1, background: "var(--border-dark)" }} />
      </div>

      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Buscador */}
          <div ref={searchRef} style={{ flex: 1, minWidth: 220, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px 11px 38px", background: "var(--input-bg-dark)", border: "1px solid var(--border-dark)", borderRadius: 8, position: "relative" }}>
              <svg style={{ position: "absolute", left: 12, color: "var(--text-secondary)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                style={{ background: "transparent", border: "none", flex: 1, outline: "none", color: "var(--text-primary)", fontSize: 14 }}
                placeholder="Buscar miembro por nombre o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              />
            </div>
            {showDropdown && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border-dark)", borderRadius: 10, overflow: "hidden", zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                {searchResults.map((m, i) => {
                  const nombre   = m.nombre || m.name || `Miembro #${m.id_miembro || m.id}`;
                  const initials = nombre.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={i}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", borderBottom: i < searchResults.length - 1 ? "1px solid var(--border-dark)" : "none" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      onClick={() => handleSelectMember(m)}
                    >
                      <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials}</div>
                      <span style={{ fontSize: 14, flex: 1 }}>{nombre}</span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>ID #{m.id_miembro || m.id}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selector de días */}
          {[{ label: "3 meses", value: 90 }, { label: "6 meses", value: 180 }, { label: "1 año", value: 365 }].map((opt) => (
            <button key={opt.value} onClick={() => handleDiasChange(opt.value)}
              style={{ padding: "10px 16px", borderRadius: 20, border: "1px solid", borderColor: dias === opt.value ? "var(--accent)" : "var(--border-dark)", background: dias === opt.value ? "var(--accent)" : "var(--input-bg-dark)", color: dias === opt.value ? "var(--text-on-accent)" : "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico del miembro */}
      {memberLoading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
          <div className="dashboard-spinner" />
          <h4 style={{ marginTop: 16, marginBottom: 4, color: "var(--text-primary)" }}>Proyectando futuro del miembro...</h4>
          <p style={{ color: "var(--text-secondary)", maxWidth: 400, fontSize: 13, lineHeight: 1.4 }}>
            Aplicando los coeficientes del modelo sobre el historial del miembro.
          </p>
        </div>
      )}
      {memberError && (
        <div className="empty-state">
          <h3>Error al cargar predicción</h3>
          <p>{memberError}</p>
        </div>
      )}
      {!memberLoading && !memberError && memberData && (
        <div className="chart-card">
          <div className="chart-header" style={{ marginBottom: 16 }}>
            <h3>
              {selectedMember
                ? (selectedMember.nombre || selectedMember.name || `Miembro #${selectedMember.id_miembro || selectedMember.id}`)
                : "Predicción del miembro"}
            </h3>
            {tendencia && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: tConfig.bg, color: tConfig.color }}>
                <span style={{ fontSize: 16 }}>{tConfig.icon}</span>
                {tConfig.label}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 24, height: 3, background: "#38bdf8", borderRadius: 2, display: "inline-block" }} />
              Historial real
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 24, height: 0, borderTop: "3px dashed #a78bfa", display: "inline-block" }} />
              Predicción IA
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={memberChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)} kg`}/>
              <Tooltip content={<CustomTooltip />}/>
              <Line type="monotone" dataKey="real" name="Historial" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, fill: "#38bdf8", strokeWidth: 0 }} connectNulls={false}/>
              <Line type="monotone" dataKey="prediccion" name="Predicción" stroke="#a78bfa" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 4, fill: "#a78bfa", strokeWidth: 0 }} connectNulls={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!selectedMember && !memberLoading && (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" style={{ margin: "0 auto 12px" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <h3>Busca un miembro</h3>
          <p>Escribe el nombre o ID de un miembro para ver su historial y predicción de peso.</p>
        </div>
      )}
    </div>
  );
}