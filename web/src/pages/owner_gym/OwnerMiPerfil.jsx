/**
 * OwnerMiPerfil.jsx — Ficha de la persona propietaria.
 *
 * Es el equivalente de "Mi Perfil" del móvil. Hasta ahora la web solo tenía
 * "Perfil del Gym", así que el dueño no encontraba dónde ver ni cambiar sus
 * propios datos: nombre, correo de acceso, teléfono y foto.
 *
 *   GET /api/owner_gym/perfil                → gimnasio + bloque `propietario`
 *   PUT /api/owner_gym/perfil/propietario    → guarda los datos de la persona
 *
 * El gimnasio se administra en su propia pantalla; aquí solo hay un acceso
 * directo para no mezclar las dos cosas.
 */
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FiSave, FiCamera, FiEdit2, FiX, FiMail, FiPhone, FiShield,
  FiCalendar, FiChevronRight, FiRefreshCw, FiAlertCircle,
} from "react-icons/fi";
import { getOwnerPerfil, updateOwnerPropietario } from "../../api/owner_gym";

const C = {
  card:   "var(--bg-card)",
  input:  "var(--bg-input, var(--bg-main))",
  border: "var(--border)",
  t1:     "var(--text-primary, #f1f5f9)",
  t2:     "var(--text-secondary, #94a3b8)",
  accent: "var(--accent, #6366f1)",
  danger: "var(--danger, #ef4444)",
};

