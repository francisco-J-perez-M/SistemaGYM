import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FiClock, 
  FiCheckCircle, 
  FiXCircle,
  FiPlay,
  FiPause,
  FiFilter,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiFileText
} from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function TrainerSessions() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState("week");

  const sessions = [
    { 
      id: 1, 
      date: "2024-02-05", 
      time: "08:00", 
      client: "María González", 
      type: "Personal", 
      duration: "60 min",
      location: "Sala 1",
      status: "completed",
      notes: "Excelente progreso en sentadillas. Aumentar peso próxima sesión.",
      exercises: 8,
      attendance: true
    },
    { 
      id: 2, 
      date: "2024-02-05", 
      time: "10:00", 
      client: "Grupo Funcional", 
      type: "Grupal", 
      duration: "90 min",
      location: "Sala Principal",
      status: "completed",
      notes: "12 participantes. Circuito HIIT muy intenso.",
      exercises: 10,
      attendance: true
    },
    { 
      id: 3, 
      date: "2024-02-05", 
      time: "14:00", 
      client: "Ana Martínez", 
      type: "Personal", 
      duration: "45 min",
      location: "Online",
      status: "in-progress",
      notes: "",
      exercises: 6,
      attendance: true
    },
    { 
      id: 4, 
      date: "2024-02-05", 
      time: "16:00", 
      client: "Luis Hernández", 
      type: "Personal", 
      duration: "60 min",
      location: "Sala 2",
      status: "scheduled",
      notes: "",
      exercises: 7,
      attendance: false
    },
    { 
      id: 5, 
      date: "2024-02-04", 
      time: "09:00", 
      client: "Carlos Ruiz", 
      type: "Personal", 
      duration: "60 min",
      location: "Sala 1",
      status: "completed",
      notes: "Trabajó fuerza de tren superior. Gran esfuerzo.",
      exercises: 9,
      attendance: true
    },
    { 
      id: 6, 
      date: "2024-02-04", 
      time: "11:00", 
      client: "Spinning Matutino", 
      type: "Grupal", 
      duration: "60 min",
      location: "Sala Cycling",
      status: "completed",
      notes: "15 participantes. Clase de resistencia.",
      exercises: 5,
      attendance: true
    },
    { 
      id: 7, 
      date: "2024-02-04", 
      time: "18:00", 
      client: "Pedro Sánchez", 
      type: "Personal", 
      duration: "45 min",
      location: "Sala 2",
      status: "cancelled",
      notes: "Cliente canceló por enfermedad.",
      exercises: 0,
      attendance: false
    },
    { 
      id: 8, 
      date: "2024-02-03", 
      time: "08:00", 
      client: "Sofía Torres", 
      type: "Personal", 
      duration: "60 min",
      location: "Sala 1",
      status: "completed",
      notes: "Primera sesión del mes. Evaluación de progreso.",
      exercises: 8,
      attendance: true
    },
  ];

  const filteredSessions = sessions.filter(session => {
    if (filterStatus === "all") return true;
    return session.status === filterStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'var(--success-color)';
      case 'in-progress': return 'var(--accent-color)';
      case 'scheduled': return '#38bdf8';
      case 'cancelled': return 'var(--error-color)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'Completada';
      case 'in-progress': return 'En Curso';
      case 'scheduled': return 'Programada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <FiCheckCircle />;
      case 'in-progress': return <FiPlay />;
      case 'scheduled': return <FiClock />;
      case 'cancelled': return <FiXCircle />;
      default: return <FiClock />;
    }
  };

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
    attendanceRate: Math.round((sessions.filter(s => s.attendance).length / sessions.length) * 100)
  };

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
            <h2>Historial de Sesiones</h2>
            <p>Monitorea y gestiona todas tus sesiones de entrenamiento</p>
          </div>
          <FiClock size={50} style={{ color: 'var(--accent-color)', opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* KPIs de Sesiones */}
      <motion.div 
        className="kpi-grid" 
        style={{ marginTop: '25px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="stat-card highlight-border" variants={itemVariants}>
          <div className="stat-header">
            <h3>Total Sesiones</h3>
          </div>
          <div className="stat-value highlight">{stats.total}</div>
          <div className="stat-detail">Esta semana</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Completadas</h3>
            <span className="trend positive">
              <FiCheckCircle size={16} />
            </span>
          </div>
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-detail">{Math.round((stats.completed / stats.total) * 100)}% del total</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Programadas</h3>
            <span className="trend warning">
              <FiClock size={16} />
            </span>
          </div>
          <div className="stat-value">{stats.scheduled}</div>
          <div className="stat-detail">Próximas sesiones</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Canceladas</h3>
            <span className="trend" style={{ color: 'var(--error-color)' }}>
              <FiXCircle size={16} />
            </span>
          </div>
          <div className="stat-value">{stats.cancelled}</div>
          <div className="stat-detail">{Math.round((stats.cancelled / stats.total) * 100)}% del total</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Asistencia</h3>
            <span className="trend positive">+5%</span>
          </div>
          <div className="stat-value highlight">{stats.attendanceRate}%</div>
          <div className="stat-detail">Tasa de asistencia</div>
        </motion.div>
      </motion.div>

      {/* Filtros */}
      <motion.div 
        className="chart-card"
        style={{ marginTop: '25px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <FiFilter size={18} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Estado:
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
            {[
              { value: 'all', label: 'Todas', count: stats.total },
              { value: 'completed', label: 'Completadas', count: stats.completed },
              { value: 'in-progress', label: 'En Curso', count: sessions.filter(s => s.status === 'in-progress').length },
              { value: 'scheduled', label: 'Programadas', count: stats.scheduled },
              { value: 'cancelled', label: 'Canceladas', count: stats.cancelled }
            ].map(filter => (
              <motion.button
                key={filter.value}
                className={`btn-outline-small ${filterStatus === filter.value ? 'active' : ''}`}
                onClick={() => setFilterStatus(filter.value)}
                style={{
                  background: filterStatus === filter.value ? 'var(--accent-color)' : 'transparent',
                  color: filterStatus === filter.value ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  borderColor: filterStatus === filter.value ? 'var(--accent-color)' : 'var(--border-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filter.label}
                <span style={{ 
                  background: filterStatus === filter.value ? 'rgba(0,0,0,0.2)' : 'var(--input-bg-dark)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {filter.count}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Lista de Sesiones */}
      <motion.div 
        className="chart-card"
        style={{ marginTop: '20px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="chart-header">
          <h3>Sesiones ({filteredSessions.length})</h3>
        </div>

        <motion.div 
          style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredSessions.map((session, idx) => (
            <motion.div
              key={session.id}
              variants={itemVariants}
              style={{
                background: 'var(--input-bg-dark)',
                border: `1px solid var(--border-dark)`,
                borderLeft: `4px solid ${getStatusColor(session.status)}`,
                borderRadius: '12px',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '20px',
                alignItems: 'center',
                opacity: session.status === 'cancelled' ? 0.6 : 1
              }}
              whileHover={{ 
                borderColor: 'var(--accent-color)',
                transform: 'translateX(5px)'
              }}
            >
              {/* Fecha y Hora */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '8px',
                minWidth: '80px'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700',
                  color: 'var(--accent-color)'
                }}>
                  {session.time}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'var(--text-secondary)',
                  textAlign: 'center'
                }}>
                  {new Date(session.date).toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </div>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `${getStatusColor(session.status)}20`,
                  color: getStatusColor(session.status),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  {getStatusIcon(session.status)}
                </div>
              </div>

              {/* Detalles */}
              <div>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  marginBottom: '8px',
                  textDecoration: session.status === 'cancelled' ? 'line-through' : 'none'
                }}>
                  {session.client}
                </h4>
                <div style={{ 
                  display: 'flex', 
                  gap: '15px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginBottom: '10px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiUser size={14} />
                    {session.type}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiClock size={14} />
                    {session.duration}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiMapPin size={14} />
                    {session.location}
                  </div>
                  {session.exercises > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiFileText size={14} />
                      {session.exercises} ejercicios
                    </div>
                  )}
                </div>
                {session.notes && (
                  <div style={{ 
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    background: 'var(--bg-card-dark)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    borderLeft: '2px solid var(--accent-color)'
                  }}>
                    {session.notes}
                  </div>
                )}
              </div>

              {/* Estado */}
              <div style={{ textAlign: 'center', minWidth: '100px' }}>
                <div style={{ 
                  padding: '6px 12px',
                  background: `${getStatusColor(session.status)}20`,
                  color: getStatusColor(session.status),
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  {getStatusText(session.status)}
                </div>
                {session.status === 'scheduled' && (
                  <motion.button
                    className="btn-compact-primary"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiPlay size={12} />
                    Iniciar
                  </motion.button>
                )}
                {session.status === 'in-progress' && (
                  <motion.button
                    className="btn-compact-primary"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiPause size={12} />
                    Pausar
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredSessions.length === 0 && (
          <div className="empty-state">
            <FiClock size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
            <h3>No hay sesiones</h3>
            <p>No se encontraron sesiones con el filtro seleccionado</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
