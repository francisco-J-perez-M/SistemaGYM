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

  // Estados de Paginación (Copiado de RestoreDashboard)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchPayments();
  }, []);

  // Resetear a página 1 cuando se busca algo
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
    alert(`Descargando recibo ${payment.id}...`);
  };

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="main-wrapper">
          <header className="top-header">
            <h2 className="page-title">Historial de Pagos</h2>
          </header>
          <main className="dashboard-content">
            <div className="loading-spinner">
                <div className="dashboard-spinner"></div>
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

          {/* KPIs (Mantenemos tu diseño original que ya se veía bien) */}
          <div className="kpi-grid">
            <motion.div 
              className="stat-card highlight-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="stat-header">
                <h3><FiDollarSign style={{ marginRight: 8 }} /> Total Pagado</h3>
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
                <h3><FiCalendar style={{ marginRight: 8 }} /> Último Pago</h3>
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
                <h3><FiCheckCircle style={{ marginRight: 8 }} /> Estado</h3>
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
                <h3><FiCalendar style={{ marginRight: 8 }} /> Próximo Pago</h3>
              </div>
              <div className="stat-value" style={{ fontSize: '22px' }}>
                {paymentsData.nextPayment}
              </div>
            </motion.div>
          </div>

          {/* TABLA CON NUEVO DISEÑO */}
          <motion.div 
            className="table-section" 
            style={{ marginTop: '25px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Header de la sección y Paginación Info */}
            <div className="section-header" style={{ marginBottom: '15px' }}>
              <h3>Detalle de Transacciones</h3>
              <span style={{ fontSize: "0.85em", color: "#666" }}>
                Página {currentPage} de {totalPages || 1}
              </span>
            </div>

            {/* Barra de Búsqueda Integrada */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
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
                    padding: '10px 10px 10px 35px',
                    background: 'var(--bg-input-dark)',
                    border: '1px solid var(--border-dark)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)'
                  }}
                />
            </div>

            <div className="custom-table-container">
              <table className="admin-table">
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
                  {filteredPayments.length === 0 ? (
                     <tr>
                       <td colSpan="7" className="text-center" style={{padding: '30px', color: 'var(--text-secondary)'}}>
                         <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}>
                            <FiAlertCircle size={24} style={{ opacity: 0.5 }} />
                            No se encontraron pagos
                         </div>
                       </td>
                     </tr>
                  ) : (
                    currentPayments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: '600', color: 'var(--accent-color)' }}>
                            {p.id}
                        </td>
                        <td>{p.date}</td>
                        <td style={{ color: 'var(--text-primary)' }}>{p.concept}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>{p.method}</td>
                        <td style={{ fontWeight: '600' }}>
                          ${p.amount.toLocaleString()} MXN
                        </td>
                        <td>
                          {/* Mapeo del estilo status-badge */}
                          <span className={`status-badge ${p.status === 'Pagado' || p.status === 'Completado' ? 'success' : 'normal'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-download"
                            onClick={() => downloadReceipt(p)}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                          >
                            <FiDownload size={14} /> Recibo
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Controles de Paginación */}
            {filteredPayments.length > itemsPerPage && (
              <div className="pagination-controls">
                <button
                  className="btn-download"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  Anterior
                </button>
                <span className="page-info">Página {currentPage}</span>
                <button
                  className="btn-download"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}