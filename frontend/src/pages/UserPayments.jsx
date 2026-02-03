import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiDollarSign, 
  FiCheckCircle,
  FiDownload,
  FiSearch,
  FiAlertCircle,
  FiCalendar
} from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function UserPaymentsHistory() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentsData, setPaymentsData] = useState({
    totalPaid: 0,
    lastPayment: "N/A",
    nextPayment: "N/A",
    status: "Cargando..."
  });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/user/payments", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Error al cargar pagos");

      const data = await response.json();
      setPaymentsData(data.stats);
      setPayments(data.payments);
      setError(null);
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudieron cargar los pagos");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadReceipt = (payment) => {
    // Simular descarga de recibo
    alert(`Descargando recibo ${payment.id}...`);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="main-wrapper">
          <header className="top-header">
            <h2 className="page-title">Historial de Pagos</h2>
          </header>
          <main className="dashboard-content">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
              <p>Cargando historial...</p>
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
          <h2 className="page-title">Historial de Pagos</h2>
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
            <motion.div 
              className="stat-card highlight-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="stat-header">
                <h3>
                  <FiDollarSign style={{ marginRight: 8 }} />
                  Total Pagado
                </h3>
              </div>
              <div className="stat-value">
                ${paymentsData.totalPaid.toLocaleString()} MXN
              </div>
            </motion.div>

            <motion.div 
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="stat-header">
                <h3>
                  <FiCalendar style={{ marginRight: 8 }} />
                  Último Pago
                </h3>
              </div>
              <div className="stat-value" style={{ fontSize: '22px' }}>
                {paymentsData.lastPayment}
              </div>
            </motion.div>

            <motion.div 
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="stat-header">
                <h3>
                  <FiCheckCircle style={{ marginRight: 8 }} />
                  Estado
                </h3>
              </div>
              <div className="stat-value" style={{ fontSize: '22px', color: 'var(--success-color)' }}>
                {paymentsData.status}
              </div>
            </motion.div>

            <motion.div 
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="stat-header">
                <h3>
                  <FiCalendar style={{ marginRight: 8 }} />
                  Próximo Pago
                </h3>
              </div>
              <div className="stat-value" style={{ fontSize: '22px' }}>
                {paymentsData.nextPayment}
              </div>
            </motion.div>
          </div>

          {/* Tabla de pagos */}
          <motion.div 
            className="table-section" 
            style={{ marginTop: '25px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-dark)' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)'
                }} />
                <input
                  type="text"
                  placeholder="Buscar por concepto o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: 'var(--bg-input-dark)',
                    border: '1px solid var(--border-dark)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: 'var(--text-secondary)'
              }}>
                <FiAlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>No se encontraron pagos</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th>Método</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p, idx) => (
                      <motion.tr 
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <td>
                          <span style={{ 
                            fontFamily: 'monospace', 
                            color: 'var(--accent-color)',
                            fontWeight: '600'
                          }}>
                            {p.id}
                          </span>
                        </td>
                        <td>{p.date}</td>
                        <td>{p.concept}</td>
                        <td>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {p.method}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>
                            ${p.amount.toLocaleString()} MXN
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 12px',
                            background: 'rgba(76, 217, 100, 0.15)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: 'var(--success-color)',
                            fontWeight: '600'
                          }}>
                            <FiCheckCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => downloadReceipt(p)}
                            style={{
                              padding: '6px 12px',
                              background: 'transparent',
                              border: '1px solid var(--border-dark)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: 'var(--text-primary)',
                              fontSize: '13px'
                            }}
                          >
                            <FiDownload size={14} />
                            Recibo
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}