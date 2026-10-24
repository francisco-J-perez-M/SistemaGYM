/**
 * OwnerStaff.jsx — Gestión de entrenadores y recepcionistas del gimnasio.
 * Reemplaza el diseño basado en Swal por modales nativos + useToast.
 */
import { useEffect, useState, useRef } from "react";
import {
  FiUsers, FiUserPlus, FiToggleLeft, FiToggleRight,
  FiSearch, FiEdit2, FiX, FiUser, FiMail, FiLock, FiShield,
} from "react-icons/fi";
import { getStaff, crearStaff, toggleStaff, updateStaff } from "../../api/owner_gym";
import { useToast } from "../../hooks/useToast";
import "../../css/CSSUnificado.css";

/* ── Constantes ── */
const ROLE_COLOR  = { Entrenador: "#6366f1", Recepcionista: "#14b8a6" };
const EMPTY_FORM  = { nombre: "", email: "", password: "", rol: "" };

/* ── Avatar iniciales ── */
function Avatar({ nombre, size = 40 }) {
  const initials = (nombre || "?")
    .split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "var(--accent-dim)", display: "flex",
      alignItems: "center", justifyContent: "center",
      color: "var(--accent-soft)", fontWeight: 700, fontSize: size * 0.35,
    }}>
      {initials}
    </div>
  );
}

