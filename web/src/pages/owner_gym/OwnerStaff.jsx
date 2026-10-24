/**
 * OwnerStaff.jsx — Gestión de entrenadores y recepcionistas del gimnasio.
 * Diseño de cards con foto de perfil (base64, sin filesystem).
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { getStaff, crearStaff, toggleStaff, updateStaff } from "../../api/owner_gym";
import DetalleUsuarioModal, { fechaFicha } from "../../components/compartido/DetalleUsuarioModal";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:      "var(--bg-main,#0f1117)",
  card:    "var(--bg-card,#1a1d27)",
  input:   "var(--bg-input,#12151e)",
  border:  "var(--border,rgba(255,255,255,.08))",
  accent:  "var(--accent,#6366f1)",
  success: "var(--success,#22c55e)",
  danger:  "var(--danger,#ef4444)",
  t1:      "var(--text-primary,#f1f5f9)",
  t2:      "var(--text-secondary,#94a3b8)",
  t3:      "var(--text-tertiary,#64748b)",
};

const ROLE_COLOR = { Entrenador: "#6366f1", Recepcionista: "#14b8a6" };
const ROLE_BG    = { Entrenador: "#6366f122", Recepcionista: "#14b8a622" };

const VALID_PREFIXES = ["data:image/jpeg;base64,","data:image/png;base64,",
                        "data:image/webp;base64,","data:image/gif;base64,"];
const validFoto = (v) => v && VALID_PREFIXES.some(p => v.startsWith(p)) ? v : null;

// ── Íconos SVG ────────────────────────────────────────────────────────────────
const IcoUser   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoMail   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IcoLock   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcoShield = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcoCamera = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IcoEdit   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IcoPlus   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>;
const IcoX      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>;

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 52 }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const palette  = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#10b981"];
  const bg       = palette[(name?.charCodeAt(0) || 0) % palette.length];
  const st = { width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: bg, fontWeight: 700, fontSize: size * 0.36, color: "#fff", letterSpacing: "-0.5px" };
  if (src && !broken) return <div style={st}><img src={src} alt={name} onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>;
  return <div style={st}>{initials}</div>;
}

// ── PhotoUploader ─────────────────────────────────────────────────────────────
function PhotoUploader({ preview, onChange, name }) {
  const ref = useRef();
  const [broken, setBroken]     = useState(false);
  const [selected, setSelected] = useState(false);
  useEffect(() => { setBroken(false); setSelected(false); }, [name]);

  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const palette  = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#10b981"];
  const bg       = palette[(name?.charCodeAt(0) || 0) % palette.length];

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setBroken(false); setSelected(true); onChange(ev.target.result); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20, gap: 6 }}>
      <div style={{ position: "relative" }}>
        <div onClick={() => ref.current?.click()} title="Clic para cambiar foto"
          style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", border: `2px solid ${selected ? C.success : C.accent}`, background: C.input, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {preview && !broken
            ? <img src={preview} alt="foto" onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: bg, fontWeight: 700, fontSize: 28, color: "#fff" }}>{initials}</div>
          }
        </div>
        <button type="button" onClick={() => ref.current?.click()}
          style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%", border: `2px solid ${C.card}`, background: selected ? C.success : C.accent, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.5)", fontSize: 12 }}>
          {selected ? "✓" : <IcoCamera />}
        </button>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: "none" }} />
      </div>
      <p style={{ fontSize: 11, color: selected ? C.success : C.t3, margin: 0, fontWeight: selected ? 700 : 400 }}>
        {selected ? "✓ Foto lista — guarda para aplicar" : "Clic en la foto para cambiarla"}
      </p>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let _setToasts = () => {};
const toast = {
  success: (msg) => _setToasts(t => [...t, { id: Date.now(), type: "success", msg }]),
  error:   (msg) => _setToasts(t => [...t, { id: Date.now(), type: "error",   msg }]),
};
function Toasts() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts(ts => ts.slice(1)), 3200);
    return () => clearTimeout(t);
  }, [toasts]);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.type === "success" ? C.success : C.danger, color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,.4)" }}>
          {t.type === "success" ? "✓" : "✕"} {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9500, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 32px", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: C.t1, marginBottom: 8 }}>{title}</p>
        <p style={{ fontSize: 13, color: C.t2, marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: danger ? `${C.danger}22` : `${C.success}22`, color: danger ? C.danger : C.success, fontWeight: 700, cursor: "pointer" }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
const EMPTY_FORM = { nombre: "", email: "", password: "", rol: "", foto_base64: "" };

function StaffModal({ open, onClose, onSave, initial, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const isEdit = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    setForm(initial
      ? { nombre: initial.nombre || "", email: initial.email || "", password: "", rol: initial.rol || "", foto_base64: "" }
      : EMPTY_FORM
    );
  }, [open, initial]);

  if (!open) return null;

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const inputSt = {
    width: "100%", boxSizing: "border-box", background: C.input,
    border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "9px 12px 9px 32px", color: C.t1, fontSize: 13, outline: "none",
  };

  const Field = ({ label, required, children }) => (
    <div style={{ flex: "1 1 calc(50% - 6px)", minWidth: 0 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.t2, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.accent, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );

  const IcoWrap = ({ icon, children }) => (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.t3, display: "flex" }}>{icon}</span>
      {children}
    </div>
  );

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.card, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
              {isEdit ? <IcoEdit /> : <IcoPlus />}
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.t1, margin: 0 }}>{isEdit ? "Editar Staff" : "Agregar Staff"}</h2>
              <p style={{ fontSize: 12, color: C.t2, margin: "2px 0 0" }}>{isEdit ? `Editando a ${initial?.nombre}` : "Entrenador o recepcionista"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t2, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Body */}
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{ padding: "20px 24px 24px" }}>
          <PhotoUploader
            preview={form.foto_base64 || (initial?.foto_perfil || null)}
            onChange={(b64) => setForm(f => ({ ...f, foto_base64: b64 }))}
            name={form.nombre}
          />

          <div style={{ background: C.input, borderRadius: 10, padding: "14px 16px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".06em", margin: 0 }}>Datos de cuenta</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Field label="Nombre completo" required>
                <IcoWrap icon={<IcoUser />}>
                  <input style={inputSt} value={form.nombre} onChange={set("nombre")} placeholder="Juan Pérez" required={!isEdit} />
                </IcoWrap>
              </Field>
              <Field label="Email" required>
                <IcoWrap icon={<IcoMail />}>
                  <input style={inputSt} type="email" value={form.email} onChange={set("email")} placeholder="juan@gym.com" required={!isEdit} />
                </IcoWrap>
              </Field>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Field label={isEdit ? "Contraseña — vacío para mantener" : "Contraseña"} required={!isEdit}>
                <IcoWrap icon={<IcoLock />}>
                  <input style={inputSt} type="password" value={form.password} onChange={set("password")} placeholder={isEdit ? "••••••••" : "Mínimo 6 caracteres"} required={!isEdit} />
                </IcoWrap>
              </Field>
              <Field label="Rol" required>
                <IcoWrap icon={<IcoShield />}>
                  <select style={inputSt} value={form.rol} onChange={set("rol")} required>
                    <option value="">Seleccionar rol…</option>
                    <option value="Entrenador">Entrenador</option>
                    <option value="Recepcionista">Recepcionista</option>
                  </select>
                </IcoWrap>
              </Field>
            </div>
          </div>

          <button type="submit" disabled={saving}
            style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", background: saving ? C.input : C.accent, color: saving ? C.t2 : "#fff", transition: "all .15s" }}>
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear usuario"}
          </button>
          <button type="button" onClick={onClose}
            style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

// ── StaffCard ─────────────────────────────────────────────────────────────────
/** Traduce un integrante del staff a la ficha genérica del modal de detalle. */
function staffADetalle(u) {
  return {
    nombre:    u.nombre,
    email:     u.email,
    telefono:  u.telefono,
    foto:      u.foto_perfil,
    activo:    u.activo !== false,
    subtitulo: u.rol ?? null,
    datos: [
      { icono: "rol",       etiqueta: "Puesto",        valor: u.rol },
      { icono: "generico",  etiqueta: "Especialidad",  valor: u.especializacion ?? u.especialidad },
      { icono: "correo",    etiqueta: "Correo",        valor: u.email },
      { icono: "telefono",  etiqueta: "Teléfono",      valor: u.telefono },
      { icono: "ingreso",   etiqueta: "Alta",          valor: fechaFicha(u.created_at) },
      { icono: "generico",  etiqueta: "Identificador", valor: u.id },
    ],
  };
}

function StaffCard({ u, onView, onEdit, onToggle }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", opacity: u.activo ? 1 : 0.7, transition: "box-shadow .15s" }}>
      {/* Header */}
      <div style={{ padding: "16px 18px 12px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Avatar src={u.foto_perfil} name={u.nombre} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.t1, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nombre}</p>
          <p style={{ fontSize: 12, color: C.t2, margin: "0 0 7px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: ROLE_BG[u.rol] || `${C.accent}22`, color: ROLE_COLOR[u.rol] || C.accent }}>
            {u.rol}
          </span>
        </div>
        <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: u.activo ? `${C.success}20` : `${C.danger}18`, color: u.activo ? C.success : C.danger, flexShrink: 0 }}>
          {u.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px", display: "flex", gap: 6, justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.t3 }}>Desde {u.created_at ? u.created_at.slice(0, 10) : "—"}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onView(u)} title="Ver ficha completa"
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: `${C.accent}1A`, color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Ver
          </button>
          <button onClick={() => onEdit(u)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <IcoEdit /> Editar
          </button>
          <button onClick={() => onToggle(u)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: u.activo ? `${C.danger}18` : `${C.success}20`, color: u.activo ? C.danger : C.success, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {u.activo ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  const p = { animation: "pulse 1.5s ease-in-out infinite", background: C.input, borderRadius: 6 };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ ...p, width: 52, height: 52, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ ...p, height: 14, width: "60%" }} />
          <div style={{ ...p, height: 11, width: "80%" }} />
          <div style={{ ...p, height: 18, width: "35%", borderRadius: 99 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <div style={{ ...p, width: 70, height: 30, borderRadius: 8 }} />
        <div style={{ ...p, width: 90, height: 30, borderRadius: 8 }} />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function OwnerStaff() {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState("");
  const [rolFil,  setRolFil]  = useState("");
  const [activos, setActivos] = useState("true");
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  // Integrante cuya ficha completa se está viendo; null cierra el modal.
  const [detalle, setDetalle] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { activos };
      if (rolFil) params.rol = rolFil;
      if (search) params.q   = search;
      const { data } = await getStaff(params);
      setStaff(data);
    } catch (err) {
      const s = err.response?.status;
      if (s !== 401 && s !== 403) toast.error("No se pudo cargar el staff");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [activos, rolFil, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 420 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const handleToggle = (u) => {
    setConfirm({
      title:   `¿${u.activo ? "Desactivar" : "Activar"} a ${u.nombre}?`,
      message: u.activo
        ? "El usuario no podrá iniciar sesión mientras esté desactivado."
        : "El usuario podrá volver a iniciar sesión.",
      danger: u.activo,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await toggleStaff(u.id);
          toast.success(`${u.nombre} ${u.activo ? "desactivado" : "activado"}`);
          load();
        } catch { toast.error("No se pudo cambiar el estado"); }
      },
    });
  };

  const handleSave = async (form) => {
    if (!form.nombre || !form.email || !form.rol || (!editing && !form.password)) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    setSaving(true);
    try {
      const payload = { nombre: form.nombre, email: form.email, rol: form.rol };
      if (form.password)             payload.password   = form.password;
      if (validFoto(form.foto_base64)) payload.foto_base64 = form.foto_base64;

      if (editing) {
        await updateStaff(editing.id, payload);
        toast.success(`${form.nombre} actualizado`);
      } else {
        await crearStaff(payload);
        toast.success(`${form.nombre} registrado`);
      }
      setModal(false); setEditing(null); load();
    } catch (e) {
      toast.error(e.response?.data?.msg || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const nEnt = staff.filter(u => u.rol === "Entrenador").length;
  const nRec = staff.filter(u => u.rol === "Recepcionista").length;

  return (
    <div className="dashboard-content">
      <Toasts />
      <ConfirmDialog
        open={Boolean(confirm)} title={confirm?.title} message={confirm?.message}
        danger={confirm?.danger} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)}
      />

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="page-title" style={{ margin: "0 0 4px" }}>Staff del Gimnasio</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.t2 }}>
            {nEnt} entrenador{nEnt !== 1 ? "es" : ""} · {nRec} recepcionista{nRec !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <IcoPlus /> Agregar Staff
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative", display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: 12, color: C.t3, display: "flex" }}><IcoSearch /></span>
          <input
            style={{ width: "100%", boxSizing: "border-box", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 36px 9px 34px", color: C.t1, fontSize: 13, outline: "none" }}
            placeholder="Buscar por nombre o email…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, background: "none", border: "none", color: C.t3, cursor: "pointer", display: "flex" }}>
              <IcoX />
            </button>
          )}
        </div>

        <select value={rolFil} onChange={e => setRolFil(e.target.value)}
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 14px", color: C.t1, fontSize: 13, outline: "none", minWidth: 160 }}>
          <option value="">Todos los roles</option>
          <option value="Entrenador">Entrenadores</option>
          <option value="Recepcionista">Recepcionistas</option>
        </select>

        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: "true", label: "Activos" }, { v: "false", label: "Inactivos" }].map(({ v, label }) => (
            <button key={v} onClick={() => setActivos(v)}
              style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${activos === v ? (v === "true" ? C.accent : C.danger) : C.border}`, background: activos === v ? (v === "true" ? C.accent : C.danger) : "transparent", color: activos === v ? "#fff" : C.t2 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : staff.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: C.t3 }}>
          <div style={{ marginBottom: 12, opacity: .4, display: "flex", justifyContent: "center" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.t2, margin: "0 0 8px" }}>
            No hay staff {activos === "true" ? "activo" : "inactivo"}
          </p>
          <p style={{ fontSize: 13, margin: "0 0 20px" }}>
            {search ? `Sin resultados para "${search}"` : "Agrega el primer miembro del staff."}
          </p>
          {!search && (
            <button onClick={() => { setEditing(null); setModal(true); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              <IcoPlus /> Agregar Staff
            </button>
          )}
        </div>
      ) : (
        <div data-guide="ow-staff-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {staff.map(u => (
            <StaffCard key={u.id} u={u}
              onView={setDetalle}
              onEdit={(u) => { setEditing(u); setModal(true); }}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      <StaffModal
        open={modal}
        onClose={() => { setModal(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        saving={saving}
      />

      <DetalleUsuarioModal
        usuario={detalle ? staffADetalle(detalle) : null}
        onClose={() => setDetalle(null)}
        titulo="Detalle del staff"
      />
    </div>
  );
}
