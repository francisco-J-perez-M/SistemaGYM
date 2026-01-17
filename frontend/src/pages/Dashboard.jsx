import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../css/Dashboard.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  
  // Datos simulados para la vista administrativa
  const [adminData, setAdminData] = useState({
    retention: 87, // %
    churn: 13, // %
    activeMembers: 1250,
    monthlyRevenue: 24500, // USD
    expiringMembers: [
      { id: 1, name: "Ana López", plan: "Anual", expires: "2023-11-05", status: "urgent" },
      { id: 2, name: "Carlos Ruiz", plan: "Mensual", expires: "2023-11-07", status: "warning" },
      { id: 3, name: "Sofía M.", plan: "Trimestral", expires: "2023-11-10", status: "warning" },
      { id: 4, name: "Jorge Vega", plan: "Mensual", expires: "2023-11-12", status: "normal" },
    ],
    // Datos simulados para gráficas (valores 0-100 para altura en %)
    kpiRevenue: [40, 55, 45, 70, 60, 85], 
    kpiExpenses: [20, 25, 22, 30, 28, 35],
    peakHours: [10, 30, 80, 50, 20, 40, 90, 100, 60, 20] // 6am a 10pm
  });

  useEffect(() => {
    // Simular carga
    setTimeout(() => setLoading(false), 800);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <Sidebar 
        role="admin" 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* CONTENIDO PRINCIPAL */}
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Panel Administrativo</h2>
          <div className="header-right">
            <div className="date-display">
              Octubre 2023
            </div>
            <div className="user-profile">
              <div className="avatar">RG</div>
              <div className="user-info">
                <span className="name">Roberto G.</span>
                <span className="role">Administrador</span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Cargando datos...</p>
            </div>
          ) : (
            <>
              {/* KPIs Rápidos */}
              <div className="kpi-grid">
                {/* KPI Retención */}
                <div className="stat-card">
                  <div className="stat-header">
                    <h3>Retención de Clientes</h3>
                    <span className="trend positive">+2.4%</span>
                  </div>
                  <div className="retention-chart">
                    <div className="circular-progress" style={{background: `conic-gradient(var(--accent-color) ${adminData.retention * 3.6}deg, var(--bg-main-dark) 0deg)`}}>
                      <div className="inner-circle">
                        <span className="percentage">{adminData.retention}%</span>
                      </div>
                    </div>
                    <div className="retention-legend">
                      <p><span className="dot active"></span> Renuevan</p>
                      <p><span className="dot inactive"></span> Se van ({adminData.churn}%)</p>
                    </div>
                  </div>
                </div>

                {/* KPI Ingresos Totales */}
                <div className="stat-card">
                  <div className="card-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <h3>Ingresos Mes Actual</h3>
                    <p className="stat-value">${adminData.monthlyRevenue.toLocaleString()}</p>
                    <p className="stat-detail">vs. $21,000 mes anterior</p>
                  </div>
                </div>

                {/* KPI Miembros Activos */}
                <div className="stat-card">
                  <div className="stat-header">
                    <h3>Miembros Activos</h3>
                    <span className="trend positive">▲ 8%</span>
                  </div>
                  <p className="stat-value">{adminData.activeMembers.toLocaleString()}</p>
                  <p className="stat-detail">+92 este mes</p>
                </div>

                {/* KPI Ocupación */}
                <div className="stat-card">
                  <div className="stat-header">
                    <h3>Ocupación Promedio</h3>
                    <span className="trend warning">↔ 0%</span>
                  </div>
                  <p className="stat-value">74%</p>
                  <p className="stat-detail">Máximo seguro: 85%</p>
                </div>
              </div>

              {/* Gráficas Grandes */}
              <div className="charts-row">
                {/* Gráfica Ingresos vs Gastos */}
                <div className="chart-card large">
                  <div className="chart-header">
                    <h3>Ingresos vs. Gastos (Últimos 6 meses)</h3>
                    <div className="chart-legend">
                      <span className="legend-item">
                        <span className="color-box income"></span> Ingresos
                      </span>
                      <span className="legend-item">
                        <span className="color-box expense"></span> Gastos
                      </span>
                    </div>
                  </div>
                  {/* Simulación visual de gráfica de barras dobles */}
                  <div className="css-bar-chart">
                    {adminData.kpiRevenue.map((rev, i) => (
                      <div key={i} className="bar-group">
                        <div className="bar income" style={{height: `${rev}%`}}>
                          <span className="tooltip">${rev}k</span>
                        </div>
                        <div className="bar expense" style={{height: `${adminData.kpiExpenses[i]}%`}}></div>
                        <span className="bar-label">{['May','Jun','Jul','Ago','Sep','Oct'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gráfica Horas Pico */}
                <div className="chart-card">
                  <div className="chart-header">
                    <h3>Horas Pico de Asistencia</h3>
                  </div>
                  <div className="css-peak-chart">
                    {adminData.peakHours.map((h, i) => (
                      <div key={i} className="peak-bar" style={{height: `${h}%`}}>
                        <span className="peak-label">
                          {i === 4 ? '12pm' : i === 7 ? '6pm' : ''}
                        </span>
                      </div>
                    ))}
                    <div className="peak-overlay">
                      <span>Mayor afluencia: <strong>19:00 hrs</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de Alertas */}
              <div className="table-section">
                <div className="section-header">
                  <h3>⚠️ Membresías Próximas a Vencer</h3>
                  <button className="btn-outline-small">Ver todas</button>
                </div>
                <div className="custom-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Miembro</th>
                        <th>Plan</th>
                        <th>Fecha Vencimiento</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminData.expiringMembers.map((member) => (
                        <tr key={member.id}>
                          <td className="font-bold">{member.name}</td>
                          <td>{member.plan}</td>
                          <td>{member.expires}</td>
                          <td>
                            <span className={`status-badge ${member.status}`}>
                              {member.status === 'urgent' ? 'Crítico' : 'Pendiente'}
                            </span>
                          </td>
                          <td>
                            <button className="action-link">Notificar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}