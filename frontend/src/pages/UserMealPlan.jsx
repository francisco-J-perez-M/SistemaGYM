import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { FiHeart, FiAlertCircle, FiCheckCircle, FiActivity } from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function UserHealth() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("health");
  const [healthData] = useState({
    condiciones: [
      { nombre: "Presión Arterial", valor: "120/80", estado: "normal", icon: <FiHeart /> },
      { nombre: "Glucosa", valor: "95 mg/dL", estado: "normal", icon: <FiActivity /> },
      { nombre: "Colesterol", valor: "180 mg/dL", estado: "normal", icon: <FiCheckCircle /> }
    ],
    alergias: ["Ninguna"],
    medicamentos: ["Ninguno"],
    lesiones: []
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) window.location.href = "/";
    else setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Salud y Bienestar</h2>
        </header>
        <main className="dashboard-content">
          <div className="kpi-grid">
            {healthData.condiciones.map((cond, idx) => (
              <motion.div key={idx} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <div className="stat-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {cond.icon}
                    {cond.nombre}
                  </h3>
                  <span className="trend positive">
                    <FiCheckCircle style={{ marginRight: 4 }} />
                    {cond.estado}
                  </span>
                </div>
                <div className="stat-value">{cond.valor}</div>
              </motion.div>
            ))}
          </div>
          <div className="charts-row" style={{ marginTop: '25px' }}>
            <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="chart-header">
                <h3><FiAlertCircle style={{ marginRight: 8 }} />Condiciones Médicas</h3>
              </div>
              <div style={{ padding: '20px' }}>
                {healthData.alergias.length > 0 ? (
                  <div style={{ padding: '15px', background: 'var(--bg-input-dark)', borderRadius: '8px', marginBottom: '15px' }}>
                    <h4 style={{ marginBottom: '10px' }}>Alergias</h4>
                    {healthData.alergias.map((alergia, idx) => (
                      <div key={idx} style={{ padding: '8px', background: 'var(--bg-dark)', borderRadius: '6px', marginBottom: '8px' }}>
                        {alergia}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '15px', background: 'rgba(76, 217, 100, 0.1)', borderRadius: '8px', color: 'var(--success-color)' }}>
                    <FiCheckCircle style={{ marginRight: 8 }} />
                    Sin alergias registradas
                  </div>
                )}
              </div>
            </motion.div>
            <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="chart-header">
                <h3>Recomendaciones</h3>
              </div>
              <div style={{ padding: '20px' }}>
                {[
                  { text: "Mantener hidratación adecuada", icon: <FiHeart /> },
                  { text: "Descanso de 7-8 horas diarias", icon: <FiActivity /> },
                  { text: "Chequeo médico anual", icon: <FiCheckCircle /> }
                ].map((rec, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'var(--bg-input-dark)', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ color: 'var(--accent-color)' }}>{rec.icon}</div>
                    <span>{rec.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}