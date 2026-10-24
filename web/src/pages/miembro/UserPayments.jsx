import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { reconciliarSilencioso } from "../../api/pagosOnline";
import { 
  FiDollarSign, 
  FiCheckCircle,
  FiDownload,
  FiSearch,
  FiAlertCircle,
  FiCalendar
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

export default function UserPaymentsHistory() {
  const navigate = useNavigate();
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
      navigate("/", { replace: true });
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
      // Confirma los pagos en línea pendientes para que aparezcan en el historial
      await reconciliarSilencioso();
      const token = localStorage.getItem("token");

      const response = await fetch("/api/user/payments", {
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
    const userData = user || JSON.parse(localStorage.getItem("user") || "{}");
    const gymName  = userData.gym_name || userData.nombre_gimnasio || "GymPro";
    const member   = userData.nombre   || userData.name            || "Miembro";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Recibo ${payment.id}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;padding:40px 24px}
  .page{max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#4f46e5,#6366f1);padding:36px 32px;color:#fff;text-align:center}
  .header h1{font-size:28px;font-weight:800;margin-bottom:4px}
  .header p{font-size:13px;opacity:.8}
  .badge{display:inline-block;background:rgba(255,255,255,.2);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;margin-top:8px}
  .body{padding:32px}
  .receipt-id{font-size:13px;color:#64748b;margin-bottom:24px;text-align:center}
  .receipt-id span{font-weight:700;color:#4f46e5}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}
  .info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px}
  .info-box label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px}
  .info-box value{font-size:14px;font-weight:600;color:#1e293b}
  .divider{border:none;border-top:1px solid #e2e8f0;margin:20px 0}
  .total-row{display:flex;justify-content:space-between;align-items:center}
  .total-row .label{font-size:13px;color:#64748b}
  .total-row .val{font-size:14px;font-weight:600;color:#1e293b}
  .total-row.big .label{font-size:16px;font-weight:700;color:#1e293b}
  .total-row.big .val{font-size:28px;font-weight:800;color:#4f46e5}
  .status-pill{display:inline-flex;align-items:center;gap:6px;background:#dcfce7;color:#16a34a;border-radius:20px;padding:6px 16px;font-size:13px;font-weight:700;margin-top:24px}
  .footer{padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8}
  @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>${gymName}</h1>
    <p>Comprobante de Pago</p>
    <div class="badge">Recibo Oficial</div>
  </div>
  <div class="body">
    <div class="receipt-id">ID de transacción: <span>${payment.id}</span></div>
    <div class="info-grid">
      <div class="info-box"><label>Miembro</label><value>${member}</value></div>
      <div class="info-box"><label>Fecha de pago</label><value>${payment.date}</value></div>
      <div class="info-box"><label>Concepto</label><value>${payment.concept}</value></div>
      <div class="info-box"><label>Método</label><value>${payment.method}</value></div>
    </div>
    <hr class="divider"/>
    <div class="total-row" style="margin-bottom:12px">
      <span class="label">Subtotal</span>
      <span class="val">$${payment.amount.toLocaleString("es-MX")} MXN</span>
    </div>
    <div class="total-row" style="margin-bottom:8px">
      <span class="label">Descuento</span>
      <span class="val">$0.00 MXN</span>
    </div>
    <hr class="divider"/>
    <div class="total-row big">
      <span class="label">Total</span>
      <span class="val">$${payment.amount.toLocaleString("es-MX")} MXN</span>
    </div>
    <div style="text-align:center">
      <div class="status-pill">✓ Pago Completado</div>
    </div>
  </div>
  <div class="footer">
    Generado el ${new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"})}
    &nbsp;·&nbsp; ${gymName} &nbsp;·&nbsp; Gracias por tu preferencia
  </div>
</div>
<script>setTimeout(()=>window.print(),400)</script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
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
              <span style={{ fontSize: "0.85em", color: "var(--text-secondary)" }}>
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
                        <td style={{ fontWeight: '600', color: 'var(--accent)' }}>
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