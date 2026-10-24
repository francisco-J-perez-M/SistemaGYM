import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FiSave, FiInfo } from "react-icons/fi";
import { getOwnerPerfil, updateOwnerPerfil } from "../../api/owner_gym";

const S = {
  page:  { padding: "28px 32px", background: "var(--bg-dark,#0f1117)", minHeight: "100vh", color: "var(--text-primary,#f1f5f9)", fontFamily: "Inter,system-ui,sans-serif" },
  title: { fontSize: 24, fontWeight: 700, margin: "0 0 4px" },
  sub:   { fontSize: 13, color: "var(--text-secondary,#94a3b8)", marginBottom: 28 },
  card:  { background: "var(--bg-card,#1e2233)", border: "1px solid var(--border,rgba(255,255,255,.08))", borderRadius: 12, padding: "28px 32px", maxWidth: 640 },
  label: { display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-secondary,#94a3b8)", marginBottom: 6 },
  input: { width: "100%", padding: "10px 14px", background: "var(--bg-dark,#0f1117)", border: "1px solid var(--border,rgba(255,255,255,.12))", borderRadius: 8, color: "var(--text-primary,#f1f5f9)", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color .2s" },
  field: { marginBottom: 20 },
  row:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  btn:   { display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "#6366f122", border: "1px solid #6366f144", borderRadius: 8, color: "#818cf8", cursor: "pointer", fontSize: 14, fontWeight: 600, marginTop: 8 },
  badge: (c) => ({ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${c}22`, color: c }),
  readonly: { padding: "10px 14px", background: "var(--bg-dark,#0f1117)", border: "1px solid rgba(255,255,255,.04)", borderRadius: 8, color: "var(--text-tertiary,#64748b)", fontSize: 14 },
};

const PLAN_COLOR = { basico: "#64748b", pro: "#6366f1", enterprise: "#f59e0b" };

export default function OwnerProfile() {
  const [perfil,  setPerfil]  = useState(null);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOwnerPerfil()
      .then(({ data }) => { setPerfil(data); setForm({ nombre: data.nombre, email_contacto: data.email_contacto || "", telefono: data.telefono || "", tipo_gimnasio: data.tipo_gimnasio || "" }); })
      .catch(() => Swal.fire("Error", "No se pudo cargar el perfil", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre?.trim()) { Swal.fire("Campo requerido", "El nombre del gimnasio no puede estar vacío", "warning"); return; }
    setSaving(true);
    try {
      const { data } = await updateOwnerPerfil(form);
      setPerfil(data);
      Swal.fire({ icon: "success", title: "Perfil actualizado", timer: 1500, showConfirmButton: false, background: "#1e2233", color: "#f1f5f9" });
    } catch (e) {
      Swal.fire("Error", e.response?.data?.msg || "No se pudo guardar", "error");
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>Cargando…</div>;

  return (
    <div style={S.page}>
      <h1 style={S.title}>Perfil del Gimnasio</h1>
      <p style={S.sub}>Información y configuración de tu establecimiento</p>

      <div style={S.card}>
        {/* Info de solo lectura */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, padding: "14px 18px", background: "var(--bg-dark,#0f1117)", borderRadius: 10, border: "1px solid rgba(255,255,255,.06)", alignItems: "center" }}>
          <FiInfo color="#6366f1" size={18} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Plan activo</div>
            <div style={{ marginTop: 4 }}>
              <span style={S.badge(PLAN_COLOR[perfil?.plan] || "#6366f1")}>
                {(perfil?.plan || "—").toUpperCase()}
              </span>
              <span style={{ marginLeft: 12, fontSize: 12, color: "#64748b" }}>
                ID #{perfil?.id} · Activo: {perfil?.activo ? "Sí" : "No"}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#475569" }}>
            Desde {perfil?.created_at ? perfil.created_at.slice(0, 10) : "—"}
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div style={S.field}>
            <label style={S.label}>Nombre del Gimnasio *</label>
            <input style={S.input} name="nombre" value={form.nombre || ""} onChange={handleChange} placeholder="Nombre del gimnasio" required />
          </div>

          <div style={{ ...S.field, ...S.row }}>
            <div>
              <label style={S.label}>Email de Contacto</label>
              <input style={S.input} name="email_contacto" type="email" value={form.email_contacto || ""} onChange={handleChange} placeholder="contacto@misgym.com" />
            </div>
            <div>
              <label style={S.label}>Teléfono</label>
              <input style={S.input} name="telefono" value={form.telefono || ""} onChange={handleChange} placeholder="555-123-4567" />
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Tipo de Establecimiento</label>
            <select style={{ ...S.input, appearance: "none" }} name="tipo_gimnasio" value={form.tipo_gimnasio || ""} onChange={handleChange}>
              <option value="">Sin especificar</option>
              <option value="gym">Gimnasio tradicional</option>
              <option value="crossfit">CrossFit / Funcional</option>
              <option value="yoga">Yoga / Pilates</option>
              <option value="boxeo">Artes marciales / Boxeo</option>
              <option value="natacion">Natación</option>
              <option value="spinning">Spinning / Ciclismo</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <button type="submit" style={S.btn} disabled={saving}>
            <FiSave /> {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
