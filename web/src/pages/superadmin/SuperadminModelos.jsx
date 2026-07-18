/**
 * SuperadminModelos.jsx — Laboratorio de Machine Learning (nivel plataforma).
 *
 * Reune los modulos tecnicos de ML que antes vivian en el panel del owner del
 * gimnasio. El superadmin elige un gimnasio y todo el analisis se acota a el
 * mediante la cabecera X-Gym-ID (persistida en localStorage como "sa_gym_id",
 * que los componentes reutilizados TabKMeans/TabRegresion/TabModelos leen a
 * traves del helper gymHeader()).
 *
 * Modulos:
 *   - Metodo del Codo y Silueta   -> GET /api/analytics/kmeans/optimo
 *   - Grupos de Miembros (K-Means)-> componente reutilizado TabKMeans
 *   - Tendencias de Peso (Regres.)-> componente reutilizado TabRegresion
 *   - Laboratorio de Modelos      -> componente reutilizado TabModelos
 *   - Entrenamiento, Prueba y Error (5 pasos) -> GET /api/analytics/entrenamiento
 */
import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  FiCpu, FiTarget, FiGrid, FiTrendingUp, FiLayers, FiActivity,
  FiPlayCircle, FiCheckCircle, FiAlertTriangle, FiSliders, FiEye,
} from "react-icons/fi";
import { getGimnasios } from "../../api/superadmin";
import { TabKMeans, TabRegresion, TabModelos } from "../owner_gym/AdminAnalytics";

const API_BASE = "";
const ACCENT   = "#fbe379";
const SUCCESS  = "#4cd964";
const INFO     = "#38bdf8";
const DANGER   = "#ff6b9d";
const PURPLE   = "#a78bfa";

const card = (extra = {}) => ({
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "20px 22px",
  ...extra,
});

const authHeaders = () => {
  const token = localStorage.getItem("token");
  const gid   = localStorage.getItem("sa_gym_id");
  const h = { Authorization: `Bearer ${token}` };
  if (gid) h["X-Gym-ID"] = gid;
  return h;
};

// ── Estados de carga / error / vacio reutilizables ────────────────────────────

function Estado({ loading, error, empty }) {
  if (loading) return <p style={{ fontSize: 13, color: "var(--text-secondary)", padding: 20 }}>Cargando analisis…</p>;
  if (error)   return <p style={{ fontSize: 13, color: "var(--danger)", padding: 20 }}>{error}</p>;
  if (empty)   return <p style={{ fontSize: 13, color: "var(--text-secondary)", padding: 20 }}>Sin datos suficientes para este gimnasio.</p>;
  return null;
}

// ── Modulo 1: Metodo del Codo y Coeficiente de Silueta ────────────────────────

