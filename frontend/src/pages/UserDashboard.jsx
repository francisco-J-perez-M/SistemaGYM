import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaFire, 
  FaDumbbell, 
  FaBolt, 
  FaWeight,
  FaCalendarCheck,
  FaTrophy,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaRunning,
  FaExclamationTriangle,
  FaSpinner,
  FaUser
} from "react-icons/fa";
import { 
  IoMdCheckmarkCircle,
  IoMdClose 
} from "react-icons/io";
import { MdFitnessCenter } from "react-icons/md";
import "../css/CSSUnificado.css";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workoutData, setWorkoutData] = useState({
    currentWeek: 0,
    totalWorkouts: 0,
    caloriesBurned: 0,
    streakDays: 0,
    currentWeight: 0
  });
  
  const [todayWorkout, setTodayWorkout] = useState({
    type: "Cargando...",
    exercises: []
  });

  const [weeklyProgress, setWeeklyProgress] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [achievements, setAchievements] = useState([]);
  const [membership, setMembership] = useState(null);
  const [showCheckinSuccess, setShowCheckinSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (!storedUser || !token) {
      window.location.href = "/";
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchDashboardData(token);
  }, []);

  const fetchDashboardData = async (token) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los datos del dashboard');
      }

      const data = await response.json();
      
      setWorkoutData(data.workoutStats);
      setTodayWorkout(data.todayWorkout);
      setWeeklyProgress(data.weeklyProgress);
      setAchievements(data.achievements);
      setMembership(data.membership);
      
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const toggleExercise = async (index) => {
    const updatedExercises = [...todayWorkout.exercises];
    updatedExercises[index].completed = !updatedExercises[index].completed;
    setTodayWorkout({ ...todayWorkout, exercises: updatedExercises });

    try {
      const token = localStorage.getItem("token");
      await fetch('/api/user/workout/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exercise_name: updatedExercises[index].name,
          completed: updatedExercises[index].completed
        })
      });
    } catch (err) {
      console.error('Error al actualizar ejercicio:', err);
    }
  };

  const handleCheckin = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/user/checkin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowCheckinSuccess(true);
        setTimeout(() => setShowCheckinSuccess(false), 3000);
        fetchDashboardData(token);
      } else {
        alert(data.message || 'Error al registrar asistencia');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al registrar asistencia');
    }
  };

  const calculateProgress = () => {
    if (todayWorkout.exercises.length === 0) return 0;
    const completed = todayWorkout.exercises.filter(ex => ex.completed).length;
    return Math.round((completed / todayWorkout.exercises.length) * 100);
  };

  const calculateWeeklyProgress = () => {
    if (weeklyProgress.length === 0) return 0;
    const total = weeklyProgress.reduce((sum, day) => sum + day, 0);
    return Math.round(total / weeklyProgress.length);
  };

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const cardVariants = {
    hover: { 
      scale: 1.02,
      boxShadow: "0 8px 30px rgba(251, 227, 121, 0.2)",
      transition: { type: "spring", stiffness: 300 }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <motion.div 
          style={{ textAlign: 'center' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FaSpinner size={50} color="var(--accent-color)" />
          </motion.div>
          <p style={{ marginTop: '20px' }}>Cargando dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-layout" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <motion.div 
          style={{ 
            textAlign: 'center',
            padding: '30px',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--error-color)'
          }}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FaExclamationTriangle size={50} color="var(--error-color)" style={{ marginBottom: '15px' }} />
          <h2 style={{ color: 'var(--error-color)', marginBottom: '15px' }}>Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: 'var(--accent-color)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#000',
              fontWeight: '600'
            }}
          >
            Reintentar
          </button>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-layout">
      <AnimatePresence>
        {showCheckinSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'var(--success-color)',
              color: 'white',
              padding: '15px 25px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 1000,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            <IoMdCheckmarkCircle size={24} />
            <span style={{ fontWeight: '600' }}>¡Check-in registrado exitosamente!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="main-wrapper">
        <motion.header 
          className="top-header"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="page-title">¡Hola, {user.nombre}!</h2>

          <div className="header-right">
            <div className="date-display">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            
            <motion.button 
              onClick={handleCheckin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '10px 20px',
                marginRight: '15px',
                background: 'var(--success-color)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaCheckCircle size={16} />
              Check-in
            </motion.button>

            <div className="user-profile">
              <div className="avatar">
                {user.foto_perfil ? (
                  <img src={`/static/uploads/${user.foto_perfil}`} alt={user.nombre} />
                ) : (
                  <FaUser size={20} />
                )}
              </div>
              <div className="user-info">
                <span className="name">{user.nombre}</span>
                <span className="role">{user.role}</span>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="dashboard-content">
          {/* Alerta de membresía */}
          <AnimatePresence>
            {membership && membership.dias_restantes <= 7 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  padding: '15px',
                  background: 'rgba(255, 189, 46, 0.1)',
                  border: '1px solid var(--warning-color)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <FaExclamationTriangle size={24} color="var(--warning-color)" />
                <div>
                  <strong>Atención:</strong> Tu membresía <strong>{membership.plan}</strong> vence 
                  en <strong>{membership.dias_restantes} días</strong> ({membership.fecha_fin})
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Banner de Bienvenida */}
          <motion.div 
            className="welcome-section"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="welcome-content">
              <div className="welcome-text">
                <h2>
                  Hoy es día de {todayWorkout.type} 
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    style={{ display: 'inline-block', marginLeft: '8px' }}
                  >
                    <MdFitnessCenter size={28} />
                  </motion.span>
                </h2>
                <p>Completa tu rutina para mantener tu racha de {workoutData.streakDays} días</p>
              </div>
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="var(--border-dark)"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="var(--accent-color)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 220" }}
                    animate={{ 
                      strokeDasharray: `${(calculateProgress() / 100) * 220} 220` 
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--accent-color)'
                }}>
                  {calculateProgress()}%
                </div>
              </div>
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
            <motion.div 
              className="stat-card highlight-border"
              variants={itemVariants}
              whileHover="hover"
            >
              <div className="stat-header">
                <h3>Racha Actual</h3>
                <motion.span 
                  className="trend positive"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FaFire size={16} style={{ marginRight: '5px' }} />
                  {workoutData.streakDays} días
                </motion.span>
              </div>
              <div className="stat-value">{workoutData.streakDays}</div>
              <div className="stat-detail">Días consecutivos entrenando</div>
            </motion.div>

            <motion.div 
              className="stat-card"
              variants={itemVariants}
              whileHover="hover"
            >
              <div className="stat-header">
                <h3>Entrenamientos</h3>
                <span className="trend positive">
                  <FaChartLine size={14} style={{ marginRight: '5px' }} />
                  +{workoutData.totalWorkouts > 0 ? '12%' : '0%'}
                </span>
              </div>
              <div className="stat-value">{workoutData.totalWorkouts}</div>
              <div className="stat-detail">Total este mes</div>
            </motion.div>

            <motion.div 
              className="stat-card"
              variants={itemVariants}
              whileHover="hover"
            >
              <div className="stat-header">
                <h3>Calorías</h3>
                <span className="trend warning">
                  <FaBolt size={14} style={{ marginRight: '5px' }} />
                  Meta: 3000
                </span>
              </div>
              <div className="stat-value highlight">{workoutData.caloriesBurned}</div>
              <div className="stat-detail">Quemadas este mes</div>
            </motion.div>

            <motion.div 
              className="stat-card"
              variants={itemVariants}
              whileHover="hover"
            >
              <div className="stat-header">
                <h3>Peso Actual</h3>
                <span className="trend positive">
                  <FaWeight size={14} style={{ marginRight: '5px' }} />
                  Progreso
                </span>
              </div>
              <div className="stat-value">
                {workoutData.currentWeight > 0 ? workoutData.currentWeight.toFixed(1) : '0.0'}
              </div>
              <div className="stat-detail">Kilogramos</div>
            </motion.div>
          </motion.div>

          {/* Rutina y Progreso */}
          <div className="charts-row" style={{ marginTop: '25px' }}>
            <motion.div 
              className="chart-card"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="chart-header">
                <h3>
                  <FaDumbbell size={18} style={{ marginRight: '8px' }} />
                  Rutina de Hoy - {todayWorkout.type}
                </h3>
                <button className="btn-outline-small">Ver rutina completa</button>
              </div>
              
              {todayWorkout.exercises.length > 0 ? (
                <div className="exercises-list">
                  <AnimatePresence>
                    {todayWorkout.exercises.map((exercise, index) => (
                      <motion.div 
                        key={index}
                        className={`exercise-item ${exercise.completed ? 'completed' : ''}`}
                        onClick={() => toggleExercise(index)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 5, backgroundColor: 'rgba(251, 227, 121, 0.05)' }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="exercise-checkbox">
                          <motion.div 
                            className={`checkbox ${exercise.completed ? 'checked' : ''}`}
                            whileTap={{ scale: 0.9 }}
                          >
                            {exercise.completed && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              >
                                <IoMdCheckmarkCircle size={20} />
                              </motion.div>
                            )}
                          </motion.div>
                        </div>
                        <div className="exercise-details">
                          <span className="exercise-name">{exercise.name}</span>
                          <span className="exercise-sets">{exercise.sets}</span>
                        </div>
                        <div className="exercise-action">
                          <button className="action-link">Ver técnica</button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div 
                  style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <FaClock size={40} style={{ marginBottom: '15px', opacity: 0.5 }} />
                  <p>Día de descanso - ¡Tu cuerpo necesita recuperarse!</p>
                </motion.div>
              )}
            </motion.div>

            <motion.div 
              className="chart-card"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="chart-header">
                <h3>
                  <FaCalendarCheck size={18} style={{ marginRight: '8px' }} />
                  Progreso Semanal
                </h3>
                <span className="trend positive">
                  <FaChartLine size={14} style={{ marginRight: '5px' }} />
                  +{calculateWeeklyProgress()}%
                </span>
              </div>
              
              <div className="css-bar-chart" style={{ height: '180px' }}>
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => {
                  const height = weeklyProgress[index] || 0;
                  const isToday = index === new Date().getDay() - 1;
                  
                  return (
                    <div key={day} className="bar-group">
                      <motion.div 
                        className={`bar income ${isToday ? 'today' : ''}`} 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        style={{ 
                          backgroundColor: isToday ? 'var(--accent-color)' : 'rgba(251, 227, 121, 0.7)'
                        }}
                      >
                        <span className="tooltip">{height}% completado</span>
                      </motion.div>
                      <span className="bar-label" style={{ color: isToday ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-input-dark)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Progreso semanal</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-color)' }}>
                    {calculateWeeklyProgress()}%
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--border-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div 
                    style={{ 
                      height: '100%', 
                      background: 'var(--accent-color)',
                      borderRadius: '3px'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateWeeklyProgress()}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Logros */}
          <motion.div 
            className="table-section"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="section-header">
              <h3 style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaTrophy size={18} />
                Logros Recientes
              </h3>
              <button className="btn-outline-small">Ver todos</button>
            </div>
            
            <div className="custom-table-container">
              {achievements.length > 0 ? (
                <motion.div 
                  style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {achievements.map((achievement, index) => (
                    <motion.div 
                      key={index}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05, y: -5 }}
                      style={{ 
                        padding: '15px', 
                        background: 'var(--bg-input-dark)', 
                        borderRadius: '8px',
                        border: '1px solid var(--border-dark)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <motion.div 
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            background: `${achievement.color}20`,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px'
                          }}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          {achievement.icon}
                        </motion.div>
                        <span style={{ fontWeight: '600', flex: 1 }}>{achievement.title}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {achievement.description}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <FaRunning size={40} style={{ marginBottom: '15px', opacity: 0.5 }} />
                  <p>¡Sigue entrenando para desbloquear logros!</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}