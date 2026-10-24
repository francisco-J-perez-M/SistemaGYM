/**
 * DetalleUsuarioModal.jsx — Ficha completa de una persona.
 *
 * Es el equivalente en la web de `components/usuarios/DetalleUsuario.tsx` del
 * móvil, y lo comparten las listas de Miembros y de Staff. Recibe los campos ya
 * normalizados para no acoplarse a la forma de cada endpoint: la lista de
 * miembros trae `foto_perfil` y `membresia`, la de staff trae `rol`, y cada
 * pantalla se encarga de traducirlos.
 *
 * Las filas sin valor no se dibujan, así que una ficha incompleta se ve limpia
 * en lugar de llena de guiones.
 */
import { useEffect } from "react";
import {
  FiX, FiMail, FiPhone, FiUser, FiCalendar, FiCreditCard,
  FiClock, FiShield, FiActivity, FiFlag, FiTrendingDown,
} from "react-icons/fi";

const C = {
  overlay: "rgba(0,0,0,.7)",
  card:    "var(--bg-card, #171a21)",
  input:   "var(--bg-input, #1e2229)",
  border:  "var(--border, #2a2f3a)",
  t1:      "var(--text-primary, #f1f5f9)",
  t2:      "var(--text-secondary, #94a3b8)",
  accent:  "var(--accent, #6366f1)",
  success: "var(--success, #22c55e)",
  danger:  "var(--danger, #ef4444)",
};

const ICONOS = {
  correo:      <FiMail size={15} />,
  telefono:    <FiPhone size={15} />,
  membresia:   <FiCreditCard size={15} />,
  vence:       <FiClock size={15} />,
  ingreso:     <FiCalendar size={15} />,
  nacimiento:  <FiCalendar size={15} />,
  rol:         <FiShield size={15} />,
  estado:      <FiActivity size={15} />,
  objetivo:    <FiFlag size={15} />,
  peso:        <FiTrendingDown size={15} />,
  generico:    <FiUser size={15} />,
};

/** Convierte una fecha de la API a dd/mm/aaaa; devuelve null si no hay valor. */
export function fechaFicha(valor) {
  if (!valor) return null;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor).slice(0, 10);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function DetalleUsuarioModal({ usuario, onClose, titulo = "Detalle" }) {
  // Cerrar con Escape: en un modal de solo lectura es lo que espera el usuario.
  useEffect(() => {
    if (!usuario) return;
    const alPulsar = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [usuario, onClose]);

  if (!usuario) return null;

  const activo = usuario.activo !== false;
  const filas  = (usuario.datos || []).filter(
    (d) => d.valor !== null && d.valor !== undefined && String(d.valor).trim() !== ""
  );
  const iniciales = (usuario.nombre || "?")
    .trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 9600, background: C.overlay,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
        width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,.5)",
      }}>
        {/* Encabezado */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: `1px solid ${C.border}`,
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.t1 }}>{titulo}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "none", border: "none", color: C.t2, cursor: "pointer",
              display: "flex", padding: 4, borderRadius: 6,
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Identidad */}
        <div style={{ padding: "26px 22px 20px", textAlign: "center" }}>
          {usuario.foto && String(usuario.foto).startsWith("data:image") ? (
            <img
              src={usuario.foto}
              alt=""
              style={{ width: 88, height: 88, borderRadius: 26, objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: 88, height: 88, borderRadius: 26, background: C.accent,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 32, fontWeight: 800,
            }}>
              {iniciales}
            </div>
          )}

          <p style={{ margin: "12px 0 2px", fontSize: 20, fontWeight: 800, color: C.t1 }}>
            {usuario.nombre || "—"}
          </p>
          {usuario.subtitulo ? (
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: C.accent }}>
              {usuario.subtitulo}
            </p>
          ) : null}

          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: activo ? `${C.success}1A` : `${C.danger}1A`,
            color: activo ? C.success : C.danger,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: activo ? C.success : C.danger,
            }} />
            {activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        {/* Contacto directo */}
        {(usuario.email || usuario.telefono) && (
          <div style={{ display: "flex", gap: 10, padding: "0 22px 18px" }}>
            {usuario.email && (
              <a
                href={`mailto:${usuario.email}`}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 7, padding: "10px 0", borderRadius: 10, textDecoration: "none",
                  background: `${C.accent}18`, border: `1px solid ${C.accent}`,
                  color: C.accent, fontSize: 13, fontWeight: 700,
                }}
              >
                <FiMail size={15} /> Correo
              </a>
            )}
            {usuario.telefono && (
              <a
                href={`tel:${String(usuario.telefono).replace(/\s/g, "")}`}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 7, padding: "10px 0", borderRadius: 10, textDecoration: "none",
                  background: `${C.accent}18`, border: `1px solid ${C.accent}`,
                  color: C.accent, fontSize: 13, fontWeight: 700,
                }}
              >
                <FiPhone size={15} /> Llamar
              </a>
            )}
          </div>
        )}

        {/* Ficha */}
        <div style={{ padding: "0 22px 24px" }}>
          {filas.length === 0 ? (
            <p style={{ color: C.t2, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              No hay más información registrada.
            </p>
          ) : (
            <div style={{
              background: C.input, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "4px 14px",
            }}>
              {filas.map((d, i) => (
                <div
                  key={`${d.etiqueta}-${i}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 0",
                    borderBottom: i === filas.length - 1 ? "none" : `1px solid ${C.border}`,
                  }}
                >
                  <span style={{ color: C.t2, display: "flex" }}>
                    {ICONOS[d.icono] || ICONOS.generico}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: C.t2 }}>{d.etiqueta}</span>
                  <span style={{
                    flex: "1.1", fontSize: 13.5, fontWeight: 600, color: C.t1,
                    textAlign: "right", wordBreak: "break-word",
                  }}>
                    {String(d.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
