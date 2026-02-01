import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import { 
  FiUsers, 
  FiCalendar, 
  FiCheckCircle, 
  FiClock,
  FiTrendingUp,
  FiAward
} from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function TrainerDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("clients");
  
  const [stats, setStats] = useState({
    activeClients: 24,
    todayClasses: 6,
    completedSessions: 142,
    avgRating: 4.8
  });

  const [todaySchedule, setTodaySchedule] = useState([
    { time: "08:00", client: "María González", type: "Personal", status: "completed" },
    { time: "09:30", client: "Carlos Ruiz", type: "Grupal", status: "completed" },
    { time: "11:00", client: "Ana Martínez", type: "Personal", status: "in-progress" },
    { time: "14:00", client: "Luis Hernández", type: "Personal", status: "pending" },
    { time: "16:30", client: "Grupo Funcional", type: "Grupal", status: "pending" },
    { time: "18:00", client: "Pedro Sánchez", type: "Personal", status: "pending" }
  ]);

  const [recentClients, setRecentClients] = useState([
    { name: "María González", progress: 85, lastSession: "Hoy", streak: 12 },
    { name: "Carlos Ruiz", progress: 72, lastSession: "Hoy", streak: 8 },
    { name: "Ana Martínez", progress: 91, lastSession: "En curso", streak: 15 },
    { name: "Luis Hernández", progress: 68, lastSession: "Ayer", streak: 5 },
    { name: "Pedro Sánchez", progress: 79, lastSession: "Hace 2 días", streak: 10 }
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'var(--success-color)';
      case 'in-progress': return 'var(--accent-color)';
      case 'pending': return 'var(--text-secondary)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'Completada';
      case 'in-progress': return 'En curso';
      case 'pending': return 'Pendiente';
      default: return status;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        role="trainer"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="main-wrapper">
        <motion.header 
          className="top-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="page-title">Panel de Entrenador</h2>
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
                {user.nombre?.split(" ").map(n => n[0]).join("") || "EN"}
              </div>
              <div className="user-info">
                <span className="name">{user.nombre || "Entrenador"}</span>
                <span className="role">Entrenador</span>
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
                <h2>¡Buenos días, {user.nombre?.split(" ")[0] || "Entrenador"}! 👋</h2>
                <p>Tienes 6 sesiones programadas para hoy. ¡Excelente trabajo!</p>
              </div>
              <FiAward size={50} style={{ color: 'var(--accent-color)', opacity: 0.8 }} />
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
                <h3><FiUsers style={{ marginRight: 8 }} />Clientes Activos</h3>
                <span className="trend positive">+3 este mes</span>
              </div>
              <div className="stat-value">{stats.activeClients}</div>
              <div className="stat-detail">Total bajo tu supervisión</div>
            </motion.div>

            <motion.div className="stat-card" variants={itemVariants}>
              <div className="stat-header">
                <h3><FiCalendar style={{ marginRight: 8 }} />Clases Hoy</h3>
                <span className="trend warning">2 en curso</span>
              </div>
              <div className="stat-value">{stats.todayClasses}</div>
              <div className="stat-detail">Sesiones programadas</div>
            </motion.div>

            <motion.div className="stat-card" variants={itemVariants}>
              <div className="stat-header">
                <h3><FiCheckCircle style={{ marginRight: 8 }} />Sesiones</h3>
                <span className="trend positive">+28%</span>
              </div>
              <div className="stat-value highlight">{stats.completedSessions}</div>
              <div className="stat-detail">Completadas este mes</div>
            </motion.div>

            <motion.div className="stat-card" variants={itemVariants}>
              <div className="stat-header">
                <h3><FiAward style={{ marginRight: 8 }} />Calificación</h3>
                <span className="trend positive">⭐ Top Trainer</span>
              </div>
              <div className="stat-value">{stats.avgRating}/5</div>
              <div className="stat-detail">Promedio de evaluaciones</div>
            </motion.div>
          </motion.div>

          {/* Contenido Principal */}
          <div className="charts-row" style={{ marginTop: '25px' }}>
            {/* Agenda del Día */}
            <motion.div 
              className="chart-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="chart-header">
                <h3><FiClock style={{ marginRight: 8 }} />Agenda de Hoy</h3>
                <button className="btn-outline-small">Ver semana completa</button>
              </div>
              
              <div className="exercises-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {todaySchedule.map((session, index) => (
                  <motion.div 
                    key={index}
                    className="exercise-item"
                    style={{ 
                      opacity: session.status === 'completed' ? 0.6 : 1,
                      borderLeft: `3px solid ${getStatusColor(session.status)}`
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="exercise-checkbox">
                      <div style={{ 
                        width: '40px', 
                        height: '40px',
                        background: 'var(--bg-input-dark)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '13px',
                        color: 'var(--accent-color)'
                      }}>
                        {session.time}
                      </div>
                    </div>
                    <div className="exercise-details">
                      <span className="exercise-name">{session.client}</span>
                      <span className="exercise-sets" style={{ color: getStatusColor(session.status) }}>
                        {session.type} • {getStatusText(session.status)}
                      </span>
                    </div>
                    <div className="exercise-action">
                      <button className="action-link">Ver detalles</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Progreso de Clientes */}
            <motion.div 
              className="chart-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="chart-header">
                <h3><FiTrendingUp style={{ marginRight: 8 }} />Progreso de Clientes</h3>
                <span className="trend positive">Promedio: 79%</span>
              </div>
              
              <div style={{ padding: '10px 0' }}>
                {recentClients.map((client, index) => (
                  <motion.div 
                    key={index}
                    style={{ 
                      padding: '15px',
                      marginBottom: '10px',
                      background: 'var(--bg-input-dark)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-dark)'
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (index * 0.05) }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontWeight: '600', display: 'block' }}>{client.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Última sesión: {client.lastSession} • 🔥 {client.streak} días
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: client.progress >= 80 ? 'var(--success-color)' : 'var(--accent-color)'
                      }}>
                        {client.progress}%
                      </span>
                    </div>
                    <div style={{ 
                      height: '6px', 
                      background: 'var(--border-dark)', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <motion.div 
                        style={{ 
                          height: '100%', 
                          background: client.progress >= 80 ? 'var(--success-color)' : 'var(--accent-color)',
                          borderRadius: '3px'
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${client.progress}%` }}
                        transition={{ delay: 0.5 + (index * 0.05), duration: 0.8 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Acciones Rápidas */}
          <motion.div 
            className="table-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="section-header">
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Acciones Rápidas</h3>
            </div>
            
            <div className="custom-table-container">
              <div style={{ 
                padding: '20px', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                gap: '15px' 
              }}>
                {[
                  { icon: "📝", title: "Nueva Rutina", desc: "Crear plan" },
                  { icon: "📊", title: "Reportes", desc: "Ver estadísticas" },
                  { icon: "💬", title: "Mensajes", desc: "3 sin leer" },
                  { icon: "🎯", title: "Objetivos", desc: "Seguimiento" }
                ].map((action, idx) => (
                  <motion.button
                    key={idx}
                    style={{ 
                      padding: '20px', 
                      background: 'var(--bg-input-dark)', 
                      borderRadius: '8px',
                      border: '1px solid var(--border-dark)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    whileHover={{ scale: 1.03, borderColor: 'var(--accent-color)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{action.icon}</div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{action.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{action.desc}</div>
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