import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiActivity, FiTarget, FiAlertCircle } from "react-icons/fi";
// CORRECCIÓN: Usamos GiBodyHeight (para estatura) y GiWeightScale (para peso)
// Ambos aparecen en tu lista de iconos disponibles.
import { GiBodyHeight, GiMuscleUp, GiWeightScale } from "react-icons/gi"; 
import BodyViewer from "../components/BodyViewer";
import "../css/CSSUnificado.css";

export default function UserBodyProgress() {
  const [user, setUser] = useState(null);
  const [selectedGender, setSelectedGender] = useState("female");
  const [bodyMetrics, setBodyMetrics] = useState({
    peso: { actual: 0, inicial: 0, meta: 0 },
    grasaCorporal: { actual: 0, inicial: 0, meta: 0 },
    musculo: { actual: 0, inicial: 0, meta: 0 },
    imc: 0,
    estatura: 0
  });
  const [progressHistory, setProgressHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasDatos, setHasDatos] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchBodyProgress();
  }, []);

  const fetchBodyProgress = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/user/body-progress", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Error al cargar progreso");

      const data = await response.json();
      setBodyMetrics(data.bodyMetrics);
      setProgressHistory(data.progressHistory);
      setSelectedGender(data.gender);
      setHasDatos(data.hasDatos);
      setError(null);
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudo cargar el progreso corporal");
    } finally {
      setLoading(false);
    }
  };

  const calcularProgreso = (actual, inicial, meta) => {
    const diferenciaPeso = Math.abs(inicial - meta);
    if (diferenciaPeso === 0) return 0;
    const progresoActual = Math.abs(inicial - actual);
    return Math.min(100, Math.round((progresoActual / diferenciaPeso) * 100));
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="main-wrapper">
          <header className="top-header">
            <h2 className="page-title">Progreso Físico</h2>
          </header>
          <main className="dashboard-content">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
              <p>Cargando progreso...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Progreso Físico</h2>
        </header>

        <main className="dashboard-content">
          {error && (
            <div style={{ 
              padding: '15px', 
              background: 'rgba(255, 59, 48, 0.1)', 
              borderRadius: '8px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--error-color)'
            }}>
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {!hasDatos && !error && (
            <div style={{ 
              padding: '20px', 
              background: 'rgba(74, 144, 226, 0.1)', 
              borderRadius: '8px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--accent-color)'
            }}>
              <FiActivity />
              <span>No hay registros de progreso. Comienza a registrar tus mediciones para ver tu evolución.</span>
            </div>
          )}

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {
                label: "Estatura",
                value: `${bodyMetrics.estatura} m`,
                change: selectedGender === "male" ? "Hombre" : "Mujer",
                // CORRECCIÓN: Usamos GiBodyHeight aquí (es más lógico)
                icon: <GiBodyHeight />, 
              },
              {
                label: "Peso Actual",
                value: `${bodyMetrics.peso.actual} kg`,
                change: bodyMetrics.peso.inicial > 0 
                  ? `${(bodyMetrics.peso.inicial - bodyMetrics.peso.actual) >= 0 ? '-' : '+'}${Math.abs(bodyMetrics.peso.inicial - bodyMetrics.peso.actual).toFixed(1)} kg`
                  : 'Sin cambios',
                // CORRECCIÓN: Usamos GiWeightScale aquí
                icon: <GiWeightScale />,
              },
              {
                label: "Masa Muscular",
                value: `${bodyMetrics.musculo.actual}%`,
                change: bodyMetrics.musculo.inicial > 0
                  ? `${(bodyMetrics.musculo.actual - bodyMetrics.musculo.inicial) >= 0 ? '+' : '-'}${Math.abs(bodyMetrics.musculo.actual - bodyMetrics.musculo.inicial).toFixed(1)}%`
                  : 'Sin cambios',
                icon: <GiMuscleUp />,
              },
              {
                label: "IMC",
                value: bodyMetrics.imc.toFixed(1),
                change: bodyMetrics.imc >= 18.5 && bodyMetrics.imc <= 24.9 ? "Saludable" : 
                        bodyMetrics.imc < 18.5 ? "Bajo peso" : "Sobrepeso",
                icon: <FiTarget />,
              },
            ].map((metric, idx) => (
              <motion.div
                key={idx}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="stat-header">
                  <h3 style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {metric.icon}
                    {metric.label}
                  </h3>
                  <span className={`trend ${
                    metric.change.includes('-') || metric.change === 'Saludable' ? 'positive' : 
                    metric.change.includes('+') && idx === 3 ? 'positive' : 
                    metric.change.includes('+') ? 'negative' : ''
                  }`}>
                    {metric.change}
                  </span>
                </div>
                <div className="stat-value">{metric.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="charts-row" style={{ marginTop: "25px" }}>
            {/* MODELO CORPORAL 3D */}
            <motion.div 
              className="chart-card" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
            >
              <div className="chart-header">
                <h3>Modelo Corporal 3D</h3>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {selectedGender === "female" ? "Femenino" : "Masculino"}
                  </span>
                </div>
              </div>

              {/* VISOR 3D */}
              <div
                style={{
                  width: "100%",
                  height: "600px", 
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                  borderRadius: "0 0 12px 12px",
                  position: "relative"
                }}
              >
                <BodyViewer
                  gender={selectedGender}
                  metrics={bodyMetrics}
                />
                
                {/* Indicador de métricas en tiempo real */}
                <div style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  background: "rgba(0,0,0,0.7)",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#fff"
                }}>
                  <div><strong>IMC:</strong> {bodyMetrics.imc.toFixed(1)}</div>
                  <div><strong>Grasa:</strong> {bodyMetrics.grasaCorporal.actual}%</div>
                  <div><strong>Músculo:</strong> {bodyMetrics.musculo.actual}%</div>
                </div>
              </div>

              {/* Áreas de enfoque */}
              <div style={{ padding: "20px", borderTop: "1px solid var(--border-dark)" }}>
                <h4 style={{ marginBottom: "15px" }}>Áreas de Enfoque</h4>
                {[
                  { 
                    area: "Reducción Grasa", 
                    progress: calcularProgreso(
                      bodyMetrics.grasaCorporal.actual,
                      bodyMetrics.grasaCorporal.inicial,
                      bodyMetrics.grasaCorporal.meta
                    ), 
                    color: "var(--accent-color)" 
                  },
                  { 
                    area: "Pérdida Peso", 
                    progress: calcularProgreso(
                      bodyMetrics.peso.actual,
                      bodyMetrics.peso.inicial,
                      bodyMetrics.peso.meta
                    ), 
                    color: "var(--success-color)" 
                  },
                  { 
                    area: "Ganancia Muscular", 
                    progress: calcularProgreso(
                      bodyMetrics.musculo.actual,
                      bodyMetrics.musculo.inicial,
                      bodyMetrics.musculo.meta
                    ), 
                    color: "var(--warning-color)" 
                  },
                ].map((area, idx) => (
                  <div key={idx} style={{ marginBottom: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>{area.area}</span>
                      <span style={{ fontWeight: 600, color: area.color }}>
                        {area.progress}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        background: "var(--border-dark)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${area.progress}%` }}
                        transition={{ duration: 1, delay: idx * 0.2 }}
                        style={{ height: "100%", background: area.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* HISTÓRICO */}
            <motion.div 
              className="chart-card" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
            >
              <div className="chart-header">
                <h3>Progreso Histórico (6 meses)</h3>
              </div>

              <div style={{ padding: "20px" }}>
                {progressHistory.length > 0 ? (
                  <div className="css-bar-chart" style={{ height: "200px" }}>
                    {progressHistory.map((month, index) => (
                      <div key={index} className="bar-group">
                        <motion.div
                          className="bar income"
                          initial={{ height: 0 }}
                          animate={{ height: `${month.porcentaje}%` }}
                          transition={{ delay: index * 0.1 }}
                          style={{ backgroundColor: "var(--accent-color)" }}
                        >
                          <span className="tooltip">{month.porcentaje}%</span>
                        </motion.div>
                        <span className="bar-label">{month.mes}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    color: 'var(--text-secondary)'
                  }}>
                    <FiActivity size={48} style={{ marginBottom: '15px', opacity: 0.3 }} />
                    <p>No hay datos históricos disponibles</p>
                    <p style={{ fontSize: '13px', marginTop: '8px' }}>
                      Los datos aparecerán cuando registres tu progreso mensual
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}