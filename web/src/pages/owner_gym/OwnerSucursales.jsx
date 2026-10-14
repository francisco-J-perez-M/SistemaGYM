/**
 * OwnerSucursales.jsx — Panel de Sucursales del Propietario (HU-45 / SCRUM-222).
 *
 * Exclusivo de Propietario (Administrador comparte el panel owner_gym pero
 * el backend restringe estos endpoints a Propietario -- ver
 * routes/owner_gym/sucursales.py -- y Sidebar.jsx ya oculta el enlace para
 * ese rol). Reúne tres cosas que antes no tenían dónde vivir en el frontend
 * aunque el backend ya las soportaba desde SCRUM-216/222:
 *   1) Alta/edición/activación de sucursales de la organización.
 *   2) Ocupación (miembros/staff) de cada sucursal frente a su plan, con
 *      aviso temprano al 90% (GET /sucursales/capacidad).
 *   3) Alta y reasignación de Administradores a una o varias sucursales.
 *
 * A propósito NO vive en OwnerStaff.jsx: dar de alta un Administrador
 * necesita elegir sucursal(es) (AsignacionUsuario), algo que ese modal no
 * modela y que el Propietario pidió mantener separado.
 */
import { useEffect, useState, useCallback } from "react";
import {
  FiMapPin, FiPlus, FiEdit2, FiHome, FiPhone, FiMail, FiLock,
  FiUser, FiShield,
} from "react-icons/fi";
import {
  getSucursales, getSucursalesCapacidad, crearSucursal, editarSucursal, toggleSucursal,
  getAdministradores, crearAdministrador, reasignarSucursalesAdmin, toggleAdministrador,
} from "../../api/owner_gym";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:      "var(--bg-main,#0f1117)",
  card:    "var(--bg-card,#1a1d27)",
  input:   "var(--bg-input,#12151e)",
  border:  "var(--border,rgba(255,255,255,.08))",
  accent:  "var(--accent,#6366f1)",
  success: "var(--success,#22c55e)",
  warning: "var(--warning,#eab308)",
  danger:  "var(--danger,#ef4444)",
  t1:      "var(--text-primary,#f1f5f9)",
  t2:      "var(--text-secondary,#94a3b8)",
  t3:      "var(--text-tertiary,#64748b)",
};

const GYM_TYPES_OPTIONS = [
  { value: "",                     label: "Sin especificar" },
  { value: "gimnasio_tradicional",  label: "Gimnasio Tradicional" },
  { value: "crossfit_functional",   label: "CrossFit / Funcional" },
  { value: "yoga_pilates",          label: "Yoga / Pilates" },
  { value: "artes_marciales",       label: "Artes Marciales" },
  { value: "spinning_cycling",      label: "Spinning / Ciclismo" },
  { value: "natacion",              label: "Natación / Acuático" },
  { value: "boutique_studio",       label: "Estudio Boutique" },
  { value: "otro",                  label: "Otro / Personalizado" },
];

const PLAN_OPTIONS = ["starter", "basico", "pro", "enterprise"];
const PLAN_COLOR   = { starter: "#64748b", basico: "#6366f1", pro: "#8b5cf6", enterprise: "#eab308" };

// ── Toast (mismo patrón que OwnerStaff.jsx) ───────────────────────────────────
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

// ── Field / IcoWrap (a nivel de módulo: ver el comentario en OwnerStaff.jsx
// sobre SCRUM-202 -- recrearlos dentro del modal en cada render le hace
// perder el foco al input tras cada carácter escrito) ─────────────────────
function Field({ label, required, children }) {
  return (
    <div style={{ flex: "1 1 calc(50% - 6px)", minWidth: 0 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.t2, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.accent, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
function IcoWrap({ icon, children }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.t3, display: "flex" }}>{icon}</span>
      {children}
    </div>
  );
}
const inputSt = {
  width: "100%", boxSizing: "border-box", background: C.input,
  border: `1px solid ${C.border}`, borderRadius: 8,
  padding: "9px 12px 9px 32px", color: C.t1, fontSize: 13, outline: "none",
};

// ── Barra de capacidad ────────────────────────────────────────────────────────
function CapBar({ label, bloque }) {
  if (!bloque) return null;
  const { actual, tope, cerca_del_tope, en_el_tope } = bloque;
  const color = en_el_tope ? C.danger : cerca_del_tope ? C.warning : C.success;
  const pct   = tope ? Math.min(100, Math.round((actual / tope) * 100)) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.t2, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: tope ? color : C.t2 }}>
          {actual}{tope != null ? ` / ${tope}` : " (sin límite)"}
          {en_el_tope && " · al tope"}
          {!en_el_tope && cerca_del_tope && " · cerca del tope"}
        </span>
      </div>
      {tope != null && (
        <div style={{ height: 6, borderRadius: 4, background: C.input, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width .3s" }} />
        </div>
      )}
    </div>
  );
}

