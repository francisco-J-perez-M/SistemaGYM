import { useState, useEffect } from "react";
import { motion } from "framer-motion";
// Agregamos FiMaximize2 para la estatura
import { FiHeart, FiAlertCircle, FiCheckCircle, FiActivity, FiTrendingUp, FiEdit2, FiMaximize2 } from "react-icons/fi";
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
      FiAlertCircle: <FiAlertCircle />,
      FiCircle: <FiActivity />,
      FiTrendingUp: <FiTrendingUp />,
      FiMaximize2: <FiMaximize2 /> // Nuevo ícono para estatura
    };
    return icons[iconName] || <FiActivity />;
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'normal': 'var(--success-color)',
      'bajo': 'var(--warning-color)',
      'alto': 'var(--warning-color)',
      'muy_alto': 'var(--error-color)',
      'sin_datos': 'var(--text-secondary)'
    };
    return colores[estado] || 'var(--text-secondary)';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'normal': 'Normal',
      'bajo': 'Bajo',
      'alto': 'Alto',
      'muy_alto': 'Muy Alto',
      'sin_datos': 'Sin datos'
    };
    return textos[estado] || estado;
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

  const sinDatos = !healthData.condiciones || healthData.condiciones.length === 0 || 
                   (healthData.condiciones.length === 1 && healthData.condiciones[0].estado === 'sin_datos');

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Salud y Bienestar</h2>
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/user-health-update'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--accent-color)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--bg-dark)',
              fontWeight: '600'
            }}
          >
            <FiEdit2 />
            Actualizar Datos
          </button>
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

          {sinDatos && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                padding: '30px', 
                background: 'var(--bg-input-dark)', 
                borderRadius: '12px', 
                marginBottom: '20px',
                textAlign: 'center'
              }}
            >
              <FiAlertCircle size={48} style={{ color: 'var(--text-secondary)', marginBottom: '15px' }} />
              <h3 style={{ marginBottom: '10px' }}>No hay datos de salud registrados</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Comienza a registrar tu progreso físico para ver tus estadísticas de salud
              </p>
              <button 
                onClick={() => window.location.href = '/user-health-update'}
                style={{
                  padding: '12px 24px',
                  background: 'var(--accent-color)',
                  color: 'var(--bg-dark)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Registrar primer dato
              </button>
            </motion.div>
          )}

          {!sinDatos && (
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
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      {getIconComponent(cond.icon)}
                      {cond.nombre}
                    </h3>
                    <span 
                      className="trend"
                      style={{ 
                        color: getEstadoColor(cond.estado),
                        background: `${getEstadoColor(cond.estado)}20`,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {getEstadoTexto(cond.estado)}
                    </span>
                  </div>
                  <div className="stat-value" style={{ fontSize: '28px' }}>{cond.valor}</div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="charts-row" style={{ marginTop: '25px' }}>
            {/* ... Resto del componente (Información Médica, Recomendaciones) igual que antes ... */}
             <motion.div 
              className="chart-card" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
            >
              <div className="chart-header">
                <h3>
                  <FiAlertCircle style={{ marginRight: 8 }} />
                  Información Médica
                </h3>
              </div>
              <div style={{ padding: '20px' }}>
                {/* Alergias */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Alergias
                  </h4>
                  {healthData.alergias && healthData.alergias.length > 0 ? (
                    <div style={{ padding: '15px', background: 'var(--bg-input-dark)', borderRadius: '8px' }}>
                      {healthData.alergias.map((alergia, idx) => (
                        <div key={idx} style={{ 
                          padding: '8px', 
                          background: 'var(--bg-dark)', 
                          borderRadius: '6px', 
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <FiAlertCircle size={16} style={{ color: 'var(--warning-color)' }} />
                          {alergia}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '15px', 
                      background: 'rgba(76, 217, 100, 0.1)', 
                      borderRadius: '8px', 
                      color: 'var(--success-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FiCheckCircle />
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

                {/* Notas */}
                {healthData.notas && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Notas del último registro
                    </h4>
                    <div style={{ 
                      padding: '15px', 
                      background: 'var(--bg-input-dark)', 
                      borderRadius: '8px',
                      fontStyle: 'italic',
                      color: 'var(--text-secondary)'
                    }}>
                      {healthData.notas}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recomendaciones (Igual que antes) */}
            <motion.div 
              className="chart-card" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
            >
               {/* ... Código de recomendaciones ... */}
               <div className="chart-header">
                <h3>
                  <FiHeart style={{ marginRight: 8 }} />
                  Recomendaciones de Salud
                </h3>
              </div>
              <div style={{ padding: '20px' }}>
                {[
                  { text: "Mantener hidratación adecuada", icon: <FiHeart /> },
                  { text: "Descanso de 7-8 horas diarias", icon: <FiActivity /> },
                  { text: "Chequeo médico anual", icon: <FiCheckCircle /> }
                  // ... Resto de items ...
                ].map((rec, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.1 }} 
                    style={{ 
                      padding: '15px', 
                      background: 'var(--bg-input-dark)', 
                      borderRadius: '8px', 
                      marginBottom: '10px' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ 
                        color: 'var(--accent-color)',
                        background: 'rgba(var(--accent-color-rgb), 0.1)',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex'
                      }}>
                        {rec.icon}
                      </div>
                      <span style={{ fontWeight: '600' }}>{rec.text}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '44px' }}>
                      {rec.desc}
                    </p>
                  </motion.div>
                ))}
              </div>

              {healthData.ultimaActualizacion && (
                <div style={{ 
                  padding: '15px', 
                  borderTop: '1px solid var(--border-dark)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FiActivity size={14} />
                  Última actualización: {new Date(healthData.ultimaActualizacion).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}