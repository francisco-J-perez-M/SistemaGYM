import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { FiPlus, FiTrash2, FiSave, FiCopy } from "react-icons/fi";
import { GiMuscleUp } from "react-icons/gi";
import "../css/CSSUnificado.css";

export default function UserRoutineCreator() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("routine");
  const [routine, setRoutine] = useState({
    nombre: "Mi Rutina Personalizada",
    dias: [
      { dia: "Lunes", grupo: "Pecho y Tríceps", ejercicios: [{ nombre: "Press Banca", series: "4", reps: "12" }] },
      { dia: "Martes", grupo: "Espalda y Bíceps", ejercicios: [{ nombre: "Dominadas", series: "3", reps: "10" }] }
    ]
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) window.location.href = "/";
    else setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const agregarEjercicio = (diaIndex) => {
    const nuevaRutina = { ...routine };
    nuevaRutina.dias[diaIndex].ejercicios.push({ nombre: "", series: "3", reps: "12" });
    setRoutine(nuevaRutina);
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Creador de Rutinas</h2>
        </header>
        <main className="dashboard-content">
          <div className="chart-card">
            <div className="chart-header">
              <h3><GiMuscleUp style={{ marginRight: 8 }} />{routine.nombre}</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button className="btn-outline-small" whileHover={{ scale: 1.05 }}>
                  <FiCopy style={{ marginRight: 6 }} />Duplicar
                </motion.button>
                <motion.button className="btn-outline-small" whileHover={{ scale: 1.05 }}>
                  <FiSave style={{ marginRight: 6 }} />Guardar
                </motion.button>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              {routine.dias.map((dia, diaIdx) => (
                <motion.div key={diaIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: diaIdx * 0.1 }} style={{ marginBottom: '25px', padding: '20px', background: 'var(--bg-input-dark)', borderRadius: '12px', border: '2px solid var(--border-dark)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ marginBottom: '4px' }}>{dia.dia}</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{dia.grupo}</p>
                    </div>
                    <motion.button onClick={() => agregarEjercicio(diaIdx)} whileHover={{ scale: 1.05 }} style={{ padding: '8px 16px', background: 'var(--accent-color)', color: 'var(--bg-dark)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                      <FiPlus />Agregar
                    </motion.button>
                  </div>
                  {dia.ejercicios.map((ejercicio, ejIdx) => (
                    <div key={ejIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px', marginBottom: '10px' }}>
                      <input type="text" placeholder="Nombre del ejercicio" defaultValue={ejercicio.nombre} style={{ padding: '10px', background: 'var(--bg-input-dark)', border: '1px solid var(--border-dark)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                      <input type="text" placeholder="Series" defaultValue={ejercicio.series} style={{ padding: '10px', background: 'var(--bg-input-dark)', border: '1px solid var(--border-dark)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                      <input type="text" placeholder="Reps" defaultValue={ejercicio.reps} style={{ padding: '10px', background: 'var(--bg-input-dark)', border: '1px solid var(--border-dark)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                      <motion.button whileHover={{ scale: 1.1, color: 'var(--error-color)' }} style={{ padding: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <FiTrash2 />
                      </motion.button>
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}