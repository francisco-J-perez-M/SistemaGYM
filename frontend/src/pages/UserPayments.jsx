import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiDollarSign, 
  FiCheckCircle,
  FiDownload,
  FiCreditCard,
  FiCalendar,
  FiFilter,
  FiSearch,
  FiAlertCircle
} from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function UserPaymentsHistory() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("payments");
  const [filterYear, setFilterYear] = useState("2024");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [paymentsData] = useState({
    totalPaid: 2850,
    lastPayment: "15 Ene 2024",
    nextPayment: "15 Feb 2024",
    status: "Al día"
  });

  const [payments] = useState([
    { 
      id: "PAY-001", 
      date: "15 Ene 2024", 
      concept: "Membresía Premium - Mensual", 
      amount: 950,
      method: "Tarjeta **** 4242",
      status: "Completado"
    },
    { 
      id: "PAY-002", 
      date: "15 Dic 2023", 
      concept: "Membresía Premium - Mensual", 
      amount: 950,
      method: "Tarjeta **** 4242",
      status: "Completado"
    },
    { 
      id: "PAY-003", 
      date: "15 Nov 2023", 
      concept: "Membresía Premium - Mensual", 
      amount: 950,
      method: "Efectivo",
      status: "Completado"
    }
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

  const filteredPayments = payments.filter(p => 
    p.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Historial de Pagos</h2>
        </header>
        <main className="dashboard-content">
          <div className="kpi-grid">
            <div className="stat-card highlight-border">
              <div className="stat-header">
                <h3><FiDollarSign style={{ marginRight: 8 }} />Total Pagado</h3>
              </div>
              <div className="stat-value">${paymentsData.totalPaid.toLocaleString()}</div>
            </div>
          </div>
          <div className="table-section" style={{ marginTop: '25px' }}>
            <div style={{ padding: '20px' }}>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-input-dark)',
                  border: '1px solid var(--border-dark)',
                  borderRadius: '8px'
                }}
              />
            </div>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.date}</td>
                    <td>{p.concept}</td>
                    <td>${p.amount}</td>
                    <td>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}