import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiAward,
  FiDownload,
  FiFilter,
  FiAlertCircle,
  FiX,
  FiLoader,
  FiRefreshCw
} from "react-icons/fi";
import trainerService from "../services/trainerService";
import "../css/CSSUnificado.css";

export default function TrainerReports() {
  const [timeRange, setTimeRange]       = useState("month");
  const [data, setData]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // ── Carga de datos ────────────────────────────────────────────
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await trainerService.getReports(timeRange);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => { loadReports(); }, [loadReports]);

  // ── Exportar CSV simple ───────────────────────────────────────
  const handleExport = () => {
    if (!data) return;
    const rows = [
      ['Mes', 'Ingresos', 'Sesiones', 'Clientes'],
      ...(data.monthlyData || []).map(d => [d.month, d.revenue, d.sessions, d.clients])
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `reporte_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // ── Atajos a sub-estructuras ──────────────────────────────────
  const stats         = data?.stats         || {};
  const growth        = stats.growth        || {};
  const monthlyData   = data?.monthlyData   || [];
  const clientProgress = data?.clientProgress || [];
  const metrics       = data?.metrics       || {};
  const maxRevenue    = Math.max(...monthlyData.map(d => d.revenue), 1);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="dashboard-content">

      {/* Header */}
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

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16, padding: '12px 16px',
            background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
            color: 'var(--error-color)'
          }}
        >
          <FiAlertCircle />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={loadReports}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <FiRefreshCw size={14} /> Reintentar
          </button>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <FiX />
          </button>
        </motion.div>
      )}

      {/* Selector de Rango + Exportar */}
      <motion.div
        className="chart-card"
        style={{ marginTop: 25 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <FiFilter size={18} style={{ color: 'var(--text-secondary)' }} />
            {[
              { value: 'week',    label: 'Semana' },
              { value: 'month',   label: 'Mes' },
              { value: 'quarter', label: 'Trimestre' },
              { value: 'year',    label: 'Año' }
            ].map(r => (
              <motion.button
                key={r.value}
                className={`btn-outline-small ${timeRange === r.value ? 'active' : ''}`}
                onClick={() => setTimeRange(r.value)}
                style={{
                  background:  timeRange === r.value ? 'var(--accent-color)' : 'transparent',
                  color:       timeRange === r.value ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  borderColor: timeRange === r.value ? 'var(--accent-color)' : 'var(--border-dark)'
                }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                {r.label}
              </motion.button>
            ))}
          </div>

          <motion.button
            className="btn-compact-primary"
            onClick={handleExport}
            disabled={loading || !data}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            <FiDownload size={16} /> Exportar CSV
          </motion.button>
        </div>
      </motion.div>

      {/* Loading spinner */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block' }}
          >
            <FiLoader size={36} />
          </motion.div>
          <p style={{ marginTop: 16 }}>Cargando estadísticas...</p>
        </div>
      )}

      {/* Contenido (solo cuando no está cargando) */}
      {!loading && data && (
        <>
          {/* KPIs */}
          <motion.div
            className="kpi-grid"
            style={{ marginTop: 25 }}
            variants={containerVariants} initial="hidden" animate="visible"
          >
            <motion.div className="stat-card highlight-border" variants={itemVariants}>
              <div className="stat-header">
                <h3><FiDollarSign style={{ marginRight: 8 }} />Ingresos</h3>
                {growth.revenue !== undefined && (
                  <span className={`trend ${growth.revenue >= 0 ? 'positive' : 'negative'}`}>
                    {growth.revenue >= 0 ? '+' : ''}{growth.revenue}%
                  </span>
                )}
              </div>
              <div className="stat-value highlight">
                ${(stats.revenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
              </div>
              <div className="stat-detail">Este período</div>
            </motion.div>

            <motion.div className="stat-card" variants={itemVariants}>
              <div className="stat-header">
                <h3><FiCalendar style={{ marginRight: 8 }} />Sesiones</h3>
                {growth.sessions !== undefined && (
                  <span className={`trend ${growth.sessions >= 0 ? 'positive' : 'negative'}`}>
                    {growth.sessions >= 0 ? '+' : ''}{growth.sessions}%
                  </span>
                )}
              </div>
              <div className="stat-value">{stats.sessions || 0}</div>
              <div className="stat-detail">Completadas</div>
            </motion.div>

            <motion.div className="stat-card" variants={itemVariants}>
              <div className="stat-header">
                <h3><FiUsers style={{ marginRight: 8 }} />Clientes</h3>
              </div>
              <div className="stat-value">{stats.clients || 0}</div>
              <div className="stat-detail">Activos</div>
            </motion.div>

            <motion.div className="stat-card" variants={itemVariants}>
              <div className="stat-header">
                <h3><FiAward style={{ marginRight: 8 }} />Calificación</h3>
                <span className="trend positive">Top Trainer</span>
              </div>
              <div className="stat-value highlight">
                {stats.avgRating ? `${stats.avgRating}/5` : 'N/A'}
              </div>
              <div className="stat-detail">Promedio general</div>
            </motion.div>
          </motion.div>

          {/* Gráficos */}
          <div className="charts-row" style={{ marginTop: 25 }}>
            {/* Gráfico de Ingresos */}
            <motion.div
              className="chart-card"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
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

              {monthlyData.length > 0 ? (
                <div className="css-bar-chart" style={{ height: 250 }}>
                  {monthlyData.map((d, idx) => (
                    <div key={idx} className="bar-group">
                      <motion.div
                        className="bar income"
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                        transition={{ delay: 0.4 + idx * 0.1, duration: 0.6 }}
                      >
                        <div className="tooltip">
                          ${d.revenue.toLocaleString('es-MX')}
                        </div>
                      </motion.div>
                      <div className="bar-label">{d.month}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  Sin datos de ingresos para este período
                </div>
              )}

              <div style={{
                marginTop: 20, padding: 15,
                background: 'var(--input-bg-dark)', borderRadius: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Promedio mensual
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-color)' }}>
                    ${monthlyData.length
                      ? Math.round(monthlyData.reduce((a, d) => a + d.revenue, 0) / monthlyData.length).toLocaleString('es-MX')
                      : 0
                    }
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Crecimiento
                  </div>
                  <div style={{
                    fontSize: 18, fontWeight: 700,
                    color: (growth.revenue || 0) >= 0 ? 'var(--success-color)' : 'var(--error-color)'
                  }}>
                    {(growth.revenue || 0) >= 0 ? '+' : ''}{growth.revenue || 0}%
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Top Clientes */}
            <motion.div
              className="chart-card"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            >
              <div className="chart-header">
                <h3><FiAward style={{ marginRight: 8 }} />Top Clientes por Asistencia</h3>
              </div>

              <div style={{ marginTop: 15 }}>
                {clientProgress.length > 0 ? clientProgress.map((client, index) => (
                  <motion.div
                    key={index}
                    style={{
                      padding: 15, marginBottom: 10,
                      background: 'var(--input-bg-dark)', borderRadius: 8,
                      border: index === 0 ? '1px solid var(--accent-color)' : '1px solid var(--border-dark)'
                    }}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 30, height: 30,
                          background: index === 0 ? 'var(--accent-color)' : 'var(--bg-card-dark)',
                          color: index === 0 ? 'var(--text-on-accent)' : 'var(--text-primary)',
                          borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13
                        }}>
                          {index + 1}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, display: 'block' }}>{client.name}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {client.sessions} sesiones completadas
                          </span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 16, fontWeight: 700,
                        color: client.improvement >= 85 ? 'var(--success-color)' : 'var(--accent-color)'
                      }}>
                        {client.improvement}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-card-dark)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div
                        style={{
                          height: '100%',
                          background: client.improvement >= 85 ? 'var(--success-color)' : 'var(--accent-color)',
                          borderRadius: 3
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${client.improvement}%` }}
                        transition={{ delay: 0.6 + index * 0.05, duration: 0.8 }}
                      />
                    </div>
                  </motion.div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                    Sin datos de clientes para este período
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Métricas Detalladas */}
          <motion.div
            className="chart-card"
            style={{ marginTop: 20 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <div className="chart-header">
              <h3>Métricas Detalladas</h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 15, marginTop: 20
            }}>
              {[
                {
                  label: 'Tasa de Asistencia',
                  value: `${metrics.attendanceRate || 0}%`,
                  trend: 'Del período actual',
                  color: 'var(--success-color)'
                },
                {
                  label: 'Satisfacción',
                  value: metrics.satisfaction ? `${metrics.satisfaction}/5` : 'N/A',
                  trend: 'Promedio evaluaciones',
                  color: 'var(--accent-color)'
                },
                {
                  label: 'Retención',
                  value: `${metrics.retentionRate || 0}%`,
                  trend: 'Clientes que regresan',
                  color: 'var(--success-color)'
                },
                {
                  label: 'Sesiones / Cliente',
                  value: metrics.sessionsPerClient || 0,
                  trend: 'Promedio del período',
                  color: 'var(--accent-color)'
                },
                {
                  label: 'Nuevos Clientes',
                  value: metrics.newClients || 0,
                  trend: 'Este período',
                  color: 'var(--warning-color)'
                },
                {
                  label: 'Cancelaciones',
                  value: `${metrics.cancellationRate || 0}%`,
                  trend: 'Del total programado',
                  color: (metrics.cancellationRate || 0) > 10 ? 'var(--error-color)' : 'var(--success-color)'
                }
              ].map((metric, idx) => (
                <motion.div
                  key={idx}
                  style={{
                    background: 'var(--input-bg-dark)',
                    padding: 20, borderRadius: 10,
                    border: '1px solid var(--border-dark)',
                    transition: 'border-color 0.2s, transform 0.2s'
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  whileHover={{ borderColor: metric.color, y: -3 }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
                    {metric.label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: metric.color, marginBottom: 6 }}>
                    {metric.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {metric.trend}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tabla resumen mensual */}
          {monthlyData.length > 0 && (
            <motion.div
              className="chart-card"
              style={{ marginTop: 20 }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            >
              <div className="chart-header">
                <h3>Resumen Mensual</h3>
              </div>

              <div style={{ marginTop: 16, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      {['Mes', 'Ingresos', 'Sesiones', 'Clientes'].map(col => (
                        <th key={col} style={{
                          textAlign: 'left', padding: '10px 14px',
                          borderBottom: '1px solid var(--border-dark)',
                          color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12,
                          textTransform: 'uppercase'
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((row, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + idx * 0.05 }}
                        style={{
                          borderBottom: idx < monthlyData.length - 1 ? '1px solid var(--border-dark)' : 'none'
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{row.month}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--accent-color)', fontWeight: 700 }}>
                          ${row.revenue.toLocaleString('es-MX')}
                        </td>
                        <td style={{ padding: '12px 14px' }}>{row.sessions}</td>
                        <td style={{ padding: '12px 14px' }}>{row.clients}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Empty state cuando no hay datos y no hay error */}
      {!loading && !data && !error && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <FiBarChart2 size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3>No hay datos disponibles</h3>
          <p>Aún no se han registrado sesiones o pagos en este período.</p>
        </div>
      )}
    </div>
  );
}