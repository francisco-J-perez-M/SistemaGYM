/**
 * TrainerDiets.jsx — Seccion de dietas del portal entrenador.
 * Permite crear, editar, eliminar y asignar planes de dieta a clientes.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus, FiEdit, FiTrash2, FiX, FiSave,
  FiUser, FiAlertCircle, FiSearch, FiChevronDown,
  FiCheckCircle, FiTarget,
} from "react-icons/fi";
import { GiMeal } from "react-icons/gi";
import trainerService from "../../services/entrenador/trainerService";
import "../../css/CSSUnificado.css";

const EMPTY_DIET = {
  nombre: "", descripcion: "", calorias_meta: "", id_miembro_pg: "",
  comidas: [],
};

const EMPTY_MEAL = { nombre: "", hora: "", calorias: "", descripcion: "" };

// --- Meal row ---
function MealRow({ meal, idx, editing, onUpdate, onRemove }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.7fr 2fr auto",
      gap: 8, alignItems: "center",
      padding: "8px 10px", background: "var(--bg-card)",
      borderRadius: 8, border: "1px solid var(--border)",
    }}>
      {editing ? (
        <>
          <input className="input-compact" placeholder="Comida (ej. Desayuno)"
            value={meal.nombre} onChange={e => onUpdate(idx, "nombre", e.target.value)} />
          <input className="input-compact" placeholder="Hora"
            value={meal.hora} onChange={e => onUpdate(idx, "hora", e.target.value)} />
          <input className="input-compact" placeholder="Kcal" type="number"
            value={meal.calorias} onChange={e => onUpdate(idx, "calorias", e.target.value)} />
          <input className="input-compact" placeholder="Descripcion"
            value={meal.descripcion} onChange={e => onUpdate(idx, "descripcion", e.target.value)} />
          <button className="icon-btn danger" style={{ padding: 4 }} onClick={() => onRemove(idx)}>
            <FiX size={13} />
          </button>
        </>
      ) : (
        <>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{meal.nombre || "—"}</span>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{meal.hora || "—"}</span>
          <span style={{ fontSize: 12, color: "var(--accent)" }}>{meal.calorias ? meal.calorias + " kcal" : "—"}</span>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", gridColumn: "span 2" }}>{meal.descripcion || "—"}</span>
        </>
      )}
    </div>
  );
}

// --- Diet form modal ---
function DietFormModal({ diet, clients, onSave, onClose, saving }) {
  const [form, setForm] = useState(diet || EMPTY_DIET);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const addMeal = () => setForm(f => ({ ...f, comidas: [...f.comidas, { ...EMPTY_MEAL }] }));
  const removeMeal = (i) => setForm(f => ({ ...f, comidas: f.comidas.filter((_, idx) => idx !== i) }));
  const updateMeal = (i, field, val) => setForm(f => {
    const comidas = [...f.comidas];
    comidas[i] = { ...comidas[i], [field]: val };
    return { ...f, comidas };
  });

  return (
    <motion.div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div
        style={{ background: "var(--bg-card)", borderRadius: 16, maxWidth: 640,
          width: "100%", maxHeight: "90vh", overflow: "auto",
          border: "1px solid var(--border)" }}
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>
            {diet ? "Editar plan de dieta" : "Nuevo plan de dieta"}
          </h3>
          <button className="icon-btn" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Basic fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
                textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>
                Nombre del plan *
              </label>
              <input className="input-compact" name="nombre" placeholder="Ej. Plan hipocalórico"
                value={form.nombre} onChange={handleChange} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
                textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>
                Calorías meta / día
              </label>
              <input className="input-compact" name="calorias_meta" type="number" placeholder="Ej. 2000"
                value={form.calorias_meta} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
              textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>
              Asignar a cliente (opcional)
            </label>
            <select className="input-compact" name="id_miembro_pg" value={form.id_miembro_pg} onChange={handleChange}>
              <option value="">Sin asignar</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
              textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>
              Descripción
            </label>
            <textarea className="input-compact" name="descripcion" rows={2}
              placeholder="Objetivos, notas generales..." style={{ resize: "vertical", fontFamily: "inherit" }}
              value={form.descripcion} onChange={handleChange} />
          </div>

          {/* Meals */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Comidas del día</label>
              <button className="btn-outline-small" style={{ fontSize: 11 }} onClick={addMeal}>
                <FiPlus size={12} /> Agregar comida
              </button>
            </div>
            {form.comidas.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: "10px 0" }}>
                Sin comidas. Agrega al menos una.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {form.comidas.map((m, i) => (
                <MealRow key={i} meal={m} idx={i} editing={true}
                  onUpdate={updateMeal} onRemove={removeMeal} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn-outline-small" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-compact-primary" onClick={() => onSave(form)} disabled={saving}>
            <FiSave size={14} /> {saving ? "Guardando..." : "Guardar plan"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Diet detail modal ---
function DietDetailModal({ diet, clients, onClose, onEdit, onAssign }) {
  const [assignTo, setAssignTo] = useState(diet.id_miembro_pg || "");
  const [assigning, setAssigning] = useState(false);

  const clientName = (id) => clients.find(c => String(c.id) === String(id))?.name || "Sin asignar";

  const handleAssign = async () => {
    try {
      setAssigning(true);
      await onAssign(diet.id, assignTo || null);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <motion.div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div
        style={{ background: "var(--bg-card)", borderRadius: 16, maxWidth: 600,
          width: "100%", maxHeight: "90vh", overflow: "auto",
          border: "1px solid var(--border)" }}
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{diet.nombre}</h3>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {diet.calorias_meta ? diet.calorias_meta + " kcal/día · " : ""}
              {diet.comidas?.length || 0} comidas
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div style={{ padding: 24 }}>
          {diet.descripcion && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.6 }}>
              {diet.descripcion}
            </p>
          )}

          {/* Assign section */}
          <div style={{ background: "var(--bg-input)", borderRadius: 10,
            border: "1px solid var(--border)", padding: "14px 16px", marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)",
              textTransform: "uppercase", letterSpacing: ".05em" }}>
              Cliente asignado
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select className="input-compact" style={{ flex: 1 }}
                value={assignTo} onChange={e => setAssignTo(e.target.value)}>
                <option value="">Sin asignar</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn-compact-primary" style={{ whiteSpace: "nowrap" }}
                onClick={handleAssign} disabled={assigning}>
                <FiCheckCircle size={14} /> {assigning ? "..." : "Asignar"}
              </button>
            </div>
          </div>

          {/* Meals */}
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
            Plan de comidas
          </div>
          {(!diet.comidas || diet.comidas.length === 0) && (
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Sin comidas registradas.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(diet.comidas || []).map((m, i) => (
              <MealRow key={i} meal={m} idx={i} editing={false} onUpdate={() => {}} onRemove={() => {}} />
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 10 }}>
          <button className="btn-compact-primary" style={{ flex: 1 }}
            onClick={() => { onClose(); onEdit(diet); }}>
            <FiEdit size={14} /> Editar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Main ---
export default function TrainerDiets() {
  const [diets, setDiets]           = useState([]);
  const [clients, setClients]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [editingDiet, setEditingDiet] = useState(null);
  const [selectedDiet, setSelectedDiet] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dietsData, clientsData] = await Promise.all([
        trainerService.getDiets(),
        trainerService.getClients(),
      ]);
      setDiets(dietsData);
      setClients((clientsData.clients || clientsData || []).map(c => ({
        id: c.id || c.id_usuario_pg,
        name: c.name || c.nombre,
      })));
    } catch (err) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    if (!form.nombre.trim()) { alert("El nombre es obligatorio"); return; }
    try {
      setSaving(true);
      if (editingDiet) {
        await trainerService.updateDiet(editingDiet.id, form);
      } else {
        await trainerService.createDiet(form);
      }
      setShowForm(false);
      setEditingDiet(null);
      await loadAll();
    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este plan de dieta?")) return;
    try {
      setDeletingId(id);
      await trainerService.deleteDiet(id);
      setDiets(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAssign = async (id, id_miembro_pg) => {
    try {
      await trainerService.assignDiet(id, id_miembro_pg);
      await loadAll();
      if (selectedDiet?.id === id) {
        setSelectedDiet(prev => ({ ...prev, id_miembro_pg }));
      }
    } catch (err) {
      alert("Error al asignar: " + err.message);
    }
  };

  const clientName = (id_miembro_pg) =>
    clients.find(c => String(c.id) === String(id_miembro_pg))?.name || null;

  const filtered = diets.filter(d => {
    const matchSearch = !search || d.nombre.toLowerCase().includes(search.toLowerCase());
    const matchClient = !filterClient ||
      String(d.id_miembro_pg || d.id_miembro) === filterClient;
    return matchSearch && matchClient;
  });

  if (loading) return (
    <div className="dashboard-content">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
      </div>
    </div>
  );

  return (
    <div className="dashboard-content">

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="page-title" style={{ marginBottom: 4 }}>Planes de Dieta</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            Crea y asigna planes nutricionales a tus clientes
          </p>
        </div>
        <button className="btn-compact-primary" onClick={() => { setEditingDiet(null); setShowForm(true); }}>
          <FiPlus size={14} /> Nuevo plan
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
              borderRadius: 10, padding: "12px 16px", marginBottom: 18,
              color: "var(--danger)", fontSize: 13, display: "flex", gap: 10, alignItems: "center",
            }}>
            <FiAlertCircle size={15} /> {error}
            <button onClick={() => setError(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--danger)" }}>
              <FiX size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <FiSearch size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input className="input-compact" placeholder="Buscar plan..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 30 }} />
        </div>
        <select className="input-compact" style={{ flex: "0 0 200px" }}
          value={filterClient} onChange={e => setFilterClient(e.target.value)}>
          <option value="">Todos los clientes</option>
          <option value="unassigned">Sin asignar</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* KPI bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total planes", value: diets.length, color: "var(--accent)" },
          { label: "Asignados", value: diets.filter(d => d.id_miembro || d.id_miembro_pg).length, color: "var(--success)" },
          { label: "Sin asignar", value: diets.filter(d => !d.id_miembro && !d.id_miembro_pg).length, color: "var(--warning)" },
        ].map(k => (
          <div key={k.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 18px", background: "var(--bg-card)",
            borderRadius: 12, border: "1px solid var(--border)", flex: "1 1 120px",
          }}>
            <FiTarget size={16} style={{ color: k.color }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".05em" }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Diet cards */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)",
        }}>
          <GiMeal size={48} style={{ color: "var(--text-secondary)", marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {diets.length === 0 ? "No hay planes de dieta. Crea el primero." : "Sin resultados para este filtro."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {filtered.map(diet => {
            const assigned = diet.id_miembro_pg || diet.id_miembro;
            return (
              <motion.div key={diet.id}
                className="stat-card"
                style={{ padding: 18, cursor: "pointer" }}
                whileHover={{ translateY: -2 }}
                onClick={() => setSelectedDiet(diet)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--accent)", fontSize: 18,
                    }}>
                      <GiMeal />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{diet.nombre}</div>
                      {diet.calorias_meta && (
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                          {diet.calorias_meta} kcal/día
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="icon-btn" style={{ padding: 5 }}
                      onClick={e => { e.stopPropagation(); setEditingDiet(diet); setShowForm(true); }}>
                      <FiEdit size={13} />
                    </button>
                    <button className="icon-btn danger" style={{ padding: 5 }}
                      disabled={deletingId === diet.id}
                      onClick={e => { e.stopPropagation(); handleDelete(diet.id); }}>
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>

                {diet.descripcion && (
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.5,
                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {diet.descripcion}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <FiUser size={11} style={{ color: assigned ? "var(--success)" : "var(--text-secondary)" }} />
                    <span style={{ fontSize: 11, color: assigned ? "var(--success)" : "var(--text-secondary)" }}>
                      {assigned ? (clientName(assigned) || "Asignado") : "Sin asignar"}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {diet.comidas?.length || 0} comidas
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <DietFormModal
            diet={editingDiet}
            clients={clients}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditingDiet(null); }}
            saving={saving}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDiet && (
          <DietDetailModal
            diet={selectedDiet}
            clients={clients}
            onClose={() => setSelectedDiet(null)}
            onEdit={(d) => { setEditingDiet(d); setShowForm(true); }}
            onAssign={handleAssign}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
