/**
 * TrainerRoutines.jsx — Biblioteca de rutinas + biblioteca de ejercicios.
 *
 * Tabs:
 *   1. Rutinas — gestión de rutinas (con soporte de imágenes por ejercicio).
 *   2. Ejercicios — catálogo propio del gimnasio (asignable a rutinas).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFileText, FiPlus, FiEdit, FiTrash2, FiCopy, FiSearch, FiX, FiFilter,
  FiAlertCircle, FiSave, FiChevronDown, FiChevronUp, FiLoader, FiImage,
  FiBookOpen, FiCheck,
} from "react-icons/fi";
import { GiMuscleUp, GiWeightLiftingUp, GiRunningShoe } from "react-icons/gi";
import trainerService from "../../services/entrenador/trainerService";
import { useToast } from "../../hooks/useToast";
import "../../css/CSSUnificado.css";

/* ── Constantes ── */
const CATEGORY_ICONS = {
  Fuerza:      <GiWeightLiftingUp />,
  Hipertrofia: <GiMuscleUp />,
  Cardio:      <GiRunningShoe />,
  Funcional:   <GiMuscleUp />,
  Movilidad:   <GiRunningShoe />,
};
const CATEGORIES   = ["Fuerza", "Hipertrofia", "Cardio", "Funcional", "Movilidad"];
const DIFFICULTIES = ["Principiante", "Intermedio", "Avanzado"];
const DIAS_SEMANA  = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const GRUPOS_MUSCULARES = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps",
  "Abdomen", "Glúteos", "Cuádriceps", "Isquiotibiales",
  "Pantorrillas", "Cuerpo completo", "Cardio",
];
const TIPOS_EJERCICIO = ["Fuerza", "Cardio", "Flexibilidad", "Funcional", "Potencia"];

const getDifficultyColor = (d) => {
  if (d === "Principiante") return "var(--success)";
  if (d === "Avanzado")     return "var(--danger)";
  return "var(--warning)";
};

const emptyRoutine = () => ({
  name: "", category: "Fuerza", difficulty: "Intermedio",
  duration_minutes: 60, description: "", days: [],
});

const emptyDay = () => ({
  day: "Lunes", muscleGroup: "",
  exercises: [{ name: "", sets: "3", reps: "12", peso: "", notes: "", imagenes: [] }],
});

/* ── Compresión de imagen vía canvas ── */
async function compressImage(file, maxW = 600, maxH = 400, quality = 0.75) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img    = new Image();
    const url    = URL.createObjectURL(file);
    img.onload = () => {
      const ratio   = Math.min(maxW / img.width, maxH / img.height, 1);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = url;
  });
}