const S = {
  page:  { padding: "28px 32px", background: "var(--bg-main)", minHeight: "100vh", color: C.t1, fontFamily: "Inter,system-ui,sans-serif" },
  title: { fontSize: 24, fontWeight: 700, margin: "0 0 4px" },
  sub:   { fontSize: 13, color: C.t2, marginBottom: 28 },
  card:  { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "26px 30px", maxWidth: 620 },
  label: { display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: C.t2, marginBottom: 6 },
  input: { width: "100%", padding: "10px 14px", background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, color: C.t1, fontSize: 14, outline: "none", boxSizing: "border-box" },
  field: { marginBottom: 18 },
  fila:  { display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: `1px solid ${C.border}` },
  btn:   { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 9, border: "none", background: C.accent, color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  btnGhost: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
};

const swalTema = () => {
  const s = getComputedStyle(document.documentElement);
  return {
    background: s.getPropertyValue("--bg-card").trim() || "#171a21",
    color:      s.getPropertyValue("--text-primary").trim() || "#f1f5f9",
  };
};

/** Convierte el archivo elegido a data URL, que es como lo guarda el backend. */
function leerComoDataUrl(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload  = () => resolve(lector.result);
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}

export default function OwnerMiPerfil() {
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [datos,    setDatos]    = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState(false);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo]  = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });

  const cargar = async () => {
    setCargando(true);
    setError(false);
    try {
      const { data } = await getOwnerPerfil();
      setDatos(data);
      const p = data?.propietario ?? {};
      setForm({
        nombre:   p.nombre   ?? "",
        email:    p.email    ?? "",
        telefono: p.telefono ?? "",
      });
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!form.nombre.trim()) {
      Swal.fire({ ...swalTema(), icon: "warning", title: "Falta el nombre" });
      return;
    }
    if (!form.email.includes("@")) {
      Swal.fire({ ...swalTema(), icon: "warning", title: "El correo no es válido" });
      return;
    }
    setGuardando(true);
    try {
      await updateOwnerPropietario({
        nombre:   form.nombre.trim(),
        email:    form.email.trim().toLowerCase(),
        telefono: form.telefono.trim(),
      });
      setEditando(false);
      await cargar();
      Swal.fire({ ...swalTema(), icon: "success", title: "Perfil actualizado", timer: 1600, showConfirmButton: false });
    } catch (e) {
      Swal.fire({
        ...swalTema(), icon: "error", title: "No se pudo guardar",
        text: e?.response?.data?.msg ?? "Revisa tu conexión.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarFoto = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";                       // permite volver a elegir el mismo
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      Swal.fire({ ...swalTema(), icon: "warning", title: "Elige una imagen" });
      return;
    }
    // El backend rechaza por encima de ~2 MB; se avisa antes de subir en balde.
    if (archivo.size > 2 * 1024 * 1024) {
      Swal.fire({ ...swalTema(), icon: "warning", title: "La imagen es muy pesada",
                  text: "El máximo son 2 MB. Recórtala o elige otra." });
      return;
    }

    setSubiendo(true);
    try {
      const dataUrl = await leerComoDataUrl(archivo);
      await updateOwnerPropietario({ foto_perfil: dataUrl });
      await cargar();
    } catch (err) {
      Swal.fire({
        ...swalTema(), icon: "error", title: "No se pudo guardar la foto",
        text: err?.response?.data?.msg ?? "Intenta de nuevo.",
      });
    } finally {
      setSubiendo(false);
    }
  };

  if (cargando) {
    return (
      <div style={S.page}>
        <p style={{ color: C.t2, fontSize: 14 }}>Cargando tu perfil…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, textAlign: "center" }}>
          <FiAlertCircle size={34} color={C.danger} />
          <p style={{ margin: "12px 0 18px", color: C.t2, fontSize: 14 }}>
            No se pudo cargar tu perfil.
          </p>
          <button onClick={cargar} style={S.btn}><FiRefreshCw /> Reintentar</button>
        </div>
      </div>
    );
  }

  const propietario = datos?.propietario ?? {};
  const nombre = propietario.nombre || "Propietario";
  const iniciales = nombre.trim().split(/\s+/).slice(0, 2)
    .map((p) => p[0]).join("").toUpperCase();
  const foto = propietario.foto_perfil;

  return (
    <div style={S.page}>
      <h1 style={S.title}>Mi Perfil</h1>
      <p style={S.sub}>Tus datos personales y de acceso al sistema.</p>

      <div style={S.card}>
        {/* Identidad */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            {foto && String(foto).startsWith("data:image") ? (
              <img src={foto} alt="" style={{ width: 96, height: 96, borderRadius: 28, objectFit: "cover" }} />
            ) : (
              <div style={{
                width: 96, height: 96, borderRadius: 28, background: C.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 34, fontWeight: 800,
              }}>
                {iniciales}
              </div>
            )}

            <button
              onClick={() => fileRef.current?.click()}
              disabled={subiendo}
              title="Cambiar foto"
              aria-label="Cambiar mi foto de perfil"
              style={{
                position: "absolute", right: -4, bottom: -4,
                width: 32, height: 32, borderRadius: "50%",
                background: C.accent, border: `2px solid ${C.card}`,
                color: "#fff", cursor: subiendo ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {subiendo ? <FiRefreshCw size={14} /> : <FiCamera size={15} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={cambiarFoto}
              style={{ display: "none" }}
            />
          </div>

          <p style={{ margin: "14px 0 4px", fontSize: 21, fontWeight: 800 }}>{nombre}</p>
          <span style={{
            display: "inline-block", padding: "4px 14px", borderRadius: 20,
            fontSize: 12, fontWeight: 700,
            background: `${C.accent}1A`, color: C.accent,
          }}>
            {propietario.rol || "Owner / Propietario"}
          </span>
        </div>

        {/* Datos */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Mis datos</h3>
          {editando ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setEditando(false); cargar(); }} style={{ ...S.btnGhost, padding: "6px 14px" }}>
                <FiX size={14} /> Cancelar
              </button>
              <button onClick={guardar} disabled={guardando} style={{ ...S.btn, padding: "6px 16px" }}>
                <FiSave size={14} /> {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditando(true)} style={{ ...S.btnGhost, padding: "6px 14px" }}>
              <FiEdit2 size={14} /> Editar
            </button>
          )}
        </div>

        {editando ? (
          <>
            <div style={S.field}>
              <label style={S.label}>Nombre</label>
              <input
                style={S.input}
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Tu nombre"
              />
            </div>
            <div style={S.field}>
              <label style={S.label}>Correo de acceso</label>
              <input
                style={S.input}
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
              />
              <p style={{ fontSize: 11.5, color: C.t2, margin: "6px 0 0" }}>
                Con este correo entras al sistema. Si lo cambias, usa el nuevo la
                próxima vez.
              </p>
            </div>
            <div style={S.field}>
              <label style={S.label}>Teléfono</label>
              <input
                style={S.input}
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                placeholder="7191055865"
              />
            </div>
          </>
        ) : (
          <div>
            <div style={S.fila}>
              <FiMail size={16} color={C.accent} />
              <span style={{ flex: 1, fontSize: 12.5, color: C.t2 }}>Correo de acceso</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{propietario.email || "—"}</span>
            </div>
            <div style={S.fila}>
              <FiPhone size={16} color={C.accent} />
              <span style={{ flex: 1, fontSize: 12.5, color: C.t2 }}>Teléfono</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {propietario.telefono || "Sin registrar"}
              </span>
            </div>
            <div style={S.fila}>
              <FiShield size={16} color={C.accent} />
              <span style={{ flex: 1, fontSize: 12.5, color: C.t2 }}>Rol</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {propietario.rol || "Owner / Propietario"}
              </span>
            </div>
            {propietario.created_at && (
              <div style={{ ...S.fila, borderBottom: "none" }}>
                <FiCalendar size={16} color={C.accent} />
                <span style={{ flex: 1, fontSize: 12.5, color: C.t2 }}>Cuenta creada</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {new Date(propietario.created_at).toLocaleDateString("es-MX")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acceso al negocio */}
      <div
        onClick={() => navigate("/owner/profile")}
        style={{
          ...S.card, maxWidth: 620, marginTop: 18, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
        }}
      >
        {datos?.logo && String(datos.logo).startsWith("data:image") ? (
          <img src={datos.logo} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover" }} />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: `${C.accent}1A`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.accent, fontWeight: 800,
          }}>
            {(datos?.nombre || "G")[0].toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>
            {datos?.nombre || "Mi gimnasio"}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.t2 }}>
            {datos?.tipo_gimnasio_label || "Ver los datos del negocio"}
          </p>
        </div>
        <FiChevronRight size={18} color={C.t2} />
      </div>
    </div>
  );
}
