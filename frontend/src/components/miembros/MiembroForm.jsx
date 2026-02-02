import React from "react";

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
  return (
    <div className="compact-form-content" style={{ opacity: 1, maxHeight: 'none' }}>
      {editingId && (
        <div className="editing-badge">
          <EditIcon />
          Modo edición
          <button className="cancel-edit-btn" type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="compact-form">
        {/* --- FOTO DE PERFIL --- */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
              border: '2px solid #3b82f6', background: '#1e293b', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '30px', color: '#64748b' }}>📷</span>
              )}
            </div>
            <label style={{
              position: 'absolute', bottom: '0', right: '0', background: '#3b82f6',
              color: 'white', borderRadius: '50%', width: '30px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <CameraIcon />
              <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* --- DATOS DE CUENTA --- */}
        <h4 style={{ color: '#94a3b8', marginBottom: '10px', fontSize: '0.9rem', borderBottom: '1px solid #334155', paddingBottom: '5px' }}>Datos de Cuenta</h4>
        
        <div className="compact-form-grid">
          <div className="form-group compact">
            <label className="form-label-compact"><UserIcon style={{ marginRight: "6px" }} /> Nombre Completo *</label>
            <input
              className="input-compact"
              placeholder="Ej: Juan Pérez"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required={!editingId}
            />
          </div>
          <div className="form-group compact">
            <label className="form-label-compact"><MailIcon style={{ marginRight: "6px" }} /> Email *</label>
            <input
              type="email"
              className="input-compact"
              placeholder="ejemplo@gym.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required={!editingId}
            />
          </div>
        </div>

        <div className="compact-form-grid">
          <div className="form-group compact">
              <label className="form-label-compact"><LockIcon style={{ marginRight: "6px" }} /> Contraseña {editingId && "(Dejar vacía para mantener)"}</label>
              <input
                  type="password"
                  className="input-compact"
                  placeholder={editingId ? "******" : "Crear contraseña"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
          </div>
        </div>

        {/* --- DATOS FÍSICOS --- */}
        <h4 style={{ color: '#94a3b8', margin: '15px 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid #334155', paddingBottom: '5px' }}>Perfil Físico</h4>
        
        <div className="compact-form-grid">
          <div className="form-group compact">
            <label className="form-label-compact"><PhoneIcon style={{ marginRight: "6px" }} /> Teléfono *</label>
            <input
              className="input-compact"
              placeholder="Ej: +34 123 456 789"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              required
            />
          </div>
          <div className="form-group compact">
            <label className="form-label-compact"><GenderIcon style={{ marginRight: "6px" }} /> Sexo *</label>
            <select
              className="input-compact"
              value={form.sexo}
              onChange={(e) => setForm({ ...form, sexo: e.target.value })}
              required
            >
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>
        </div>

        <div className="compact-form-grid">
          <div className="form-group compact">
            <label className="form-label-compact"><WeightIcon style={{ marginRight: "6px" }} /> Peso (kg)</label>
            <input
              className="input-compact"
              type="number" step="0.1"
              placeholder="Ej: 75.5"
              value={form.peso_inicial}
              onChange={(e) => setForm({ ...form, peso_inicial: e.target.value })}
            />
          </div>
          <div className="form-group compact">
            <label className="form-label-compact"><HeightIcon style={{ marginRight: "6px" }} /> Estatura (m)</label>
            <input
              className="input-compact"
              type="number" step="0.01"
              placeholder="Ej: 1.75"
              value={form.estatura}
              onChange={(e) => setForm({ ...form, estatura: e.target.value })}
            />
          </div>
        </div>

        <div className="compact-form-grid">
          <div className="form-group compact">
            <label className="form-label-compact">IMC (calculado)</label>
            <input
              className="input-compact"
              value={imcActual}
              disabled
              style={{ 
                background: "#0f172a", 
                color: "#38bdf8", 
                fontWeight: "bold",
                cursor: "not-allowed"
              }}
            />
          </div>
        </div>

        <div className="compact-form-actions-bottom">
          <button className="btn-compact-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner-small"></span> : (editingId ? "Actualizar Datos" : "Registrar Miembro")}
          </button>
        </div>
      </form>
    </div>
  );
}