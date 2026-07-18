/**
 * MiembrosDashboard.jsx — Gestión de miembros del gimnasio
 *
 * Fotos: base64 comprimida en canvas antes de enviar al backend.
 * Se almacena en MongoDB directamente — sin filesystem ni volúmenes.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { FiCamera, FiSearch, FiUsers, FiCheck } from "react-icons/fi";
import {
  getMiembros, createMiembro, updateMiembro,
  deleteMiembro, reactivateMiembro,
} from "../../api/miembros";

// ── Paleta / tokens ───────────────────────────────────────────────────────────
const C = {
  bg:       "var(--bg-main,#0f1117)",
  card:     "var(--bg-card,#1a1d27)",
  input:    "var(--bg-input,#12151e)",
  border:   "var(--border,rgba(255,255,255,.08))",
  accent:   "var(--accent,#6366f1)",
  success:  "var(--success,#22c55e)",
  danger:   "var(--danger,#ef4444)",
  warn:     "var(--warning,#f59e0b)",
  t1:       "var(--text-primary,#f1f5f9)",
  t2:       "var(--text-secondary,#94a3b8)",
  t3:       "var(--text-tertiary,#64748b)",
};

// ── Utilidades ────────────────────────────────────────────────────────────────

/** Lee un File y lo devuelve como data URL base64 (sin resize para máxima compatibilidad) */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const imc = (kg, m) => {
  const k = parseFloat(kg), h = parseFloat(m);
  return k > 0 && h > 0 ? (k / (h * h)).toFixed(1) : "";
};

