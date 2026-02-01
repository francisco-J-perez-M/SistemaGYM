import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCreditCard, FiCheck } from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function UserMembershipRenewal() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("renew");
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [plans] = useState([
    { id: "monthly", nombre: "Mensual", precio: 950, ahorro: 0 },
    { id: "quarterly", nombre: "Trimestral", precio: 2550, ahorro: 300 },
    { id: "annual", nombre: "Anual", precio: 9000, ahorro: 2400 }
  ]);

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
          <h2 className="page-title">Renovar Membresía</h2>
        </header>
        <main className="dashboard-content">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Planes Disponibles</h3>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {plans.map((plan, idx) => (
                <motion.div key={plan.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} onClick={() => setSelectedPlan(plan.id)} style={{
                  padding: '25px',
                  background: selectedPlan === plan.id ? 'linear-gradient(135deg, var(--accent-color)20, transparent)' : 'var(--bg-input-dark)',
                  border: selectedPlan === plan.id ? '2px solid var(--accent-color)' : '2px solid var(--border-dark)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  {selectedPlan === plan.id && (
                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--accent-color)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-dark)' }}>
                      <FiCheck />
                    </div>
                  )}
                  <h3 style={{ marginBottom: '15px', fontSize: '22px' }}>{plan.nombre}</h3>
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ fontSize: '36px', fontWeight: '700', color: 'var(--accent-color)' }}>${plan.precio}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}> MXN</span>
                  </div>
                  {plan.ahorro > 0 && (
                    <div style={{ padding: '8px 12px', background: 'rgba(76, 217, 100, 0.15)', borderRadius: '6px', color: 'var(--success-color)', fontSize: '13px', fontWeight: '600', marginBottom: '15px' }}>
                      Ahorras ${plan.ahorro} MXN
                    </div>
                  )}
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {["Acceso ilimitado", "Clases grupales", "Duchas y vestidores", "App móvil"].map((benefit, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '14px' }}>
                        <FiCheck style={{ color: 'var(--success-color)' }} />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div className="chart-card" style={{ marginTop: '25px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="chart-header">
              <h3><FiCreditCard style={{ marginRight: 8 }} />Método de Pago</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ padding: '20px', background: 'var(--bg-input-dark)', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <FiCreditCard style={{ marginRight: 8 }} />
                    <span style={{ fontWeight: '600' }}>Tarjeta guardada</span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>**** **** **** 4242</div>
                </div>
                <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-dark)', borderRadius: '8px', cursor: 'pointer' }}>
                  Cambiar
                </button>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{
                width: '100%',
                padding: '16px',
                background: 'var(--accent-color)',
                color: 'var(--bg-dark)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer'
              }}>
                Renovar por ${plans.find(p => p.id === selectedPlan)?.precio} MXN
              </motion.button>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}