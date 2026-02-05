import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUsers, 
  FiSearch, 
  FiTrendingUp, 
  FiTrendingDown,
  FiEdit,
  FiEye,
  FiBarChart2,
  FiAward,
  FiTarget,
  FiActivity,
  FiX
} from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function TrainerClients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const clients = [
    { 
      id: 1, 
      name: "María González", 
      age: 28, 
      goal: "Pérdida de peso",
      progress: 85, 
      lastSession: "Hoy",
      streak: 12,
      sessionsTotal: 48,
      attendance: 96,
      status: "active",
      trend: "up",
      stats: {
        weight: { initial: 75, current: 68, goal: 65 },
        muscle: { initial: 32, current: 35, goal: 38 },
        fat: { initial: 30, current: 24, goal: 20 }
      }
    },
    { 
      id: 2, 
      name: "Carlos Ruiz", 
      age: 35, 
      goal: "Ganancia muscular",
      progress: 72, 
      lastSession: "Hoy",
      streak: 8,
      sessionsTotal: 32,
      attendance: 88,
      status: "active",
      trend: "up",
      stats: {
        weight: { initial: 70, current: 76, goal: 80 },
        muscle: { initial: 35, current: 42, goal: 45 },
        fat: { initial: 18, current: 16, goal: 14 }
      }
    },
    { 
      id: 3, 
      name: "Ana Martínez", 
      age: 42, 
      goal: "Acondicionamiento",
      progress: 91, 
      lastSession: "Ayer",
      streak: 15,
      sessionsTotal: 64,
      attendance: 94,
      status: "active",
      trend: "up",
      stats: {
        weight: { initial: 65, current: 63, goal: 62 },
        muscle: { initial: 28, current: 32, goal: 34 },
        fat: { initial: 28, current: 22, goal: 20 }
      }
    },
    { 
      id: 4, 
      name: "Luis Hernández", 
      age: 31, 
      goal: "Fuerza funcional",
      progress: 68, 
      lastSession: "Hace 2 días",
      streak: 5,
      sessionsTotal: 28,
      attendance: 82,
      status: "active",
      trend: "stable",
      stats: {
        weight: { initial: 85, current: 82, goal: 78 },
        muscle: { initial: 40, current: 43, goal: 46 },
        fat: { initial: 25, current: 22, goal: 18 }
      }
    },
    { 
      id: 5, 
      name: "Pedro Sánchez", 
      age: 29, 
      goal: "Resistencia",
      progress: 79, 
      lastSession: "Hace 3 días",
      streak: 10,
      sessionsTotal: 40,
      attendance: 90,
      status: "active",
      trend: "up",
      stats: {
        weight: { initial: 72, current: 70, goal: 68 },
        muscle: { initial: 33, current: 36, goal: 38 },
        fat: { initial: 22, current: 19, goal: 16 }
      }
    },
    { 
      id: 6, 
      name: "Sofía Torres", 
      age: 26, 
      goal: "Tonificación",
      progress: 55, 
      lastSession: "Hace 5 días",
      streak: 3,
      sessionsTotal: 20,
      attendance: 75,
      status: "warning",
      trend: "down",
      stats: {
        weight: { initial: 60, current: 59, goal: 57 },
        muscle: { initial: 25, current: 27, goal: 30 },
        fat: { initial: 26, current: 24, goal: 20 }
      }
    }
  ];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return <FiTrendingUp style={{ color: 'var(--success-color)' }} />;
      case 'down': return <FiTrendingDown style={{ color: 'var(--error-color)' }} />;
      default: return <FiActivity style={{ color: 'var(--text-secondary)' }} />;
    }
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
            <h2>Mis Clientes</h2>
            <p>Gestiona y monitorea el progreso de tus clientes</p>
          </div>
          <FiUsers size={50} style={{ color: 'var(--accent-color)', opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* KPIs Resumen */}
      <motion.div 
        className="kpi-grid" 
        style={{ marginTop: '25px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Total Clientes</h3>
          </div>
          <div className="stat-value highlight">{clients.length}</div>
          <div className="stat-detail">Activos en el programa</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Progreso Promedio</h3>
          </div>
          <div className="stat-value">
            {Math.round(clients.reduce((acc, c) => acc + c.progress, 0) / clients.length)}%
          </div>
          <div className="stat-detail">Hacia sus objetivos</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Asistencia</h3>
          </div>
          <div className="stat-value">
            {Math.round(clients.reduce((acc, c) => acc + c.attendance, 0) / clients.length)}%
          </div>
          <div className="stat-detail">Tasa de asistencia</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Sesiones Totales</h3>
          </div>
          <div className="stat-value highlight">
            {clients.reduce((acc, c) => acc + c.sessionsTotal, 0)}
          </div>
          <div className="stat-detail">Este mes</div>
        </motion.div>
      </motion.div>

      {/* Búsqueda y Filtros */}
      <motion.div 
        className="chart-card"
        style={{ marginTop: '25px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-dark-container with-icon" style={{ flex: 1, minWidth: '250px' }}>
            <FiSearch size={18} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm("")}>
                <FiX />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'active', 'warning'].map(status => (
              <motion.button
                key={status}
                className={`btn-outline-small ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
                style={{
                  background: filterStatus === status ? 'var(--accent-color)' : 'transparent',
                  color: filterStatus === status ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  borderColor: filterStatus === status ? 'var(--accent-color)' : 'var(--border-dark)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {status === 'all' ? 'Todos' : status === 'active' ? 'Activos' : 'Atención'}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Lista de Clientes */}
      <motion.div 
        className="chart-card"
        style={{ marginTop: '20px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="chart-header">
          <h3>Clientes ({filteredClients.length})</h3>
        </div>

        <motion.div 
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px', marginTop: '20px' }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredClients.map((client, idx) => (
            <motion.div
              key={client.id}
              variants={itemVariants}
              className="member-card-hover"
              style={{
                background: 'var(--input-bg-dark)',
                border: `1px solid var(--border-dark)`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedClient(client)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className="avatar" style={{ width: '50px', height: '50px', fontSize: '18px' }}>
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                      {client.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {client.age} años • {client.goal}
                    </p>
                  </div>
                </div>
                {getTrendIcon(client.trend)}
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '10px',
                marginBottom: '15px',
                fontSize: '12px'
              }}>
                <div style={{ 
                  background: 'var(--bg-card-dark)', 
                  padding: '8px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Racha</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-color)' }}>
                    {client.streak} días
                  </div>
                </div>
                <div style={{ 
                  background: 'var(--bg-card-dark)', 
                  padding: '8px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Asistencia</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success-color)' }}>
                    {client.attendance}%
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  marginBottom: '6px'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Progreso</span>
                  <span style={{ 
                    fontWeight: '700',
                    color: client.progress >= 80 ? 'var(--success-color)' : 'var(--accent-color)'
                  }}>
                    {client.progress}%
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
                      background: client.progress >= 80 ? 'var(--success-color)' : 'var(--accent-color)',
                      borderRadius: '3px'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${client.progress}%` }}
                    transition={{ delay: 0.3 + (idx * 0.05), duration: 0.8 }}
                  />
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                paddingTop: '15px',
                borderTop: '1px solid var(--border-dark)',
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}>
                <span>Última sesión: {client.lastSession}</span>
                <span>{client.sessionsTotal} sesiones</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredClients.length === 0 && (
          <div className="empty-state">
            <FiUsers size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
            <h3>No se encontraron clientes</h3>
            <p>Intenta con otro término de búsqueda o ajusta los filtros</p>
          </div>
        )}
      </motion.div>

      {/* Modal de Detalle del Cliente */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedClient(null)}
          >
            <motion.div
              style={{
                background: 'var(--bg-card-dark)',
                borderRadius: '16px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '1px solid var(--border-dark)'
              }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                padding: '25px',
                borderBottom: '1px solid var(--border-dark)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div className="avatar" style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                    {selectedClient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', marginBottom: '5px' }}>{selectedClient.name}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {selectedClient.age} años • {selectedClient.goal}
                    </p>
                  </div>
                </div>
                <motion.button
                  className="icon-btn"
                  onClick={() => setSelectedClient(null)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX size={20} />
                </motion.button>
              </div>

              <div style={{ padding: '25px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>
                  Estadísticas de Progreso
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {Object.entries(selectedClient.stats).map(([key, values]) => (
                    <div key={key}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                        fontSize: '14px'
                      }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                          {key === 'weight' ? 'Peso (kg)' : key === 'muscle' ? 'Masa Muscular (%)' : 'Grasa Corporal (%)'}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {values.initial} → {values.current} / {values.goal}
                        </span>
                      </div>
                      <div style={{ 
                        height: '8px', 
                        background: 'var(--bg-main-dark)', 
                        borderRadius: '4px',
                        position: 'relative'
                      }}>
                        <motion.div 
                          style={{ 
                            height: '100%',
                            background: 'var(--accent-color)',
                            borderRadius: '4px',
                            position: 'absolute'
                          }}
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${((values.current - values.initial) / (values.goal - values.initial)) * 100}%` 
                          }}
                          transition={{ delay: 0.2, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ 
                  marginTop: '25px',
                  display: 'flex',
                  gap: '10px'
                }}>
                  <motion.button
                    className="btn-compact-primary"
                    style={{ flex: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiEdit size={16} />
                    Editar Perfil
                  </motion.button>
                  <motion.button
                    className="btn-compact-primary"
                    style={{ flex: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiBarChart2 size={16} />
                    Ver Historial
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
