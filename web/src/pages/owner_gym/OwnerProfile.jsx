import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FiSave, FiInfo, FiAlertCircle, FiRefreshCw, FiImage } from "react-icons/fi";
import { getOwnerPerfil, updateOwnerPerfil } from "../../api/owner_gym";

const getSwalTheme = () => {
  const s = getComputedStyle(document.documentElement);
  return {
    background: s.getPropertyValue("--bg-card").trim() || "var(--bg-card)",
    color:      s.getPropertyValue("--text-primary").trim() || "#f1f5f9",
  };
};

/* ── Tipos de gimnasio (deben coincidir con backend GYM_TYPES) ── */
const GYM_TYPES_OPTIONS = [
  { value: "",                    label: "Sin especificar" },
  { value: "gimnasio_tradicional", label: "Gimnasio Tradicional" },
  { value: "crossfit_functional",  label: "CrossFit / Funcional" },
  { value: "yoga_pilates",         label: "Yoga / Pilates" },
  { value: "artes_marciales",      label: "Artes Marciales" },
  { value: "spinning_cycling",     label: "Spinning / Ciclismo" },
  { value: "natacion",             label: "Natación / Acuático" },
  { value: "boutique_studio",      label: "Estudio Boutique" },
  { value: "otro",                 label: "Otro / Personalizado" },
];

