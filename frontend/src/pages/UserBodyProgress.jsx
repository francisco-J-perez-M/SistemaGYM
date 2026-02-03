import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiActivity, FiTarget, FiAlertCircle } from "react-icons/fi";
import { GiBodyHeight, GiMuscleUp } from "react-icons/gi";
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
  });
  const [progressHistory, setProgressHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setSelectedGender(data.gender || "female");
      setError(null);
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudo cargar el progreso corporal");
    } finally {
      setLoading(false);
    }
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

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {
                label: "Peso Actual",
                value: `${bodyMetrics.peso.actual} kg`,
                change: `-${(bodyMetrics.peso.inicial - bodyMetrics.peso.actual).toFixed(1)} kg`,
                icon: <GiBodyHeight />,
              },
              {
                label: "Grasa Corporal",
                value: `${bodyMetrics.grasaCorporal.actual}%`,
                change: `-${(bodyMetrics.grasaCorporal.inicial - bodyMetrics.grasaCorporal.actual).toFixed(1)}%`,
                icon: <FiActivity />,
              },
              {
                label: "Masa Muscular",
                value: `${bodyMetrics.musculo.actual}%`,
                change: `+${(bodyMetrics.musculo.actual - bodyMetrics.musculo.inicial).toFixed(1)}%`,
                icon: <GiMuscleUp />,
              },
              {
                label: "IMC",
                value: bodyMetrics.imc,
                change: bodyMetrics.imc >= 18.5 && bodyMetrics.imc <= 24.9 ? "Saludable" : "Revisar",
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
                  <span className="trend positive">{metric.change}</span>
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
                <h3>Modelo Corporal</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setSelectedGender("female")}
                    style={{
                      padding: "6px 12px",
                      background: selectedGender === "female" ? "var(--accent-color)" : "transparent",
                      border: "1px solid var(--border-dark)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#fff"
                    }}
                  >
                    Femenino
                  </button>
                  <button
                    onClick={() => setSelectedGender("male")}
                    style={{
                      padding: "6px 12px",
                      background: selectedGender === "male" ? "var(--accent-color)" : "transparent",
                      border: "1px solid var(--border-dark)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#fff"
                    }}
                  >
                    Masculino
                  </button>
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
                  borderRadius: "0 0 12px 12px"
                }}
              >
                <BodyViewer
                  gender={selectedGender}
                  metrics={bodyMetrics}
                />
              </div>

              {/* Áreas de enfoque */}
              <div style={{ padding: "20px", borderTop: "1px solid var(--border-dark)" }}>
                <h4 style={{ marginBottom: "15px" }}>Áreas de Enfoque</h4>
                {[
                  { 
                    area: "Abdomen", 
                    progress: Math.min(100, Math.round((bodyMetrics.grasaCorporal.inicial - bodyMetrics.grasaCorporal.actual) / (bodyMetrics.grasaCorporal.inicial - bodyMetrics.grasaCorporal.meta) * 100)), 
                    color: "var(--accent-color)" 
                  },
                  { 
                    area: "Piernas", 
                    progress: Math.min(100, Math.round((bodyMetrics.peso.inicial - bodyMetrics.peso.actual) / (bodyMetrics.peso.inicial - bodyMetrics.peso.meta) * 100)), 
                    color: "var(--success-color)" 
                  },
                  { 
                    area: "Brazos", 
                    progress: Math.min(100, Math.round((bodyMetrics.musculo.actual - bodyMetrics.musculo.inicial) / (bodyMetrics.musculo.meta - bodyMetrics.musculo.inicial) * 100)), 
                    color: "var(--warning-color)" 
                  },
                ].map((area, idx) => (
                  <div key={idx} style={{ marginBottom: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>{area.area}</span>
                      <span style={{ fontWeight: 600, color: area.color }}>
                        {isNaN(area.progress) ? 0 : area.progress}%
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
                        animate={{ width: `${isNaN(area.progress) ? 0 : area.progress}%` }}
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
                <h3>Progreso Histórico</h3>
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
                    <p>No hay datos históricos disponibles</p>
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