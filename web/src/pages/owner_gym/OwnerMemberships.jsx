import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  FiPlus, FiEdit2, FiToggleLeft, FiToggleRight,
  FiTrash2, FiX, FiTag, FiStar,
} from "react-icons/fi";
import { getMembresias, crearMembresia, editarMembresia, toggleMembresia, eliminarMembresia } from "../../api/owner_gym";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n ?? 0);

const SWAL_OPTS = () => {
  const s = getComputedStyle(document.documentElement);
  return {
    background: s.getPropertyValue("--bg-card").trim() || "#1e2233",
    color:      s.getPropertyValue("--text-primary").trim() || "#f1f5f9",
  };
};

// ── estilos ──────────────────────────────────────────────────────────────────
const S = {
  page:    { padding: "28px 32px", background: "var(--bg-main)", minHeight: "100vh", color: "var(--text-primary)", fontFamily: "Inter,system-ui,sans-serif" },
  header:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  title:   { fontSize: 24, fontWeight: 700, margin: 0 },
  sub:     { fontSize: 13, color: "var(--text-secondary)", marginTop: 4 },
  grid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 18 },

  card: (activo, tipo) => ({
    background:    "var(--bg-card)",
    border:        "1px solid var(--border)",
    borderTop:     `3px solid ${tipo === "promocion" ? "#f59e0b" : activo ? "#6366f1" : "#374151"}`,
    borderRadius:  12,
    padding:       "20px 22px",
    display:       "flex",
    flexDirection: "column",
    gap:           10,
    transition:    "box-shadow .15s",
    opacity:       activo ? 1 : 0.6,
  }),

  pill: (color) => ({
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: `${color}22`, color,
  }),

  btn: (c = "#6366f1") => ({
    display: "flex", alignItems: "center", gap: 8,
    padding: "9px 18px",
    background: `${c}22`, border: `1px solid ${c}44`,
    borderRadius: 8, color: c, cursor: "pointer", fontSize: 13, fontWeight: 600,
  }),

  filterBtn: (active) => ({
    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
    border: "1px solid var(--border)",
    background: active ? "var(--accent)" : "var(--bg-card)",
    color:      active ? "#fff" : "var(--text-secondary)",
    transition: "all .15s",
  }),

  iconBtn: (c) => ({ background: "none", border: "none", color: c, cursor: "pointer", fontSize: 18, padding: 4, display: "flex", alignItems: "center" }),

  // Modal
  overlay:  { position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 },
  modal:    { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 480, position: "relative" },
  label:    { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6, display: "block" },
  input:    { width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 72 },
  row:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  fGroup:   { marginBottom: 16 },
};

