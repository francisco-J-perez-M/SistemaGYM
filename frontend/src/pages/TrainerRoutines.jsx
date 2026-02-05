import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiFileText, 
  FiPlus, 
  FiEdit,
  FiTrash2,
  FiCopy,
  FiEye,
  FiSearch,
  FiX,
  FiFilter
} from "react-icons/fi";
import { GiMuscleUp, GiWeightLiftingUp, GiRunningShoe } from "react-icons/gi";
import "../css/CSSUnificado.css";

export default function TrainerRoutines() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");

  const routines = [
    {
      id: 1,
      name: "Fuerza Tren Superior",
      category: "Fuerza",
      icon: <GiWeightLiftingUp />,
      duration: "60 min",
      exercises: 8,
      difficulty: "Intermedio",
      clients: 5,
      lastUsed: "Hoy",
      description: "Rutina enfocada en desarrollo de fuerza en brazos, pecho y espalda",
      exerciseList: [
        { name: "Press de banca", sets: "4x10", rest: "90s" },
        { name: "Dominadas", sets: "3x8", rest: "90s" },
        { name: "Press militar", sets: "4x12", rest: "60s" },
        { name: "Remo con barra", sets: "4x10", rest: "90s" },
        { name: "Curl de bíceps", sets: "3x12", rest: "60s" },
        { name: "Extensión de tríceps", sets: "3x12", rest: "60s" },
        { name: "Elevaciones laterales", sets: "3x15", rest: "45s" },
        { name: "Face pulls", sets: "3x15", rest: "45s" }
      ]
    },
    {
      id: 2,
      name: "Hipertrofia Piernas",
      category: "Hipertrofia",
      icon: <GiMuscleUp />,
      duration: "75 min",
      exercises: 10,
      difficulty: "Avanzado",
      clients: 8,
      lastUsed: "Ayer",
      description: "Programa intensivo para desarrollo muscular en tren inferior",
      exerciseList: [
        { name: "Sentadilla con barra", sets: "5x8", rest: "120s" },
        { name: "Prensa de piernas", sets: "4x12", rest: "90s" },
        { name: "Peso muerto rumano", sets: "4x10", rest: "90s" },
        { name: "Zancadas con mancuernas", sets: "3x12", rest: "60s" },
        { name: "Curl femoral", sets: "4x12", rest: "60s" },
        { name: "Extensión de cuádriceps", sets: "4x15", rest: "60s" },
        { name: "Elevaciones de gemelos sentado", sets: "4x20", rest: "45s" },
        { name: "Elevaciones de gemelos de pie", sets: "4x20", rest: "45s" },
        { name: "Abducción de cadera", sets: "3x15", rest: "45s" },
        { name: "Adducción de cadera", sets: "3x15", rest: "45s" }
      ]
    },
    {
      id: 3,
      name: "HIIT Funcional",
      category: "Cardio",
      icon: <GiRunningShoe />,
      duration: "45 min",
      exercises: 12,
      difficulty: "Intermedio",
      clients: 15,
      lastUsed: "Hace 2 días",
      description: "Entrenamiento de alta intensidad por intervalos",
      exerciseList: [
        { name: "Burpees", sets: "3x15", rest: "30s" },
        { name: "Mountain climbers", sets: "3x30s", rest: "30s" },
        { name: "Jump squats", sets: "3x15", rest: "30s" },
        { name: "Box jumps", sets: "3x12", rest: "45s" },
        { name: "Battle ropes", sets: "3x30s", rest: "30s" },
        { name: "Kettlebell swings", sets: "3x20", rest: "45s" },
        { name: "Sprint en cinta", sets: "4x30s", rest: "60s" },
        { name: "Plancha dinámica", sets: "3x45s", rest: "30s" },
        { name: "Jumping jacks", sets: "3x30", rest: "20s" },
        { name: "High knees", sets: "3x30s", rest: "30s" },
        { name: "Plank to push-up", sets: "3x10", rest: "30s" },
        { name: "Russian twists", sets: "3x30", rest: "30s" }
      ]
    },
    {
      id: 4,
      name: "Core y Estabilidad",
      category: "Funcional",
      icon: <GiMuscleUp />,
      duration: "40 min",
      exercises: 8,
      difficulty: "Principiante",
      clients: 12,
      lastUsed: "Hace 3 días",
      description: "Fortalecimiento de core y mejora de estabilidad corporal",
      exerciseList: [
        { name: "Plancha frontal", sets: "3x60s", rest: "45s" },
        { name: "Plancha lateral", sets: "3x45s", rest: "30s" },
        { name: "Dead bug", sets: "3x15", rest: "30s" },
        { name: "Bird dog", sets: "3x12", rest: "30s" },
        { name: "Pallof press", sets: "3x12", rest: "45s" },
        { name: "Ab wheel rollout", sets: "3x10", rest: "60s" },
        { name: "Bicycle crunches", sets: "3x20", rest: "30s" },
        { name: "Hollow body hold", sets: "3x30s", rest: "45s" }
      ]
    },
    {
      id: 5,
      name: "Movilidad y Flexibilidad",
      category: "Movilidad",
      icon: <GiRunningShoe />,
      duration: "30 min",
      exercises: 10,
      difficulty: "Principiante",
      clients: 7,
      lastUsed: "Hace 4 días",
      description: "Rutina de estiramientos y movilidad articular",
      exerciseList: [
        { name: "Cat-Cow", sets: "3x10", rest: "20s" },
        { name: "World's greatest stretch", sets: "2x8", rest: "30s" },
        { name: "Hip circles", sets: "3x10", rest: "20s" },
        { name: "Shoulder dislocations", sets: "3x12", rest: "30s" },
        { name: "Leg swings", sets: "2x15", rest: "20s" },
        { name: "Spiderman stretch", sets: "2x8", rest: "30s" },
        { name: "T-spine rotations", sets: "3x10", rest: "20s" },
        { name: "Ankle mobility", sets: "3x12", rest: "20s" },
        { name: "Couch stretch", sets: "2x60s", rest: "30s" },
        { name: "Child's pose", sets: "2x60s", rest: "30s" }
      ]
    },
    {
      id: 6,
      name: "Full Body Strength",
      category: "Fuerza",
      icon: <GiWeightLiftingUp />,
      duration: "90 min",
      exercises: 12,
      difficulty: "Avanzado",
      clients: 4,
      lastUsed: "Hace 5 días",
      description: "Entrenamiento completo de cuerpo entero para fuerza máxima",
      exerciseList: [
        { name: "Sentadilla con barra", sets: "5x5", rest: "180s" },
        { name: "Press de banca", sets: "5x5", rest: "180s" },
        { name: "Peso muerto", sets: "5x5", rest: "180s" },
        { name: "Press militar", sets: "4x8", rest: "120s" },
        { name: "Remo con barra", sets: "4x8", rest: "120s" },
        { name: "Dominadas lastradas", sets: "4x6", rest: "120s" },
        { name: "Dips lastrados", sets: "4x8", rest: "120s" },
        { name: "Farmers walk", sets: "3x40m", rest: "90s" },
        { name: "Sentadilla frontal", sets: "3x10", rest: "90s" },
        { name: "Floor press", sets: "3x10", rest: "90s" },
        { name: "Bulgarian split squat", sets: "3x10", rest: "90s" },
        { name: "Plancha con peso", sets: "3x45s", rest: "60s" }
      ]
    }
  ];

  const categories = [
    { value: "all", label: "Todas", count: routines.length },
    { value: "Fuerza", label: "Fuerza", count: routines.filter(r => r.category === "Fuerza").length },
    { value: "Hipertrofia", label: "Hipertrofia", count: routines.filter(r => r.category === "Hipertrofia").length },
    { value: "Cardio", label: "Cardio", count: routines.filter(r => r.category === "Cardio").length },
    { value: "Funcional", label: "Funcional", count: routines.filter(r => r.category === "Funcional").length },
    { value: "Movilidad", label: "Movilidad", count: routines.filter(r => r.category === "Movilidad").length }
  ];

  const filteredRoutines = routines.filter(routine => {
    const matchesSearch = routine.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || routine.category === filterCategory;
    return matchesSearch && matchesCategory;
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

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Principiante': return 'var(--success-color)';
      case 'Intermedio': return 'var(--warning-color)';
      case 'Avanzado': return 'var(--error-color)';
      default: return 'var(--text-secondary)';
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
            <h2>Biblioteca de Rutinas</h2>
            <p>Crea, edita y gestiona tus rutinas de entrenamiento</p>
          </div>
          <FiFileText size={50} style={{ color: 'var(--accent-color)', opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div 
        className="kpi-grid" 
        style={{ marginTop: '25px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="stat-card highlight-border" variants={itemVariants}>
          <div className="stat-header">
            <h3>Total Rutinas</h3>
          </div>
          <div className="stat-value highlight">{routines.length}</div>
          <div className="stat-detail">En tu biblioteca</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Más Usada</h3>
          </div>
          <div className="stat-value">HIIT Funcional</div>
          <div className="stat-detail">15 clientes</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Última Actualización</h3>
          </div>
          <div className="stat-value">Hoy</div>
          <div className="stat-detail">Fuerza Tren Superior</div>
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
              placeholder="Buscar rutina..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm("")}>
                <FiX />
              </button>
            )}
          </div>

          <motion.button
            className="btn-compact-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus size={16} />
            Nueva Rutina
          </motion.button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <FiFilter size={16} style={{ color: 'var(--text-secondary)' }} />
          {categories.map(cat => (
            <motion.button
              key={cat.value}
              className={`btn-outline-small ${filterCategory === cat.value ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat.value)}
              style={{
                background: filterCategory === cat.value ? 'var(--accent-color)' : 'transparent',
                color: filterCategory === cat.value ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                borderColor: filterCategory === cat.value ? 'var(--accent-color)' : 'var(--border-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat.label}
              <span style={{ 
                background: filterCategory === cat.value ? 'rgba(0,0,0,0.2)' : 'var(--input-bg-dark)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {cat.count}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Grid de Rutinas */}
      <motion.div 
        className="chart-card"
        style={{ marginTop: '20px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div 
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredRoutines.map((routine, idx) => (
            <motion.div
              key={routine.id}
              variants={itemVariants}
              className="member-card-hover"
              style={{
                background: 'var(--input-bg-dark)',
                border: `1px solid var(--border-dark)`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedRoutine(routine)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'var(--bg-card-dark)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'var(--accent-color)'
                  }}>
                    {routine.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                      {routine.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {routine.category} • {routine.duration}
                    </p>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '15px', lineHeight: '1.5' }}>
                {routine.description}
              </p>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '10px',
                marginBottom: '15px'
              }}>
                <div style={{ 
                  background: 'var(--bg-card-dark)', 
                  padding: '8px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>Ejercicios</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-color)' }}>
                    {routine.exercises}
                  </div>
                </div>
                <div style={{ 
                  background: 'var(--bg-card-dark)', 
                  padding: '8px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>Clientes</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success-color)' }}>
                    {routine.clients}
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '15px',
                borderTop: '1px solid var(--border-dark)'
              }}>
                <div style={{ 
                  padding: '4px 10px',
                  background: `${getDifficultyColor(routine.difficulty)}20`,
                  color: getDifficultyColor(routine.difficulty),
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {routine.difficulty}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <motion.button
                    className="icon-btn"
                    style={{ padding: '6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiEdit size={14} />
                  </motion.button>
                  <motion.button
                    className="icon-btn"
                    style={{ padding: '6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiCopy size={14} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredRoutines.length === 0 && (
          <div className="empty-state">
            <FiFileText size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
            <h3>No se encontraron rutinas</h3>
            <p>Intenta con otro término de búsqueda o ajusta los filtros</p>
          </div>
        )}
      </motion.div>

      {/* Modal de Detalle de Rutina */}
      <AnimatePresence>
        {selectedRoutine && (
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
            onClick={() => setSelectedRoutine(null)}
          >
            <motion.div
              style={{
                background: 'var(--bg-card-dark)',
                borderRadius: '16px',
                maxWidth: '700px',
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
                alignItems: 'flex-start'
              }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'var(--input-bg-dark)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    color: 'var(--accent-color)'
                  }}>
                    {selectedRoutine.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', marginBottom: '5px' }}>{selectedRoutine.name}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {selectedRoutine.category} • {selectedRoutine.duration} • {selectedRoutine.exercises} ejercicios
                    </p>
                  </div>
                </div>
                <motion.button
                  className="icon-btn"
                  onClick={() => setSelectedRoutine(null)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX size={20} />
                </motion.button>
              </div>

              <div style={{ padding: '25px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
                  {selectedRoutine.description}
                </p>

                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>
                  Lista de Ejercicios
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedRoutine.exerciseList.map((exercise, idx) => (
                    <motion.div
                      key={idx}
                      style={{
                        background: 'var(--input-bg-dark)',
                        padding: '15px',
                        borderRadius: '8px',
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto auto',
                        gap: '15px',
                        alignItems: 'center'
                      }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                    >
                      <div style={{
                        width: '30px',
                        height: '30px',
                        background: 'var(--accent-color)',
                        color: 'var(--text-on-accent)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '13px'
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        {exercise.name}
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: 'var(--text-secondary)',
                        fontWeight: '600'
                      }}>
                        {exercise.sets}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-card-dark)',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}>
                        {exercise.rest}
                      </div>
                    </motion.div>
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
                    Editar Rutina
                  </motion.button>
                  <motion.button
                    className="btn-compact-primary"
                    style={{ flex: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiCopy size={16} />
                    Duplicar
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
