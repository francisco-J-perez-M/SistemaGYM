import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiChevronLeft, 
  FiChevronRight,
  FiPlus,
  FiMapPin,
  FiVideo,
  FiCheck,
  FiX
} from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function TrainerSchedule() {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  // Generar días de la semana
  const getWeekDays = (weekOffset = 0) => {
    const days = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push({
        date: day,
        dayName: day.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNumber: day.getDate(),
        isToday: day.toDateString() === today.toDateString()
      });
    }
    return days;
  };

  const weekDays = getWeekDays(currentWeek);

  // Datos de sesiones por día
  const sessions = {
    0: [ // Domingo
      { time: "10:00", client: "María González", type: "Personal", duration: "60 min", location: "Sala 1", status: "confirmed" },
    ],
    1: [ // Lunes
      { time: "08:00", client: "Carlos Ruiz", type: "Personal", duration: "60 min", location: "Sala 2", status: "confirmed" },
      { time: "10:00", client: "Grupo Funcional", type: "Grupal", duration: "90 min", location: "Sala Principal", status: "confirmed" },
      { time: "16:00", client: "Ana Martínez", type: "Personal", duration: "45 min", location: "Online", status: "pending" },
    ],
    2: [ // Martes
      { time: "09:00", client: "Luis Hernández", type: "Personal", duration: "60 min", location: "Sala 1", status: "confirmed" },
      { time: "11:00", client: "Spinning Matutino", type: "Grupal", duration: "60 min", location: "Sala Cycling", status: "confirmed" },
      { time: "17:00", client: "Pedro Sánchez", type: "Personal", duration: "45 min", location: "Sala 2", status: "confirmed" },
    ],
    3: [ // Miércoles
      { time: "08:00", client: "Sofía Torres", type: "Personal", duration: "60 min", location: "Sala 1", status: "confirmed" },
      { time: "14:00", client: "CrossFit Iniciación", type: "Grupal", duration: "90 min", location: "Box", status: "confirmed" },
      { time: "18:00", client: "Roberto Díaz", type: "Personal", duration: "60 min", location: "Online", status: "pending" },
    ],
    4: [ // Jueves
      { time: "07:00", client: "Entrenamiento Funcional", type: "Grupal", duration: "60 min", location: "Sala Principal", status: "confirmed" },
      { time: "10:00", client: "Elena Morales", type: "Personal", duration: "45 min", location: "Sala 2", status: "confirmed" },
      { time: "16:30", client: "Yoga & Fuerza", type: "Grupal", duration: "75 min", location: "Sala Yoga", status: "confirmed" },
    ],
    5: [ // Viernes
      { time: "09:00", client: "Javier López", type: "Personal", duration: "60 min", location: "Sala 1", status: "confirmed" },
      { time: "11:00", client: "HIIT Avanzado", type: "Grupal", duration: "60 min", location: "Sala Principal", status: "confirmed" },
      { time: "17:00", client: "Carmen Vega", type: "Personal", duration: "45 min", location: "Online", status: "pending" },
    ],
    6: [ // Sábado
      { time: "10:00", client: "Bootcamp Fin de Semana", type: "Grupal", duration: "90 min", location: "Exterior", status: "confirmed" },
      { time: "12:00", client: "Consulta Nutricional", type: "Consulta", duration: "30 min", location: "Despacho", status: "confirmed" },
    ]
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'var(--success-color)';
      case 'pending': return 'var(--warning-color)';
      case 'cancelled': return 'var(--error-color)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
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
            <h2>Agenda y Calendario</h2>
            <p>Gestiona tus sesiones y horarios semanales</p>
          </div>
          <FiCalendar size={50} style={{ color: 'var(--accent-color)', opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* Navegación de Semana */}
      <motion.div 
        className="chart-card"
        style={{ marginTop: '25px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>
              Semana del {weekDays[0].date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Total de sesiones: {Object.values(sessions).flat().length}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <motion.button
              className="icon-btn"
              onClick={() => setCurrentWeek(currentWeek - 1)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiChevronLeft size={18} />
            </motion.button>
            <motion.button
              className="btn-compact-primary"
              onClick={() => setCurrentWeek(0)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Hoy
            </motion.button>
            <motion.button
              className="icon-btn"
              onClick={() => setCurrentWeek(currentWeek + 1)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiChevronRight size={18} />
            </motion.button>
          </div>
        </div>

        {/* Días de la semana */}
        <motion.div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '12px',
            marginBottom: '20px'
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {weekDays.map((day, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              onClick={() => setSelectedDay(index)}
              style={{
                background: day.isToday 
                  ? 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))'
                  : selectedDay === index 
                    ? 'var(--input-bg-dark)' 
                    : 'var(--bg-card-dark)',
                border: `2px solid ${selectedDay === index ? 'var(--accent-color)' : 'var(--border-dark)'}`,
                borderRadius: '12px',
                padding: '15px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              whileHover={{ scale: 1.05, borderColor: 'var(--accent-color)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '600',
                textTransform: 'uppercase',
                marginBottom: '8px',
                color: day.isToday ? 'var(--text-on-accent)' : 'var(--text-secondary)'
              }}>
                {day.dayName}
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '700',
                color: day.isToday ? 'var(--text-on-accent)' : 'var(--text-primary)'
              }}>
                {day.dayNumber}
              </div>
              <div style={{ 
                fontSize: '10px',
                marginTop: '8px',
                padding: '3px 6px',
                background: day.isToday ? 'rgba(0,0,0,0.2)' : 'rgba(251, 227, 121, 0.1)',
                borderRadius: '6px',
                color: day.isToday ? 'var(--text-on-accent)' : 'var(--accent-color)'
              }}>
                {sessions[index]?.length || 0} sesiones
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Lista de sesiones del día seleccionado */}
      <AnimatePresence mode="wait">
        {selectedDay !== null && (
          <motion.div
            className="chart-card"
            style={{ marginTop: '20px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="chart-header">
              <h3>
                <FiClock style={{ marginRight: 8 }} />
                Sesiones del {weekDays[selectedDay].dayName} {weekDays[selectedDay].dayNumber}
              </h3>
              <motion.button
                className="btn-compact-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlus size={16} />
                Nueva Sesión
              </motion.button>
            </div>

            <div style={{ marginTop: '20px' }}>
              {sessions[selectedDay]?.length > 0 ? (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  {sessions[selectedDay].map((session, idx) => (
                    <motion.div
                      key={idx}
                      variants={itemVariants}
                      style={{
                        background: 'var(--input-bg-dark)',
                        border: `1px solid var(--border-dark)`,
                        borderLeft: `4px solid ${getStatusColor(session.status)}`,
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr auto',
                        gap: '20px',
                        alignItems: 'center'
                      }}
                      whileHover={{ 
                        borderColor: 'var(--accent-color)',
                        transform: 'translateX(5px)'
                      }}
                    >
                      {/* Hora */}
                      <div style={{ textAlign: 'center' }}>
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
                          marginTop: '4px'
                        }}>
                          {session.duration}
                        </div>
                      </div>

                      {/* Detalles */}
                      <div>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600',
                          marginBottom: '8px'
                        }}>
                          {session.client}
                        </h4>
                        <div style={{ 
                          display: 'flex', 
                          gap: '15px',
                          fontSize: '13px',
                          color: 'var(--text-secondary)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiUser size={14} />
                            {session.type}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {session.location === 'Online' ? <FiVideo size={14} /> : <FiMapPin size={14} />}
                            {session.location}
                          </div>
                          <div style={{ 
                            padding: '2px 8px',
                            background: `${getStatusColor(session.status)}20`,
                            color: getStatusColor(session.status),
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {getStatusText(session.status)}
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <motion.button
                          className="icon-btn"
                          style={{ background: 'rgba(76, 217, 100, 0.1)', color: 'var(--success-color)' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FiCheck size={18} />
                        </motion.button>
                        <motion.button
                          className="icon-btn danger"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FiX size={18} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="empty-state">
                  <FiCalendar size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
                  <h3>No hay sesiones programadas</h3>
                  <p>Este día está libre. ¿Quieres agregar una nueva sesión?</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
