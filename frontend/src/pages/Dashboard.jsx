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
    retention: 87,
    churn: 13,
    activeMembers: 0,
    monthlyRevenue: 0,
    expiringMembers: [],
    kpiRevenue: [], 
    kpiExpenses: [20, 25, 22, 30, 28, 35],
    peakHours: [10, 30, 80, 50, 20, 40, 90, 100, 60, 20],
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [kpiRes, expiringRes] = await Promise.all([
          getDashboardKPIs(),
          getMembresiasPorExpirar(7),
        ]);

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
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="dashboard-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="dashboard-spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="kpi-grid">
              {/* TARJETA DE RETENCIÓN - CORREGIDA */}
              <div className="stat-card">
                <div className="stat-header">
                  <h3>Retención de Clientes</h3>
                  <span className="trend positive">+2.4%</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '20px',
                  marginTop: '15px'
                }}>
                  {/* Círculo de progreso */}
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: `conic-gradient(
                        var(--accent-color) ${adminData.retention * 3.6}deg, 
                        var(--input-bg-dark) ${adminData.retention * 3.6}deg
                      )`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        width: '65px',
                        height: '65px',
                        background: 'var(--bg-card-dark)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '18px',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {adminData.retention}%
                    </div>
                  </div>

                  {/* Leyenda */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: 0
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--accent-color)',
                        display: 'inline-block'
                      }}></span>
                      Renuevan ({adminData.retention}%)
                    </p>
                    <p style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: 0
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--input-bg-dark)',
                        border: '1px solid var(--border-dark)',
                        display: 'inline-block'
                      }}></span>
                      Se van ({adminData.churn}%)
                    </p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Ingresos Mes Actual</h3>
                  <p className="stat-value highlight">
                    ${adminData.monthlyRevenue?.toLocaleString()}
                  </p>
                  <p className="stat-detail">Meta: $50,000</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Miembros Activos</h3>
                  <span className="trend positive">↑ 12%</span>
                </div>
                <p className="stat-value">
                  {adminData.activeMembers?.toLocaleString()}
                </p>
                <p className="stat-detail">Con membresía vigente</p>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Ocupación Promedio</h3>
                  <span className="trend warning">↔ 0%</span>
                </div>
                <p className="stat-value">74%</p>
                <p className="stat-detail">Basado en última semana</p>
              </div>
            </div>

            {/* GRÁFICAS */}
            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Ingresos vs. Gastos (Últimos 6 meses)</h3>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="color-box income"></span>
                      Ingresos
                    </div>
                    <div className="legend-item">
                      <span className="color-box expense"></span>
                      Gastos
                    </div>
                  </div>
                </div>
                <div className="css-bar-chart">
                  {adminData.kpiRevenue && adminData.kpiRevenue.map((rev, i) => {
                    // Calculamos el máximo para normalizar
                    const maxRevenue = Math.max(...adminData.kpiRevenue);
                    const normalizedHeight = (rev / maxRevenue) * 100;
                    
                    return (
                      <div key={i} className="bar-group">
                        {/* Barra de Ingresos */}
                        <div
                          className="bar income"
                          style={{ height: `${normalizedHeight}%` }}
                        >
                          <span className="tooltip">Ingresos: ${rev.toLocaleString()}</span>
                        </div>
                        
                        {/* Barra de Gastos */}
                        <div
                          className="bar expense"
                          style={{ height: `${adminData.kpiExpenses[i]}%` }}
                        >
                          <span className="tooltip">Gastos estimados</span>
                        </div>
                        
                        <span className="bar-label">{monthLabels[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráfica de horas pico */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Horas Pico del Día</h3>
                </div>
                <div className="css-peak-chart">
                  {adminData.peakHours.map((h, i) => (
                    <div
                      key={i}
                      className="peak-bar"
                      style={{ height: `${h}%` }}
                    >
                      <span className="peak-label">{6 + i * 2}h</span>
                    </div>
                  ))}
                </div>
                <div className="peak-overlay">
                  <strong>Pico máximo:</strong> 18:00 - 20:00
                </div>
              </div>
            </div>

            {/* TABLA */}
            <div className="table-section">
              <div className="section-header">
                <h3> Membresías Próximas a Vencer</h3>
                <span className="total-count">
                  {adminData.expiringMembers.length} membresía(s)
                </span>
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
                              {m.status === "urgent" ? "Crítico" : "Pendiente"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
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