const imcLabel = (val) => {
  const v = parseFloat(val);
  if (!v) return null;
  if (v < 18.5) return { text: "Bajo peso",    color: C.warn };
  if (v < 25)   return { text: "Normal",        color: C.success };
  if (v < 30)   return { text: "Sobrepeso",     color: C.warn };
  return           { text: "Obesidad",           color: C.danger };
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 48 }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);

  const initials = (name || "?")
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const colors = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#10b981"];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];

  const style = {
    width: size, height: size, borderRadius: "50%",
    flexShrink: 0, overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: bg, fontWeight: 700, fontSize: size * 0.36,
    color: "#fff", letterSpacing: "-0.5px",
  };

  const resolvedSrc = src
    ? (src.startsWith("data:") || src.startsWith("http") || src.startsWith("/"))
      ? src
      : `/api/uploads/${src}`
    : null;

  if (resolvedSrc && !broken) {
    return (
      <div style={style}>
        <img
          src={resolvedSrc} alt={name}
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }
  return <div style={style}>{initials}</div>;
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ children, color = C.accent }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    padding: "2px 8px", borderRadius: 99,
    fontSize: 11, fontWeight: 700,
    background: `${color}22`, color,
  }}>{children}</span>
);

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
        <div key={t.id} style={{
          background: t.type === "success" ? C.success : C.danger,
          color: "#fff", padding: "10px 18px", borderRadius: 10,
          fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,.4)",
          animation: "fadeIn .2s ease",
        }}>
          {t.type === "success" ? "✓" : "✕"} {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Modal base ────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,.6)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`,
          position: "sticky", top: 0, background: C.card, zIndex: 1,
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.t1, margin: 0 }}>{title}</h2>
            {subtitle && <p style={{ fontSize: 12, color: C.t2, margin: "3px 0 0" }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: C.t2, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}
          >✕</button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Campo de formulario ───────────────────────────────────────────────────────
const inputSt = {
  width: "100%", boxSizing: "border-box",
  background: C.input, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: "9px 12px",
  color: C.t1, fontSize: 13, outline: "none",
};

function Field({ label, required, children, half }) {
  return (
    <div style={{ flex: half ? "1 1 calc(50% - 6px)" : "1 1 100%", minWidth: 0 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.t2, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.accent, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Foto uploader ─────────────────────────────────────────────────────────────
function PhotoUploader({ preview, onChange, name }) {
  const ref = useRef();
  const [broken, setBroken] = useState(false);
  const [selected, setSelected] = useState(false);
  useEffect(() => { setBroken(false); setSelected(false); }, [name]); // reset al cambiar de miembro

  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      setBroken(false);
      setSelected(true);
      onChange(b64);
    };
    reader.onerror = () => toast.error("Error al leer la imagen");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const trigger = () => ref.current?.click();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20, gap: 8 }}>
      <div style={{ position: "relative" }}>
        <div
          onClick={trigger}
          title="Haz clic para cambiar la foto"
          style={{
            width: 96, height: 96, borderRadius: "50%", overflow: "hidden",
            border: `2px solid ${selected ? C.success : C.accent}`,
            background: C.input,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {preview && !broken ? (
            <img src={preview} alt="foto" onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 28, fontWeight: 800, color: C.accent, letterSpacing: "-1px" }}>{initials}</span>
          )}
        </div>
        {/* Botón cámara */}
        <button type="button" onClick={trigger}
          style={{
            position: "absolute", bottom: 0, right: 0,
            width: 30, height: 30, borderRadius: "50%", border: `2px solid ${C.card}`,
            background: selected ? C.success : C.accent,
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, boxShadow: "0 2px 8px rgba(0,0,0,.5)",
          }}
        >{selected ? <FiCheck /> : <FiCamera />}</button>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          style={{ display: "none" }} />
      </div>
      {/* Texto de ayuda */}
      <p style={{ fontSize: 11, color: selected ? C.success : C.t3, margin: 0, fontWeight: selected ? 700 : 400 }}>
        {selected ? "✓ Foto lista — guarda para aplicar" : "Haz clic en la foto para cambiarla"}
      </p>
    </div>
  );
}

// ── Formulario crear/editar ───────────────────────────────────────────────────
function MiembroForm({ initial, onSave, onCancel }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    nombre:      initial?.nombre      ?? "",
    email:       initial?.email       ?? "",
    password:    "",
    telefono:    initial?.telefono    ?? "",
    sexo:        initial?.sexo        ?? "",
    peso_inicial:initial?.peso_inicial?? "",
    estatura:    initial?.estatura    ?? "",
    foto_base64: initial?.foto_perfil?.startsWith("data:") ? initial.foto_perfil : "",
    foto_preview: (() => {
      const f = initial?.foto_perfil;
      if (!f) return "";
      if (f.startsWith("data:") || f.startsWith("http") || f.startsWith("/")) return f;
      return `/api/uploads/${f}`;
    })(),
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const imcVal   = imc(form.peso_inicial, form.estatura);
  const imcMeta  = imcLabel(imcVal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.telefono.trim() || !form.sexo) { setErr("Teléfono y sexo son obligatorios."); return; }
    if (!isEdit && (!form.nombre.trim() || !form.email.trim())) { setErr("Nombre y email son obligatorios."); return; }

    setSaving(true);
    try {
      const payload = {
        nombre:       form.nombre.trim(),
        email:        form.email.trim(),
        telefono:     form.telefono.trim(),
        sexo:         form.sexo,
        peso_inicial: form.peso_inicial,
        estatura:     form.estatura,
        foto_base64:  form.foto_base64,
      };
      if (form.password) payload.password = form.password;

      if (isEdit) {
        await updateMiembro(initial.id, payload);
        toast.success("Miembro actualizado");
      } else {
        await createMiembro(payload);
        toast.success(`${form.nombre} registrado`);
      }
      onSave();
    } catch (e) {
      setErr(e?.response?.data?.error || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const sectionSt = {
    background: C.input, borderRadius: 10,
    padding: "14px 16px", marginBottom: 14,
    display: "flex", flexDirection: "column", gap: 12,
  };

  return (
    <form onSubmit={handleSubmit}>
      <PhotoUploader
        preview={form.foto_base64 || form.foto_preview || null}
        onChange={(b64) => setForm(f => ({ ...f, foto_base64: b64, foto_preview: b64 }))}
        name={form.nombre}
      />

      {/* Cuenta */}
      <div style={sectionSt}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".06em", margin: 0 }}>Datos de cuenta</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Field label="Nombre completo" required half>
            <input style={inputSt} value={form.nombre} onChange={set("nombre")} placeholder="Ej: Juan Pérez" required={!isEdit} />
          </Field>
          <Field label="Email" required half>
            <input style={inputSt} type="email" value={form.email} onChange={set("email")} placeholder="ejemplo@gym.com" required={!isEdit} />
          </Field>
        </div>
        <Field label={isEdit ? "Contraseña — vacío para mantener" : "Contraseña"}>
          <input style={inputSt} type="password" value={form.password} onChange={set("password")} placeholder={isEdit ? "••••••••" : "Crear contraseña"} />
        </Field>
      </div>

      {/* Perfil físico */}
      <div style={sectionSt}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".06em", margin: 0 }}>Perfil físico</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Field label="Teléfono" required half>
            <input style={inputSt} value={form.telefono} onChange={set("telefono")} placeholder="+52 664 123 4567" required />
          </Field>
          <Field label="Sexo" required half>
            <select style={inputSt} value={form.sexo} onChange={set("sexo")} required>
              <option value="">Seleccionar…</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </Field>
          <Field label="Peso inicial (kg)" half>
            <input style={inputSt} type="number" step="0.1" value={form.peso_inicial} onChange={set("peso_inicial")} placeholder="75.5" />
          </Field>
          <Field label="Estatura (m)" half>
            <input style={inputSt} type="number" step="0.01" value={form.estatura} onChange={set("estatura")} placeholder="1.75" />
          </Field>
        </div>
        {imcVal && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: C.card, borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: C.t2, fontWeight: 600 }}>IMC Calculado</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: imcMeta?.color || C.accent }}>
              {imcVal} <span style={{ fontSize: 12, fontWeight: 600 }}>— {imcMeta?.text}</span>
            </span>
          </div>
        )}
      </div>

      {err && <p style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{err}</p>}

      <button
        type="submit" disabled={saving}
        style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", background: saving ? C.input : C.accent, color: saving ? C.t2 : "#fff", transition: "all .15s" }}
      >
        {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Registrar miembro"}
      </button>
      <button type="button" onClick={onCancel} style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
        Cancelar
      </button>
    </form>
  );
}

// ── Card de miembro ───────────────────────────────────────────────────────────
function MemberCard({ m, inactivos, onEdit, onDelete, onReactivate }) {
  const imcVal  = imc(m.peso_inicial, m.estatura);
  const imcMeta = imcLabel(imcVal);

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 14, overflow: "hidden",
      opacity: inactivos ? 0.7 : 1,
      transition: "box-shadow .15s",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 18px 12px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Avatar src={m.foto_perfil} name={m.nombre} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.t1, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {m.nombre}
          </p>
          <p style={{ fontSize: 12, color: C.t2, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {m.email}
          </p>
          {m.membresia_activa && (
            <p style={{ fontSize: 11, color: C.accent, margin: "4px 0 0" }}>
              {m.membresia_activa.nombre}
            </p>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <Badge color={m.estado === "Activo" ? C.success : C.t3}>
            {m.estado}
          </Badge>
          {m.sexo && (
            <span style={{ fontSize: 11, color: C.t3 }}>
              {m.sexo === "M" ? "Masc." : m.sexo === "F" ? "Fem." : "Otro"}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      {(m.peso_inicial || m.estatura) && (
        <div style={{ display: "flex", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          {[
            { label: "Peso", val: m.peso_inicial ? `${m.peso_inicial} kg` : "—" },
            { label: "Estatura", val: m.estatura ? `${m.estatura} m` : "—" },
            ...(imcVal ? [{ label: "IMC", val: imcVal, color: imcMeta?.color }] : []),
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRight: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <p style={{ fontSize: 11, color: C.t3, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: s.color || C.t1, margin: 0 }}>{s.val}</p>
              {s.label === "IMC" && imcMeta && (
                <p style={{ fontSize: 10, color: imcMeta.color, margin: 0 }}>{imcMeta.text}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
        <button
          onClick={() => onEdit(m)}
          style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          Editar
        </button>
        {inactivos ? (
          <button
            onClick={() => onReactivate(m)}
            style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: `${C.success}22`, color: C.success, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Reactivar
          </button>
        ) : (
          <button
            onClick={() => onDelete(m)}
            style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: `${C.danger}18`, color: C.danger, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Desactivar
          </button>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  const pulse = { animation: "pulse 1.5s ease-in-out infinite", background: C.input, borderRadius: 6 };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ ...pulse, width: 52, height: 52, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ ...pulse, height: 14, width: "65%" }} />
          <div style={{ ...pulse, height: 11, width: "80%" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ ...pulse, flex: 1, height: 30 }} />
        <div style={{ ...pulse, flex: 1, height: 30 }} />
      </div>
    </div>
  );
}

// ── Diálogo de confirmación ───────────────────────────────────────────────────
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

// ── Página principal ──────────────────────────────────────────────────────────
export default function MiembrosDashboard() {
  const [miembros,   setMiembros]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [search,     setSearch]     = useState("");
  const [inactivos,  setInactivos]  = useState(false);
  const [modal,      setModal]      = useState(null);   // null | {} | {miembro}
  const [confirm,    setConfirm]    = useState(null);   // null | {title,msg,fn,danger}

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const { data } = await getMiembros(p, inactivos, search);
      setMiembros(data.miembros  || []);
      setTotal(data.total        || 0);
      setTotalPages(data.pages   || 1);
      setPage(p);
    } catch { toast.error("Error al cargar miembros"); }
    finally  { setLoading(false); }
  }, [inactivos, search, page]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => load(1), 400);
    return () => clearTimeout(t);
  }, [search, inactivos]); // eslint-disable-line

  const handleEdit   = (m) => setModal(m);
  const handleNew    = ()  => setModal({});

  const handleDelete = (m) => setConfirm({
    title:   `¿Desactivar a ${m.nombre}?`,
    msg:     "Podrás reactivarlo en cualquier momento desde la papelera.",
    danger:  true,
    fn:      async () => {
      try { await deleteMiembro(m.id); toast.success(`${m.nombre} desactivado`); load(1); }
      catch { toast.error("No se pudo desactivar"); }
      setConfirm(null);
    },
  });

  const handleReactivate = (m) => setConfirm({
    title:  `¿Reactivar a ${m.nombre}?`,
    msg:    "El miembro volverá a estar activo.",
    danger: false,
    fn:     async () => {
      try { await reactivateMiembro(m.id); toast.success(`${m.nombre} reactivado`); load(1); }
      catch { toast.error("No se pudo reactivar"); }
      setConfirm(null);
    },
  });

  const handleSave = () => { setModal(null); load(page); };

  return (
    <div style={{ padding: "24px 28px", background: C.bg, minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
      <Toasts />

      {/* Modal crear/editar */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.id ? "Editar Miembro" : "Registrar Nuevo Miembro"}
        subtitle={modal?.id ? "Modifica los datos del miembro" : "Completa los datos para registrar al miembro"}
      >
        {modal !== null && (
          <MiembroForm
            initial={modal?.id ? modal : null}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Confirm */}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.msg}
        danger={confirm?.danger}
        onConfirm={confirm?.fn}
        onCancel={() => setConfirm(null)}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: 0 }}>Gestión de Miembros</h1>
          <p style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>
            {total} miembro{total !== 1 ? "s" : ""} {inactivos ? "en papelera" : "activos"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => { setInactivos(v => !v); setPage(1); }}
            style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: inactivos ? `${C.danger}18` : "transparent", color: inactivos ? C.danger : C.t2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            {inactivos ? "Ver activos" : "Papelera"}
          </button>
          {!inactivos && (
            <button
              data-guide="ow-mem-nuevo"
              onClick={handleNew}
              style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              + Nuevo Miembro
            </button>
          )}
        </div>
      </div>

      {/* Búsqueda */}
      <div data-guide="ow-mem-search" style={{ position: "relative", marginBottom: 20, maxWidth: 440 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.t3, pointerEvents: "none", display: "inline-flex" }}><FiSearch /></span>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre o email…"
          style={{ ...inputSt, paddingLeft: 36, width: "100%", borderRadius: 10 }}
        />
        {search && (
          <button onClick={() => { setSearch(""); setPage(1); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 16 }}>✕</button>
        )}
      </div>

      {/* Grid */}
      {loading && miembros.length === 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : miembros.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: C.t2 }}>
          <p style={{ fontSize: 40, marginBottom: 12, display: "flex", justifyContent: "center" }}><FiUsers /></p>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.t1, marginBottom: 8 }}>
            {search ? "Sin resultados" : inactivos ? "Papelera vacía" : "Sin miembros activos"}
          </p>
          <p style={{ fontSize: 13, marginBottom: 20 }}>
            {search ? `No se encontró "${search}"` : inactivos ? "No hay miembros desactivados." : "Registra el primer miembro para comenzar."}
          </p>
          {!search && !inactivos && (
            <button onClick={handleNew} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Nuevo Miembro
            </button>
          )}
        </div>
      ) : (
        <div data-guide="ow-mem-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {miembros.map(m => (
            <MemberCard
              key={m.id}
              m={m}
              inactivos={inactivos}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReactivate={handleReactivate}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28, alignItems: "center" }}>
          <button disabled={page === 1 || loading} onClick={() => load(page - 1)}
            style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: page === 1 ? 0.4 : 1 }}>
            ← Anterior
          </button>
          <span style={{ fontSize: 13, color: C.t2 }}>Página {page} de {totalPages}</span>
          <button disabled={page === totalPages || loading} onClick={() => load(page + 1)}
            style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: page === totalPages ? 0.4 : 1 }}>
            Siguiente →
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}