/* ── Modal de Crear / Editar Staff ── */
function StaffModal({ open, onClose, onSave, initialData = null, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(initialData
        ? { nombre: initialData.nombre || "", email: initialData.email || "", password: "", rol: initialData.rol || "" }
        : EMPTY_FORM
      );
    }
  }, [open, initialData]);

  if (!open) return null;
  const isEdit = Boolean(initialData);

  const field = (id, label, icon, type = "text", placeholder = "") => (
    <div className="form-group compact">
      <label className="form-label-compact">
        {icon} {label}{!isEdit || id !== "password" ? " *" : " (dejar vacía para mantener)"}
      </label>
      <input
        className="input-compact"
        type={type}
        placeholder={placeholder || label}
        value={form[id]}
        onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
        required={!isEdit || id !== "password"}
      />
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1100, padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--bg-card)", borderRadius: "var(--r-lg)",
        border: "1px solid var(--border)", width: "100%", maxWidth: 460,
        overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,.5)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--r-md)",
              background: "rgba(99,102,241,.12)", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#6366f1",
            }}>
              {isEdit ? <FiEdit2 size={16} /> : <FiUserPlus size={16} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                {isEdit ? "Editar Staff" : "Agregar Staff"}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
                {isEdit ? `Editando a ${initialData?.nombre}` : "Entrenador o recepcionista"}
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ width: 30, height: 30, padding: 0 }}>
            <FiX size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={e => { e.preventDefault(); onSave(form); }}
          style={{ padding: "20px 22px" }}
        >
          <div className="compact-form-grid">
            {field("nombre",   "Nombre completo", <FiUser size={13} />, "text",     "Juan Pérez")}
            {field("email",    "Email",           <FiMail size={13} />, "email",    "juan@gym.com")}
          </div>
          <div className="compact-form-grid">
            {field("password", "Contraseña",      <FiLock size={13} />, "password", isEdit ? "••••••" : "Mínimo 6 caracteres")}
            <div className="form-group compact">
              <label className="form-label-compact"><FiShield size={13} /> Rol *</label>
              <select
                className="input-compact"
                value={form.rol}
                onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
                required
              >
                <option value="">Seleccionar rol…</option>
                <option value="Entrenador">Entrenador</option>
                <option value="Recepcionista">Recepcionista</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
            <button type="button" className="btn-outline-small" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-compact-primary" disabled={loading}
              style={{ minWidth: 110 }}>
              {loading
                ? <span className="spinner-small" />
                : isEdit ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════ */
export default function OwnerStaff() {
  const { toast, confirm, ToastPortal } = useToast();

  const [staff,    setStaff]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState("");
  const [rolFil,   setRolFil]   = useState("");
  const [activos,  setActivos]  = useState("true");
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);   // usuario a editar (o null = crear)
  const searchRef = useRef(null);

  /* ── Carga ── */
  const load = async () => {
    setLoading(true);
    try {
      const params = { activos };
      if (rolFil) params.rol = rolFil;
      if (search) params.q  = search;
      const { data } = await getStaff(params);
      setStaff(data);
    } catch (err) {
      const status = err.response?.status;
      // 401/403 es esperado en un gym recién registrado (sin staff aún)
      if (status !== 401 && status !== 403) {
        toast.error("Error de conexión", "No se pudo cargar el staff.");
      }
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activos, rolFil]);

  /* ── Búsqueda con debounce ── */
  useEffect(() => {
    const t = setTimeout(load, 420);
    return () => clearTimeout(t);
  }, [search]);

  /* ── Toggle activo/inactivo ── */
  const handleToggle = async (u) => {
    const accion = u.activo ? "desactivar" : "activar";
    const ok = await confirm({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${u.nombre}?`,
      message: u.activo
        ? "El usuario no podrá iniciar sesión mientras esté desactivado."
        : "El usuario podrá volver a iniciar sesión.",
      type: u.activo ? "danger" : "success",
      confirmText: `Sí, ${accion}`,
      cancelText:  "Cancelar",
    });
    if (!ok) return;
    try {
      await toggleStaff(u.id);
      toast.success("Estado actualizado", `${u.nombre} fue ${u.activo ? "desactivado" : "activado"}.`);
      load();
    } catch {
      toast.error("Error", "No se pudo cambiar el estado.");
    }
  };

  /* ── Crear o editar ── */
  const handleSave = async (form) => {
    if (!form.nombre || !form.email || !form.rol || (!editing && !form.password)) {
      toast.warning("Campos incompletos", "Completa todos los campos requeridos.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        // Editar — omitir password si está vacío
        const payload = { nombre: form.nombre, email: form.email, rol: form.rol };
        if (form.password.trim()) payload.password = form.password;
        await updateStaff(editing.id, payload);
        toast.success("Staff actualizado", `Los datos de ${form.nombre} fueron guardados.`);
      } else {
        await crearStaff(form);
        toast.success("Usuario creado", `${form.nombre} fue registrado en el sistema.`);
      }
      setModal(false);
      setEditing(null);
      load();
    } catch (e) {
      toast.error("Error al guardar", e.response?.data?.msg || "No se pudo guardar el usuario.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit  = (u) => { setEditing(u); setModal(true);  };
  const openCreate= ()  => { setEditing(null); setModal(true); };

  /* ── Contadores para el header ── */
  const totalEntrenadores   = staff.filter(u => u.rol === "Entrenador").length;
  const totalRecepcionistas = staff.filter(u => u.rol === "Recepcionista").length;

  return (
    <div className="dashboard-content">
      <ToastPortal />

      {/* ── Encabezado ── */}
      <div className="section-header">
        <div>
          <h2 className="page-title">Staff del Gimnasio</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            {totalEntrenadores} entrenador{totalEntrenadores !== 1 ? "es" : ""} ·{" "}
            {totalRecepcionistas} recepcionista{totalRecepcionistas !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-compact-primary" onClick={openCreate}>
          <FiUserPlus size={14} /> Agregar Staff
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {/* Buscador */}
        <div className="input-dark-container with-icon" style={{ flex: 1, minWidth: 220 }}>
          <FiSearch size={15} style={{ color: "var(--text-tertiary)" }} />
          <input
            ref={searchRef}
            className="search-input"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch("")}>×</button>
          )}
        </div>

        {/* Filtro rol */}
        <select
          className="input-compact"
          style={{ width: "auto", minWidth: 160 }}
          value={rolFil}
          onChange={e => setRolFil(e.target.value)}
        >
          <option value="">Todos los roles</option>
          <option value="Entrenador">Entrenadores</option>
          <option value="Recepcionista">Recepcionistas</option>
        </select>

        {/* Filtro activo */}
        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: "true", label: "Activos" }, { v: "false", label: "Inactivos" }].map(({ v, label }) => (
            <button
              key={v}
              className="btn-outline-small"
              onClick={() => setActivos(v)}
              style={{
                background:  activos === v ? (v === "true" ? "var(--accent)" : "var(--danger)") : "transparent",
                color:       activos === v ? "#fff" : "var(--text-secondary)",
                borderColor: activos === v ? (v === "true" ? "var(--accent)" : "var(--danger)") : "var(--border)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="stat-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
            Cargando staff…
          </div>
        ) : staff.length === 0 ? (
          <div className="empty-state" style={{ padding: "48px 24px" }}>
            <FiUsers size={36} style={{ opacity: .3, marginBottom: 12 }} />
            <h3>No hay staff {activos === "true" ? "activo" : "inactivo"}</h3>
            <p style={{ marginBottom: 20 }}>
              {search ? `Sin resultados para "${search}"` : "Agrega el primer miembro del staff."}
            </p>
            {!search && (
              <button className="btn-compact-primary" onClick={openCreate}>
                <FiUserPlus size={14} /> Agregar Staff
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Usuario", "Email", "Rol", "Desde", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{
                    padding: "11px 16px", textAlign: "left",
                    color: "var(--text-secondary)", fontWeight: 600,
                    fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em",
                    borderBottom: "1px solid var(--border)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map(u => (
                <tr
                  key={u.id}
                  style={{ transition: "background .12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.025)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Nombre + avatar */}
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar nombre={u.nombre} />
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{u.nombre}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    {u.email}
                  </td>

                  {/* Rol */}
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: `${ROLE_COLOR[u.rol] || "#6366f1"}20`,
                      color:       ROLE_COLOR[u.rol] || "#6366f1",
                    }}>
                      {u.rol}
                    </span>
                  </td>

                  {/* Fecha registro */}
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", color: "var(--text-tertiary)", fontSize: 12 }}>
                    {u.created_at ? u.created_at.slice(0, 10) : "—"}
                  </td>

                  {/* Estado */}
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: u.activo ? "rgba(34,197,94,.12)"  : "rgba(239,68,68,.12)",
                      color:       u.activo ? "#22c55e"              : "#ef4444",
                    }}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="icon-btn"
                        title="Editar"
                        onClick={() => openEdit(u)}
                        style={{ width: 30, height: 30, padding: 0 }}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        className="icon-btn"
                        title={u.activo ? "Desactivar" : "Activar"}
                        onClick={() => handleToggle(u)}
                        style={{
                          width: 30, height: 30, padding: 0,
                          color: u.activo ? "var(--danger)" : "var(--success)",
                        }}
                      >
                        {u.activo ? <FiToggleRight size={17} /> : <FiToggleLeft size={17} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal crear / editar ── */}
      <StaffModal
        open={modal}
        onClose={() => { setModal(false); setEditing(null); }}
        onSave={handleSave}
        initialData={editing}
        loading={saving}
      />
    </div>
  );
}
