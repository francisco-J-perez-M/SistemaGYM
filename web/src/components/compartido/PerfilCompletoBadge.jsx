/**
 * PerfilCompletoBadge.jsx — Indicador circular de pendientes (SCRUM-102).
 *
 * Se monta una sola vez en Layout.jsx (solo para role === "user"), como un
 * botón flotante de posición fija, así que queda visible desde cualquier
 * pantalla del portal del Miembro sin depender de que cada página tenga
 * su propio header (muchas páginas del rol Miembro dibujan su propio
 * <header className="top-header"> por separado, sin un componente
 * compartido entre todas).
 *
 * El cálculo del porcentaje NO vive aquí: viene de
 * GET /api/user/profile-completion (api/app/routes/miembro/user_profile.py),
 * el mismo endpoint que consume la app móvil (ver
 * mobile/components/navigation/PerfilCompletoBadge.tsx), para que el % sea
 * idéntico en ambas plataformas por construcción.
 */
import { useState, useEffect } from "react";
import { FiX, FiChevronRight, FiCheckCircle, FiCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { peticion } from "../../api/cliente";

const RADIO = 20;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

// A qué ruta del portal del Miembro lleva cada campo pendiente.
const RUTA_POR_CAMPO = {
  nombre: "/user/profile", telefono: "/user/profile",
  fecha_nacimiento: "/user/profile", foto: "/user/profile",
  objetivo: "/user/profile", disponibilidad: "/user/profile",
  unidad_medida: "/user/profile",
  peso: "/user/progress", estatura: "/user/progress", medidas: "/user/progress",
  condiciones: "/user-health-update", lesiones: "/user-health-update",
  contacto_emergencia: "/user-health-update",
};

export default function PerfilCompletoBadge() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [abierto, setAbierto] = useState(false);

  // Se monta una sola vez por Layout.jsx (no por página), así que una
  // única carga al montar es suficiente — no hay un hook de fetch genérico
  // del proyecto que convenga reutilizar aquí sin acoplar este componente
  // flotante a un patrón de una página en particular.
  useEffect(() => {
    let vivo = true;
    peticion("/api/user/profile-completion")
      .then((d) => { if (vivo) setData(d); })
      .catch(() => { if (vivo) setData(null); });
    return () => { vivo = false; };
  }, []);

  if (!data || data.completo) return null;

  const pct = Math.max(0, Math.min(100, data.porcentaje));
  const offset = CIRCUNFERENCIA * (1 - pct / 100);

  const irA = (campo) => {
    setAbierto(false);
    navigate(RUTA_POR_CAMPO[campo] ?? "/user/profile");
  };

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        title={`Perfil ${pct}% completo`}
        style={S.fab}
      >
        <svg width={44} height={44} viewBox="0 0 44 44">
          <circle cx={22} cy={22} r={RADIO} stroke="var(--border)" strokeWidth={4} fill="none" />
          <circle
            cx={22} cy={22} r={RADIO}
            stroke="var(--accent)" strokeWidth={4} fill="none"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
          />
        </svg>
        <span style={S.fabText}>{pct}%</span>
      </button>

      {abierto && (
        <div style={S.overlay} onClick={() => setAbierto(false)}>
          <div style={S.panel} onClick={(e) => e.stopPropagation()}>
            <div style={S.header}>
              <div>
                <h3 style={S.title}>Completa tu perfil</h3>
                <span style={S.subtitle}>{pct}% completo</span>
              </div>
              <button onClick={() => setAbierto(false)} style={S.closeBtn} aria-label="Cerrar">
                <FiX size={20} />
              </button>
            </div>

            <div style={{ overflowY: "auto", maxHeight: 440 }}>
              {data.bloques.map((bloque) => (
                <div key={bloque.id} style={{ marginBottom: 18 }}>
                  <div style={S.bloqueHeader}>
                    <span style={S.bloqueTitulo}>{bloque.nombre}</span>
                    {!bloque.obligatorio && <span style={S.chipOpcional}>OPCIONAL</span>}
                  </div>

                  {bloque.pendientes.length === 0 ? (
                    <div style={S.row}>
                      <FiCheckCircle color="var(--success)" size={16} />
                      <span style={{ marginLeft: 8, color: "var(--text-secondary)", fontSize: 13 }}>
                        {bloque.id === "medico" && !bloque.consentimientoOtorgado
                          ? "Sin registrar — puedes omitirlo"
                          : "Completo"}
                      </span>
                    </div>
                  ) : (
                    bloque.pendientes.map((p) => (
                      <button key={p.campo} onClick={() => irA(p.campo)} style={S.pendienteBtn}>
                        <FiCircle size={14} color="var(--text-muted)" />
                        <span style={{ marginLeft: 8, flex: 1, textAlign: "left", fontSize: 13.5, color: "var(--text-primary)" }}>
                          {p.label}
                        </span>
                        <FiChevronRight size={16} color="var(--text-muted)" />
                      </button>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  fab: {
    position: "fixed", bottom: 24, right: 24, zIndex: 1000,
    width: 44, height: 44, borderRadius: "50%",
    background: "var(--bg-card)", border: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,.18)",
  },
  fabText: { position: "absolute", fontSize: 10, fontWeight: 700, color: "var(--text-primary)" },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
    display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
    zIndex: 1001, padding: 24,
  },
  panel: {
    width: 360, maxWidth: "90vw", background: "var(--bg-card)",
    border: "1px solid var(--border)", borderRadius: 16, padding: 20,
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  title: { margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text-primary)" },
  subtitle: { fontSize: 13, color: "var(--text-secondary)" },
  closeBtn: { background: "transparent", border: "none", cursor: "pointer", color: "var(--text-primary)" },
  bloqueHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  bloqueTitulo: { fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" },
  chipOpcional: {
    fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
    background: "var(--bg-input)", borderRadius: 6, padding: "2px 6px",
  },
  row: { display: "flex", alignItems: "center", padding: "8px 0" },
  pendienteBtn: {
    display: "flex", alignItems: "center", width: "100%", padding: "9px 0",
    borderBottom: "1px solid var(--border)", background: "transparent", border: "none",
    borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer",
  },
};
