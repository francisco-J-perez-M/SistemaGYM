import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFileText,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiSearch,
  FiX,
  FiFilter,
  FiAlertCircle,
  FiSave,
  FiChevronDown,
  FiChevronUp,
  FiLoader
} from "react-icons/fi";
import { GiMuscleUp, GiWeightLiftingUp, GiRunningShoe } from "react-icons/gi";
import trainerService from "../services/trainerService";
import "../css/CSSUnificado.css";

// ── Íconos por categoría ──────────────────────────────────────
const CATEGORY_ICONS = {
  Fuerza:      <GiWeightLiftingUp />,
  Hipertrofia: <GiMuscleUp />,
  Cardio:      <GiRunningShoe />,
  Funcional:   <GiMuscleUp />,
  Movilidad:   <GiRunningShoe />,
};

const CATEGORIES = ['Fuerza', 'Hipertrofia', 'Cardio', 'Funcional', 'Movilidad'];
const DIFFICULTIES = ['Principiante', 'Intermedio', 'Avanzado'];
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// ── Colores de dificultad ─────────────────────────────────────
const getDifficultyColor = (d) => {
  if (d === 'Principiante') return 'var(--success-color)';
  if (d === 'Avanzado')     return 'var(--error-color)';
  return 'var(--warning-color)';
};

// ── Estado inicial para nueva rutina ──────────────────────────
const emptyRoutine = () => ({
  name: '',
  category: 'Fuerza',
  difficulty: 'Intermedio',
  duration_minutes: 60,
  description: '',
  days: []
});

const emptyDay = () => ({
  day: 'Lunes',
  muscleGroup: '',
  exercises: [{ name: '', sets: '3', reps: '12', peso: '', notes: '' }]
});

