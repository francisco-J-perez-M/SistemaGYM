import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiActivity, FiTarget } from "react-icons/fi";
import { GiBodyHeight, GiMuscleUp } from "react-icons/gi";
import BodyViewer from "../components/BodyViewer";
import "../css/CSSUnificado.css";

export default function UserBodyProgress() {
  const [user, setUser] = useState(null);
  const [selectedGender, setSelectedGender] = useState("female");

  const [bodyMetrics] = useState({
    peso: { actual: 65, inicial: 70, meta: 62 },
    grasaCorporal: { actual: 22, inicial: 28, meta: 18 },
    musculo: { actual: 48, inicial: 42, meta: 52 },
    imc: 23.1,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) window.location.href = "/";
    else setUser(JSON.parse(storedUser));
  }, []);

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Progreso Físico</h2>
        </header>

        <main className="dashboard-content">
          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {
                label: "Peso Actual",
                value: `${bodyMetrics.peso.actual} kg`,
                change: `-${bodyMetrics.peso.inicial - bodyMetrics.peso.actual} kg`,
                icon: <GiBodyHeight />,
              },
              {
                label: "Grasa Corporal",
                value: `${bodyMetrics.grasaCorporal.actual}%`,
                change: `-${bodyMetrics.grasaCorporal.inicial - bodyMetrics.grasaCorporal.actual}%`,
                icon: <FiActivity />,
              },
              {
                label: "Masa Muscular",
                value: `${bodyMetrics.musculo.actual}%`,
                change: `+${bodyMetrics.musculo.actual - bodyMetrics.musculo.inicial}%`,
                icon: <GiMuscleUp />,
              },
              {
                label: "IMC",
                value: bodyMetrics.imc,
                change: "Saludable",
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
            <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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

              {/* VISOR 3D - CORREGIDO */}
              <div
                style={{
                  // Se quitó el padding para maximizar espacio
                  // Se aumentó la altura a 600px (crítico para modelos verticales)
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

              {/* Áreas */}
              <div style={{ padding: "20px", borderTop: "1px solid var(--border-dark)" }}>
                <h4 style={{ marginBottom: "15px" }}>Áreas de Enfoque</h4>
                {[
                  { area: "Abdomen", progress: 65, color: "var(--accent-color)" },
                  { area: "Piernas", progress: 78, color: "var(--success-color)" },
                  { area: "Brazos", progress: 82, color: "var(--warning-color)" },
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
            <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="chart-header">
                <h3>Progreso Histórico</h3>
              </div>

              <div style={{ padding: "20px" }}>
                <div className="css-bar-chart" style={{ height: "200px" }}>
                  {["Ene", "Feb", "Mar", "Abr", "May", "Jun"].map((month, index) => {
                    const heights = [45, 52, 58, 65, 70, 78];
                    return (
                      <div key={month} className="bar-group">
                        <motion.div
                          className="bar income"
                          initial={{ height: 0 }}
                          animate={{ height: `${heights[index]}%` }}
                          transition={{ delay: index * 0.1 }}
                          style={{ backgroundColor: "var(--accent-color)" }}
                        >
                          <span className="tooltip">{heights[index]}%</span>
                        </motion.div>
                        <span className="bar-label">{month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}