const S = {
  page:  { padding: "28px 32px", background: "var(--bg-main)", minHeight: "100vh", color: "var(--text-primary,#f1f5f9)", fontFamily: "Inter,system-ui,sans-serif" },
  title: { fontSize: 24, fontWeight: 700, margin: "0 0 4px" },
  sub:   { fontSize: 13, color: "var(--text-secondary,#94a3b8)", marginBottom: 28 },
  card:  { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 32px", maxWidth: 640 },
  label: { display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-secondary,#94a3b8)", marginBottom: 6 },
  input: { width: "100%", padding: "10px 14px", background: "var(--bg-main)", border: "1px solid var(--border,rgba(255,255,255,.12))", borderRadius: 8, color: "var(--text-primary,#f1f5f9)", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color .2s" },
  field: { marginBottom: 20 },
  row:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  btn:   { display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "#6366f122", border: "1px solid #6366f144", borderRadius: 8, color: "#818cf8", cursor: "pointer", fontSize: 14, fontWeight: 600, marginTop: 8 },
  badge: (c) => ({ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${c}22`, color: c }),
  readonly: { padding: "10px 14px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,.04)", borderRadius: 8, color: "var(--text-tertiary,#64748b)", fontSize: 14 },
};

const PLAN_COLOR = { basico: "var(--text-secondary)", pro: "#6366f1", enterprise: "#f59e0b" };

export default function OwnerProfile() {
  const [perfil,    setPerfil]    = useState(null);
  const [form,      setForm]      = useState({});
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Logotipo pendiente de guardar. Se separa del formulario para poder
  // mostrarlo de inmediato al elegir el archivo, antes de pulsar Guardar.
  const [logoNuevo, setLogoNuevo] = useState(null);

  const loadPerfil = () => {
    setLoading(true);
    setLoadError(false);
    getOwnerPerfil()
      .then(({ data }) => {
        setPerfil(data);
        setLogoNuevo(null);
        setForm({
          nombre:        data.nombre           || "",
          email_contacto: data.email_contacto  || "",
          telefono:      data.telefono         || "",
          tipo_gimnasio: data.tipo_gimnasio    || "",
        });
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPerfil(); }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  /**
   * Lee el archivo elegido como data URL, el mismo formato que envía la app
   * móvil. Así el logotipo se ve igual venga de donde venga: antes solo se
   * podía cargar desde el móvil y en la web no aparecía por ningún lado.
   *
   * El límite de 2 MB lo impone el backend, que lo guarda en la propia fila
   * del gimnasio; se comprueba aquí para avisar antes de subir nada.
   */
  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire("Archivo no válido", "El logotipo debe ser una imagen.", "warning");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire("Imagen muy pesada",
                "El logotipo no puede pasar de 2 MB. Prueba con una versión más ligera.",
                "warning");
      return;
    }

    const lector = new FileReader();
    lector.onload = () => setLogoNuevo(lector.result);
    lector.onerror = () => Swal.fire("Error", "No se pudo leer la imagen.", "error");
    lector.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre?.trim()) { Swal.fire("Campo requerido", "El nombre del gimnasio no puede estar vacío", "warning"); return; }
    setSaving(true);
    try {
      // El logotipo solo viaja si cambió: mandarlo en cada guardado obligaría
      // a reescribir varios cientos de kilobytes por cambiar un teléfono.
      const cuerpo = logoNuevo ? { ...form, logo: logoNuevo } : form;
      const { data } = await updateOwnerPerfil(cuerpo);
      setPerfil(data);
      setLogoNuevo(null);
      Swal.fire({ icon: "success", title: "Perfil actualizado", timer: 1500, showConfirmButton: false, ...getSwalTheme() });
    } catch (e) {
      Swal.fire("Error", e.response?.data?.msg || "No se pudo guardar", "error");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
      Cargando…
    </div>
  );

  if (loadError) return (
    <div style={{ ...S.page, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--text-secondary)" }}>
      <FiAlertCircle size={36} color="#475569" />
      <p style={{ margin: 0, fontSize: 14 }}>No se pudo cargar el perfil del gimnasio</p>
      <button onClick={loadPerfil} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "var(--accent-dim)", border: "1px solid var(--accent)", color: "var(--accent-soft)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
        <FiRefreshCw size={13} /> Reintentar
      </button>
    </div>
  );

  return (
    <div style={S.page}>
      <h1 style={S.title}>Perfil del Gimnasio</h1>
      <p style={S.sub}>Información y configuración de tu establecimiento</p>

      <div style={S.card}>
        {/* Logotipo. Aparece arriba del todo porque es lo que identifica al
            gimnasio en los reportes en PDF y en la app. */}
        <div style={{
          display: "flex", alignItems: "center", gap: 18, marginBottom: 24,
          paddingBottom: 22, borderBottom: "1px solid var(--border)",
        }}>
          <label
            htmlFor="logo-gimnasio"
            title="Cambiar el logotipo"
            style={{
              width: 96, height: 96, borderRadius: 20, cursor: "pointer",
              background: "var(--bg-main)",
              border: `2px dashed ${(logoNuevo || perfil?.logo) ? "transparent" : "var(--border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0, position: "relative",
            }}
          >
            {(logoNuevo || perfil?.logo) ? (
              <img
                src={logoNuevo || perfil.logo}
                alt="Logotipo del gimnasio"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <FiImage size={30} style={{ color: "var(--text-secondary)" }} />
            )}
          </label>
          <input
            id="logo-gimnasio"
            type="file"
            accept="image/*"
            onChange={handleLogo}
            style={{ display: "none" }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Logotipo del gimnasio
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              Aparece en la portada de los reportes en PDF y en la aplicación móvil.
              Haz clic en el recuadro para cambiarlo. Máximo 2 MB.
            </p>
            {logoNuevo && (
              <p style={{ fontSize: 12, color: "var(--accent)", margin: "8px 0 0", fontWeight: 600 }}>
                Logotipo listo — pulsa Guardar para aplicarlo.
              </p>
            )}
          </div>
        </div>

        {/* Info de solo lectura */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, padding: "14px 18px", background: "var(--bg-main)", borderRadius: 10, border: "1px solid rgba(255,255,255,.06)", alignItems: "center" }}>
          <FiInfo color="#6366f1" size={18} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Plan activo</div>
            <div style={{ marginTop: 4 }}>
              <span style={S.badge(PLAN_COLOR[perfil?.plan] || "#6366f1")}>
                {(perfil?.plan || "—").toUpperCase()}
              </span>
              <span style={{ marginLeft: 12, fontSize: 12, color: "var(--text-secondary)" }}>
                ID #{perfil?.id} · Activo: {perfil?.activo ? "Sí" : "No"}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-primary)" }}>
            Desde {perfil?.created_at ? perfil.created_at.slice(0, 10) : "—"}
          </div>
        </div>

        <form onSubmit={handleSave} data-guide="ow-profile-form">
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
              {GYM_TYPES_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
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
