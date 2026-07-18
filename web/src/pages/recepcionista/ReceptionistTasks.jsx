/**
 * ReceptionistTasks.jsx
 * CRUD real contra /api/recepcionista/tasks (MongoDB tareas_recepcion).
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiPlus, FiCheck, FiTrash2, FiEdit2, FiX, FiRefreshCw,
  FiClipboard, FiAlertCircle, FiClock, FiFlag, FiFilter,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const API  = "/api/recepcionista/tasks";
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ── Mapas de prioridad / categoria ─────────────────────────────────────────── */
const PRIO = {
  alta:   { label:"Alta",   color:"#ef4444", bg:"rgba(239,68,68,0.12)" },
  media:  { label:"Media",  color:"#fbbf24", bg:"rgba(251,191,36,0.12)" },
  baja:   { label:"Baja",   color:"#22c55e", bg:"rgba(34,197,94,0.12)" },
};
const CATS = ["General","Limpieza","Pagos","Citas","Inventario","Seguimiento"];

const badge = (prioridad) => {
  const p = PRIO[prioridad] || PRIO.baja;
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px",
      borderRadius:99, background:p.bg, color:p.color }}>
      {p.label}
    </span>
  );
};

/* ── Formulario inline ──────────────────────────────────────────────────────── */
function TaskForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    texto:    initial.texto    ?? "",
    prioridad:initial.prioridad?? "media",
    categoria:initial.categoria?? "General",
    fecha:    initial.fecha    ?? "",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
      style={{ background:"var(--bg-input)", border:"1px solid var(--border-dark)",
        borderRadius:"var(--r-md)", padding:"16px 18px", marginBottom:12 }}>
      <textarea
        rows={2}
        placeholder="Descripcion de la tarea..."
        value={form.texto}
        onChange={e => set("texto", e.target.value)}
        style={{ width:"100%", resize:"vertical", background:"var(--bg-main)",
          border:"1px solid var(--border-dark)", borderRadius:"var(--r-sm)",
          color:"var(--text-primary)", fontSize:13, padding:"8px 10px",
          fontFamily:"inherit", marginBottom:10 }}
      />
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <select value={form.prioridad} onChange={e => set("prioridad", e.target.value)}
          style={{ padding:"6px 10px", borderRadius:"var(--r-sm)", fontSize:12,
            background:"var(--bg-main)", border:"1px solid var(--border-dark)",
            color:"var(--text-primary)" }}>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <select value={form.categoria} onChange={e => set("categoria", e.target.value)}
          style={{ padding:"6px 10px", borderRadius:"var(--r-sm)", fontSize:12,
            background:"var(--bg-main)", border:"1px solid var(--border-dark)",
            color:"var(--text-primary)" }}>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)}
          style={{ padding:"6px 10px", borderRadius:"var(--r-sm)", fontSize:12,
            background:"var(--bg-main)", border:"1px solid var(--border-dark)",
            color:"var(--text-primary)" }}
        />
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
          <button onClick={onCancel}
            style={{ padding:"7px 12px", borderRadius:"var(--r-sm)", fontSize:12,
              background:"transparent", border:"1px solid var(--border-dark)",
              color:"var(--text-secondary)", cursor:"pointer" }}>
            Cancelar
          </button>
          <button onClick={() => onSave(form)} disabled={!form.texto.trim() || loading}
            style={{ padding:"7px 14px", borderRadius:"var(--r-sm)", fontSize:12,
              fontWeight:600, background:"var(--accent)", border:"none",
              color:"#fff", cursor:"pointer", opacity: loading ? .6 : 1 }}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══ PÁGINA PRINCIPAL ════════════════════════════════════════════════════════ */
