import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCreditCard, FiCheck, FiAlertCircle } from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function UserMembershipRenewal() {
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/user/membership/plans", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Error al cargar planes");

      const data = await response.json();
      setPlans(data.planes);
      
      // Seleccionar plan mensual por defecto
      const monthlyPlan = data.planes.find(p => p.id === "monthly");
      if (monthlyPlan) {
        setSelectedPlan(monthlyPlan);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudieron cargar los planes");
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!selectedPlan) {
      setError("Por favor selecciona un plan");
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/user/membership/renew", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id_membresia: selectedPlan.id_membresia
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al renovar membresía");
      }

      const data = await response.json();
      setSuccessMessage(`¡Membresía renovada exitosamente! Tu ${selectedPlan.nombre} está activa hasta ${data.membresia.fechaFin}`);
      
      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        window.location.href = "/user-dashboard";
      }, 3000);
      
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="main-wrapper">
          <header className="top-header">
            <h2 className="page-title">Renovar Membresía</h2>
          </header>
          <main className="dashboard-content">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
              <p>Cargando planes...</p>
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
          <h2 className="page-title">Renovar Membresía</h2>
        </header>
        
        <main className="dashboard-content">
          {/* Mensajes */}
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

          {successMessage && (
            <div style={{ 
              padding: '15px', 
              background: 'rgba(76, 217, 100, 0.1)', 
              borderRadius: '8px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--success-color)'
            }}>
              <FiCheck />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Planes disponibles */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Planes Disponibles</h3>
            </div>
            
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {plans.map((plan, idx) => (
                <motion.div 
                  key={plan.id} 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: idx * 0.1 }} 
                  onClick={() => setSelectedPlan(plan)} 
                  style={{
                    padding: '25px',
                    background: selectedPlan?.id === plan.id ? 'linear-gradient(135deg, var(--accent-color)20, transparent)' : 'var(--bg-input-dark)',
                    border: selectedPlan?.id === plan.id ? '2px solid var(--accent-color)' : '2px solid var(--border-dark)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {selectedPlan?.id === plan.id && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '15px', 
                      right: '15px', 
                      background: 'var(--accent-color)', 
                      borderRadius: '50%', 
                      width: '28px', 
                      height: '28px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'var(--bg-dark)' 
                    }}>
                      <FiCheck />
                    </div>
                  )}
                  
                  <h3 style={{ marginBottom: '15px', fontSize: '22px' }}>{plan.nombre}</h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ fontSize: '36px', fontWeight: '700', color: 'var(--accent-color)' }}>
                      ${plan.precio.toLocaleString()}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}> MXN</span>
                  </div>
                  
                  {plan.ahorro > 0 && (
                    <div style={{ 
                      padding: '8px 12px', 
                      background: 'rgba(76, 217, 100, 0.15)', 
                      borderRadius: '6px', 
                      color: 'var(--success-color)', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      marginBottom: '15px' 
                    }}>
                      Ahorras ${plan.ahorro.toLocaleString()} MXN
                    </div>
                  )}
                  
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {["Acceso ilimitado", "Clases grupales", "Duchas y vestidores", "App móvil"].map((benefit, i) => (
                      <li key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        marginBottom: '10px', 
                        fontSize: '14px' 
                      }}>
                        <FiCheck style={{ color: 'var(--success-color)' }} />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Método de pago y confirmación */}
          <motion.div 
            className="chart-card" 
            style={{ marginTop: '25px' }} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chart-header">
              <h3>
                <FiCreditCard style={{ marginRight: 8 }} />
                Método de Pago
              </h3>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ 
                padding: '20px', 
                background: 'var(--bg-input-dark)', 
                borderRadius: '12px', 
                marginBottom: '20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <FiCreditCard style={{ marginRight: 8 }} />
                    <span style={{ fontWeight: '600' }}>Tarjeta guardada</span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    **** **** **** 4242
                  </div>
                </div>
                <button style={{ 
                  padding: '8px 16px', 
                  background: 'transparent', 
                  border: '1px solid var(--border-dark)', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}>
                  Cambiar
                </button>
              </div>
              
              <motion.button 
                whileHover={{ scale: processing ? 1 : 1.02 }} 
                whileTap={{ scale: processing ? 1 : 0.98 }} 
                onClick={handleRenew}
                disabled={processing || !selectedPlan}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: processing || !selectedPlan ? 'var(--border-dark)' : 'var(--accent-color)',
                  color: 'var(--bg-dark)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: processing || !selectedPlan ? 'not-allowed' : 'pointer',
                  opacity: processing || !selectedPlan ? 0.6 : 1
                }}
              >
                {processing ? (
                  "Procesando..."
                ) : selectedPlan ? (
                  `Renovar por $${selectedPlan.precio.toLocaleString()} MXN`
                ) : (
                  "Selecciona un plan"
                )}
              </motion.button>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}