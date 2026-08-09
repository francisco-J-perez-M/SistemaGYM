/**
 * HistorialAsistencias.jsx — Lista paginada de los días que un miembro asistió al gym.
 *
 * Se monta dentro de la ficha de usuario (DetalleUsuarioModal) a través de su
 * slot `extra`. Hace su propia carga para que el modal siga siendo un componente
 * de presentación puro y la ficha de staff —que no tiene asistencias— no cargue
 * nada de más.
 *
 * La paginación es del servidor (page / per_page); aquí sólo se navega.
 */
import { useEffect, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiLogIn, FiLogOut } from "react-icons/fi";
import { getAsistenciasMiembro } from "../../api/miembros";

const C = {
  input:   "var(--bg-input, #1e2229)",
  border:  "var(--border, #2a2f3a)",
  t1:      "var(--text-primary, #f1f5f9)",
  t2:      "var(--text-secondary, #94a3b8)",
  accent:  "var(--accent, #6366f1)",
  danger:  "var(--danger, #ef4444)",
};

const POR_PAGINA = 8;

/** "2026-08-08" → "sáb 08 ago 2026". Evita `new Date(iso)` puro para no correr el día por UTC. */
function fechaLarga(iso) {
  if (!iso) return "—";
  const [a, m, d] = iso.split("-").map(Number);
  if (!a || !m || !d) return iso;
  const texto = new Date(a, m - 1, d).toLocaleDateString("es-MX", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "18:42:07" → "18:42". */
const hhmm = (h) => (typeof h === "string" && h.length >= 5 ? h.slice(0, 5) : null);

export default function HistorialAsistencias({ miembroId }) {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Al cambiar de miembro se vuelve a la primera página: mantener la anterior
  // mostraría un vacío desconcertante si el nuevo miembro tiene menos registros.
  useEffect(() => { setPage(1); }, [miembroId]);

  useEffect(() => {
    if (!miembroId) return;
    let vigente = true;

    setLoading(true);
    setError(null);
    getAsistenciasMiembro(miembroId, page, POR_PAGINA)
      .then(({ data }) => {
        if (!vigente) return;
        setItems(data.asistencias || []);
        setTotal(data.total || 0);
        setPages(data.pages || 0);
      })
      .catch(() => vigente && setError("No se pudo cargar el historial de asistencias."))
      .finally(() => vigente && setLoading(false));

    // Descarta la respuesta si el modal cambió de miembro o se cerró antes de resolver.
    return () => { vigente = false; };
  }, [miembroId, page]);

  if (!miembroId) return null;

  return (
    <div style={{ padding: "0 22px 24px" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10,
      }}>
        <span style={{
          display: "flex", alignItems: "center", gap: 7,
          fontSize: 13, fontWeight: 700, color: C.t1,
        }}>
          <FiCalendar size={15} /> Días asistidos
        </span>
        {total > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.accent,
            background: `${C.accent}18`, padding: "3px 9px", borderRadius: 99,
          }}>
            {total} {total === 1 ? "visita" : "visitas"}
          </span>
        )}
      </div>

      <div style={{
        background: C.input, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: "4px 14px",
      }}>
        {loading ? (
          <p style={{ color: C.t2, fontSize: 13, textAlign: "center", padding: "16px 0", margin: 0 }}>
            Cargando…
          </p>
        ) : error ? (
          <p style={{ color: C.danger, fontSize: 13, textAlign: "center", padding: "16px 0", margin: 0 }}>
            {error}
          </p>
        ) : items.length === 0 ? (
          <p style={{ color: C.t2, fontSize: 13, textAlign: "center", padding: "16px 0", margin: 0 }}>
            Sin asistencias registradas.
          </p>
        ) : (
          items.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "11px 0",
                borderBottom: i === items.length - 1 ? "none" : `1px solid ${C.border}`,
              }}
            >
              <span style={{ flex: 1, fontSize: 13, color: C.t1, fontWeight: 600 }}>
                {fechaLarga(a.fecha)}
              </span>
              <span style={{ display: "flex", gap: 12, fontSize: 12.5, color: C.t2 }}>
                {hhmm(a.hora_entrada) && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <FiLogIn size={13} /> {hhmm(a.hora_entrada)}
                  </span>
                )}
                {hhmm(a.hora_salida) && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <FiLogOut size={13} /> {hhmm(a.hora_salida)}
                  </span>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      {pages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 12, marginTop: 12,
        }}>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || loading}
            aria-label="Página anterior"
            style={pagerStyle(page === 1 || loading)}
          >
            <FiChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 12, color: C.t2 }}>
            Página {page} de {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, pages))}
            disabled={page === pages || loading}
            aria-label="Página siguiente"
            style={pagerStyle(page === pages || loading)}
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

const pagerStyle = (disabled) => ({
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 30, height: 30, borderRadius: 8,
  border: `1px solid ${C.border}`, background: "transparent",
  color: disabled ? C.t2 : C.t1,
  opacity: disabled ? 0.4 : 1,
  cursor: disabled ? "default" : "pointer",
});
