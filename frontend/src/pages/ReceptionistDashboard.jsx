import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiUserCheck, 
  FiDollarSign, 
  FiClock,
  FiUsers,
  FiCalendar,
  FiPhoneCall,
  FiMail,
  FiAlertCircle
} from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function ReceptionistDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("checkins");
  
  const [stats, setStats] = useState({
    todayCheckins: 47,
    pendingPayments: 8,
    activeMembers: 156,
    appointments: 12
  });

  const [recentCheckins, setRecentCheckins] = useState([
    { name: "María González", time: "Hace 5 min", membershipStatus: "Activa", photo: "MG" },
    { name: "Carlos Ruiz", time: "Hace 12 min", membershipStatus: "Activa", photo: "CR" },
    { name: "Ana Martínez", time: "Hace 18 min", membershipStatus: "Por vencer", photo: "AM" },
    { name: "Luis Hernández", time: "Hace 25 min", membershipStatus: "Activa", photo: "LH" },
    { name: "Pedro Sánchez", time: "Hace 30 min", membershipStatus: "Activa", photo: "PS" }
  ]);

  const [pendingTasks, setPendingTasks] = useState([
    { task: "Llamar a clientes con membresías por vencer", priority: "high", count: 5 },
    { task: "Confirmar citas de entrenamiento personal", priority: "medium", count: 8 },
    { task: "Procesar pagos pendientes", priority: "high", count: 3 },
    { task: "Actualizar información de contacto", priority: "low", count: 12 },
    { task: "Enviar recordatorios de pago", priority: "medium", count: 6 }
  ]);

  const [upcomingAppointments, setUpcomingAppointments] = useState([
    { time: "10:00", client: "Evaluación - Nuevo Cliente", trainer: "Coach López" },
    { time: "11:30", client: "Tour Instalaciones - Familia Rodríguez", trainer: "Recepción" },
    { time: "14:00", client: "Renovación Membresía - Juan Pérez", trainer: "Gerente" },
    { time: "16:00", client: "Clase Grupal - Spinning", trainer: "Coach Martínez" }
  ]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (!user) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'var(--error-color)';
      case 'medium': return 'var(--warning-color)';
      case 'low': return 'var(--success-color)';
      default: return 'var(--text-secondary)';
    }
  };

  const getPriorityText = (priority) => {
    switch(priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <motion.header 
          className="top-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="page-title">Panel de Recepción</h2>
          <div className="header-right">
            <div className="date-display">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="user-profile">
              <div className="avatar">
                {user.nombre?.split(" ").map(n => n[0]).join("") || "RC"}
              </div>
              <div className="user-info">
                <span className="name">{user.nombre || "Recepcionista"}</span>
                <span className="role">Recepcionista</span>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="dashboard-content">
          {/* Banner de Bienvenida */}
          <motion.div 
            className="welcome-section"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="welcome-content">
              <div className="welcome-text">
                <h2>¡Bienvenida, {user.nombre?.split(" ")[0] || "Recepcionista"}! 🌟</h2>
                <p>Tienes 8 pagos pendientes de procesar y 12 citas programadas hoy</p>
              </div>
              <FiUserCheck size={50} style={{ color: 'var(--accent-color)', opacity: 0.8 }} />
            </div>
          </motion.div>

          {/* KPI Grid */}
          <motion.div 
            className="kpi-grid" 
            style={{ marginTop: '25px' }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="stat-card highlight-border" variants={itemVariants}>
              <div className="stat-header">
                <h3><FiUserCheck style={{ marginRight: 8 }} />Check-ins Hoy</h3>
                <span className="trend positive">+15%</span>
              </div>
              <div className="stat-value">{stats.todayCheckins}</div>
              <div className="stat-detail">Desde las 6:00 AM</div>
            </motion.div>

            <motion.div className="stat-card" variants={itemVariants}>
              <div className="stat-header">
                <h3><FiDollarSign style={{ marginRight: 8 }} />Pagos Pendientes</h3>
                <span className="trend warning">Requiere atención</span>
              </div>
              <div className="stat-value highlight">{stats.pendingPayments}</div>
              <div className="stat-detail">Por procesar hoy</div>
            </motion.div>

            <motion.div className="stat-card" variants={itemVariants}>
              <div className="stat-header">
                <h3><FiUsers style={{ marginRight: 8 }} />Miembros Activos</h3>
                <span className="trend positive">+8 este mes</span>
              </div>
              <div className="stat-value">{stats.activeMembers}</div>
              <div className="stat-detail">Total en el gimnasio</div>
            </motion.div>

            <motion.div className="stat-card" variants={itemVariants}>
              <div className="stat-header">
                <h3><FiCalendar style={{ marginRight: 8 }} />Citas</h3>
                <span className="trend positive">4 confirmadas</span>
              </div>
              <div className="stat-value">{stats.appointments}</div>
              <div className="stat-detail">Programadas hoy</div>
            </motion.div>
          </motion.div>

          {/* Contenido Principal */}
          <div className="charts-row" style={{ marginTop: '25px' }}>
            {/* Check-ins Recientes */}
            <motion.div 
              className="chart-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="chart-header">
                <h3><FiClock style={{ marginRight: 8 }} />Check-ins Recientes</h3>
                <button className="btn-outline-small">Ver todos</button>
              </div>
              
              <div className="exercises-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {recentCheckins.map((checkin, index) => (
                  <motion.div 
                    key={index}
                    className="exercise-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="exercise-checkbox">
                      <div style={{ 
                        width: '45px', 
                        height: '45px',
                        background: 'var(--accent-color)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '14px',
                        color: 'var(--bg-dark)'
                      }}>
                        {checkin.photo}
                      </div>
                    </div>
                    <div className="exercise-details">
                      <span className="exercise-name">{checkin.name}</span>
                      <span className="exercise-sets" style={{ 
                        color: checkin.membershipStatus === 'Por vencer' ? 'var(--warning-color)' : 'var(--success-color)' 
                      }}>
                        {checkin.membershipStatus} • {checkin.time}
                      </span>
                    </div>
                    <div className="exercise-action">
                      <button className="action-link">Ver perfil</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Tareas Pendientes */}
            <motion.div 
              className="chart-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="chart-header">
                <h3><FiAlertCircle style={{ marginRight: 8 }} />Tareas Pendientes</h3>
                <span className="trend warning">5 prioritarias</span>
              </div>
              
              <div style={{ padding: '10px 0' }}>
                {pendingTasks.map((task, index) => (
                  <motion.div 
                    key={index}
                    style={{ 
                      padding: '15px',
                      marginBottom: '10px',
                      background: 'var(--bg-input-dark)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-dark)',
                      borderLeft: `3px solid ${getPriorityColor(task.priority)}`
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (index * 0.05) }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          {task.task}
                        </span>
                        <span style={{ 
                          fontSize: '11px',
                          color: getPriorityColor(task.priority),
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          Prioridad {getPriorityText(task.priority)}
                        </span>
                      </div>
                      <div style={{ 
                        background: getPriorityColor(task.priority),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginLeft: '10px'
                      }}>
                        {task.count}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Próximas Citas */}
          <motion.div 
            className="table-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="section-header">
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                <FiCalendar style={{ marginRight: 8 }} />Próximas Citas
              </h3>
              <button className="btn-outline-small">Agregar cita</button>
            </div>
            
            <div className="custom-table-container">
              <div style={{ padding: '20px' }}>
                {upcomingAppointments.map((apt, idx) => (
                  <motion.div
                    key={idx}
                    style={{ 
                      padding: '18px', 
                      background: 'var(--bg-input-dark)', 
                      borderRadius: '8px',
                      border: '1px solid var(--border-dark)',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + (idx * 0.05) }}
                    whileHover={{ scale: 1.01, borderColor: 'var(--accent-color)' }}
                  >
                    <div style={{ 
                      width: '60px',
                      height: '60px',
                      background: 'var(--accent-color)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--bg-dark)',
                      fontWeight: '700'
                    }}>
                      <div style={{ fontSize: '18px' }}>{apt.time}</div>
                      <div style={{ fontSize: '10px', opacity: 0.7 }}>horas</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '15px' }}>
                        {apt.client}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Atendido por: {apt.trainer}
                      </div>
                    </div>
                    <button className="btn-outline-small">Gestionar</button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Acciones Rápidas */}
          <motion.div 
            className="table-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="section-header">
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Acciones Rápidas</h3>
            </div>
            
            <div className="custom-table-container">
              <div style={{ 
                padding: '20px', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                gap: '15px' 
              }}>
                {[
                  { icon: <FiUserCheck size={24} />, title: "Registrar Check-in", color: 'var(--success-color)' },
                  { icon: <FiDollarSign size={24} />, title: "Procesar Pago", color: 'var(--accent-color)' },
                  { icon: <FiPhoneCall size={24} />, title: "Llamadas", color: 'var(--warning-color)' },
                  { icon: <FiMail size={24} />, title: "Enviar Email", color: '#4A90E2' }
                ].map((action, idx) => (
                  <motion.button
                    key={idx}
                    style={{ 
                      padding: '25px 15px', 
                      background: 'var(--bg-input-dark)', 
                      borderRadius: '8px',
                      border: '1px solid var(--border-dark)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      borderColor: action.color,
                      boxShadow: `0 0 20px ${action.color}20`
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div style={{ color: action.color }}>{action.icon}</div>
                    <div style={{ fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>
                      {action.title}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}