function TabCodoSilueta({ gymId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/analytics/kmeans/optimo`, { headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
      setData(j);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []); // el remontaje por key={gymId} en el padre dispara el refetch al cambiar de gimnasio

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || error || !data?.resultados?.length) {
    return <Estado loading={loading} error={error} empty={!loading && !error} />;
  }

  const { resultados, k_recomendado_codo, k_recomendado_silueta, n } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Metric label="Muestras analizadas" value={n} color="var(--text-primary)" icon={<FiActivity />} />
        <Metric label="k optimo (codo)" value={k_recomendado_codo} color={ACCENT} icon={<FiTarget />} />
        <Metric label="k optimo (silueta)" value={k_recomendado_silueta} color={INFO} icon={<FiTarget />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={card()}>
          <h3 style={hStyle}>Metodo del Codo (inercia por k)</h3>
          <p style={pStyle}>El "codo" marca el punto donde agregar mas grupos deja de reducir significativamente la inercia.</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={resultados} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="k" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="inercia" stroke={ACCENT} strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={card()}>
          <h3 style={hStyle}>Coeficiente de Silueta por k</h3>
          <p style={pStyle}>Mide que tan bien separados quedan los grupos (rango -1 a 1). El k con mayor silueta es el mas nitido.</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={resultados} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="k" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} domain={[0, 1]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="silhouette" radius={[6, 6, 0, 0]}>
                {resultados.map((r) => (
                  <Cell key={r.k} fill={r.k === k_recomendado_silueta ? SUCCESS : INFO} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={card({ padding: 0, overflow: "hidden" })}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-input)" }}>
              {["k", "Inercia", "Silueta"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resultados.map(r => (
              <tr key={r.k} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdStyle}>
                  <b style={{ color: "var(--text-primary)" }}>{r.k}</b>
                  {r.k === k_recomendado_codo && <span style={pill(ACCENT)}>codo</span>}
                  {r.k === k_recomendado_silueta && <span style={pill(SUCCESS)}>silueta</span>}
                </td>
                <td style={tdStyle}>{r.inercia}</td>
                <td style={tdStyle}>{r.silhouette}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Modulo 5: Entrenamiento, Prueba y Error (5 pasos) ─────────────────────────

const PASOS_META = [
  { key: "1_entrenamiento", label: "Entrenamiento",     icon: <FiPlayCircle />,    color: ACCENT  },
  { key: "2_evaluacion",    label: "Evaluacion",         icon: <FiCheckCircle />,   color: INFO    },
  { key: "3_analisis_error",label: "Analisis del Error", icon: <FiAlertTriangle />, color: DANGER  },
  { key: "4_optimizacion",  label: "Optimizacion",       icon: <FiSliders />,       color: PURPLE  },
  { key: "5_interpretacion",label: "Interpretacion",     icon: <FiEye />,           color: SUCCESS },
];

function TabEntrenamiento({ gymId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/analytics/entrenamiento`, { headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
      setData(j);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []); // el remontaje por key={gymId} en el padre dispara el refetch al cambiar de gimnasio

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || error || !data?.pasos) {
    return <Estado loading={loading} error={error} empty={!loading && !error} />;
  }

  const p = data.pasos;
  const ev = p["2_evaluacion"].metricas;
  const err = p["3_analisis_error"];
  const opt = p["4_optimizacion"];
  const imp = p["5_interpretacion"].importancias || [];
  const maxImp = Math.max(...imp.map(i => i.importancia), 0.0001);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Metric label="Miembros" value={data.n} color="var(--text-primary)" icon={<FiActivity />} />
        <Metric label="Entrenamiento (75%)" value={data.n_entrenamiento} color={ACCENT} icon={<FiPlayCircle />} />
        <Metric label="Prueba (25%)" value={data.n_prueba} color={INFO} icon={<FiCheckCircle />} />
      </div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Objetivo: <b style={{ color: "var(--text-primary)" }}>{data.objetivo}</b>
      </p>

      {/* Linea de los 5 pasos */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PASOS_META.map((m, i) => (
          <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 160px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", width: "100%" }}>
              <span style={{ color: m.color, display: "flex", fontSize: 18 }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>PASO {i + 1}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{m.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paso 1 y 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={card()}>
          <h3 style={hStyle}><FiPlayCircle style={{ color: ACCENT, verticalAlign: "-2px", marginRight: 6 }} />1. Entrenamiento</h3>
          <p style={pStyle}>{p["1_entrenamiento"].descripcion}</p>
          <Metric label="Accuracy en entrenamiento" value={`${(p["1_entrenamiento"].accuracy_entrenamiento * 100).toFixed(1)}%`} color={ACCENT} full />
        </div>
        <div style={card()}>
          <h3 style={hStyle}><FiCheckCircle style={{ color: INFO, verticalAlign: "-2px", marginRight: 6 }} />2. Evaluacion (datos no vistos)</h3>
          <p style={pStyle}>{p["2_evaluacion"].descripcion}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[["Accuracy", ev.accuracy], ["Precision", ev.precision], ["Recall", ev.recall], ["F1", ev.f1]].map(([k, v]) => (
              <div key={k} style={{ background: "var(--bg-input)", borderRadius: 8, padding: "10px 12px" }}>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>{k}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: INFO }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Paso 3 */}
      <div style={card()}>
        <h3 style={hStyle}><FiAlertTriangle style={{ color: DANGER, verticalAlign: "-2px", marginRight: 6 }} />3. Analisis del Error</h3>
        <p style={pStyle}>{err.descripcion}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <Metric label="Error entrenamiento" value={err.error_entrenamiento} color={ACCENT} />
          <Metric label="Error prueba" value={err.error_prueba} color={DANGER} />
          <Metric label="Brecha" value={err.brecha} color={PURPLE} />
        </div>
        <div style={{ background: "var(--bg-input)", borderLeft: `3px solid ${DANGER}`, borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "var(--text-primary)" }}>
          {err.diagnostico}
        </div>
      </div>

      {/* Paso 4 */}
      <div style={card()}>
        <h3 style={hStyle}><FiSliders style={{ color: PURPLE, verticalAlign: "-2px", marginRight: 6 }} />4. Optimizacion</h3>
        <p style={pStyle}>{opt.descripcion}</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-input)" }}>
              <th style={thStyle}>Profundidad (max_depth)</th>
              <th style={thStyle}>Accuracy en prueba</th>
            </tr>
          </thead>
          <tbody>
            {opt.pruebas.map((o, i) => {
              const best = o.max_depth === opt.mejor.max_depth && o.accuracy_prueba === opt.mejor.accuracy_prueba;
              return (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: best ? "rgba(167,139,250,.10)" : "transparent" }}>
                  <td style={tdStyle}>{String(o.max_depth)}{best && <span style={pill(PURPLE)}>mejor</span>}</td>
                  <td style={tdStyle}>{o.accuracy_prueba}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paso 5 */}
      <div style={card()}>
        <h3 style={hStyle}><FiEye style={{ color: SUCCESS, verticalAlign: "-2px", marginRight: 6 }} />5. Interpretacion</h3>
        <p style={pStyle}>{p["5_interpretacion"].descripcion}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {imp.map(f => (
            <div key={f.feature} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 150, fontSize: 12, color: "var(--text-secondary)" }}>{f.feature}</span>
              <div style={{ flex: 1, background: "var(--bg-input)", borderRadius: 6, height: 16, overflow: "hidden" }}>
                <div style={{ width: `${(f.importancia / maxImp) * 100}%`, height: "100%", background: SUCCESS, borderRadius: 6 }} />
              </div>
              <span style={{ width: 60, fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textAlign: "right" }}>{f.importancia}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--bg-input)", borderLeft: `3px solid ${SUCCESS}`, borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "var(--text-primary)" }}>
          {p["5_interpretacion"].conclusion}
        </div>
      </div>
    </div>
  );
}

// ── Helpers de presentacion ───────────────────────────────────────────────────

const hStyle = { fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 };
const pStyle = { fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 };
const thStyle = { textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border)" };
const tdStyle = { padding: "12px 16px", color: "var(--text-secondary)" };
const tooltipStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" };
const pill = (color) => ({ marginLeft: 8, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "var(--bg-input)", color, border: `1px solid ${color}` });

function Metric({ label, value, color, icon, full }) {
  return (
    <div style={{ background: "var(--bg-input)", borderRadius: 10, padding: "12px 16px", flex: full ? "1 1 100%" : "1 1 160px", display: "flex", alignItems: "center", gap: 12 }}>
      {icon && <span style={{ color, fontSize: 20, display: "flex" }}>{icon}</span>}
      <div>
        <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, color }}>{value}</p>
      </div>
    </div>
  );
}

// ── Definicion de sub-pestañas ────────────────────────────────────────────────

const SUBTABS = [
  { id: "codo",         label: "Metodo del Codo y Silueta",     Icon: FiTarget,     kind: "local", Comp: TabCodoSilueta },
  { id: "kmeans",       label: "Grupos de Miembros (K-Means)",  Icon: FiGrid,       kind: "reuse", Comp: TabKMeans      },
  { id: "regresion",    label: "Tendencias de Peso (Regresion)",Icon: FiTrendingUp, kind: "reuse", Comp: TabRegresion   },
  { id: "modelos",      label: "Laboratorio de Modelos",        Icon: FiLayers,     kind: "reuse", Comp: TabModelos     },
  { id: "entrenamiento",label: "Entrenamiento, Prueba y Error", Icon: FiCpu,        kind: "local", Comp: TabEntrenamiento },
];

export default function SuperadminModelos() {
  const [gyms, setGyms]     = useState([]);
  const [gymId, setGymId]   = useState(() => localStorage.getItem("sa_gym_id") || "");
  const [active, setActive] = useState("codo");
  const [loadingGyms, setLoadingGyms] = useState(true);

  useEffect(() => {
    getGimnasios({ per_page: 500, activo: "true" })
      .then(r => {
        const list = r.data.gimnasios || [];
        setGyms(list);
        setGymId(prev => {
          const valid = prev && list.some(g => String(g.id) === String(prev));
          const next = valid ? prev : (list[0] ? String(list[0].id) : "");
          if (next) localStorage.setItem("sa_gym_id", next);
          return next;
        });
      })
      .catch(() => setGyms([]))
      .finally(() => setLoadingGyms(false));
  }, []);

  const onSelectGym = (id) => {
    setGymId(id);
    if (id) localStorage.setItem("sa_gym_id", id);
    else localStorage.removeItem("sa_gym_id");
  };

  const activeTab = SUBTABS.find(t => t.id === active) || SUBTABS[0];
  const ActiveComp = activeTab.Comp;
  const gymName = gyms.find(g => String(g.id) === String(gymId))?.nombre;

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "var(--bg-input)", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
            <FiCpu style={{ color: ACCENT }} /> Laboratorio de ML
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Modulos tecnicos de machine learning acotados a un gimnasio de la plataforma.
          </p>
        </div>

        {/* Selector de gimnasio */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FiActivity style={{ color: "var(--text-secondary)" }} />
          <select
            value={gymId}
            onChange={e => onSelectGym(e.target.value)}
            disabled={loadingGyms}
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 14px", color: "var(--text-primary)", fontSize: 13, minWidth: 220, fontWeight: 600 }}
          >
            {loadingGyms && <option>Cargando gimnasios…</option>}
            {!loadingGyms && gyms.length === 0 && <option value="">Sin gimnasios activos</option>}
            {gyms.map(g => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {!gymId ? (
        <div style={card()}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Selecciona un gimnasio para ejecutar los modelos de machine learning.
          </p>
        </div>
      ) : (
        <>
          {/* Sub-pestañas */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {SUBTABS.map(t => {
              const on = t.id === active;
              const Icon = t.Icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)",
                    borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    background: on ? "var(--accent-dim, rgba(251,227,121,.12))" : "var(--bg-card)",
                    color: on ? "var(--accent-soft, " + ACCENT + ")" : "var(--text-secondary)",
                    borderColor: on ? ACCENT : "var(--border)",
                  }}
                >
                  <Icon /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Contenido de la pestaña activa.
             key incluye el gimnasio para forzar el remontaje (y refetch) de los
             componentes reutilizados cuando el superadmin cambia de gimnasio. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Gimnasio: <b style={{ color: "var(--text-primary)" }}>{gymName || gymId}</b>
            </p>
            {activeTab.kind === "local"
              ? <ActiveComp key={`${activeTab.id}-${gymId}`} gymId={gymId} />
              : <ActiveComp key={`${activeTab.id}-${gymId}`} />}
          </div>
        </>
      )}
    </div>
  );
}
