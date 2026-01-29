import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../css/CSSUnificado.css";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("progress");
  const [workoutData, setWorkoutData] = useState({
    currentWeek: 3,
    totalWorkouts: 12,
    caloriesBurned: 2450,
    streakDays: 7,
  });
  
  const [todayWorkout, setTodayWorkout] = useState({
    type: "Pierna",
    exercises: [
      { name: "Sentadillas", sets: "4x12", completed: true },
      { name: "Prensa", sets: "3x15", completed: true },
      { name: "Extensiones", sets: "3x12", completed: false },
      { name: "Curl Femoral", sets: "4x10", completed: false },
      { name: "Elevación de Talones", sets: "5x20", completed: false }
    ]
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(storedUser));
    
    // Simular carga de datos
    const timer = setTimeout(() => {
      setWorkoutData({
        currentWeek: 3,
        totalWorkouts: 12,
        caloriesBurned: 2450,
        streakDays: 7,
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const toggleExercise = (index) => {
    const updatedExercises = [...todayWorkout.exercises];
    updatedExercises[index].completed = !updatedExercises[index].completed;
    setTodayWorkout({ ...todayWorkout, exercises: updatedExercises });
  };

  const calculateProgress = () => {
    const completed = todayWorkout.exercises.filter(ex => ex.completed).length;
    return Math.round((completed / todayWorkout.exercises.length) * 100);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar 
        role="user"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="main-wrapper">
        <header className="top-header">
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
            <div className="user-profile">
              <div className="avatar">
                {user.nombre.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="user-info">
                <span className="name">{user.nombre}</span>
                <span className="role">{user.role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          {/* Banner de Bienvenida con Progreso */}
          <div className="welcome-section">
            <div className="welcome-content">
              <div className="welcome-text">
                <h2>Hoy es día de {todayWorkout.type} </h2>
                <p>Completa tu rutina para mantener tu racha de {workoutData.streakDays} días</p>
              </div>
              <div className="circular-progress" style={{ width: '80px', height: '80px' }}>
                <div className="inner-circle">
                  <span className="percentage">{calculateProgress()}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="kpi-grid" style={{ marginTop: '25px' }}>
            <div className="stat-card highlight-border">
              <div className="stat-header">
                <h3>Racha Actual</h3>
                <span className="trend positive"> {workoutData.streakDays} días</span>
              </div>
              <div className="stat-value">{workoutData.streakDays}</div>
              <div className="stat-detail">Días consecutivos entrenando</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3>Entrenamientos</h3>
                <span className="trend positive">+12%</span>
              </div>
              <div className="stat-value">{workoutData.totalWorkouts}</div>
              <div className="stat-detail">Total esta semana</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3>Calorías</h3>
                <span className="trend warning">Meta: 3000</span>
              </div>
              <div className="stat-value highlight">{workoutData.caloriesBurned}</div>
              <div className="stat-detail">Quemadas hoy</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3>Semana</h3>
                <span className="trend positive">Al día</span>
              </div>
              <div className="stat-value">{workoutData.currentWeek}/4</div>
              <div className="stat-detail">Semanas completadas</div>
            </div>
          </div>

          {/* Contenido Principal - Rutina de Hoy */}
          <div className="charts-row" style={{ marginTop: '25px' }}>
            <div className="chart-card">
              <div className="chart-header">
                <h3>Rutina de Hoy - {todayWorkout.type}</h3>
                <button className="btn-outline-small">Ver rutina completa</button>
              </div>
              
              <div className="exercises-list">
                {todayWorkout.exercises.map((exercise, index) => (
                  <div 
                    key={index} 
                    className={`exercise-item ${exercise.completed ? 'completed' : ''}`}
                    onClick={() => toggleExercise(index)}
                  >
                    <div className="exercise-checkbox">
                      <div className={`checkbox ${exercise.completed ? 'checked' : ''}`}>
                        {exercise.completed && '✓'}
                      </div>
                    </div>
                    <div className="exercise-details">
                      <span className="exercise-name">{exercise.name}</span>
                      <span className="exercise-sets">{exercise.sets}</span>
                    </div>
                    <div className="exercise-action">
                      <button className="action-link">Ver técnica</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Progreso Semanal</h3>
                <span className="trend positive">+8.5%</span>
              </div>
              
              <div className="css-bar-chart" style={{ height: '180px' }}>
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => {
                  const height = [65, 80, 70, 90, 85, 40, 75][index];
                  const isToday = index === new Date().getDay() - 1;
                  
                  return (
                    <div key={day} className="bar-group">
                      <div 
                        className={`bar income ${isToday ? 'today' : ''}`} 
                        style={{ 
                          height: `${height}%`,
                          backgroundColor: isToday ? 'var(--accent-color)' : 'rgba(251, 227, 121, 0.7)'
                        }}
                      >
                        <span className="tooltip">{height}% completado</span>
                      </div>
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
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-color)' }}>78%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--border-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: '78%', 
                    height: '100%', 
                    background: 'var(--accent-color)',
                    borderRadius: '3px'
                  }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Últimos Logros */}
          <div className="table-section">
            <div className="section-header">
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Logros Recientes</h3>
              <button className="btn-outline-small">Ver todos</button>
            </div>
            
            <div className="custom-table-container">
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                <div style={{ 
                  padding: '15px', 
                  background: 'var(--bg-input-dark)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-dark)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ 
                      width: '30px', 
                      height: '30px', 
                      background: 'rgba(251, 227, 121, 0.1)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-color)'
                    }}>
                      
                    </div>
                    <span style={{ fontWeight: '600' }}>Racha de 7 días</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Completado hoy
                  </span>
                </div>
                
                <div style={{ 
                  padding: '15px', 
                  background: 'var(--bg-input-dark)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-dark)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ 
                      width: '30px', 
                      height: '30px', 
                      background: 'rgba(76, 217, 100, 0.1)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--success-color)'
                    }}>
                      💪
                    </div>
                    <span style={{ fontWeight: '600' }}>+12% Peso Muerto</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Mejor marca personal
                  </span>
                </div>
                
                <div style={{ 
                  padding: '15px', 
                  background: 'var(--bg-input-dark)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-dark)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ 
                      width: '30px', 
                      height: '30px', 
                      background: 'rgba(255, 189, 46, 0.1)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--warning-color)'
                    }}>
                      
                    </div>
                    <span style={{ fontWeight: '600' }}>Entrenamiento Express</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Menos de 45 minutos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}