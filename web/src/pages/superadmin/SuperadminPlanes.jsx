import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getPlanes, crearPlan, editarPlan, togglePlan } from "../../api/superadmin";

const card = (extra = {}) => ({
  background: "var(--bg-card, #1a1d2e)",
  border: "1px solid var(--border, rgba(255,255,255,.08))",
  borderRadius: 14,
  padding: "20px 22px",
  ...extra,
});

const badge = (type = "pos") => {
  const map = {
    pos:  { bg: "rgba(16,185,129,.15)", color: "#10b981" },
    neg:  { bg: "rgba(239,68,68,.15)", color: "#ef4444" },
    info: { bg: "rgba(99,102,241,.15)", color: "#818cf8" },
    warn: { bg: "rgba(234,179,8,.15)", color: "#eab308" },
  };
  const c = map[type] || map.info;
  return { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color };
};

const btnStyle = (variant = "primary") => {
  const v = {
    primary: { background: "var(--accent, #6366f1)", color: "#fff" },
    ghost:   { background: "rgba(255,255,255,.06)",  color: "var(--text-secondary, #94a3b8)" },
    danger:  { background: "rgba(239,68,68,.1)",     color: "#ef4444" },
    success: { background: "rgba(16,185,129,.1)",    color: "#10b981" },
  };
  return { border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .15s", ...(v[variant] || v.primary) };
};

const INPUT = {
  width: "100%",
  background: "rgba(255,255,255,.04)",
  border: "1px solid var(--border, rgba(255,255,255,.08))",
  borderRadius: 8,
  padding: "9px 12px",
  color: "var(--text-primary, #f1f5f9)",
  fontSize: 13,
  boxSizing: "border-box",
};

const FEATURES_DEFAULT = [
  "Gestión de miembros",
  "Control de pagos",
  "Reportes básicos",
];

function PlanForm({ plan, onSave, onCancel }) {
  const [form, setForm] = useState({
    nombre:             plan?.nombre             || "",
    precio_mensual_mxn: plan?.precio_mensual_mxn || 0,
    descripcion:        plan?.descripcion        || "",
    max_miembros:       plan?.max_miembros       || null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (plan?.id) await editarPlan(plan.id, form);
      else          await crearPlan(form);
      onSave();
    } catch (err) {
      const msg = err?.response?.data?.msg || "Error al guardar";
      Swal.fire({ icon: "error", title: "Error", text: msg, background: "var(--bg-card, #1e2233)", color: "var(--text-primary, #f1f5f9)" });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", marginBottom: 6 }}>Nombre del Plan</label>
        <input style={INPUT} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required placeholder="Ej: enterprise" />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", marginBottom: 6 }}>Precio mensual (centavos MXN)</label>
        <input style={INPUT} type="number" min={0} value={form.precio_mensual_mxn} onChange={e => setForm(f => ({ ...f, precio_mensual_mxn: parseInt(e.target.value) || 0 }))} required placeholder="149900 = $1,499/mes" />
        <p style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", marginTop: 4 }}>
          = ${((form.precio_mensual_mxn || 0) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN/mes
        </p>
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", marginBottom: 6 }}>Descripción</label>
        <textarea
          style={{ ...INPUT, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
          value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          placeholder="Describe las características del plan"
        />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", marginBottom: 6 }}>Máximo de miembros (vacío = ilimitado)</label>
        <input style={INPUT} type="number" min={1} value={form.max_miembros || ""} onChange={e => setForm(f => ({ ...f, max_miembros: e.target.value ? parseInt(e.target.value) : null }))} placeholder="Ej: 500" />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" style={btnStyle("ghost")} onClick={onCancel}>Cancelar</button>
        <button type="submit" style={btnStyle("primary")}>{plan?.id ? "Guardar cambios" : "Crear plan"}</button>
      </div>
    </form>
  );
}

function PlanCard({ plan, onEdit, onToggle }) {
  const precio = ((plan.precio_mensual_mxn || 0) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 });
  return (
    <div style={{ ...card(), borderTop: `3px solid ${plan.activo ? "var(--accent, #6366f1)" : "rgba(100,116,139,.4)"}`, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary, #f1f5f9)", marginBottom: 4 }}>{plan.nombre}</h3>
          <p style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)" }}>{plan.descripcion || "Sin descripción"}</p>
        </div>
        <span style={badge(plan.activo ? "pos" : "neg")}>{plan.activo ? "Activo" : "Inactivo"}</span>
      </div>

      <div>
        <span style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary, #f1f5f9)" }}>${precio}</span>
        <span style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)", marginLeft: 4 }}>MXN/mes</span>
      </div>

      {plan.max_miembros && (
        <p style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)" }}>
          Máx: {plan.max_miembros.toLocaleString()} miembros
        </p>
      )}

      {plan.descripcion && (
        <p style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)", lineHeight: 1.5 }}>{plan.descripcion}</p>
      )}

      {plan.suscriptores_activos != null && (
        <p style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)", borderTop: "1px solid var(--border, rgba(255,255,255,.08))", paddingTop: 10 }}>
          {plan.suscriptores_activos} suscripciones activas
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button style={{ ...btnStyle("ghost"), flex: 1 }} onClick={() => onEdit(plan)}>Editar</button>
        <button style={{ ...btnStyle(plan.activo ? "danger" : "success"), flex: 1 }} onClick={() => onToggle(plan)}>
          {plan.activo ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}

export default function SuperadminPlanes() {
  const [planes,   setPlanes]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);   // plan en edición o {} para nuevo
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    getPlanes().then(r => setPlanes(r.data.planes || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (plan) => {
    const { isConfirmed } = await Swal.fire({
      title: `${plan.activo ? "Desactivar" : "Activar"} plan "${plan.nombre}"`,
      text: plan.activo ? "Los gimnasios con este plan no perderán acceso de inmediato, pero no podrán renovarlo." : "El plan estará disponible para nuevas suscripciones.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: plan.activo ? "Desactivar" : "Activar",
      confirmButtonColor: plan.activo ? "#ef4444" : "#10b981",
      cancelButtonText: "Cancelar",
      background: "var(--bg-card, #1e2233)",
      color: "var(--text-primary, #f1f5f9)",
    });
    if (!isConfirmed) return;
    try {
      const r = await togglePlan(plan.id);
      if (r.data.advertencia) {
        Swal.fire({ icon: "warning", title: "Plan desactivado", text: r.data.advertencia, background: "var(--bg-card, #1e2233)", color: "var(--text-primary, #f1f5f9)" });
      } else {
        Swal.fire({ icon: "success", title: "Listo", timer: 1500, showConfirmButton: false, background: "var(--bg-card, #1e2233)", color: "var(--text-primary, #f1f5f9)" });
      }
      load();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e?.response?.data?.msg || "No se pudo cambiar", background: "var(--bg-card, #1e2233)", color: "var(--text-primary, #f1f5f9)" });
    }
  };

  const handleEdit = (plan) => { setEditing(plan); setShowForm(true); };
  const handleNew  = ()     => { setEditing(null);  setShowForm(true); };
  const handleSave = ()     => { setShowForm(false); setEditing(null); load();
    Swal.fire({ icon: "success", title: "Plan guardado", timer: 1500, showConfirmButton: false, background: "var(--bg-card, #1e2233)", color: "var(--text-primary, #f1f5f9)" }); };

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "var(--bg-dark, #0f1117)", fontFamily: "inherit" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary, #f1f5f9)", marginBottom: 4 }}>Planes de Suscripción</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary, #94a3b8)" }}>Gestiona los planes disponibles para los gimnasios</p>
        </div>
        <button style={btnStyle("primary")} onClick={handleNew}>+ Nuevo Plan</button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
          <div style={{ ...card(), width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, #f1f5f9)", marginBottom: 20 }}>
              {editing?.id ? "Editar Plan" : "Nuevo Plan"}
            </h2>
            <PlanForm plan={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-secondary, #94a3b8)" }}>Cargando planes…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {planes.map(plan => (
            <PlanCard key={plan.id} plan={plan} onEdit={handleEdit} onToggle={handleToggle} />
          ))}
          {planes.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "var(--text-secondary, #94a3b8)" }}>
              Sin planes configurados. Crea el primero.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          