/* ════════════════════════════════════════════
   SUBCOMPONENTE: Cargador de imágenes (3 slots)
════════════════════════════════════════════ */
function ImageSlots({ images = [], onChange }) {
  const inputRefs = [useRef(), useRef(), useRef()];

  const handleFile = async (slotIdx, file) => {
    if (!file) return;
    const b64 = await compressImage(file);
    const next = [...images];
    next[slotIdx] = b64;
    onChange(next.filter(Boolean).slice(0, 3));
  };

  const removeImage = (slotIdx) => {
    const next = [...images];
    next.splice(slotIdx, 1);
    onChange(next.filter(Boolean));
  };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
      <span style={{ fontSize: 10, color: "var(--text-secondary)", flexShrink: 0 }}>
        <FiImage size={11} style={{ marginRight: 3 }} />Cómo hacerlo:
      </span>
      {[0, 1, 2].map(i => {
        const src = images[i];
        return (
          <div key={i} style={{ position: "relative" }}>
            <div
              onClick={() => !src && inputRefs[i].current?.click()}
              style={{
                width: 44, height: 44, borderRadius: 6,
                border: `1px dashed ${src ? "transparent" : "var(--border)"}`,
                background: src ? "transparent" : "var(--bg-input)",
                overflow: "hidden",
                cursor: src ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "border-color 0.15s",
              }}
            >
              {src
                ? <img src={src} alt={`img${i}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <FiPlus size={13} style={{ color: "var(--text-tertiary)" }} />
              }
            </div>
            {src && (
              <button
                onClick={() => removeImage(i)}
                style={{
                  position: "absolute", top: -4, right: -4,
                  width: 14, height: 14, borderRadius: "50%",
                  background: "var(--danger)", color: "#fff", border: "none",
                  cursor: "pointer", fontSize: 9, lineHeight: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <FiX size={8} />
              </button>
            )}
            <input
              ref={inputRefs[i]}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => handleFile(i, e.target.files?.[0])}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════
   SUBCOMPONENTE: Picker de ejercicios desde biblioteca
════════════════════════════════════════════ */
function LibraryPicker({ exercises, onPick, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = exercises.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (e.grupo_muscular || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 24, width: "100%", maxWidth: 440, maxHeight: "70vh",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700 }}>Seleccionar de biblioteca</h4>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
            <FiX />
          </button>
        </div>

        <div className="input-dark-container with-icon" style={{ marginBottom: 12 }}>
          <FiSearch size={15} style={{ color: "var(--text-secondary)" }} />
          <input className="search-input" placeholder="Buscar ejercicio..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: 20, fontSize: 13 }}>
              Sin resultados
            </p>
          )}
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "10px 14px", cursor: "pointer",
                textAlign: "left", transition: "border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  {ex.nombre}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                  {[ex.grupo_muscular, ex.tipo].filter(Boolean).join(" · ")}
                </div>
              </div>
              {ex.series && (
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {ex.series}×{ex.repeticiones || "—"}
                </span>
              )}
              <FiCheck size={13} style={{ color: "var(--accent)", opacity: 0.7 }} />
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   SUBCOMPONENTE: Formulario de ejercicio (biblioteca)
════════════════════════════════════════════ */
function ExerciseFormModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || {
    nombre: "", descripcion: "", grupo_muscular: "", tipo: "",
    series: "", repeticiones: "",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const label = { fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 28, width: "100%", maxWidth: 460,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700 }}>
            {initial ? "Editar ejercicio" : "Nuevo ejercicio"}
          </h4>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
            <FiX />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={label}>Nombre *</label>
            <input className="input-compact" value={form.nombre}
              onChange={e => set("nombre", e.target.value)} placeholder="Ej: Press de banca" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>Grupo muscular</label>
              <select className="input-compact" value={form.grupo_muscular}
                onChange={e => set("grupo_muscular", e.target.value)}>
                <option value="">Seleccionar...</option>
                {GRUPOS_MUSCULARES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Tipo</label>
              <select className="input-compact" value={form.tipo}
                onChange={e => set("tipo", e.target.value)}>
                <option value="">Seleccionar...</option>
                {TIPOS_EJERCICIO.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Series</label>
              <input className="input-compact" type="number" min={1}
                value={form.series} onChange={e => set("series", e.target.value)}
                placeholder="3" />
            </div>
            <div>
              <label style={label}>Repeticiones</label>
              <input className="input-compact" value={form.repeticiones}
                onChange={e => set("repeticiones", e.target.value)}
                placeholder="10-12 o al fallo" />
            </div>
          </div>

          <div>
            <label style={label}>Descripción / instrucciones</label>
            <textarea className="input-compact" rows={3} style={{ resize: "vertical" }}
              value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
              placeholder="Cómo ejecutar correctamente el ejercicio..." />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn-outline-small" style={{ flex: 1, padding: 10 }}>
            Cancelar
          </button>
          <button onClick={() => onSave(form)} className="btn-compact-primary"
            style={{ flex: 2, padding: 10, opacity: saving ? 0.7 : 1 }} disabled={saving}>
            <FiSave size={14} /> {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════ */
export default function TrainerRoutines() {
  const { toast, confirm, ToastPortal } = useToast();

  /* ── Tab activo ── */
  const [tab, setTab] = useState("routines"); // "routines" | "exercises"

  /* ── Estado: rutinas ── */
  const [routines, setRoutines]             = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loadingR, setLoadingR]             = useState(true);
  const [errorR, setErrorR]                 = useState(null);
  const [actionLoading, setActionLoading]   = useState(false);
  const [searchTerm, setSearchTerm]         = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [showForm, setShowForm]             = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [formData, setFormData]             = useState(emptyRoutine());
  const [expandedDay, setExpandedDay]       = useState(0);
  const [showLibraryPicker, setShowLibraryPicker] = useState(null); // {di, ei} | null

  /* ── Estado: ejercicios ── */
  const [exercises, setExercises]           = useState([]);
  const [loadingE, setLoadingE]             = useState(false);
  const [errorE, setErrorE]                 = useState(null);
  const [searchEx, setSearchEx]             = useState("");
  const [showExForm, setShowExForm]         = useState(false);
  const [editingEx, setEditingEx]           = useState(null);
  const [savingEx, setSavingEx]             = useState(false);

  /* ── Cargar rutinas ── */
  const loadRoutines = useCallback(async () => {
    try {
      setLoadingR(true); setErrorR(null);
      const data = await trainerService.getRoutines({ category: filterCategory, search: searchTerm });
      setRoutines(data.routines || []);
      setCategoryCounts(data.categoryCounts || {});
    } catch (err) {
      setErrorR(err.message);
      toast.error("Error al cargar", err.message);
    } finally {
      setLoadingR(false);
    }
  }, [filterCategory, searchTerm]);

  useEffect(() => {
    const t = setTimeout(loadRoutines, 300);
    return () => clearTimeout(t);
  }, [loadRoutines]);

  /* ── Cargar ejercicios ── */
  const loadExercises = useCallback(async () => {
    try {
      setLoadingE(true); setErrorE(null);
      const data = await trainerService.getExercises({ search: searchEx });
      setExercises(data.exercises || []);
    } catch (err) {
      setErrorE(err.message);
    } finally {
      setLoadingE(false);
    }
  }, [searchEx]);

  useEffect(() => {
    if (tab === "exercises") {
      const t = setTimeout(loadExercises, 300);
      return () => clearTimeout(t);
    }
  }, [loadExercises, tab]);

  // Pre-fetch exercises for library picker even on routines tab
  useEffect(() => { loadExercises(); }, []);

  /* ── Acciones rutinas ── */
  const handleDuplicate = async (e, id, name) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await trainerService.duplicateRoutine(id);
      toast.success("Rutina duplicada", `"${name}" fue copiada.`);
      await loadRoutines();
    } catch (err) { toast.error("Error", err.message); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    const ok = await confirm({
      title: "¿Eliminar rutina?",
      message: `"${name}" se eliminará permanentemente.`,
      type: "danger", confirmText: "Eliminar", cancelText: "Cancelar",
    });
    if (!ok) return;
    try {
      setActionLoading(true);
      await trainerService.deleteRoutine(id);
      setSelectedRoutine(null);
      toast.success("Rutina eliminada", `"${name}" eliminada correctamente.`);
      await loadRoutines();
    } catch (err) { toast.error("Error", err.message); }
    finally { setActionLoading(false); }
  };

  const openCreate = () => {
    setFormData(emptyRoutine());
    setEditingId(null);
    setExpandedDay(0);
    setShowForm(true);
  };

  const openEdit = (e, routine) => {
    e && e.stopPropagation();
    setFormData({
      name: routine.name, category: routine.category,
      difficulty: routine.difficulty,
      duration_minutes: parseInt(routine.duration) || 60,
      description: routine.description, days: [],
    });
    setEditingId(routine.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.warning("Campo requerido", "El nombre es obligatorio."); return;
    }
    try {
      setActionLoading(true);
      if (editingId) {
        await trainerService.updateRoutine(editingId, formData);
        toast.success("Rutina actualizada", `"${formData.name}" guardada.`);
      } else {
        await trainerService.createRoutine(formData);
        toast.success("Rutina creada", `"${formData.name}" añadida.`);
      }
      setShowForm(false);
      await loadRoutines();
    } catch (err) {
      toast.error("Error al guardar", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Helpers días y ejercicios en formulario ── */
  const addDay = () => {
    setFormData(f => ({ ...f, days: [...f.days, emptyDay()] }));
    setExpandedDay(formData.days.length);
  };

  const removeDay = (di) => setFormData(f => ({ ...f, days: f.days.filter((_, i) => i !== di) }));

  const updateDay = (di, field, val) => setFormData(f => {
    const days = [...f.days];
    days[di] = { ...days[di], [field]: val };
    return { ...f, days };
  });

  const addExercise = (di) => setFormData(f => {
    const days = [...f.days];
    days[di] = {
      ...days[di],
      exercises: [...days[di].exercises,
        { name: "", sets: "3", reps: "12", peso: "", notes: "", imagenes: [] }],
    };
    return { ...f, days };
  });

  const removeExercise = (di, ei) => setFormData(f => {
    const days = [...f.days];
    days[di] = { ...days[di], exercises: days[di].exercises.filter((_, i) => i !== ei) };
    return { ...f, days };
  });

  const updateExercise = (di, ei, field, val) => setFormData(f => {
    const days = [...f.days];
    const exs  = [...days[di].exercises];
    exs[ei] = { ...exs[ei], [field]: val };
    days[di] = { ...days[di], exercises: exs };
    return { ...f, days };
  });

  /* Añadir desde biblioteca */
  const pickFromLibrary = (di, ei) => setShowLibraryPicker({ di, ei });

  const handlePickExercise = (ex) => {
    const { di, ei } = showLibraryPicker;
    const current = formData.days[di].exercises[ei];
    updateExercise(di, ei, "name",  ex.nombre);
    if (ex.series)      updateExercise(di, ei, "sets", String(ex.series));
    if (ex.repeticiones) updateExercise(di, ei, "reps", ex.repeticiones);
    setShowLibraryPicker(null);
  };

  /* ── Acciones ejercicios ── */
  const handleSaveEx = async (form) => {
    if (!form.nombre.trim()) { toast.warning("Campo requerido", "El nombre es obligatorio."); return; }
    try {
      setSavingEx(true);
      if (editingEx) {
        await trainerService.updateExercise(editingEx.id, form);
        toast.success("Ejercicio actualizado", form.nombre);
      } else {
        await trainerService.createExercise(form);
        toast.success("Ejercicio creado", form.nombre);
      }
      setShowExForm(false);
      setEditingEx(null);
      await loadExercises();
    } catch (err) { toast.error("Error", err.message); }
    finally { setSavingEx(false); }
  };

  const handleDeleteEx = async (ex) => {
    const ok = await confirm({
      title: "¿Eliminar ejercicio?",
      message: `"${ex.nombre}" se eliminará de la biblioteca.`,
      type: "danger", confirmText: "Eliminar", cancelText: "Cancelar",
    });
    if (!ok) return;
    try {
      setActionLoading(true);
      await trainerService.deleteExercise(ex.id);
      toast.success("Ejercicio eliminado", ex.nombre);
      await loadExercises();
    } catch (err) { toast.error("Error", err.message); }
    finally { setActionLoading(false); }
  };

  /* ── Animaciones ── */
  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const iv = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div className="dashboard-content">
      <ToastPortal />

      {/* Header */}
      <motion.div className="welcome-section"
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <div className="welcome-content">
          <div className="welcome-text">
            <h2>Rutinas y Ejercicios</h2>
            <p>Crea rutinas, gestiona tu biblioteca de ejercicios y asígnalos a tus clientes</p>
          </div>
          <FiFileText size={50} style={{ color: "var(--accent)", opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 4, marginTop: 22, marginBottom: 20,
        borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {[
          { key: "routines",  icon: <FiFileText size={14} />,  label: "Rutinas" },
          { key: "exercises", icon: <FiBookOpen size={14} />, label: "Ejercicios" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 18px", border: "none", cursor: "pointer",
              borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              background: "none",
              color: tab === t.key ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: 14, transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════ TAB: RUTINAS ════════════════════════ */}
      {tab === "routines" && (
        <>
          {/* KPIs */}
          <motion.div className="kpi-grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 20 }}
            variants={cv} initial="hidden" animate="visible">
            <motion.div className="stat-card highlight-border" variants={iv}>
              <div className="stat-header"><h3>Total Rutinas</h3></div>
              <div className="stat-value highlight">{routines.length}</div>
              <div className="stat-detail">En tu biblioteca</div>
            </motion.div>
            <motion.div className="stat-card" variants={iv}>
              <div className="stat-header"><h3>Más Usada</h3></div>
              <div className="stat-value" style={{ fontSize: 16 }}>
                {[...routines].sort((a, b) => b.clients - a.clients)[0]?.name || "—"}
              </div>
              <div className="stat-detail">
                {[...routines].sort((a, b) => b.clients - a.clients)[0]?.clients || 0} clientes
              </div>
            </motion.div>
            <motion.div className="stat-card" variants={iv}>
              <div className="stat-header"><h3>Última Act.</h3></div>
              <div className="stat-value" style={{ fontSize: 16 }}>{routines[0]?.lastUsed || "—"}</div>
              <div className="stat-detail">{routines[0]?.name || ""}</div>
            </motion.div>
          </motion.div>

          {/* Búsqueda + filtros */}
          <motion.div className="chart-card" style={{ marginBottom: 16 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div style={{ display: "flex", gap: 15, alignItems: "center", flexWrap: "wrap" }}>
              <div className="input-dark-container with-icon" style={{ flex: 1, minWidth: 220 }}>
                <FiSearch size={18} style={{ color: "var(--text-secondary)" }} />
                <input type="text" className="search-input" placeholder="Buscar rutina…"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                {searchTerm && (
                  <button className="clear-search" onClick={() => setSearchTerm("")}><FiX /></button>
                )}
              </div>
              <motion.button className="btn-compact-primary" onClick={openCreate}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <FiPlus size={16} /> Nueva Rutina
              </motion.button>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
              <FiFilter size={15} style={{ color: "var(--text-secondary)" }} />
              {[{ value: "all", label: "Todas", count: routines.length },
                ...CATEGORIES.map(c => ({ value: c, label: c, count: categoryCounts[c] || 0 }))
              ].map(cat => (
                <motion.button key={cat.value} className="btn-outline-small"
                  onClick={() => setFilterCategory(cat.value)}
                  style={{
                    background: filterCategory === cat.value ? "var(--accent)" : "transparent",
                    color: filterCategory === cat.value ? "#fff" : "var(--text-secondary)",
                    borderColor: filterCategory === cat.value ? "var(--accent)" : "var(--border)",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  {cat.label}
                  <span style={{
                    background: filterCategory === cat.value ? "rgba(0,0,0,.2)" : "var(--bg-input)",
                    padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                  }}>
                    {cat.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Grid de rutinas */}
          <motion.div className="chart-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            {loadingR ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <FiLoader size={30} />
                </motion.div>
                <p style={{ marginTop: 14 }}>Cargando rutinas…</p>
              </div>
            ) : (
              <motion.div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}
                variants={cv} initial="hidden" animate="visible">
                {routines.map(routine => (
                  <motion.div key={routine.id} variants={iv} className="member-card-hover"
                    style={{
                      background: "var(--bg-input)", border: "1px solid var(--border)",
                      borderRadius: 12, padding: 20, cursor: "pointer",
                    }}
                    onClick={() => setSelectedRoutine(routine)}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {/* Header */}
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                      <div style={{
                        width: 46, height: 46, background: "var(--bg-card)", borderRadius: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, color: "var(--accent)",
                      }}>
                        {CATEGORY_ICONS[routine.category] || <GiMuscleUp />}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{routine.name}</h4>
                        <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                          {routine.category} · {routine.duration}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                      {routine.description || "Sin descripción"}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {[
                        { label: "Ejercicios", value: routine.exercises, color: "var(--accent)" },
                        { label: "Clientes",   value: routine.clients,   color: "var(--success)" },
                      ].map(s => (
                        <div key={s.label} style={{ background: "var(--bg-card)", padding: 8, borderRadius: 8, textAlign: "center" }}>
                          <div style={{ color: "var(--text-secondary)", fontSize: 10, marginBottom: 3 }}>{s.label}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      paddingTop: 12, borderTop: "1px solid var(--border)",
                    }}>
                      <span style={{
                        padding: "3px 9px",
                        background: `${getDifficultyColor(routine.difficulty)}20`,
                        color: getDifficultyColor(routine.difficulty),
                        borderRadius: 6, fontSize: 11, fontWeight: 600,
                      }}>
                        {routine.difficulty}
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <motion.button className="icon-btn" style={{ padding: 6 }}
                          onClick={e => openEdit(e, routine)} title="Editar"
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <FiEdit size={13} />
                        </motion.button>
                        <motion.button className="icon-btn" style={{ padding: 6 }}
                          onClick={e => handleDuplicate(e, routine.id, routine.name)} title="Duplicar"
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <FiCopy size={13} />
                        </motion.button>
                        <motion.button className="icon-btn danger" style={{ padding: 6 }}
                          onClick={e => handleDelete(e, routine.id, routine.name)} title="Eliminar"
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <FiTrash2 size={13} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {!loadingR && routines.length === 0 && (
              <div className="empty-state">
                <FiFileText size={44} style={{ opacity: 0.3, marginBottom: 14 }} />
                <h3>No se encontraron rutinas</h3>
                <p>Intenta ajustar los filtros o crea la primera</p>
                <motion.button className="btn-compact-primary" style={{ marginTop: 14 }} onClick={openCreate}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <FiPlus size={15} /> Crear primera rutina
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Modal detalle rutina */}
          <AnimatePresence>
            {selectedRoutine && (
              <motion.div
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 1000, padding: 20 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedRoutine(null)}>
                <motion.div
                  style={{ background: "var(--bg-card)", borderRadius: 16, maxWidth: 700,
                    width: "100%", maxHeight: "90vh", overflow: "auto",
                    border: "1px solid var(--border)" }}
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ padding: 24, borderBottom: "1px solid var(--border)",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ width: 56, height: 56, background: "var(--bg-input)", borderRadius: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 26, color: "var(--accent)" }}>
                        {CATEGORY_ICONS[selectedRoutine.category] || <GiMuscleUp />}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 19, marginBottom: 4 }}>{selectedRoutine.name}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                          {selectedRoutine.category} · {selectedRoutine.duration} · {selectedRoutine.exercises} ejercicios
                        </p>
                      </div>
                    </div>
                    <motion.button className="icon-btn" onClick={() => setSelectedRoutine(null)}>
                      <FiX size={18} />
                    </motion.button>
                  </div>
                  <div style={{ padding: 24 }}>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.6 }}>
                      {selectedRoutine.description || "Sin descripción."}
                    </p>
                    <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Lista de Ejercicios</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(selectedRoutine.exerciseList || []).map((ex, idx) => (
                        <div key={idx} style={{
                          background: "var(--bg-input)", padding: "12px 14px", borderRadius: 8,
                          border: "1px solid var(--border)",
                        }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={{
                              width: 28, height: 28, background: "var(--accent)", color: "#fff",
                              borderRadius: "50%", display: "flex", alignItems: "center",
                              justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0,
                            }}>{idx + 1}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{ex.name}</div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                                {ex.day} · {ex.sets} · {ex.peso ? `${ex.peso} kg` : "Peso libre"}
                              </div>
                            </div>
                          </div>
                          {/* Imágenes del ejercicio */}
                          {(ex.imagenes || []).length > 0 && (
                            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                              {ex.imagenes.map((img, ii) => (
                                <img key={ii} src={img} alt={`paso ${ii + 1}`}
                                  style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 6,
                                    border: "1px solid var(--border)" }} />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {(!selectedRoutine.exerciseList || selectedRoutine.exerciseList.length === 0) && (
                        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Sin ejercicios registrados.</p>
                      )}
                    </div>
                    <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
                      <motion.button className="btn-compact-primary" style={{ flex: 1 }}
                        onClick={e => { setSelectedRoutine(null); openEdit(e, selectedRoutine); }}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                        <FiEdit size={15} /> Editar
                      </motion.button>
                      <motion.button className="btn-compact-primary" style={{ flex: 1 }}
                        onClick={e => { handleDuplicate(e, selectedRoutine.id, selectedRoutine.name); setSelectedRoutine(null); }}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                        <FiCopy size={15} /> Duplicar
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal crear / editar rutina */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 1100, padding: 20 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  style={{ background: "var(--bg-card)", borderRadius: 16, maxWidth: 780,
                    width: "100%", maxHeight: "92vh", overflow: "auto",
                    border: "1px solid var(--border)" }}
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}>
                  {/* Header form */}
                  <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 17 }}>{editingId ? "Editar Rutina" : "Nueva Rutina"}</h3>
                    <motion.button className="icon-btn" onClick={() => setShowForm(false)}>
                      <FiX size={19} />
                    </motion.button>
                  </div>

                  <div style={{ padding: 24 }}>
                    {/* Datos básicos */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label-compact">Nombre *</label>
                        <input className="input-compact" value={formData.name}
                          onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                          placeholder="Ej. Fuerza Tren Superior" />
                      </div>
                      <div>
                        <label className="form-label-compact">Categoría</label>
                        <select className="input-compact" value={formData.category}
                          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}>
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label-compact">Dificultad</label>
                        <select className="input-compact" value={formData.difficulty}
                          onChange={e => setFormData(f => ({ ...f, difficulty: e.target.value }))}>
                          {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label-compact">Duración (min)</label>
                        <input type="number" className="input-compact" min={10}
                          value={formData.duration_minutes}
                          onChange={e => setFormData(f => ({ ...f, duration_minutes: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label-compact">Descripción</label>
                        <textarea className="input-compact" rows={3}
                          style={{ resize: "vertical", fontFamily: "inherit" }}
                          value={formData.description}
                          onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                          placeholder="Objetivo de la rutina…" />
                      </div>
                    </div>

                    {/* Días */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600 }}>Días de entrenamiento</h4>
                        <motion.button className="btn-compact-primary" onClick={addDay} style={{ fontSize: 12 }}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <FiPlus size={13} /> Agregar día
                        </motion.button>
                      </div>

                      {formData.days.length === 0 && (
                        <p style={{ color: "var(--text-secondary)", fontSize: 12, textAlign: "center", padding: "18px 0" }}>
                          Agrega días para definir los ejercicios.
                        </p>
                      )}

                      {formData.days.map((day, di) => (
                        <div key={di} style={{
                          background: "var(--bg-input)", borderRadius: 10,
                          border: "1px solid var(--border)", marginBottom: 10, overflow: "hidden",
                        }}>
                          {/* Cabecera del día */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                            cursor: "pointer",
                            borderBottom: expandedDay === di ? "1px solid var(--border)" : "none",
                          }} onClick={() => setExpandedDay(expandedDay === di ? -1 : di)}>
                            <select className="input-compact" style={{ width: "auto", flex: 1 }}
                              value={day.day}
                              onChange={e => { e.stopPropagation(); updateDay(di, "day", e.target.value); }}
                              onClick={e => e.stopPropagation()}>
                              {DIAS_SEMANA.map(d => <option key={d}>{d}</option>)}
                            </select>
                            <input className="input-compact" style={{ flex: 2 }}
                              placeholder="Grupo muscular" value={day.muscleGroup}
                              onChange={e => updateDay(di, "muscleGroup", e.target.value)}
                              onClick={e => e.stopPropagation()} />
                            <span style={{ color: "var(--text-secondary)", fontSize: 11, flexShrink: 0 }}>
                              {day.exercises.length} ej.
                            </span>
                            {expandedDay === di ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                            <motion.button className="icon-btn danger" style={{ padding: 4 }}
                              onClick={e => { e.stopPropagation(); removeDay(di); }}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <FiTrash2 size={13} />
                            </motion.button>
                          </div>

                          {/* Ejercicios del día */}
                          {expandedDay === di && (
                            <div style={{ padding: "14px 16px" }}>
                              {day.exercises.map((ex, ei) => (
                                <div key={ei} style={{
                                  background: "var(--bg-card)", borderRadius: 8,
                                  border: "1px solid var(--border)", padding: "10px 12px",
                                  marginBottom: 8,
                                }}>
                                  {/* Fila principal */}
                                  <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 0.7fr 0.7fr 0.7fr auto auto",
                                    gap: 6, alignItems: "center",
                                  }}>
                                    <input className="input-compact" placeholder="Nombre del ejercicio"
                                      value={ex.name} onChange={e => updateExercise(di, ei, "name", e.target.value)} />
                                    <input className="input-compact" placeholder="Series"
                                      value={ex.sets} onChange={e => updateExercise(di, ei, "sets", e.target.value)} />
                                    <input className="input-compact" placeholder="Reps"
                                      value={ex.reps} onChange={e => updateExercise(di, ei, "reps", e.target.value)} />
                                    <input className="input-compact" placeholder="Peso"
                                      value={ex.peso} onChange={e => updateExercise(di, ei, "peso", e.target.value)} />
                                    {/* Botón biblioteca */}
                                    <button title="Seleccionar de biblioteca"
                                      onClick={() => pickFromLibrary(di, ei)}
                                      style={{
                                        width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)",
                                        background: "var(--bg-input)", color: "var(--accent)",
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                      }}>
                                      <FiBookOpen size={13} />
                                    </button>
                                    <motion.button className="icon-btn danger" style={{ padding: 4 }}
                                      onClick={() => removeExercise(di, ei)}
                                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                      <FiX size={13} />
                                    </motion.button>
                                  </div>

                                  {/* Fila de imágenes */}
                                  <ImageSlots
                                    images={ex.imagenes || []}
                                    onChange={imgs => updateExercise(di, ei, "imagenes", imgs)}
                                  />
                                </div>
                              ))}
                              <motion.button className="btn-outline-small" style={{ marginTop: 4 }}
                                onClick={() => addExercise(di)}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <FiPlus size={13} /> Ejercicio
                              </motion.button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Acciones */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <motion.button className="btn-outline-small" onClick={() => setShowForm(false)}
                        disabled={actionLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        Cancelar
                      </motion.button>
                      <motion.button className="btn-compact-primary" onClick={handleSave}
                        disabled={actionLoading}
                        whileHover={{ scale: actionLoading ? 1 : 1.05 }}
                        whileTap={{ scale: actionLoading ? 1 : 0.95 }}>
                        <FiSave size={15} />
                        {actionLoading ? "Guardando…" : editingId ? "Actualizar" : "Crear Rutina"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Library picker modal */}
          <AnimatePresence>
            {showLibraryPicker && (
              <LibraryPicker
                exercises={exercises}
                onPick={handlePickExercise}
                onClose={() => setShowLibraryPicker(null)}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* ════════════════════════ TAB: EJERCICIOS ════════════════════════ */}
      {tab === "exercises" && (
        <>
          {/* Toolbar */}
          <motion.div className="chart-card" style={{ marginBottom: 16 }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <div className="input-dark-container with-icon" style={{ flex: 1, minWidth: 220 }}>
                <FiSearch size={16} style={{ color: "var(--text-secondary)" }} />
                <input className="search-input" placeholder="Buscar ejercicio…"
                  value={searchEx} onChange={e => setSearchEx(e.target.value)} />
                {searchEx && (
                  <button className="clear-search" onClick={() => setSearchEx("")}><FiX /></button>
                )}
              </div>
              <button className="btn-compact-primary"
                onClick={() => { setEditingEx(null); setShowExForm(true); }}>
                <FiPlus size={15} /> Nuevo ejercicio
              </button>
            </div>
          </motion.div>

          {/* Tabla de ejercicios */}
          <motion.div className="table-section"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="section-header" style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", marginBottom: 0 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                Biblioteca de ejercicios
              </h3>
              <span className="total-count">{exercises.length} ejercicios</span>
            </div>

            {loadingE ? (
              <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-secondary)" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <FiLoader size={26} />
                </motion.div>
              </div>
            ) : exercises.length === 0 ? (
              <div className="empty-state" style={{ padding: "48px 24px" }}>
                <FiBookOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3>Biblioteca vacía</h3>
                <p>Agrega ejercicios a tu biblioteca para asignarlos rápidamente en tus rutinas.</p>
                <button className="btn-compact-primary" style={{ marginTop: 14 }}
                  onClick={() => { setEditingEx(null); setShowExForm(true); }}>
                  <FiPlus size={14} /> Crear primer ejercicio
                </button>
              </div>
            ) : (
              <div className="custom-table-container" style={{ borderRadius: 0, border: "none" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Grupo muscular</th>
                      <th>Tipo</th>
                      <th>Series × Reps</th>
                      <th style={{ width: 80, textAlign: "center" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map(ex => (
                      <tr key={ex.id}>
                        <td className="font-bold">
                          {ex.nombre}
                          {ex.descripcion && (
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 400, marginTop: 2 }}>
                              {ex.descripcion.slice(0, 80)}{ex.descripcion.length > 80 ? "…" : ""}
                            </div>
                          )}
                        </td>
                        <td>{ex.grupo_muscular || "—"}</td>
                        <td>{ex.tipo || "—"}</td>
                        <td>
                          {ex.series ? `${ex.series} × ${ex.repeticiones || "—"}` : "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <motion.button className="icon-btn" style={{ padding: 5 }}
                              title="Editar"
                              onClick={() => { setEditingEx(ex); setShowExForm(true); }}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <FiEdit size={13} />
                            </motion.button>
                            <motion.button className="icon-btn danger" style={{ padding: 5 }}
                              title="Eliminar"
                              onClick={() => handleDeleteEx(ex)}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <FiTrash2 size={13} />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Modal ejercicio */}
          <AnimatePresence>
            {showExForm && (
              <ExerciseFormModal
                initial={editingEx ? {
                  nombre:         editingEx.nombre,
                  descripcion:    editingEx.descripcion || "",
                  grupo_muscular: editingEx.grupo_muscular || "",
                  tipo:           editingEx.tipo || "",
                  series:         editingEx.series || "",
                  repeticiones:   editingEx.repeticiones || "",
                } : null}
                onSave={handleSaveEx}
                onClose={() => { setShowExForm(false); setEditingEx(null); }}
                saving={savingEx}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