// ── SucursalModal ─────────────────────────────────────────────────────────────
const EMPTY_SUC = { nombre: "", email_contacto: "", telefono: "", tipo_gimnasio: "", plan: "", heredar_cobro: true };

function SucursalModal({ open, onClose, onSave, initial, saving }) {
  const [form, setForm] = useState(EMPTY_SUC);
  const isEdit = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    setForm(initial
      ? { nombre: initial.nombre || "", email_contacto: initial.email_contacto || "", telefono: initial.telefono || "", tipo_gimnasio: initial.tipo_gimnasio || "", plan: initial.plan || "", heredar_cobro: true }
      : EMPTY_SUC
    );
  }, [open, initial]);

  if (!open) return null;
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.card, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
              {isEdit ? <FiEdit2 size={16} /> : <FiPlus size={16} />}
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.t1, margin: 0 }}>{isEdit ? "Editar Sucursal" : "Nueva Sucursal"}</h2>
              <p style={{ fontSize: 12, color: C.t2, margin: "2px 0 0" }}>{isEdit ? `Editando ${initial?.nombre}` : "Se crea dentro de tu organización"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t2, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{ padding: "20px 24px 24px" }}>
          <div style={{ background: C.input, borderRadius: 10, padding: "14px 16px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".06em", margin: 0 }}>Datos de la sucursal</p>
            <Field label="Nombre" required>
              <IcoWrap icon={<FiHome size={14} />}>
                <input style={inputSt} value={form.nombre} onChange={set("nombre")} placeholder="Hyper Panchito Gym - Sucursal Norte" required />
              </IcoWrap>
            </Field>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Field label="Email de contacto">
                <IcoWrap icon={<FiMail size={14} />}>
                  <input style={inputSt} type="email" value={form.email_contacto} onChange={set("email_contacto")} placeholder="sucursal@gym.com" />
                </IcoWrap>
              </Field>
              <Field label="Teléfono">
                <IcoWrap icon={<FiPhone size={14} />}>
                  <input style={inputSt} value={form.telefono} onChange={set("telefono")} placeholder="555-123-4567" />
                </IcoWrap>
              </Field>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Field label="Tipo de establecimiento">
                <select style={{ ...inputSt, padding: "9px 12px" }} value={form.tipo_gimnasio} onChange={set("tipo_gimnasio")}>
                  {GYM_TYPES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </Field>
              <Field label={isEdit ? "Plan" : "Plan (vacío = heredar de la sede principal)"}>
                <select style={{ ...inputSt, padding: "9px 12px" }} value={form.plan} onChange={set("plan")}>
                  <option value="">{isEdit ? "Sin cambiar" : "Heredar de la sede principal"}</option>
                  {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>
            {!isEdit && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.t2, cursor: "pointer" }}>
                <input type="checkbox" checked={form.heredar_cobro} onChange={e => setForm(f => ({ ...f, heredar_cobro: e.target.checked }))} />
                Heredar la cuenta de cobro (pasarelas) de la sede principal
              </label>
            )}
          </div>

          <button type="submit" disabled={saving}
            style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", background: saving ? C.input : C.accent, color: saving ? C.t2 : "#fff" }}>
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear sucursal"}
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

// ── AdminModal (alta o reasignación de sucursales) ────────────────────────────
const EMPTY_ADMIN = { nombre: "", email: "", password: "", sucursales: [] };

function AdminModal({ open, onClose, onSave, initial, sucursales, saving }) {
  const [form, setForm] = useState(EMPTY_ADMIN);
  const isReasignar = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    setForm(initial
      ? { nombre: initial.nombre || "", email: initial.email || "", password: "", sucursales: initial.sucursales || [] }
      : EMPTY_ADMIN
    );
  }, [open, initial]);

  if (!open) return null;
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleSuc = (id) => setForm(f => ({
    ...f,
    sucursales: f.sucursales.includes(id) ? f.sucursales.filter(s => s !== id) : [...f.sucursales, id],
  }));

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.card, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
              {isReasignar ? <FiEdit2 size={16} /> : <FiPlus size={16} />}
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.t1, margin: 0 }}>{isReasignar ? "Reasignar sucursales" : "Nuevo Administrador"}</h2>
              <p style={{ fontSize: 12, color: C.t2, margin: "2px 0 0" }}>{isReasignar ? `Editando a ${initial?.nombre}` : "Rol Administrador, alcance por sucursal"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t2, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{ padding: "20px 24px 24px" }}>
          {!isReasignar && (
            <div style={{ background: C.input, borderRadius: 10, padding: "14px 16px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".06em", margin: 0 }}>Datos de cuenta</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Field label="Nombre completo" required>
                  <IcoWrap icon={<FiUser size={14} />}>
                    <input style={inputSt} value={form.nombre} onChange={set("nombre")} placeholder="Ana Gómez" required />
                  </IcoWrap>
                </Field>
                <Field label="Email" required>
                  <IcoWrap icon={<FiMail size={14} />}>
                    <input style={inputSt} type="email" value={form.email} onChange={set("email")} placeholder="ana@gym.com" required />
                  </IcoWrap>
                </Field>
              </div>
              <Field label="Contraseña" required>
                <IcoWrap icon={<FiLock size={14} />}>
                  <input style={inputSt} type="password" value={form.password} onChange={set("password")} placeholder="Mínimo 6 caracteres" required />
                </IcoWrap>
              </Field>
            </div>
          )}

          <div style={{ background: C.input, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 10px" }}>
              Sucursales asignadas <span style={{ color: C.accent }}>*</span>
            </p>
            {sucursales.length === 0 ? (
              <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>No hay sucursales creadas todavía.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
                {sucursales.map(s => (
                  <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.t1, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.sucursales.includes(s.id)} onChange={() => toggleSuc(s.id)} />
                    {s.nombre} {s.es_sucursal_principal && <span style={{ fontSize: 10, color: C.t3 }}>(sede principal)</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={saving || form.sucursales.length === 0}
            style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: (saving || form.sucursales.length === 0) ? "not-allowed" : "pointer", background: (saving || form.sucursales.length === 0) ? C.input : C.accent, color: (saving || form.sucursales.length === 0) ? C.t2 : "#fff" }}>
            {saving ? "Guardando…" : isReasignar ? "Guardar sucursales" : "Crear administrador"}
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

// ── Tarjetas ───────────────────────────────────────────────────────────────────
function SucursalCard({ s, cap, onEdit, onToggle }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", opacity: s.activo ? 1 : 0.7 }}>
      <div style={{ padding: "16px 18px 10px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, flexShrink: 0 }}>
              <FiMapPin size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.t1, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nombre}</p>
              <p style={{ fontSize: 11, color: C.t3, margin: "2px 0 0" }}>
                {s.es_sucursal_principal ? "Sede principal" : "Sucursal"} · <span style={{ color: PLAN_COLOR[s.plan] || C.t2, fontWeight: 700 }}>{(s.plan || "—").toUpperCase()}</span>
              </p>
            </div>
          </div>
          <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.activo ? `${C.success}20` : `${C.danger}18`, color: s.activo ? C.success : C.danger, flexShrink: 0 }}>
            {s.activo ? "Activa" : "Inactiva"}
          </span>
        </div>
        {(s.email_contacto || s.telefono) && (
          <p style={{ fontSize: 11, color: C.t2, margin: "0 0 10px" }}>
            {[s.email_contacto, s.telefono].filter(Boolean).join(" · ")}
          </p>
        )}
        <CapBar label="Miembros" bloque={cap?.miembros} />
        <CapBar label="Staff"    bloque={cap?.staff} />
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px", display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button onClick={() => onEdit(s)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <FiEdit2 size={12} /> Editar
        </button>
        <button onClick={() => onToggle(s)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: s.activo ? `${C.danger}18` : `${C.success}20`, color: s.activo ? C.danger : C.success, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {s.activo ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}

function AdminCard({ a, sucursalesMap, onReasignar, onToggle }) {
  const nombres = (a.sucursales || []).map(id => sucursalesMap[id]?.nombre || `#${id}`);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", opacity: a.activo ? 1 : 0.7 }}>
      <div style={{ padding: "16px 18px 10px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#eab30822", display: "flex", alignItems: "center", justifyContent: "center", color: C.warning, flexShrink: 0 }}>
          <FiShield size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.t1, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nombre}</p>
              <p style={{ fontSize: 12, color: C.t2, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email}</p>
            </div>
            <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: a.activo ? `${C.success}20` : `${C.danger}18`, color: a.activo ? C.success : C.danger, flexShrink: 0 }}>
              {a.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {nombres.length === 0
              ? <span style={{ fontSize: 11, color: C.t3 }}>Sin sucursales asignadas</span>
              : nombres.map((n, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: `${C.accent}18`, color: C.accent }}>
                    <FiMapPin size={9} style={{ marginRight: 3, verticalAlign: -1 }} />{n}
                  </span>
                ))
            }
          </div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px", display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button onClick={() => onReasignar(a)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <FiEdit2 size={12} /> Sucursales
        </button>
        <button onClick={() => onToggle(a)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: a.activo ? `${C.danger}18` : `${C.success}20`, color: a.activo ? C.danger : C.success, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {a.activo ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function OwnerSucursales() {
  const [sucursales, setSucursales]   = useState([]);
  const [capacidad,  setCapacidad]    = useState({});
  const [administradores, setAdministradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [sucModal, setSucModal] = useState(false);
  const [sucEditing, setSucEditing] = useState(null);
  const [adminModal, setAdminModal] = useState(false);
  const [adminEditing, setAdminEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rSuc, rCap, rAdmin] = await Promise.all([
        getSucursales(), getSucursalesCapacidad(), getAdministradores(),
      ]);
      setSucursales(rSuc.data);
      const capMap = {};
      (rCap.data || []).forEach(b => { capMap[b.id_gimnasio] = b; });
      setCapacidad(capMap);
      setAdministradores(rAdmin.data);
    } catch {
      toast.error("No se pudo cargar la información de sucursales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sucursalesMap = sucursales.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

  // ── Sucursales ──────────────────────────────────────────────────────────────
  const handleSaveSucursal = async (form) => {
    if (!form.nombre.trim()) { toast.error("El nombre es requerido"); return; }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre, email_contacto: form.email_contacto,
        telefono: form.telefono, tipo_gimnasio: form.tipo_gimnasio,
      };
      if (form.plan) payload.plan = form.plan;
      if (sucEditing) {
        await editarSucursal(sucEditing.id, payload);
        toast.success(`${form.nombre} actualizada`);
      } else {
        payload.heredar_cobro = form.heredar_cobro;
        await crearSucursal(payload);
        toast.success(`${form.nombre} creada`);
      }
      setSucModal(false); setSucEditing(null); load();
    } catch (e) {
      toast.error(e.response?.data?.msg || "Error al guardar la sucursal");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSucursal = (s) => {
    setConfirm({
      title: `¿${s.activo ? "Desactivar" : "Activar"} ${s.nombre}?`,
      message: s.activo
        ? "Mientras esté desactivada, su staff y miembros no podrán operar en ella."
        : "La sucursal volverá a operar normalmente.",
      danger: s.activo,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await toggleSucursal(s.id);
          toast.success(`${s.nombre} ${s.activo ? "desactivada" : "activada"}`);
          load();
        } catch (e) {
          toast.error(e.response?.data?.msg || "No se pudo cambiar el estado");
        }
      },
    });
  };

  // ── Administradores ─────────────────────────────────────────────────────────
  const handleSaveAdmin = async (form) => {
    if (form.sucursales.length === 0) { toast.error("Selecciona al menos una sucursal"); return; }
    setSaving(true);
    try {
      if (adminEditing) {
        await reasignarSucursalesAdmin(adminEditing.id, form.sucursales);
        toast.success(`Sucursales de ${adminEditing.nombre} actualizadas`);
      } else {
        if (!form.nombre || !form.email || !form.password) {
          toast.error("Completa nombre, email y contraseña");
          setSaving(false);
          return;
        }
        await crearAdministrador({
          nombre: form.nombre, email: form.email, password: form.password,
          sucursales: form.sucursales,
        });
        toast.success(`${form.nombre} registrado como Administrador`);
      }
      setAdminModal(false); setAdminEditing(null); load();
    } catch (e) {
      toast.error(e.response?.data?.msg || "Error al guardar el administrador");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdmin = (a) => {
    setConfirm({
      title: `¿${a.activo ? "Desactivar" : "Activar"} a ${a.nombre}?`,
      message: a.activo
        ? "No podrá iniciar sesión mientras esté desactivado."
        : "Podrá volver a iniciar sesión.",
      danger: a.activo,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await toggleAdministrador(a.id);
          toast.success(`${a.nombre} ${a.activo ? "desactivado" : "activado"}`);
          load();
        } catch { toast.error("No se pudo cambiar el estado"); }
      },
    });
  };

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
          <h2 className="page-title" style={{ margin: "0 0 4px" }}>Sucursales</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.t2 }}>
            {sucursales.length} sucursal{sucursales.length !== 1 ? "es" : ""} · {administradores.length} administrador{administradores.length !== 1 ? "es" : ""}
          </p>
        </div>
        <button onClick={() => { setSucEditing(null); setSucModal(true); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <FiPlus size={14} /> Nueva Sucursal
        </button>
      </div>

      {loading ? (
        <p style={{ color: C.t2, fontSize: 13 }}>Cargando…</p>
      ) : (
        <>
          {sucursales.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: C.t3 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.t2, margin: "0 0 8px" }}>Aún no tienes sucursales registradas</p>
              <p style={{ fontSize: 13, margin: 0 }}>Tu sede principal se creó automáticamente al dar de alta tu gimnasio.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16, marginBottom: 32 }}>
              {sucursales.map(s => (
                <SucursalCard key={s.id} s={s} cap={capacidad[s.id]}
                  onEdit={(s) => { setSucEditing(s); setSucModal(true); }}
                  onToggle={handleToggleSucursal}
                />
              ))}
            </div>
          )}

          {/* Administradores */}
          <div className="section-header" style={{ marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t1, margin: "0 0 4px" }}>Administradores</h3>
              <p style={{ margin: 0, fontSize: 13, color: C.t2 }}>Staff con alcance sobre una o varias sucursales</p>
            </div>
            <button onClick={() => { setAdminEditing(null); setAdminModal(true); }} disabled={sucursales.length === 0}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "none", background: sucursales.length === 0 ? C.input : C.accent, color: sucursales.length === 0 ? C.t2 : "#fff", fontWeight: 700, fontSize: 13, cursor: sucursales.length === 0 ? "not-allowed" : "pointer" }}>
              <FiPlus size={14} /> Nuevo Administrador
            </button>
          </div>

          {administradores.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: C.t3 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.t2, margin: "0 0 8px" }}>No hay administradores todavía</p>
              <p style={{ fontSize: 13, margin: 0 }}>Crea uno y asígnale las sucursales que va a operar.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
              {administradores.map(a => (
                <AdminCard key={a.id} a={a} sucursalesMap={sucursalesMap}
                  onReasignar={(a) => { setAdminEditing(a); setAdminModal(true); }}
                  onToggle={handleToggleAdmin}
                />
              ))}
            </div>
          )}
        </>
      )}

      <SucursalModal
        open={sucModal}
        onClose={() => { setSucModal(false); setSucEditing(null); }}
        onSave={handleSaveSucursal}
        initial={sucEditing}
        saving={saving}
      />

      <AdminModal
        open={adminModal}
        onClose={() => { setAdminModal(false); setAdminEditing(null); }}
        onSave={handleSaveAdmin}
        initial={adminEditing}
        sucursales={sucursales}
        saving={saving}
      />
    </div>
  );
}
