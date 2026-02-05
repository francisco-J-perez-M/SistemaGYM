import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FiBarChart2, 
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiAward,
  FiDownload,
  FiFilter
} from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function TrainerReports() {
  const [timeRange, setTimeRange] = useState("month");

  const stats = {
    revenue: 12500,
    sessions: 142,
    clients: 24,
    avgRating: 4.8,
    growth: {
      revenue: 15,
      sessions: 12,
      clients: 8
    }
  };

  const monthlyData = [
    { month: "Ene", revenue: 8500, sessions: 95, clients: 18 },
    { month: "Feb", revenue: 9200, sessions: 108, clients: 20 },
    { month: "Mar", revenue: 10100, sessions: 122, clients: 22 },
    { month: "Abr", revenue: 11300, sessions: 135, clients: 23 },
    { month: "May", revenue: 12500, sessions: 142, clients: 24 }
  ];

  const clientProgress = [
    { name: "María González", improvement: 92, sessions: 48 },
    { name: "Ana Martínez", improvement: 88, sessions: 64 },
    { name: "Carlos Ruiz", improvement: 85, sessions: 32 },
    { name: "Pedro Sánchez", improvement: 82, sessions: 40 },
    { name: "Luis Hernández", improvement: 78, sessions: 28 }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  return (
    <div className="dashboard-content">
      <motion.div 
        className="welcome-section"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="welcome-content">
          <div className="welcome-text">
            <h2>Reportes y Estadísticas</h2>
            <p>Analiza tu desempeño y el progreso de tus clientes</p>
          </div>
          <FiBarChart2 size={50} style={{ color: 'var(--accent-color)', opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* Selector de Rango */}
      <motion.div 
        className="chart-card"
        style={{ marginTop: '25px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <FiFilter size={18} style={{ color: 'var(--text-secondary)' }} />
            {['week', 'month', 'quarter', 'year'].map(range => (
              <motion.button
                key={range}
                className={`btn-outline-small ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
                style={{
                  background: timeRange === range ? 'var(--accent-color)' : 'transparent',
                  color: timeRange === range ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  borderColor: timeRange === range ? 'var(--accent-color)' : 'var(--border-dark)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : range === 'quarter' ? 'Trimestre' : 'Año'}
              </motion.button>
            ))}
          </div>
          <motion.button
            className="btn-compact-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiDownload size={16} />
            Exportar Reporte
          </motion.button>
        </div>
      </motion.div>

      {/* KPIs Principales */}
      <motion.div 
        className="kpi-grid" 
        style={{ marginTop: '25px' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="stat-card highlight-border" variants={itemVariants}>
          <div className="stat-header">
            <h3><FiDollarSign style={{ marginRight: 8 }} />Ingresos</h3>
            <span className="trend positive">+{stats.growth.revenue}%</span>
          </div>
          <div className="stat-value highlight">${stats.revenue.toLocaleString()}</div>
          <div className="stat-detail">Este mes</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3><FiCalendar style={{ marginRight: 8 }} />Sesiones</h3>
            <span className="trend positive">+{stats.growth.sessions}%</span>
          </div>
          <div className="stat-value">{stats.sessions}</div>
          <div className="stat-detail">Completadas</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3><FiUsers style={{ marginRight: 8 }} />Clientes</h3>
            <span className="trend positive">+{stats.growth.clients}%</span>
          </div>
          <div className="stat-value">{stats.clients}</div>
          <div className="stat-detail">Activos</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3><FiAward style={{ marginRight: 8 }} />Calificación</h3>
            <span className="trend positive">Top Trainer</span>
          </div>
          <div className="stat-value highlight">{stats.avgRating}/5</div>
          <div className="stat-detail">Promedio general</div>
        </motion.div>
      </motion.div>

      <div className="charts-row" style={{ marginTop: '25px' }}>
        {/* Gráfico de Ingresos */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="chart-header">
            <h3><FiTrendingUp style={{ marginRight: 8 }} />Evolución de Ingresos</h3>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="color-box income"></div>
                Ingresos mensuales
              </div>
            </div>
          </div>

          <div className="css-bar-chart" style={{ height: '250px' }}>
            {monthlyData.map((data, idx) => (
              <div key={idx} className="bar-group">
                <motion.div 
                  className="bar income"
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                  transition={{ delay: 0.5 + (idx * 0.1), duration: 0.6 }}
                >
                  <div className="tooltip">
                    ${data.revenue.toLocaleString()}
                  </div>
                </motion.div>
                <div className="bar-label">{data.month}</div>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: '20px', 
            padding: '15px',
            background: 'var(--input-bg-dark)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Promedio mensual
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-color)' }}>
                ${Math.round(monthlyData.reduce((acc, d) => acc + d.revenue, 0) / monthlyData.length).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Crecimiento
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--success-color)' }}>
                +{stats.growth.revenue}%
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Clientes por Progreso */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="chart-header">
            <h3><FiAward style={{ marginRight: 8 }} />Top Clientes por Progreso</h3>
          </div>
          
          <div style={{ marginTop: '15px' }}>
            {clientProgress.map((client, index) => (
              <motion.div
                key={index}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  background: 'var(--input-bg-dark)',
                  borderRadius: '8px',
                  border: index === 0 ? '1px solid var(--accent-color)' : '1px solid var(--border-dark)'
                }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (index * 0.05) }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      background: index === 0 ? 'var(--accent-color)' : 'var(--bg-card-dark)',
                      color: index === 0 ? 'var(--text-on-accent)' : 'var(--text-primary)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <span style={{ fontWeight: '600', display: 'block' }}>{client.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {client.sessions} sesiones
                      </span>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: '700',
                    color: client.improvement >= 85 ? 'var(--success-color)' : 'var(--accent-color)'
                  }}>
                    {client.improvement}%
                  </span>
                </div>
                <div style={{ 
                  height: '6px', 
                  background: 'var(--bg-card-dark)', 
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <motion.div 
                    style={{ 
                      height: '100%', 
                      background: client.improvement >= 85 ? 'var(--success-color)' : 'var(--accent-color)',
                      borderRadius: '3px'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${client.improvement}%` }}
                    transition={{ delay: 0.6 + (index * 0.05), duration: 0.8 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Métricas Detalladas */}
      <motion.div 
        className="chart-card"
        style={{ marginTop: '20px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="chart-header">
          <h3>Métricas Detalladas</h3>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '20px'
        }}>
          {[
            { label: "Tasa de Retención", value: "94%", trend: "+2%", color: 'var(--success-color)' },
            { label: "Satisfacción", value: "4.8/5", trend: "+0.3", color: 'var(--accent-color)' },
            { label: "Asistencia", value: "88%", trend: "+5%", color: 'var(--success-color)' },
            { label: "Sesiones/Cliente", value: "5.9", trend: "+0.4", color: 'var(--accent-color)' },
            { label: "Nuevos Clientes", value: "3", trend: "Este mes", color: 'var(--warning-color)' },
            { label: "Cancelaciones", value: "2%", trend: "-1%", color: 'var(--success-color)' }
          ].map((metric, idx) => (
            <motion.div
              key={idx}
              style={{
                background: 'var(--input-bg-dark)',
                padding: '20px',
                borderRadius: '10px',
                border: '1px solid var(--border-dark)'
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + (idx * 0.05) }}
              whileHover={{ borderColor: metric.color, transform: 'translateY(-3px)' }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                {metric.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: metric.color, marginBottom: '6px' }}>
                {metric.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {metric.trend}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
