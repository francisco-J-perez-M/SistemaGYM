import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiTrash2, FiSave, FiCopy, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { GiMuscleUp } from "react-icons/gi";
import "../css/CSSUnificado.css";

export default function UserRoutineCreator() {
  const [user, setUser] = useState(null);
  const [routine, setRoutine] = useState({
    nombre: "Mi Rutina Personalizada",
    dias: [
      { 
        dia: "Lunes", 
        grupo: "Pecho y Tríceps", 
        ejercicios: [{ nombre: "Press Banca", series: "4", reps: "12" }] 
      },
      { 
        dia: "Martes", 
        grupo: "Espalda y Bíceps", 
        ejercicios: [{ nombre: "Dominadas", series: "3", reps: "10" }] 
      }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchRoutine();
  }, []);

  const fetchRoutine = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/user/routines", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Error al cargar rutina");

      const data = await response.json();
      
      // Cargar la primera rutina si existe
      if (data.rutinas && data.rutinas.length > 0) {
        setRoutine(data.rutinas[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error:", err);
      // No mostrar error si no hay rutinas, usar la rutina por defecto
      console.log("Usando rutina por defecto");
    } finally {
      setLoading(false);
    }
  };

  const agregarEjercicio = (diaIndex) => {
    const nuevaRutina = { ...routine };
    nuevaRutina.dias[diaIndex].ejercicios.push({ nombre: "", series: "3", reps: "12" });
    setRoutine(nuevaRutina);
  };

  const eliminarEjercicio = (diaIndex, ejercicioIndex) => {
    const nuevaRutina = { ...routine };
    nuevaRutina.dias[diaIndex].ejercicios.splice(ejercicioIndex, 1);
    setRoutine(nuevaRutina);
  };

  const actualizarEjercicio = (diaIndex, ejercicioIndex, campo, valor) => {
    const nuevaRutina = { ...routine };
    nuevaRutina.dias[diaIndex].ejercicios[ejercicioIndex][campo] = valor;
    setRoutine(nuevaRutina);
  };

  const agregarDia = () => {
    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const diasUsados = routine.dias.map(d => d.dia);
    const siguienteDia = diasSemana.find(dia => !diasUsados.includes(dia));
    
    if (siguienteDia) {
      const nuevaRutina = { ...routine };
      nuevaRutina.dias.push({
        dia: siguienteDia,
        grupo: "Nuevo Grupo",
        ejercicios: [{ nombre: "", series: "3", reps: "12" }]
      });
      setRoutine(nuevaRutina);
    } else {
      setError("Ya has agregado todos los días de la semana");
      setTimeout(() => setError(null), 3000);
    }
  };

  const eliminarDia = (diaIndex) => {
    if (routine.dias.length > 1) {
      const nuevaRutina = { ...routine };
      nuevaRutina.dias.splice(diaIndex, 1);
      setRoutine(nuevaRutina);
    } else {
      setError("Debes mantener al menos un día en la rutina");
      setTimeout(() => setError(null), 3000);
    }
  };

  const guardarRutina = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      // Validar que haya al menos un ejercicio
      const tieneEjercicios = routine.dias.some(dia => 
        dia.ejercicios.some(ej => ej.nombre.trim() !== "")
      );
      
      if (!tieneEjercicios) {
        setError("Debes agregar al menos un ejercicio con nombre");
        setSaving(false);
        return;
      }
      
      const method = routine.id ? "PUT" : "POST";
      const url = routine.id 
        ? `http://localhost:5000/api/user/routines/${routine.id}`
        : "http://localhost:5000/api/user/routines";
      
      const response = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(routine)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar rutina");
      }

      const data = await response.json();
      setSuccessMessage("Rutina guardada exitosamente");
      
      // Actualizar ID si es una rutina nueva
      if (data.rutina && data.rutina.id) {
        setRoutine({ ...routine, id: data.rutina.id });
      }
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const duplicarRutina = async () => {
    try {
      if (!routine.id) {
        setError("Primero debes guardar la rutina antes de duplicarla");
        return;
      }
      
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/user/routines/${routine.id}/duplicate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Error al duplicar rutina");

      const data = await response.json();
      setSuccessMessage("Rutina duplicada exitosamente");
      
      // Cargar la rutina duplicada
      if (data.rutina) {
        setRoutine(data.rutina);
      }
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudo duplicar la rutina");
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Creador de Rutinas</h2>
        </header>
        
        <main className="dashboard-content">
          {/* Mensajes */}
          {error && (
            <div style={{ 
              padding: '15px', 
              background: 'rgba(255, 59, 48, 0.1)', 
              borderRadius: '8px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--error-color)'
            }}>
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div style={{ 
              padding: '15px', 
              background: 'rgba(76, 217, 100, 0.1)', 
              borderRadius: '8px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--success-color)'
            }}>
              <FiCheckCircle />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="chart-card">
            <div className="chart-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <GiMuscleUp style={{ fontSize: '24px' }} />
                <input
                  type="text"
                  value={routine.nombre}
                  onChange={(e) => setRoutine({ ...routine, nombre: e.target.value })}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    flex: 1
                  }}
                  placeholder="Nombre de la rutina"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button 
                  className="btn-outline-small" 
                  whileHover={{ scale: 1.05 }}
                  onClick={duplicarRutina}
                >
                  <FiCopy style={{ marginRight: 6 }} />
                  Duplicar
                </motion.button>
                
                <motion.button 
                  className="btn-outline-small" 
                  whileHover={{ scale: 1.05 }}
                  onClick={guardarRutina}
                  disabled={saving}
                  style={{
                    opacity: saving ? 0.6 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FiSave style={{ marginRight: 6 }} />
                  {saving ? "Guardando..." : "Guardar"}
                </motion.button>
              </div>
            </div>
            
            <div style={{ padding: '20px' }}>
              {routine.dias.map((dia, diaIdx) => (
                <motion.div 
                  key={diaIdx} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: diaIdx * 0.1 }} 
                  style={{ 
                    marginBottom: '25px', 
                    padding: '20px', 
                    background: 'var(--bg-input-dark)', 
                    borderRadius: '12px', 
                    border: '2px solid var(--border-dark)' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: '8px' }}>{dia.dia}</h3>
                      <input
                        type="text"
                        value={dia.grupo}
                        onChange={(e) => {
                          const nuevaRutina = { ...routine };
                          nuevaRutina.dias[diaIdx].grupo = e.target.value;
                          setRoutine(nuevaRutina);
                        }}
                        style={{
                          background: 'var(--bg-dark)',
                          border: '1px solid var(--border-dark)',
                          borderRadius: '6px',
                          padding: '8px',
                          fontSize: '14px',
                          color: 'var(--text-secondary)',
                          width: '100%',
                          maxWidth: '300px'
                        }}
                        placeholder="Grupo muscular"
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <motion.button 
                        onClick={() => agregarEjercicio(diaIdx)} 
                        whileHover={{ scale: 1.05 }} 
                        style={{ 
                          padding: '8px 16px', 
                          background: 'var(--accent-color)', 
                          color: 'var(--bg-dark)', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontWeight: '600' 
                        }}
                      >
                        <FiPlus />
                        Ejercicio
                      </motion.button>
                      
                      {routine.dias.length > 1 && (
                        <motion.button
                          onClick={() => eliminarDia(diaIdx)}
                          whileHover={{ scale: 1.1, color: 'var(--error-color)' }}
                          style={{
                            padding: '8px',
                            background: 'transparent',
                            border: '1px solid var(--border-dark)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <FiTrash2 />
                        </motion.button>
                      )}
                    </div>
                  </div>
                  
                  {dia.ejercicios.map((ejercicio, ejIdx) => (
                    <div 
                      key={ejIdx} 
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '2fr 1fr 1fr auto', 
                        gap: '12px', 
                        padding: '12px', 
                        background: 'var(--bg-dark)', 
                        borderRadius: '8px', 
                        marginBottom: '10px' 
                      }}
                    >
                      <input 
                        type="text" 
                        placeholder="Nombre del ejercicio" 
                        value={ejercicio.nombre}
                        onChange={(e) => actualizarEjercicio(diaIdx, ejIdx, 'nombre', e.target.value)}
                        style={{ 
                          padding: '10px', 
                          background: 'var(--bg-input-dark)', 
                          border: '1px solid var(--border-dark)', 
                          borderRadius: '6px', 
                          color: 'var(--text-primary)' 
                        }} 
                      />
                      <input 
                        type="text" 
                        placeholder="Series" 
                        value={ejercicio.series}
                        onChange={(e) => actualizarEjercicio(diaIdx, ejIdx, 'series', e.target.value)}
                        style={{ 
                          padding: '10px', 
                          background: 'var(--bg-input-dark)', 
                          border: '1px solid var(--border-dark)', 
                          borderRadius: '6px', 
                          color: 'var(--text-primary)' 
                        }} 
                      />
                      <input 
                        type="text" 
                        placeholder="Reps" 
                        value={ejercicio.reps}
                        onChange={(e) => actualizarEjercicio(diaIdx, ejIdx, 'reps', e.target.value)}
                        style={{ 
                          padding: '10px', 
                          background: 'var(--bg-input-dark)', 
                          border: '1px solid var(--border-dark)', 
                          borderRadius: '6px', 
                          color: 'var(--text-primary)' 
                        }} 
                      />
                      <motion.button 
                        whileHover={{ scale: 1.1, color: 'var(--error-color)' }} 
                        onClick={() => eliminarEjercicio(diaIdx, ejIdx)}
                        style={{ 
                          padding: '10px', 
                          background: 'transparent', 
                          border: 'none', 
                          cursor: 'pointer', 
                          color: 'var(--text-secondary)' 
                        }}
                      >
                        <FiTrash2 />
                      </motion.button>
                    </div>
                  ))}
                </motion.div>
              ))}
              
              {routine.dias.length < 7 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={agregarDia}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'var(--bg-input-dark)',
                    border: '2px dashed var(--border-dark)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <FiPlus />
                  Agregar Día
                </motion.button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}