import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiHeart, FiAlertCircle, FiCheckCircle, FiActivity } from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function UserHealth() {
  const [user, setUser] = useState(null);
  const [healthData, setHealthData] = useState({
    condiciones: [],
    alergias: [],
    medicamentos: [],
    lesiones: [],
    ultimaActualizacion: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/user/health", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Error al cargar datos de salud");

      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudieron cargar los datos de salud");
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName) => {
    const icons = {
      FiHeart: <FiHeart />,
      FiActivity: <FiActivity />,
      FiCheckCircle: <FiCheckCircle />,
      FiAlertCircle: <FiAlertCircle />
    };
    return icons[iconName] || <FiActivity />;
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="main-wrapper">
          <header className="top-header">
            <h2 className="page-title">Salud y Bienestar</h2>
          </header>
          <main className="dashboard-content">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
              <p>Cargando datos de salud...</p>
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
          <h2 className="page-title">Salud y Bienestar</h2>
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

          {/* KPIs de condiciones */}
          <div className="kpi-grid">
            {healthData.condiciones.map((cond, idx) => (
              <motion.div 
                key={idx} 
                className="stat-card" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: idx * 0.1 }}
              >
                <div className="stat-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getIconComponent(cond.icon)}
                    {cond.nombre}
                  </h3>
                  <span className={`trend ${cond.estado === 'normal' ? 'positive' : 'negative'}`}>
                    <FiCheckCircle style={{ marginRight: 4 }} />
                    {cond.estado}
                  </span>
                </div>
                <div className="stat-value">{cond.valor}</div>
              </motion.div>
            ))}
          </div>

          <div className="charts-row" style={{ marginTop: '25px' }}>
            {/* Condiciones médicas */}
            <motion.div 
              className="chart-card" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
            >
              <div className="chart-header">
                <h3>
                  <FiAlertCircle style={{ marginRight: 8 }} />
                  Condiciones Médicas
                </h3>
              </div>
              <div style={{ padding: '20px' }}>
                {/* Alergias */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Alergias
                  </h4>
                  {healthData.alergias && healthData.alergias.length > 0 && healthData.alergias[0] !== "Ninguna" ? (
                    <div style={{ padding: '15px', background: 'var(--bg-input-dark)', borderRadius: '8px' }}>
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

                {/* Medicamentos */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Medicamentos
                  </h4>
                  {healthData.medicamentos && healthData.medicamentos.length > 0 && healthData.medicamentos[0] !== "Ninguno" ? (
                    <div style={{ padding: '15px', background: 'var(--bg-input-dark)', borderRadius: '8px' }}>
                      {healthData.medicamentos.map((med, idx) => (
                        <div key={idx} style={{ padding: '8px', background: 'var(--bg-dark)', borderRadius: '6px', marginBottom: '8px' }}>
                          {med}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '15px', background: 'rgba(76, 217, 100, 0.1)', borderRadius: '8px', color: 'var(--success-color)' }}>
                      <FiCheckCircle style={{ marginRight: 8 }} />
                      Sin medicamentos registrados
                    </div>
                  )}
                </div>

                {/* Lesiones */}
                {healthData.lesiones && healthData.lesiones.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Lesiones
                    </h4>
                    <div style={{ padding: '15px', background: 'var(--bg-input-dark)', borderRadius: '8px' }}>
                      {healthData.lesiones.map((lesion, idx) => (
                        <div key={idx} style={{ padding: '8px', background: 'var(--bg-dark)', borderRadius: '6px', marginBottom: '8px' }}>
                          {lesion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recomendaciones */}
            <motion.div 
              className="chart-card" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
            >
              <div className="chart-header">
                <h3>Recomendaciones</h3>
              </div>
              <div style={{ padding: '20px' }}>
                {[
                  { text: "Mantener hidratación adecuada", icon: <FiHeart /> },
                  { text: "Descanso de 7-8 horas diarias", icon: <FiActivity /> },
                  { text: "Chequeo médico anual", icon: <FiCheckCircle /> }
                ].map((rec, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.1 }} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '15px', 
                      background: 'var(--bg-input-dark)', 
                      borderRadius: '8px', 
                      marginBottom: '10px' 
                    }}
                  >
                    <div style={{ color: 'var(--accent-color)' }}>{rec.icon}</div>
                    <span>{rec.text}</span>
                  </motion.div>
                ))}
              </div>
              
              {healthData.ultimaActualizacion && (
                <div style={{ 
                  padding: '15px', 
                  borderTop: '1px solid var(--border-dark)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)'
                }}>
                  Última actualización: {new Date(healthData.ultimaActualizacion).toLocaleDateString()}
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}