/**
 * pages/owner_gym/OwnerPerfilPublico.jsx — Fotos y testimonios que el
 * gimnasio muestra en la pagina comercial publica de GymPro (Landing.jsx).
 *
 * Accesible a Propietario y Administrador, igual que "Perfil del Gym"
 * (OwnerProfile.jsx) -- aqui no hay dinero de por medio como en
 * OwnerPagos.jsx/HU-50, asi que no se restringe a solo Propietario.
 */
import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { FiImage, FiTrash2, FiUpload, FiStar, FiMessageSquare, FiPlus } from "react-icons/fi";
import {
  getImagenesPropias, subirImagen, eliminarImagen,
  getTestimoniosPropios, crearTestimonio, eliminarTestimonio,
} from "../../api/perfilPublico";

const getSwalTheme = () => {
  const s = getComputedStyle(document.documentElement);
  return {
    background: s.getPropertyValue("--bg-card").trim() || "var(--bg-card)",
    color:      s.getPropertyValue("--text-primary").trim() || "#f1f5f9",
  };
};

const MAX_IMAGENES = 4;

const S = {
  page:  { padding: "28px 32px", background: "var(--bg-main)", minHeight: "100vh", color: "var(--text-primary,#f1f5f9)", fontFamily: "Inter,system-ui,sans-serif" },
  title: { fontSize: 24, fontWeight: 700, margin: "0 0 4px" },
  sub:   { fontSize: 13, color: "var(--text-secondary,#94a3b8)", marginBottom: 28, maxWidth: 640 },
  card:  { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px 28px", marginBottom: 24, maxWidth: 760 },
  h2:    { fontSize: 16, fontWeight: 700, margin: "0 0 4px" },
  h2sub: { fontSize: 12.5, color: "var(--text-secondary,#94a3b8)", margin: "0 0 18px" },
  grid:  { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 16 },
  thumbWrap: { position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "4 / 3", background: "var(--bg-input)" },
  thumb: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  delBtn: { position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 999, border: "none", background: "rgba(0,0,0,.55)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  uploadBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "var(--accent-dim)", border: "1px solid var(--border-hover)", borderRadius: 8, color: "var(--accent)", cursor: "pointer", fontSize: 13.5, fontWeight: 600 },
  countHint: { fontSize: 12, color: "var(--text-tertiary,#64748b)", marginTop: 4 },
  label: { display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-secondary,#94a3b8)", marginBottom: 6 },
  input: { width: "100%", padding: "10px 14px", background: "var(--bg-main)", border: "1px solid var(--border,rgba(255,255,255,.12))", borderRadius: 8, color: "var(--text-primary,#f1f5f9)", fontSize: 14, outline: "none", boxSizing: "border-box" },
  field: { marginBottom: 14 },
  row:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  stars: { display: "flex", gap: 4 },
  starBtn: (activa) => ({ background: "none", border: "none", cursor: "pointer", padding: 2, color: activa ? "var(--warning)" : "var(--text-tertiary,#64748b)", fontSize: 18, lineHeight: 1 }),
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "var(--accent)", border: "none", borderRadius: 8, color: "var(--text-on-accent,#fff)", cursor: "pointer", fontSize: 14, fontWeight: 600, marginTop: 6 },
  testimonioCard: { border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 10, position: "relative" },
  testimonioTexto: { fontSize: 13.5, color: "var(--text-primary)", margin: "6px 0 8px", lineHeight: 1.5 },
  testimonioAutor: { fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" },
  testimonioCargo: { fontSize: 12, color: "var(--text-secondary,#94a3b8)" },
  testimonioDel: { position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "var(--text-tertiary,#64748b)", cursor: "pointer" },
  empty: { fontSize: 13, color: "var(--text-tertiary,#64748b)", fontStyle: "italic", marginBottom: 14 },
};

function Estrellas({ valor }) {
  if (!valor) return null;
  return (
    <span style={{ ...S.stars, marginBottom: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FiStar key={n} style={{ color: n <= valor ? "var(--warning)" : "var(--border)" }} size={13} fill={n <= valor ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

export default function OwnerPerfilPublico() {
  const [imagenes,    setImagenes]    = useState([]);
  const [testimonios, setTestimonios] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [subiendo,    setSubiendo]    = useState(false);
  const [guardandoTestimonio, setGuardandoTestimonio] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ autor_nombre: "", autor_cargo: "", texto: "", calificacion: 5 });

  const cargar = () => {
    setLoading(true);
    Promise.all([getImagenesPropias(), getTestimoniosPropios()])
      .then(([imgRes, tesRes]) => {
        setImagenes(imgRes.data || []);
        setTestimonios(tesRes.data || []);
      })
      .catch(() => {
        Swal.fire({ ...getSwalTheme(), title: "No se pudo cargar", text: "Intenta recargar la página.", icon: "error" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleElegirArchivo = () => fileInputRef.current?.click();

  const handleArchivoSeleccionado = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo despues
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({ ...getSwalTheme(), title: "Archivo no válido", text: "Solo se aceptan imágenes.", icon: "warning" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      Swal.fire({ ...getSwalTheme(), title: "Imagen muy pesada", text: "Cada foto debe pesar menos de 15 MB.", icon: "warning" });
      return;
    }

    setSubiendo(true);
    try {
      const { data } = await subirImagen(file);
      setImagenes((prev) => [...prev, data]);
    } catch (err) {
      Swal.fire({
        ...getSwalTheme(), title: "No se pudo subir",
        text: err.response?.data?.msg || "Intenta de nuevo.", icon: "error",
      });
    } finally {
      setSubiendo(false);
    }
  };

  const handleBorrarImagen = async (img) => {
    const confirm = await Swal.fire({
      ...getSwalTheme(), title: "¿Quitar esta foto?",
      text: "Dejará de verse en la página pública de inmediato.",
      icon: "warning", showCancelButton: true, confirmButtonText: "Quitarla", cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      await eliminarImagen(img.id);
      setImagenes((prev) => prev.filter((i) => i.id !== img.id));
    } catch {
      Swal.fire({ ...getSwalTheme(), title: "No se pudo quitar la foto", icon: "error" });
    }
  };

  const handleChangeForm = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCrearTestimonio = async (e) => {
    e.preventDefault();
    if (!form.autor_nombre.trim() || !form.texto.trim()) {
      Swal.fire({ ...getSwalTheme(), title: "Faltan datos", text: "El nombre y el testimonio son obligatorios.", icon: "warning" });
      return;
    }

    setGuardandoTestimonio(true);
    try {
      const { data } = await crearTestimonio(form);
      setTestimonios((prev) => [data, ...prev]);
      setForm({ autor_nombre: "", autor_cargo: "", texto: "", calificacion: 5 });
      Swal.fire({ ...getSwalTheme(), title: "¡Listo!", text: "Ya aparece en la página pública.", icon: "success", timer: 1800, showConfirmButton: false });
    } catch (err) {
      Swal.fire({
        ...getSwalTheme(), title: "No se pudo guardar",
        text: err.response?.data?.msg || "Intenta de nuevo.", icon: "error",
      });
    } finally {
      setGuardandoTestimonio(false);
    }
  };

  const handleBorrarTestimonio = async (t) => {
    const confirm = await Swal.fire({
      ...getSwalTheme(), title: "¿Quitar este testimonio?",
      icon: "warning", showCancelButton: true, confirmButtonText: "Quitarlo", cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      await eliminarTestimonio(t.id);
      setTestimonios((prev) => prev.filter((x) => x.id !== t.id));
    } catch {
      Swal.fire({ ...getSwalTheme(), title: "No se pudo quitar", icon: "error" });
    }
  };

  if (loading) {
    return <div style={S.page}><p style={{ color: "var(--text-secondary)" }}>Cargando…</p></div>;
  }

  return (
    <div style={S.page}>
      <h1 style={S.title}>Perfil público</h1>
      <p style={S.sub}>
        Lo que subas aquí aparece sin que nadie inicie sesión: en el carrusel de
        gimnasios y en los testimonios de <b>gympro.lat</b>, la página comercial
        que ven los visitantes antes de registrarse.
      </p>

      <div style={S.card}>
        <h2 style={S.h2}><FiImage style={{ verticalAlign: "-2px", marginRight: 6 }} />Fotos de tu gimnasio</h2>
        <p style={S.h2sub}>Instalaciones, equipo, clases — lo que quieras mostrar al público.</p>

        {imagenes.length === 0 && <p style={S.empty}>Todavía no has subido ninguna foto.</p>}

        <div style={S.grid}>
          {imagenes.map((img) => (
            <div key={img.id} style={S.thumbWrap}>
              <img src={img.url} alt="Foto del gimnasio" style={S.thumb} />
              <button style={S.delBtn} onClick={() => handleBorrarImagen(img)} title="Quitar foto">
                <FiTrash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          style={{ display: "none" }}
          onChange={handleArchivoSeleccionado}
        />
        <button
          style={{ ...S.uploadBtn, opacity: imagenes.length >= MAX_IMAGENES || subiendo ? 0.6 : 1, cursor: imagenes.length >= MAX_IMAGENES || subiendo ? "not-allowed" : "pointer" }}
          onClick={handleElegirArchivo}
          disabled={imagenes.length >= MAX_IMAGENES || subiendo}
        >
          <FiUpload /> {subiendo ? "Subiendo…" : "Subir foto"}
        </button>
        <p style={S.countHint}>{imagenes.length} / {MAX_IMAGENES} fotos · PNG, JPG, GIF o WEBP, máx. 15 MB cada una</p>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}><FiMessageSquare style={{ verticalAlign: "-2px", marginRight: 6 }} />Testimonios</h2>
        <p style={S.h2sub}>Comparte lo que te han dicho tus socios o tu equipo — aparece tal cual lo escribas.</p>

        {testimonios.length === 0 && <p style={S.empty}>Todavía no has agregado ningún testimonio.</p>}

        {testimonios.map((t) => (
          <div key={t.id} style={S.testimonioCard}>
            <button style={S.testimonioDel} onClick={() => handleBorrarTestimonio(t)} title="Quitar testimonio">
              <FiTrash2 size={14} />
            </button>
            <Estrellas valor={t.calificacion} />
            <p style={S.testimonioTexto}>"{t.texto}"</p>
            <div style={S.testimonioAutor}>{t.autor_nombre}</div>
            {t.autor_cargo && <div style={S.testimonioCargo}>{t.autor_cargo}</div>}
          </div>
        ))}

        <form onSubmit={handleCrearTestimonio} style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
          <div style={S.row}>
            <div style={S.field}>
              <label style={S.label}>Nombre</label>
              <input style={S.input} name="autor_nombre" value={form.autor_nombre} onChange={handleChangeForm} placeholder="Laura Méndez" maxLength={150} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Cargo (opcional)</label>
              <input style={S.input} name="autor_cargo" value={form.autor_cargo} onChange={handleChangeForm} placeholder="Socia desde 2024" maxLength={150} />
            </div>
          </div>
          <div style={S.field}>
            <label style={S.label}>Testimonio</label>
            <textarea
              style={{ ...S.input, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
              name="texto" value={form.texto} onChange={handleChangeForm}
              placeholder="Qué le dirías a alguien que está pensando en inscribirse…"
              maxLength={500}
            />
          </div>
          <div style={S.field}>
            <label style={S.label}>Calificación</label>
            <div style={S.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} style={S.starBtn(n <= form.calificacion)} onClick={() => setForm((f) => ({ ...f, calificacion: n }))}>
                  <FiStar fill={n <= form.calificacion ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
          <button type="submit" style={{ ...S.btnPrimary, opacity: guardandoTestimonio ? 0.7 : 1 }} disabled={guardandoTestimonio}>
            <FiPlus /> {guardandoTestimonio ? "Guardando…" : "Agregar testimonio"}
          </button>
        </form>
      </div>
    </div>
  );
}
