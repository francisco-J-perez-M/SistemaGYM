import React, { useRef, useState, useEffect } from "react";

/* ================= ICONOS SVG LOCALES ================= */
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const MailIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const PhoneIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const LockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>);
const WeightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/></svg>);
const HeightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="M14.5 4v16"/></svg>);
const GenderIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>);
const CameraIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);

export default function MiembroForm({
  form,
  setForm,
  loading,
  editingId,
  fotoPreview,
  onFileChange,
  onSubmit,
  onCancel,
  imcActual,
}) {
  const fileInputRef = useRef(null);
  const [imgBroken, setImgBroken] = useState(false);

  // Cuando fotoPreview cambia (nueva selección o nuevo miembro), resetear estado roto
  useEffect(() => { setImgBroken(false); }, [fotoPreview]);

  const handleImgError = () => setImgBroken(true);
  const handleImgLoad  = () => setImgBroken(false);

  // Iniciales como fallback
  const initials = (form.nombre || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const triggerFile = () => fileInputRef.current?.click();

  return (
    <div className="compact-form-content" style={{ opacity: 1, maxHeight: 'none' }}>
      <form onSubmit={onSubmit} className="compact-form">
        {/* --- FOTO DE PERFIL --- */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <div
              onClick={triggerFile}
              style={{
                width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
                border: '2px solid var(--accent)', background: 'var(--bg-input)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {fotoPreview && !imgBroken ? (
                <img
                  src={fotoPreview}
                  alt={form.nombre || "foto"}
                  onError={handleImgError}
                  onLoad={handleImgLoad}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{
                  fontSize: initials ? 28 : 22,
                  fontWeight: 700,
                  color: 'var(--accent-soft)',
                  letterSpacing: '-1px',
                }}>
                  {initials || <CameraIcon />}
                </span>
              )}
            </div>
            {/* Botón cámara — usa ref, no label con input hidden */}
            <button
              type="button"
              onClick={triggerFile}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: '50%',
                width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,.4)',
              }}
              title="Cambiar foto"
            >
              <CameraIcon />
            </button>
            {/* Input oculto controlado por ref */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => { setImgBroken(false); onFileChange(e); }}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
              tabIndex={-1}
            />
          </div>
        </div>

        {/* ── SECCIÓN: Cuenta ─────────────────────────────────── */}
        <div style={sectionStyle}>
          <p style={sectionLabel}>Datos de Cuenta</p>
          <div style={gridTwo}>
            <Field label="Nombre completo" required icon={<UserIcon />}>
              <input style={inputStyle} placeholder="Ej: Juan Pérez"
                value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required={!editingId} />
            </Field>
            <Field label="Email" required icon={<MailIcon />}>
              <input style={inputStyle} type="email" placeholder="ejemplo@gym.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                required={!editingId} />
            </Field>
          </div>
          <Field label={editingId ? "Contraseña — dejar vacía para mantener la actual" : "Contraseña"} icon={<LockIcon />}>
            <input style={inputStyle} type="password"
              placeholder={editingId ? "••••••••" : "Crear contraseña"}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
        </div>

        {/* ── SECCIÓN: Perfil físico ───────────────────────── */}
        <div style={sectionStyle}>
          <p style={sectionLabel}>Perfil Físico</p>
          <div style={gridTwo}>
            <Field label="Teléfono" required icon={<PhoneIcon />}>
              <input style={inputStyle} placeholder="Ej: +52 664 123 4567"
                value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                required />
            </Field>
            <Field label="Sexo" required icon={<GenderIcon />}>
              <select style={inputStyle} value={form.sexo}
                onChange={(e) => setForm({ ...form, sexo: e.target.value })} required>
                <option value="">Seleccionar…</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </Field>
          </div>
          <div style={gridTwo}>
            <Field label="Peso inicial (kg)" icon={<WeightIcon />}>
              <input style={inputStyle} type="number" step="0.1" placeholder="Ej: 75.5"
                value={form.peso_inicial} onChange={(e) => setForm({ ...form, peso_inicial: e.target.value })} />
            </Field>
            <Field label="Estatura (m)" icon={<HeightIcon />}>
              <input style={inputStyle} type="number" step="0.01" placeholder="Ej: 1.75"
                value={form.estatura} onChange={(e) => setForm({ ...form, estatura: e.target.value })} />
            </Field>
          </div>

          {/* IMC calculado */}
          {imcActual && (
            <div style={{ background: "var(--bg-input)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>IMC Calculado</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--accent-soft)" }}>{imcActual}</span>
            </div>
          )}
        </div>

        <button
          type="submit" disabled={loading}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none",
            background: loading ? "var(--bg-input)" : "var(--accent)",
            color: loading ? "var(--text-secondary)" : "#fff",
            fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4, transition: "all .15s",
          }}
        >
          {loading ? "Guardando…" : editingId ? "Guardar cambios" : "Registrar Miembro"}
        </button>
      </form>
    </div>
  );
}

/* ── Helpers de layout ───────────────────────────────────────── */
const sectionStyle = {
  background: "var(--bg-input,rgba(255,255,255,.04))",
  borderRadius: 10,
  padding: "16px 18px",
  marginBottom: 14,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const sectionLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: ".07em",
  margin: 0,
};

const gridTwo = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: "var(--bg-card,#1e2233)",
  border: "1px solid var(--border,rgba(255,255,255,.1))",
  borderRadius: 8, padding: "9px 12px",
  color: "var(--text-primary)", fontSize: 13,
  outline: "none",
};

function Field({ label, required, icon, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
        {icon} {label}{required && <span style={{ color: "var(--accent-soft)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}