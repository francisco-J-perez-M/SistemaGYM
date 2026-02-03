import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCreditCard, FiCheck, FiAlertCircle, FiDollarSign } from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function UserMembershipRenewal() {
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Tarjeta");
  const [plans, setPlans] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
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
    fetchPaymentMethods();
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

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/user/membership/payment-methods", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.metodos || []);
        
        // Seleccionar el método principal por defecto
        const metodoPrincipal = data.metodos.find(m => m.principal);
        if (metodoPrincipal) {
          setSelectedPaymentMethod(metodoPrincipal.tipo);
        }
      }
    } catch (err) {
      console.error("Error al cargar métodos de pago:", err);
      // No es crítico, continuar con métodos por defecto
    }
  };

  const handleRenew = async () => {
    if (!selectedPlan) {
      setError("Por favor selecciona un plan");
      return;
    }

    if (!selectedPaymentMethod) {
      setError("Por favor selecciona un método de pago");
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
          id_membresia: selectedPlan.id_membresia,
          metodo_pago: selectedPaymentMethod
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al renovar membresía");
      }

      const data = await response.json();
      setSuccessMessage(`¡Membresía renovada exitosamente! Tu ${selectedPlan.nombre} está activa hasta ${new Date(data.membresia.fechaFin).toLocaleDateString('es-MX')}`);
      
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

  const metodosDisponibles = [
    { id: "Efectivo", nombre: "Efectivo", icono: <FiDollarSign />, desc: "Pago en caja" },
    { id: "Tarjeta", nombre: "Tarjeta", icono: <FiCreditCard />, desc: "Débito o crédito" },
    { id: "Transferencia", nombre: "Transferencia", icono: <FiDollarSign />, desc: "Transferencia bancaria" }
  ];

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
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                padding: '15px', 
                background: 'rgba(255, 59, 48, 0.1)', 
                borderRadius: '8px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--error-color)',
                border: '1px solid rgba(255, 59, 48, 0.3)'
              }}
            >
              <FiAlertCircle />
              <span>{error}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                padding: '15px', 
                background: 'rgba(76, 217, 100, 0.1)', 
                borderRadius: '8px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--success-color)',
                border: '1px solid rgba(76, 217, 100, 0.3)'
              }}
            >
              <FiCheck />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* Planes disponibles */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Selecciona tu Plan</h3>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Elige el plan que mejor se adapte a tus necesidades
              </span>
            </div>
            
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {plans.map((plan, idx) => (
                <motion.div 
                  key={plan.id} 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: idx * 0.1 }} 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedPlan(plan)} 
                  style={{
                    padding: '25px',
                    background: selectedPlan?.id === plan.id ? 'linear-gradient(135deg, rgba(255, 159, 10, 0.1), transparent)' : 'var(--bg-input-dark)',
                    border: selectedPlan?.id === plan.id ? '2px solid var(--accent-color)' : '2px solid var(--border-dark)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {selectedPlan?.id === plan.id && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ 
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
                      }}
                    >
                      <FiCheck />
                    </motion.div>
                  )}
                  
                  <h3 style={{ marginBottom: '15px', fontSize: '22px' }}>{plan.nombre}</h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ fontSize: '36px', fontWeight: '700', color: 'var(--accent-color)' }}>
                      ${plan.precio.toLocaleString()}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}> MXN</span>
                  </div>
                  
                  <div style={{ 
                    padding: '8px 12px', 
                    background: 'rgba(255, 159, 10, 0.1)', 
                    borderRadius: '6px', 
                    color: 'var(--text-secondary)', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    marginBottom: '15px' 
                  }}>
                    Duración: {plan.duracion_meses} {plan.duracion_meses === 1 ? 'mes' : 'meses'}
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
                    {["Acceso ilimitado al gimnasio", "Clases grupales incluidas", "Duchas y vestidores", "App móvil incluida"].map((benefit, i) => (
                      <li key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        marginBottom: '10px', 
                        fontSize: '14px' 
                      }}>
                        <FiCheck style={{ color: 'var(--success-color)', flexShrink: 0 }} />
                        <span>{benefit}</span>
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
              {/* Métodos de pago disponibles */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '15px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Selecciona cómo deseas pagar
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {metodosDisponibles.map((metodo) => (
                    <motion.div
                      key={metodo.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedPaymentMethod(metodo.id)}
                      style={{
                        padding: '20px',
                        background: selectedPaymentMethod === metodo.id ? 'linear-gradient(135deg, rgba(255, 159, 10, 0.1), transparent)' : 'var(--bg-input-dark)',
                        border: selectedPaymentMethod === metodo.id ? '2px solid var(--accent-color)' : '2px solid var(--border-dark)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {selectedPaymentMethod === metodo.id && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '10px', 
                          right: '10px', 
                          background: 'var(--accent-color)', 
                          borderRadius: '50%', 
                          width: '24px', 
                          height: '24px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'var(--bg-dark)' 
                        }}>
                          <FiCheck size={14} />
                        </div>
                      )}
                      
                      <div style={{ 
                        fontSize: '24px', 
                        marginBottom: '10px',
                        color: selectedPaymentMethod === metodo.id ? 'var(--accent-color)' : 'var(--text-secondary)'
                      }}>
                        {metodo.icono}
                      </div>
                      <div style={{ fontWeight: '600', marginBottom: '5px' }}>{metodo.nombre}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{metodo.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              {selectedPlan && (
                <div style={{ 
                  padding: '20px', 
                  background: 'var(--bg-input-dark)', 
                  borderRadius: '12px', 
                  marginBottom: '20px'
                }}>
                  <h4 style={{ marginBottom: '15px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Resumen de tu compra
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Plan:</span>
                    <span style={{ fontWeight: '600' }}>{selectedPlan.nombre}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Método de pago:</span>
                    <span style={{ fontWeight: '600' }}>{selectedPaymentMethod}</span>
                  </div>
                  <div style={{ 
                    borderTop: '1px solid var(--border-dark)', 
                    paddingTop: '10px', 
                    marginTop: '10px',
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '18px',
                    fontWeight: '700'
                  }}>
                    <span>Total:</span>
                    <span style={{ color: 'var(--accent-color)' }}>
                      ${selectedPlan.precio.toLocaleString()} MXN
                    </span>
                  </div>
                </div>
              )}
              
              {/* Botón de confirmación */}
              <motion.button 
                whileHover={{ scale: processing ? 1 : 1.02 }} 
                whileTap={{ scale: processing ? 1 : 0.98 }} 
                onClick={handleRenew}
                disabled={processing || !selectedPlan || !selectedPaymentMethod}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: processing || !selectedPlan || !selectedPaymentMethod ? 'var(--border-dark)' : 'var(--accent-color)',
                  color: 'var(--bg-dark)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: processing || !selectedPlan || !selectedPaymentMethod ? 'not-allowed' : 'pointer',
                  opacity: processing || !selectedPlan || !selectedPaymentMethod ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {processing ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                    Procesando pago...
                  </>
                ) : selectedPlan && selectedPaymentMethod ? (
                  <>
                    <FiCheck />
                    Confirmar y pagar ${selectedPlan.precio.toLocaleString()} MXN
                  </>
                ) : (
                  "Selecciona un plan y método de pago"
                )}
              </motion.button>

              <p style={{ 
                marginTop: '15px', 
                fontSize: '13px', 
                color: 'var(--text-secondary)', 
                textAlign: 'center' 
              }}>
                Al confirmar, aceptas los términos y condiciones del gimnasio
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}