export default function ReceptionistTasks() {
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [filter,   setFilter]   = useState("todas");

  /* ── Fetch ───────────────────────────────────────────────────────────────── */
  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await axios.get(API, { headers: hdrs() });
      setTasks(r.data.tasks || []);
    } catch {
      setError("No se pudieron cargar las tareas. Intenta de nuevo.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  /* ── Crear ───────────────────────────────────────────────────────────────── */
  const crear = async (form) => {
    setSaving(true);
    try {
      const r = await axios.post(API, form, { headers: hdrs() });
      setTasks(p => [r.data.task, ...p]);
      setShowForm(false);
    } catch { setError("Error al crear la tarea."); }
    finally { setSaving(false); }
  };

  /* ── Actualizar texto/meta ───────────────────────────────────────────────── */
  const actualizar = async (id, form) => {
    setSaving(true);
    try {
      const r = await axios.patch(`${API}/${id}`, form, { headers: hdrs() });
      setTasks(p => p.map(t => t._id === id ? r.data.task : t));
      setEditId(null);
    } catch { setError("Error al actualizar la tarea."); }
    finally { setSaving(false); }
  };

  /* ── Togglear completada ─────────────────────────────────────────────────── */
  const toggleComplete = async (task) => {
    try {
      const r = await axios.patch(`${API}/${task._id}`,
        { completada: !task.completada }, { headers: hdrs() });
      setTasks(p => p.map(t => t._id === task._id ? r.data.task : t));
    } catch { /* silencioso */ }
  };

  /* ── Eliminar ────────────────────────────────────────────────────────────── */
  const eliminar = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, { headers: hdrs() });
      setTasks(p => p.filter(t => t._id !== id));
    } catch { setError("Error al eliminar la tarea."); }
  };

  /* ── Filtrado ────────────────────────────────────────────────────────────── */
  const visible = tasks.filter(t => {
    if (filter === "pendientes")  return !t.completada;
    if (filter === "completadas") return t.completada;
    if (filter === "alta")        return t.prioridad === "alta" && !t.completada;
    return true;
  });

  const pendCount = tasks.filter(t => !t.completada).length;

  return (
    <div className="dashboard-content">
      {/* Header */}
      <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
        style={{ marginBottom:20, display:"flex", justifyContent:"space-between",
          alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--text-primary)", margin:0 }}>
            Tareas
            {pendCount > 0 && (
              <span style={{ marginLeft:10, background:"var(--accent)", color:"#fff",
                borderRadius:99, fontSize:11, fontWeight:700, padding:"2px 8px" }}>
                {pendCount}
              </span>
            )}
          </h1>
          <p style={{ color:"var(--text-secondary)", fontSize:13, marginTop:4 }}>
            Lista de tareas del area de recepcion
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <motion.button onClick={fetch} disabled={loading}
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px",
              background:"transparent", border:"1px solid var(--border-dark)",
              color:"var(--text-secondary)", borderRadius:"var(--r-md)",
              cursor:"pointer", fontSize:13 }}>
            <FiRefreshCw size={14}/>
          </motion.button>
          <motion.button onClick={() => { setShowForm(true); setEditId(null); }}
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
              background:"var(--accent)", border:"none", color:"#fff",
              borderRadius:"var(--r-md)", cursor:"pointer", fontSize:13, fontWeight:600 }}>
            <FiPlus size={15}/> Nueva tarea
          </motion.button>
        </div>
      </motion.div>

      {error && (
        <div style={{ marginBottom:14, padding:"10px 14px",
          background:"rgba(239,68,68,0.1)", borderRadius:8,
          color:"#ef4444", fontSize:13, display:"flex",
          justifyContent:"space-between", alignItems:"center" }}>
          <span><FiAlertCircle size={13} style={{ marginRight:6 }}/>{error}</span>
          <button onClick={() => setError(null)}
            style={{ background:"none", border:"none", cursor:"pointer", color:"inherit" }}>
            <FiX size={12}/>
          </button>
        </div>
      )}

      {/* Formulario nueva tarea */}
      {showForm && !editId && (
        <TaskForm onSave={crear} onCancel={() => setShowForm(false)} loading={saving}/>
      )}

      {/* Filtros */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {[
          { id:"todas",       label:"Todas" },
          { id:"pendientes",  label:"Pendientes" },
          { id:"completadas", label:"Completadas" },
          { id:"alta",        label:"Alta prioridad" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px",
              borderRadius:"var(--r-md)", fontSize:12, fontWeight:600, cursor:"pointer",
              background: filter===f.id ? "var(--accent-dim)" : "var(--bg-input)",
              border: filter===f.id ? "1px solid var(--accent)" : "1px solid var(--border-dark)",
              color: filter===f.id ? "var(--accent-soft)" : "var(--text-secondary)" }}>
            <FiFilter size={11}/> {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ padding:40, textAlign:"center", color:"var(--text-secondary)", fontSize:13 }}>
          Cargando tareas...
        </div>
      ) : visible.length === 0 ? (
        <div style={{ padding:52, textAlign:"center", color:"var(--text-secondary)" }}>
          <FiClipboard size={36} style={{ opacity:.3, marginBottom:12 }}/>
          <p style={{ fontSize:14, margin:0 }}>No hay tareas en esta vista</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <AnimatePresence>
            {visible.map((t, i) => (
              <motion.div key={t._id}
                initial={{ opacity:0, x:-14 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:14 }} transition={{ delay:i*0.03 }}
                className="chart-card"
                style={{ padding:"14px 16px", opacity: t.completada ? .55 : 1 }}>

                {editId === t._id ? (
                  <TaskForm initial={t}
                    onSave={f => actualizar(t._id, f)}
                    onCancel={() => setEditId(null)}
                    loading={saving}
                  />
                ) : (
                  <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                    {/* Checkbox */}
                    <button onClick={() => toggleComplete(t)}
                      style={{ width:20, height:20, borderRadius:5, border:"2px solid",
                        borderColor: t.completada ? "var(--success)" : "var(--border-dark)",
                        background: t.completada ? "var(--success)" : "transparent",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        cursor:"pointer", flexShrink:0, marginTop:2 }}>
                      {t.completada && <FiCheck size={11} color="#fff"/>}
                    </button>

                    {/* Contenido */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)",
                          textDecoration: t.completada ? "line-through" : "none" }}>
                          {t.texto}
                        </span>
                        {badge(t.prioridad)}
                        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99,
                          background:"var(--bg-input)", color:"var(--text-secondary)",
                          border:"1px solid var(--border-dark)" }}>
                          {t.categoria || "General"}
                        </span>
                      </div>
                      {t.fecha && (
                        <div style={{ display:"flex", alignItems:"center", gap:4,
                          fontSize:11, color:"var(--text-secondary)", marginTop:5 }}>
                          <FiClock size={11}/>
                          {new Date(t.fecha + "T12:00:00").toLocaleDateString("es-MX",
                            { day:"numeric", month:"short", year:"numeric" })}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    {!t.completada && (
                      <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                        <button onClick={() => { setEditId(t._id); setShowForm(false); }}
                          style={{ width:30, height:30, borderRadius:"var(--r-sm)",
                            background:"var(--bg-input)", border:"1px solid var(--border-dark)",
                            color:"var(--text-secondary)", cursor:"pointer",
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <FiEdit2 size={13}/>
                        </button>
                        <button onClick={() => eliminar(t._id)}
                          style={{ width:30, height:30, borderRadius:"var(--r-sm)",
                            background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)",
                            color:"#ef4444", cursor:"pointer",
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <FiTrash2 size={13}/>
                        </button>
                      </div>
                    )}
                    {t.completada && (
                      <button onClick={() => eliminar(t._id)}
                        style={{ width:30, height:30, borderRadius:"var(--r-sm)", flexShrink:0,
                          background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)",
                          color:"#ef4444", cursor:"pointer",
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <FiTrash2 size={12}/>
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
