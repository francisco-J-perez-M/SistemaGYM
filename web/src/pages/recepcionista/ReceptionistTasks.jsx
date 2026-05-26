import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClipboard, FiPlus, FiTrash2, FiCheck,
  FiAlertCircle, FiClock, FiFlag,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const PRIORITIES = ["alta", "media", "baja"];

const PRIORITY_STYLES = {
  alta:  { color: "var(--danger)", bg: "rgba(239,68,68,0.12)",  icon: <FiAlertCircle size={12} /> },
  media: { color: "var(--warning)", bg: "rgba(234,179,8,0.12)",  icon: <FiClock size={12} /> },
  baja:  { color: "var(--text-tertiary)", bg: "rgba(100,116,139,0.12)",icon: <FiFlag size={12} /> },
};

const CATEGORIES = ["Membresías", "Pagos", "Limpieza", "Equipamiento", "Comunicación", "Otro"];

const INITIAL_TASKS = [
  { id: 1, text: "Llamar a clientes con membresías por vencer (5)",   priority: "alta",  category: "Membresías",   done: false, date: "2026-05-15" },
  { id: 2, text: "Procesar pagos pendientes en caja",                 priority: "alta",  category: "Pagos",        done: false, date: "2026-05-15" },
  { id: 3, text: "Confirmar citas de evaluación del día",             priority: "media", category: "Membresías",   done: false, date: "2026-05-15" },
  { id: 4, text: "Reponer toallas en vestidores",                     priority: "media", category: "Limpieza",     done: false, date: "2026-05-15" },
  { id: 5, text: "Enviar recordatorios de pago por WhatsApp",         priority: "media", category: "Comunicación", done: true,  date: "2026-05-14" },
  { id: 6, text: "Reportar máquina de cardio 3 fuera de servicio",   priority: "alta",  category: "Equipamiento", done: true,  date: "2026-05-14" },
  { id: 7, text: "Actualizar lista de espera para clases de spinning",priority: "baja",  category: "Membresías",   done: false, date: "2026-05-16" },
];

export default function ReceptionistTasks() {
  const [tasks,   setTasks]   = useState(INITIAL_TASKS);
  const [filter,  setFilter]  = useState("pendientes");
  const [catFilter, setCatFilter] = useState("todas");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ text: "", priority: "media", category: "Otro", date: new Date().toISOString().split("T")[0] });
  const [nextId, setNextId] = useState(8);

  const toggle = (id) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const remove = (id) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  const addTask = () => {
    if (!form.text.trim()) return;
    setTasks(prev => [{ ...form, id: nextId, done: false }, ...prev]);
    setNextId(n => n + 1);
    setForm({ text: "", priority: "media", category: "Otro", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
  };

  const visible = tasks
    .filter(t => {
      if (filter === "pendientes") return !t.done;
      if (filter === "completadas") return t.done;
      return true;
    })
    .filter(t => catFilter === "todas" || t.category === catFilter)
    .sort((a, b) => {
      const pri = { alta: 0, media: 1, baja: 2 };
      return pri[a.priority] - pri[b.priority];
    });

  const pending   = tasks.filter(t => !t.done).length;
  const completed = tasks.filter(t => t.done).length;
  const progress  = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="dashboard-content">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Tareas
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Lista de pendientes de recepción
          </p>
        </div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "9px 16px", background: "var(--accent)",
            border: "none", color: "#fff", borderRadius: "var(--r-md)",
            cursor: "pointer", fontSize: "13px", fontWeight: 600,
          }}
        >
          <FiPlus size={14} /> Nueva tarea
        </motion.button>
      </motion.div>

      {/* Progreso */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="chart-card"
        style={{ marginBottom: "20px", padding: "18px 20px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", gap: "20px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Pendientes: <strong style={{ color: "var(--warning)" }}>{pending}</strong>
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Completadas: <strong style={{ color: "var(--success)" }}>{completed}</strong>
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Total: <strong style={{ color: "var(--text-primary)" }}>{tasks.length}</strong>
            </span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent-soft)" }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: "6px", background: "var(--bg-input)", borderRadius: "3px", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ height: "100%", background: "var(--accent)", borderRadius: "3px" }}
          />
        </div>
      </motion.div>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ overflow: "hidden", marginBottom: "16px" }}
          >
            <div className="chart-card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                Nueva tarea
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "12px", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700,
                    color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                    Descripción
                  </label>
                  <input type="text" value={form.text} placeholder="¿Qué hay que hacer?"
                    onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px",
                      background: "var(--bg-input)", border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)", color: "var(--text-primary)", fontSize: "13px",
                      boxSizing: "border-box" }}
                  />
                </div>
                {[
                  { label: "Prioridad", key: "priority", options: PRIORITIES },
                  { label: "Categoría", key: "category", options: CATEGORIES },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700,
                      color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                      {f.label}
                    </label>
                    <select value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ padding: "9px 12px", background: "var(--bg-input)",
                        border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                        color: "var(--text-primary)", fontSize: "13px" }}
                    >
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <button onClick={addTask} style={{
                  padding: "9px 18px", background: "var(--accent)", border: "none",
                  color: "#fff", borderRadius: "var(--r-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                }}>
                  Agregar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["pendientes", "completadas", "todas"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 14px", borderRadius: "var(--r-md)", fontSize: "12px", fontWeight: 600,
            cursor: "pointer", textTransform: "capitalize",
            background: filter === f ? "var(--accent-dim)" : "transparent",
            border: filter === f ? "1px solid var(--accent)" : "1px solid var(--border)",
            color: filter === f ? "var(--accent-soft)" : "var(--text-secondary)",
          }}>
            {f}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ padding: "7px 12px", background: "var(--bg-input)",
            border: "1px solid var(--border)", borderRadius: "var(--r-md)",
            color: "var(--text-secondary)", fontSize: "12px" }}>
          <option value="todas">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <AnimatePresence>
          {visible.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="chart-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              <FiClipboard size={32} style={{ opacity: 0.3, marginBottom: "10px" }} />
              <p>No hay tareas en esta vista.</p>
            </motion.div>
          ) : visible.map((task, i) => {
            const p = PRIORITY_STYLES[task.priority];
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 18px", borderRadius: "var(--r-md)",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  opacity: task.done ? 0.55 : 1, transition: "opacity 0.2s",
                }}
              >
                {/* Checkbox */}
                <motion.button
                  onClick={() => toggle(task.id)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{
                    width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${task.done ? "var(--success)" : "var(--border-hover)"}`,
                    background: task.done ? "var(--success)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {task.done && <FiCheck size={12} color="#fff" />}
                </motion.button>

                {/* Texto */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: "13px", fontWeight: 500,
                    color: task.done ? "var(--text-secondary)" : "var(--text-primary)",
                    textDecoration: task.done ? "line-through" : "none",
                  }}>
                    {task.text}
                  </span>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                      {task.category}
                    </span>
                    {task.date && (
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px" }}>
                        <FiClock size={9} /> {task.date}
                      </span>
                    )}
                  </div>
                </div>

                {/* Prioridad */}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  background: p.bg, color: p.color,
                  padding: "3px 9px", borderRadius: "99px", fontSize: "10px", fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {p.icon} {task.priority}
                </span>

                {/* Eliminar */}
                <motion.button
                  onClick={() => remove(task.id)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{
                    background: "transparent", border: "none", color: "rgba(239,68,68,0.5)",
                    cursor: "pointer", padding: "4px", flexShrink: 0,
                  }}
                >
                  <FiTrash2 size={14} />
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