// ─────────────────────────────────────────────────────────────
export default function TrainerRoutines() {
  const [routines, setRoutines]           = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm]       = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modal detalle
  const [selectedRoutine, setSelectedRoutine] = useState(null);

  // Modal crear/editar
  const [showForm, setShowForm]           = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [formData, setFormData]           = useState(emptyRoutine());
  const [expandedDay, setExpandedDay]     = useState(0);

  // ── Carga de datos ───────────────────────────────────────────
  const loadRoutines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await trainerService.getRoutines({
        category: filterCategory,
        search: searchTerm
      });
      setRoutines(data.routines || []);
      setCategoryCounts(data.categoryCounts || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(loadRoutines, 300);
    return () => clearTimeout(timer);
  }, [loadRoutines]);

  // ── Acciones ─────────────────────────────────────────────────
  const handleDuplicate = async (e, id) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await trainerService.duplicateRoutine(id);
      await loadRoutines();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta rutina?')) return;
    try {
      setActionLoading(true);
      await trainerService.deleteRoutine(id);
      setSelectedRoutine(null);
      await loadRoutines();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openCreate = () => {
    setFormData(emptyRoutine());
    setEditingId(null);
    setExpandedDay(0);
    setShowForm(true);
  };

  const openEdit = (e, routine) => {
    e.stopPropagation();
    setFormData({
      name:             routine.name,
      category:         routine.category,
      difficulty:       routine.difficulty,
      duration_minutes: parseInt(routine.duration) || 60,
      description:      routine.description,
      days:             []
    });
    setEditingId(routine.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { setError('El nombre es requerido'); return; }
    try {
      setActionLoading(true);
      setError(null);
      if (editingId) {
        await trainerService.updateRoutine(editingId, formData);
      } else {
        await trainerService.createRoutine(formData);
      }
      setShowForm(false);
      await loadRoutines();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Form helpers ─────────────────────────────────────────────
  const addDay = () => {
    setFormData(f => ({ ...f, days: [...f.days, emptyDay()] }));
    setExpandedDay(formData.days.length);
  };

  const removeDay = (di) => {
    setFormData(f => ({ ...f, days: f.days.filter((_, i) => i !== di) }));
  };

  const updateDay = (di, field, value) => {
    setFormData(f => {
      const days = [...f.days];
      days[di] = { ...days[di], [field]: value };
      return { ...f, days };
    });
  };

  const addExercise = (di) => {
    setFormData(f => {
      const days = [...f.days];
      days[di] = {
        ...days[di],
        exercises: [...days[di].exercises, { name: '', sets: '3', reps: '12', peso: '', notes: '' }]
      };
      return { ...f, days };
    });
  };

  const removeExercise = (di, ei) => {
    setFormData(f => {
      const days = [...f.days];
      days[di] = { ...days[di], exercises: days[di].exercises.filter((_, i) => i !== ei) };
      return { ...f, days };
    });
  };

  const updateExercise = (di, ei, field, value) => {
    setFormData(f => {
      const days = [...f.days];
      const exs  = [...days[di].exercises];
      exs[ei] = { ...exs[ei], [field]: value };
      days[di] = { ...days[di], exercises: exs };
      return { ...f, days };
    });
  };

  // ── Animaciones ──────────────────────────────────────────────
  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const totalRoutines = routines.length +
    Object.values(categoryCounts).reduce((a, b) => a + b, 0) -
    Object.values(categoryCounts).reduce((a, b) => a + b, 0); // just routines.length

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
            <h2>Biblioteca de Rutinas</h2>
            <p>Crea, edita y gestiona tus rutinas de entrenamiento</p>
          </div>
          <FiFileText size={50} style={{ color: 'var(--accent-color)', opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* Error global */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: 'rgba(239,68,68,.1)',
              border: '1px solid rgba(239,68,68,.3)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--error-color)'
            }}
          >
            <FiAlertCircle />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <FiX />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPIs */}
      <motion.div
        className="kpi-grid"
        style={{ marginTop: 25, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        variants={containerVariants} initial="hidden" animate="visible"
      >
        <motion.div className="stat-card highlight-border" variants={itemVariants}>
          <div className="stat-header"><h3>Total Rutinas</h3></div>
          <div className="stat-value highlight">{routines.length}</div>
          <div className="stat-detail">En tu biblioteca</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header"><h3>Más Usada</h3></div>
          <div className="stat-value" style={{ fontSize: 16 }}>
            {routines.sort((a, b) => b.clients - a.clients)[0]?.name || '—'}
          </div>
          <div className="stat-detail">
            {routines.sort((a, b) => b.clients - a.clients)[0]?.clients || 0} clientes
          </div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header"><h3>Última Act.</h3></div>
          <div className="stat-value" style={{ fontSize: 16 }}>
            {routines[0]?.lastUsed || '—'}
          </div>
          <div className="stat-detail">{routines[0]?.name || ''}</div>
        </motion.div>
      </motion.div>

      {/* Búsqueda y Filtros */}
      <motion.div
        className="chart-card"
        style={{ marginTop: 25 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      >
        <div style={{ display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-dark-container with-icon" style={{ flex: 1, minWidth: 250 }}>
            <FiSearch size={18} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar rutina..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <FiX />
              </button>
            )}
          </div>

          <motion.button
            className="btn-compact-primary"
            onClick={openCreate}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            <FiPlus size={16} />
            Nueva Rutina
          </motion.button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 15, flexWrap: 'wrap', alignItems: 'center' }}>
          <FiFilter size={16} style={{ color: 'var(--text-secondary)' }} />
          {[
            { value: 'all', label: 'Todas', count: routines.length },
            ...CATEGORIES.map(c => ({ value: c, label: c, count: categoryCounts[c] || 0 }))
          ].map(cat => (
            <motion.button
              key={cat.value}
              className={`btn-outline-small ${filterCategory === cat.value ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat.value)}
              style={{
                background:   filterCategory === cat.value ? 'var(--accent-color)' : 'transparent',
                color:        filterCategory === cat.value ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                borderColor:  filterCategory === cat.value ? 'var(--accent-color)' : 'var(--border-dark)',
                display: 'flex', alignItems: 'center', gap: 6
              }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              {cat.label}
              <span style={{
                background: filterCategory === cat.value ? 'rgba(0,0,0,.2)' : 'var(--input-bg-dark)',
                padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700
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
        style={{ marginTop: 20 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <FiLoader size={32} />
            </motion.div>
            <p style={{ marginTop: 16 }}>Cargando rutinas...</p>
          </div>
        ) : (
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 15 }}
            variants={containerVariants} initial="hidden" animate="visible"
          >
            {routines.map(routine => (
              <motion.div
                key={routine.id}
                variants={itemVariants}
                className="member-card-hover"
                style={{
                  background: 'var(--input-bg-dark)',
                  border: '1px solid var(--border-dark)',
                  borderRadius: 12,
                  padding: 20,
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedRoutine(routine)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      width: 50, height: 50,
                      background: 'var(--bg-card-dark)', borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, color: 'var(--accent-color)'
                    }}>
                      {CATEGORY_ICONS[routine.category] || <GiMuscleUp />}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{routine.name}</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {routine.category} • {routine.duration}
                      </p>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 15, lineHeight: 1.5 }}>
                  {routine.description || 'Sin descripción'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
                  {[
                    { label: 'Ejercicios', value: routine.exercises, color: 'var(--accent-color)' },
                    { label: 'Clientes',   value: routine.clients,   color: 'var(--success-color)' }
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: 'var(--bg-card-dark)', padding: 8, borderRadius: 8, textAlign: 'center'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 15, borderTop: '1px solid var(--border-dark)'
                }}>
                  <div style={{
                    padding: '4px 10px',
                    background: `${getDifficultyColor(routine.difficulty)}20`,
                    color: getDifficultyColor(routine.difficulty),
                    borderRadius: 6, fontSize: 11, fontWeight: 600
                  }}>
                    {routine.difficulty}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <motion.button
                      className="icon-btn" style={{ padding: 6 }}
                      onClick={e => openEdit(e, routine)}
                      title="Editar"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    >
                      <FiEdit size={14} />
                    </motion.button>
                    <motion.button
                      className="icon-btn" style={{ padding: 6 }}
                      onClick={e => handleDuplicate(e, routine.id)}
                      title="Duplicar"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    >
                      <FiCopy size={14} />
                    </motion.button>
                    <motion.button
                      className="icon-btn" style={{ padding: 6, color: 'var(--error-color)' }}
                      onClick={e => handleDelete(e, routine.id)}
                      title="Eliminar"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    >
                      <FiTrash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && routines.length === 0 && (
          <div className="empty-state">
            <FiFileText size={48} style={{ opacity: 0.3, marginBottom: 15 }} />
            <h3>No se encontraron rutinas</h3>
            <p>Intenta con otro término o ajusta los filtros</p>
            <motion.button
              className="btn-compact-primary"
              style={{ marginTop: 16 }}
              onClick={openCreate}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              <FiPlus size={16} /> Crear primera rutina
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* ── Modal Detalle ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRoutine && (
          <motion.div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: 20
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedRoutine(null)}
          >
            <motion.div
              style={{
                background: 'var(--bg-card-dark)', borderRadius: 16,
                maxWidth: 700, width: '100%', maxHeight: '90vh',
                overflow: 'auto', border: '1px solid var(--border-dark)'
              }}
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header modal */}
              <div style={{
                padding: 25, borderBottom: '1px solid var(--border-dark)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
              }}>
                <div style={{ display: 'flex', gap: 15, alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 60, height: 60, background: 'var(--input-bg-dark)', borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, color: 'var(--accent-color)'
                  }}>
                    {CATEGORY_ICONS[selectedRoutine.category] || <GiMuscleUp />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 20, marginBottom: 5 }}>{selectedRoutine.name}</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {selectedRoutine.category} • {selectedRoutine.duration} • {selectedRoutine.exercises} ejercicios
                    </p>
                  </div>
                </div>
                <motion.button
                  className="icon-btn"
                  onClick={() => setSelectedRoutine(null)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                >
                  <FiX size={20} />
                </motion.button>
              </div>

              <div style={{ padding: 25 }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                  {selectedRoutine.description || 'Sin descripción.'}
                </p>

                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 15 }}>Lista de Ejercicios</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(selectedRoutine.exerciseList || []).map((ex, idx) => (
                    <motion.div
                      key={idx}
                      style={{
                        background: 'var(--input-bg-dark)', padding: 15, borderRadius: 8,
                        display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 15, alignItems: 'center'
                      }}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                    >
                      <div style={{
                        width: 30, height: 30,
                        background: 'var(--accent-color)', color: 'var(--text-on-accent)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13
                      }}>{idx + 1}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{ex.name}</div>
                        {ex.day && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{ex.day}</div>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{ex.sets}</div>
                      <div style={{
                        fontSize: 12, color: 'var(--text-secondary)',
                        background: 'var(--bg-card-dark)', padding: '4px 8px', borderRadius: 6
                      }}>
                        {ex.rest || ex.peso || '—'}
                      </div>
                    </motion.div>
                  ))}
                  {(!selectedRoutine.exerciseList || selectedRoutine.exerciseList.length === 0) && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sin ejercicios registrados.</p>
                  )}
                </div>

                <div style={{ marginTop: 25, display: 'flex', gap: 10 }}>
                  <motion.button
                    className="btn-compact-primary" style={{ flex: 1 }}
                    onClick={e => { setSelectedRoutine(null); openEdit(e, selectedRoutine); }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  >
                    <FiEdit size={16} /> Editar Rutina
                  </motion.button>
                  <motion.button
                    className="btn-compact-primary" style={{ flex: 1 }}
                    onClick={e => { handleDuplicate(e, selectedRoutine.id); setSelectedRoutine(null); }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  >
                    <FiCopy size={16} /> Duplicar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Crear / Editar ───────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1100, padding: 20
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              style={{
                background: 'var(--bg-card-dark)', borderRadius: 16,
                maxWidth: 750, width: '100%', maxHeight: '92vh',
                overflow: 'auto', border: '1px solid var(--border-dark)'
              }}
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            >
              {/* Header form */}
              <div style={{
                padding: '20px 25px',
                borderBottom: '1px solid var(--border-dark)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <h3 style={{ fontSize: 18 }}>{editingId ? 'Editar Rutina' : 'Nueva Rutina'}</h3>
                <motion.button className="icon-btn" onClick={() => setShowForm(false)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <FiX size={20} />
                </motion.button>
              </div>

              <div style={{ padding: 25 }}>
                {/* Datos básicos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label-compact">Nombre *</label>
                    <input
                      className="input-compact"
                      value={formData.name}
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      placeholder="Ej. Fuerza Tren Superior"
                    />
                  </div>

                  <div>
                    <label className="form-label-compact">Categoría</label>
                    <select
                      className="input-compact"
                      value={formData.category}
                      onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label-compact">Dificultad</label>
                    <select
                      className="input-compact"
                      value={formData.difficulty}
                      onChange={e => setFormData(f => ({ ...f, difficulty: e.target.value }))}
                    >
                      {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label-compact">Duración (min)</label>
                    <input
                      type="number" className="input-compact"
                      value={formData.duration_minutes}
                      onChange={e => setFormData(f => ({ ...f, duration_minutes: e.target.value }))}
                      min={10}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label-compact">Descripción</label>
                    <textarea
                      className="input-compact" rows={3}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                      value={formData.description}
                      onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe el objetivo de la rutina..."
                    />
                  </div>
                </div>

                {/* Días y ejercicios */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600 }}>Días de entrenamiento</h4>
                    <motion.button
                      className="btn-compact-primary"
                      onClick={addDay}
                      style={{ fontSize: 13 }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    >
                      <FiPlus size={14} /> Agregar día
                    </motion.button>
                  </div>

                  {formData.days.length === 0 && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                      Agrega días para definir los ejercicios de la rutina.
                    </p>
                  )}

                  {formData.days.map((day, di) => (
                    <div
                      key={di}
                      style={{
                        background: 'var(--input-bg-dark)', borderRadius: 10,
                        border: '1px solid var(--border-dark)', marginBottom: 10,
                        overflow: 'hidden'
                      }}
                    >
                      {/* Cabecera del día */}
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 16px', cursor: 'pointer',
                          borderBottom: expandedDay === di ? '1px solid var(--border-dark)' : 'none'
                        }}
                        onClick={() => setExpandedDay(expandedDay === di ? -1 : di)}
                      >
                        <select
                          className="input-compact"
                          style={{ width: 'auto', flex: 1 }}
                          value={day.day}
                          onChange={e => { e.stopPropagation(); updateDay(di, 'day', e.target.value); }}
                          onClick={e => e.stopPropagation()}
                        >
                          {DIAS_SEMANA.map(d => <option key={d}>{d}</option>)}
                        </select>
                        <input
                          className="input-compact"
                          style={{ flex: 2 }}
                          placeholder="Grupo muscular (ej. Pecho y Tríceps)"
                          value={day.muscleGroup}
                          onChange={e => updateDay(di, 'muscleGroup', e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {day.exercises.length} ej.
                        </span>
                        {expandedDay === di ? <FiChevronUp /> : <FiChevronDown />}
                        <motion.button
                          className="icon-btn"
                          style={{ color: 'var(--error-color)', padding: 4 }}
                          onClick={e => { e.stopPropagation(); removeDay(di); }}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        >
                          <FiTrash2 size={14} />
                        </motion.button>
                      </div>

                      {/* Ejercicios del día */}
                      {expandedDay === di && (
                        <div style={{ padding: 16 }}>
                          {day.exercises.map((ex, ei) => (
                            <div
                              key={ei}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                                gap: 8, marginBottom: 8, alignItems: 'center'
                              }}
                            >
                              <input
                                className="input-compact"
                                placeholder="Nombre del ejercicio"
                                value={ex.name}
                                onChange={e => updateExercise(di, ei, 'name', e.target.value)}
                              />
                              <input
                                className="input-compact"
                                placeholder="Series"
                                value={ex.sets}
                                onChange={e => updateExercise(di, ei, 'sets', e.target.value)}
                              />
                              <input
                                className="input-compact"
                                placeholder="Reps"
                                value={ex.reps}
                                onChange={e => updateExercise(di, ei, 'reps', e.target.value)}
                              />
                              <input
                                className="input-compact"
                                placeholder="Peso"
                                value={ex.peso}
                                onChange={e => updateExercise(di, ei, 'peso', e.target.value)}
                              />
                              <motion.button
                                className="icon-btn"
                                style={{ color: 'var(--error-color)', padding: 4 }}
                                onClick={() => removeExercise(di, ei)}
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              >
                                <FiX size={14} />
                              </motion.button>
                            </div>
                          ))}
                          <motion.button
                            className="btn-outline-small"
                            style={{ marginTop: 4 }}
                            onClick={() => addExercise(di)}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          >
                            <FiPlus size={13} /> Ejercicio
                          </motion.button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Botones form */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <motion.button
                    className="btn-outline-small"
                    onClick={() => setShowForm(false)}
                    disabled={actionLoading}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    className="btn-compact-primary"
                    onClick={handleSave}
                    disabled={actionLoading}
                    whileHover={{ scale: actionLoading ? 1 : 1.05 }}
                    whileTap={{ scale: actionLoading ? 1 : 0.95 }}
                  >
                    <FiSave size={16} />
                    {actionLoading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Rutina'}
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