// ── Modal Formulario ─────────────────────────────────────────────────────────
function MembresiaModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre:         initial?.nombre         ?? "",
    tipo:           initial?.tipo           ?? "estandar",
    precio:         initial?.precio         ?? "",
    duracion_meses: initial?.duracion_meses ?? 1,
    descripcion:    initial?.descripcion    ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim())                                            return setError("El nombre es requerido.");
    if (isNaN(parseFloat(form.precio)) || parseFloat(form.precio) < 0) return setError("Ingresa un precio válido.");
    if (isNaN(parseInt(form.duracion_meses)) || parseInt(form.duracion_meses) < 1) return setError("La duración mínima es 1 mes.");

    setSaving(true);
    try {
      await onSave({
        nombre:         form.nombre.trim(),
        tipo:           form.tipo,
        precio:         parseFloat(form.precio),
        duracion_meses: parseInt(form.duracion_meses),
        descripcion:    form.descripcion.trim(),
      });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.msg || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 18 }}
        >
          <FiX />
        </button>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 22 }}>
          {initial?.id ? "Editar Membresía" : "Nueva Membresía"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div style={S.fGroup}>
            <label style={S.label}>Nombre del plan</label>
            <input style={S.input} value={form.nombre} onChange={set("nombre")} placeholder="Ej. Mensual Plus" />
          </div>

          {/* Tipo — selector visual */}
          <div style={S.fGroup}>
            <label style={S.label}>Tipo</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { value: "estandar",  label: "Estándar",  Icon: FiTag,  color: "#6366f1" },
                { value: "promocion", label: "Promoción", Icon: FiStar, color: "#f59e0b" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tipo: opt.value }))}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer",
                    border:      `2px solid ${form.tipo === opt.value ? opt.color : "var(--border)"}`,
                    background:  form.tipo === opt.value ? `${opt.color}18` : "var(--bg-input)",
                    color:       form.tipo === opt.value ? opt.color : "var(--text-secondary)",
                    display:     "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    fontSize: 13, fontWeight: 600, transition: "all .15s",
                  }}
                >
                  <opt.Icon size={13} /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Precio + Duración */}
          <div style={{ ...S.row, ...S.fGroup }}>
            <div>
              <label style={S.label}>Precio (MXN)</label>
              <input style={S.input} type="number" min="0" step="0.01" value={form.precio} onChange={set("precio")} placeholder="499.00" />
            </div>
            <div>
              <label style={S.label}>Duración (meses)</label>
              <input style={S.input} type="number" min="1" value={form.duracion_meses} onChange={set("duracion_meses")} />
            </div>
          </div>

          {/* Descripción */}
          <div style={S.fGroup}>
            <label style={S.label}>Descripción <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
            <textarea style={S.textarea} value={form.descripcion} onChange={set("descripcion")} placeholder="Acceso completo + clases grupales…" />
          </div>

          {error && <p style={{ color: "var(--danger)", fontSize: 12, marginBottom: 8 }}>{error}</p>}

          <button
            type="submit"
            disabled={saving}
            style={{ width: "100%", padding: 11, borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", marginTop: 4 }}
          >
            {saving ? "Guardando…" : initial?.id ? "Guardar cambios" : "Crear membresía"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 }}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
const FILTROS = [
  { key: "todas",     label: "Todas"     },
  { key: "activas",   label: "Activas"   },
  { key: "inactivas", label: "Inactivas" },
  { key: "promocion", label: "Promoción" },
];

const TIPO_CFG = {
  estandar:  { label: "Estándar",  color: "#6366f1", Icon: FiTag  },
  promocion: { label: "Promoción", color: "#f59e0b", Icon: FiStar },
};

export default function OwnerMemberships() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro,  setFiltro]  = useState("todas");
  const [modal,   setModal]   = useState(null); // null | {} | { id, ... }

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getMembresias();
      setItems(data);
    } catch {
      Swal.fire("Error", "No se pudieron cargar las membresías", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const displayed = items.filter(m => {
    if (filtro === "activas")   return m.activo;
    if (filtro === "inactivas") return !m.activo;
    if (filtro === "promocion") return m.tipo === "promocion";
    return true;
  });

  const handleSave = async (form) => {
    if (modal?.id) {
      await editarMembresia(modal.id, form);
      Swal.fire({ icon: "success", title: "Actualizada", timer: 1400, showConfirmButton: false, ...SWAL_OPTS() });
    } else {
      await crearMembresia(form);
      Swal.fire({ icon: "success", title: "Membresía creada", timer: 1400, showConfirmButton: false, ...SWAL_OPTS() });
    }
    load();
  };

  const handleToggle = async (m) => {
    try {
      await toggleMembresia(m.id);
      load();
    } catch {
      Swal.fire("Error", "No se pudo cambiar el estado", "error");
    }
  };

  const handleDelete = async (m) => {
    const { isConfirmed } = await Swal.fire({
      title: `¿Eliminar "${m.nombre}"?`,
      text: "Solo se puede eliminar si no tiene miembros asociados.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", confirmButtonText: "Eliminar",
      ...SWAL_OPTS(),
    });
    if (!isConfirmed) return;
    try {
      await eliminarMembresia(m.id);
      Swal.fire({ icon: "success", title: "Eliminada", timer: 1400, showConfirmButton: false, ...SWAL_OPTS() });
      load();
    } catch (e) {
      Swal.fire("No se puede eliminar", e.response?.data?.msg || "Error", "error");
    }
  };

  const count = (key) => {
    if (key === "activas")   return items.filter(m => m.activo).length;
    if (key === "inactivas") return items.filter(m => !m.activo).length;
    if (key === "promocion") return items.filter(m => m.tipo === "promocion").length;
    return items.length;
  };

  return (
    <div style={S.page}>
      {modal !== null && (
        <MembresiaModal
          initial={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Tipos de Membresía</h1>
          <p style={S.sub}>Planes y precios del gimnasio</p>
        </div>
        <button data-guide="ow-memb-nueva" style={S.btn()} onClick={() => setModal({})}>
          <FiPlus /> Nueva Membresía
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {FILTROS.map(f => (
          <button key={f.key} style={S.filterBtn(filtro === f.key)} onClick={() => setFiltro(f.key)}>
            {f.label}
            {" "}
            <span style={{ opacity: .65, fontSize: 11 }}>({count(f.key)})</span>
          </button>
        ))}
      </div>

      {/* Grid de cards */}
      {loading ? (
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: 40 }}>Cargando…</p>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
          <FiTag size={40} style={{ opacity: .3, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
          <p style={{ marginBottom: 16 }}>No hay membresías en esta categoría.</p>
          <button style={{ ...S.btn(), margin: "0 auto" }} onClick={() => setModal({})}>
            <FiPlus /> Crear membresía
          </button>
        </div>
      ) : (
        <div data-guide="ow-memb-grid" style={S.grid}>
          {displayed.map(m => {
            const tcfg = TIPO_CFG[m.tipo] || TIPO_CFG.estandar;
            return (
              <div key={m.id} style={S.card(m.activo, m.tipo)}>
                {/* Cabecera */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{m.nombre}</span>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <span style={S.pill(tcfg.color)}>
                      <tcfg.Icon size={10} /> {tcfg.label}
                    </span>
                    <span style={S.pill(m.activo ? "#22c55e" : "#64748b")}>
                      {m.activo ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>

                {/* Precio */}
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.02em", color: m.tipo === "promocion" ? "#f59e0b" : "#6366f1" }}>
                  {fmt(m.precio)}
                </div>

                {/* Duración + precio mensual */}
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {m.duracion_meses === 1 ? "1 mes" : `${m.duracion_meses} meses`}
                  <span style={{ marginLeft: 8, color: "var(--text-tertiary)", fontSize: 12 }}>
                    · {fmt(m.precio / m.duracion_meses)}/mes
                  </span>
                </div>

                {/* Descripción */}
                {m.descripcion
                  ? <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{m.descripcion}</p>
                  : <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0, fontStyle: "italic" }}>Sin descripción</p>
                }

                {/* Acciones */}
                <div style={{ display: "flex", gap: 6, marginTop: 4, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                  <button style={S.iconBtn("#6366f1")} onClick={() => setModal(m)} title="Editar"><FiEdit2 /></button>
                  <button
                    style={S.iconBtn(m.activo ? "#ef4444" : "#22c55e")}
                    onClick={() => handleToggle(m)}
                    title={m.activo ? "Desactivar" : "Activar"}
                  >
                    {m.activo ? <FiToggleRight /> : <FiToggleLeft />}
                  </button>
                  <button style={{ ...S.iconBtn("#ef4444"), marginLeft: "auto" }} onClick={() => handleDelete(m)} title="Eliminar">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
