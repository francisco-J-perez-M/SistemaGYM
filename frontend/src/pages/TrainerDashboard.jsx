import { useState, useEffect } from "react";
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
  FiX,
  FiAlertCircle
} from "react-icons/fi";
import trainerService from "../services/trainerService";
import "../css/CSSUnificado.css";

export default function TrainerClients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar clientes al montar el componente
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientsData = await trainerService.getClients();
      setClients(clientsData);
    } catch (err) {
      setError(err.message || 'Error al cargar clientes');
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Calcular KPIs desde los datos reales
  const totalClients = clients.length;
  const averageProgress = clients.length > 0 
    ? Math.round(clients.reduce((acc, c) => acc + c.progress, 0) / clients.length)
    : 0;
  const averageAttendance = clients.length > 0
    ? Math.round(clients.reduce((acc, c) => acc + c.attendance, 0) / clients.length)
    : 0;
  const totalSessions = clients.reduce((acc, c) => acc + c.sessionsTotal, 0);

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <motion.div 
            className="spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>
            Cargando clientes...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-content">
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="empty-state">
            <FiAlertCircle size={48} style={{ color: 'var(--error-color)', marginBottom: '15px' }} />
            <h3>Error al cargar los datos</h3>
            <p>{error}</p>
            <motion.button
              className="btn-compact-primary"
              onClick={loadClients}
              style={{ marginTop: '20px' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Reintentar
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

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
          <div className="stat-value highlight">{totalClients}</div>
          <div className="stat-detail">Activos en el programa</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Progreso Promedio</h3>
          </div>
          <div className="stat-value">{averageProgress}%</div>
          <div className="stat-detail">Hacia sus objetivos</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Asistencia</h3>
          </div>
          <div className="stat-value">{averageAttendance}%</div>
          <div className="stat-detail">Tasa de asistencia</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Sesiones Totales</h3>
          </div>
          <div className="stat-value highlight">{totalSessions}</div>
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
                  {Object.entries(selectedClient.stats).map(([key, values]) => {
                    // Solo mostrar si hay datos válidos
                    if (values.initial === 0 && values.current === 0 && values.goal === 0) {
                      return null;
                    }
                    
                    return (
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
                              width: `${Math.min(((values.current - values.initial) / (values.goal - values.initial)) * 100, 100)}%` 
                            }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                          />
                        </div>
                      </div>
                    );
                  })}
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