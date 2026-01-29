import { useState, useEffect } from "react";
import "../css/CSSUnificado.css";

// Importamos la nueva función unificada
import { getDashboardKPIs } from "../api/dashboard";
import { getMembresiasPorExpirar } from "../api/miembroMembresias";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user")) || {
    nombre: "Admin",
    role: "admin",
  };

  const [adminData, setAdminData] = useState({
    retention: 87, // Dato mock (o puedes agregarlo al endpoint del backend)
    churn: 13,     // Dato mock
    activeMembers: 0,
    monthlyRevenue: 0,
    expiringMembers: [],
    kpiRevenue: [], 
    kpiExpenses: [20, 25, 22, 30, 28, 35], // Mock de gastos
    peakHours: [10, 30, 80, 50, 20, 40, 90, 100, 60, 20], // Mock de horas pico
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Hacemos las peticiones en paralelo para mayor velocidad
        const [kpiRes, expiringRes] = await Promise.all([
          getDashboardKPIs(),          // Trae ingresos y miembros del backend
          getMembresiasPorExpirar(7),  // Trae la tabla de vencimientos
        ]);

        // Mapeamos la respuesta del backend al estado de React
        // Asumiendo que tu backend devuelve: { active_members, monthly_revenue, revenue_6_months }
        setAdminData((prev) => ({
          ...prev,
          activeMembers: kpiRes.active_members,     
          monthlyRevenue: kpiRes.monthly_revenue,   
          kpiRevenue: kpiRes.revenue_6_months,      
          expiringMembers: expiringRes.data,
        }));

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!localStorage.getItem("token")) {
      window.location.href = "/";
    } else {
      loadDashboard();
    }
  }, []);

  // Función auxiliar para obtener nombres de los últimos 6 meses dinámicamente
  const getLast6MonthsLabels = () => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const currentMonth = new Date().getMonth();
    const result = [];
    for (let i = 5; i >= 0; i--) {
        const index = (currentMonth - i + 12) % 12;
        result.push(months[index]);
    }
    return result;
  };

  const monthLabels = getLast6MonthsLabels();

  return (
    <>
      {/* HEADER */}
      <header className="top-header">
        <h2 className="page-title">Panel Administrativo</h2>
        <div className="header-right">
          <div className="date-display">
            {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </div>
          <div className="user-profile">
            <div className="avatar">
              {user.nombre
                ? user.nombre
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "A"}
            </div>
            <div className="user-info">
              <span className="name">{user.nombre}</span>
              <span className="role">{user.role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="dashboard-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="kpi-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <h3>Retención de Clientes</h3>
                  <span className="trend positive">+2.4%</span>
                </div>
                <div className="retention-chart">
                  <div
                    className="circular-progress"
                    style={{
                      background: `conic-gradient(var(--accent-color) ${
                        adminData.retention * 3.6
                      }deg, var(--bg-main-dark) 0deg)`,
                    }}
                  >
                    <div className="inner-circle">
                      <span className="percentage">
                        {adminData.retention}%
                      </span>
                    </div>
                  </div>
                  <div className="retention-legend">
                    <p>
                      <span className="dot active"></span> Renuevan
                    </p>
                    <p>
                      <span className="dot inactive"></span> Se van (
                      {adminData.churn}%)
                    </p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Ingresos Mes Actual</h3>
                  <p className="stat-value">
                    ${adminData.monthlyRevenue?.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Miembros Activos</h3>
                </div>
                <p className="stat-value">
                  {adminData.activeMembers?.toLocaleString()}
                </p>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Ocupación Promedio</h3>
                  <span className="trend warning">↔ 0%</span>
                </div>
                <p className="stat-value">74%</p>
              </div>
            </div>

            {/* GRÁFICAS */}
            <div className="charts-row">
              <div className="chart-card large">
                <div className="chart-header">
                  <h3>Ingresos vs. Gastos (Últimos 6 meses)</h3>
                </div>
                <div className="css-bar-chart">
                  {adminData.kpiRevenue && adminData.kpiRevenue.map((rev, i) => (
                    <div key={i} className="bar-group">
                      {/* Barra de Ingresos (Backend) */}
                      <div
                        className="bar income"
                        // Normalizamos la altura para que no se salga (asumiendo max 5000 para ejemplo visual, ajusta según tus ingresos reales)
                        style={{ height: `${Math.min((rev / 5000) * 100, 100)}%` }} 
                      >
                        <span className="tooltip">${rev}</span>
                      </div>
                      
                      {/* Barra de Gastos (Mock) */}
                      <div
                        className="bar expense"
                        style={{
                          height: `${adminData.kpiExpenses[i]}%`,
                        }}
                      ></div>
                      
                      <span className="bar-label">
                        {monthLabels[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TABLA */}
            <div className="table-section">
              <div className="section-header">
                <h3>⚠️ Membresías Próximas a Vencer</h3>
              </div>
              <div className="custom-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Miembro</th>
                      <th>Plan</th>
                      <th>Fecha Vencimiento</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData.expiringMembers.length > 0 ? (
                      adminData.expiringMembers.map((m) => (
                        <tr key={m.id}>
                          <td className="font-bold">{m.miembro}</td>
                          <td>{m.plan}</td>
                          <td>{m.fecha_fin}</td>
                          <td>
                            <span className={`status-badge ${m.status}`}>
                              {m.status === "urgent"
                                ? "Crítico"
                                : "Pendiente"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colspan="4" style={{textAlign: "center", padding: "20px"}}>
                            No hay membresías por vencer en los próximos 7 días.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}