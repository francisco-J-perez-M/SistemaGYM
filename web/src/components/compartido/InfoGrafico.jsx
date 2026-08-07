/**
 * InfoGrafico — cabecera de gráfico con título y un botón que explica qué se
 * está viendo.
 *
 * Un gráfico con dos líneas de colores no dice por sí solo qué representa cada
 * una, de dónde salen los datos ni cómo leer el eje. En lugar de llenar la
 * tarjeta de texto —que estorbaría a quien ya lo sabe— la explicación vive tras
 * un botón: quien la necesita la abre, quien no, ve el gráfico limpio.
 *
 * Uso:
 *
 *   <InfoGrafico
 *     titulo="Ingresos últimos 6 meses"
 *     subtitulo="Comparativa entre membresías y punto de venta"
 *     series={[
 *       { color: "#6366f1", nombre: "Membresías", descripcion: "Cobros de planes." },
 *       { color: "#f59e0b", nombre: "POS",        descripcion: "Ventas de productos." },
 *     ]}
 *     notas={["Las cifras incluyen IVA."]}
 *   />
 *   <ResponsiveContainer>…</ResponsiveContainer>
 *
 * El desplegable se cierra al pulsar fuera o con Escape, como cualquier menú:
 * dejarlo abierto tapando el gráfico sería peor que no tenerlo.
 */
import { useState, useRef, useEffect } from "react";
import { FiHelpCircle, FiX } from "react-icons/fi";

export default function InfoGrafico({
  titulo,
  subtitulo,
  series = [],
  notas = [],
  children,
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);

  useEffect(() => {
    if (!abierto) return;

    const fuera = (e) => {
      if (caja.current && !caja.current.contains(e.target)) setAbierto(false);
    };
    const escape = (e) => { if (e.key === "Escape") setAbierto(false); };

    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  return (
    <div style={{ position: "relative", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: 15, fontWeight: 700, margin: 0,
            color: "var(--text-primary)",
          }}>
            {titulo}
          </h3>
          {subtitulo && (
            <p style={{
              fontSize: 12, color: "var(--text-secondary)", margin: "3px 0 0",
              lineHeight: 1.45,
            }}>
              {subtitulo}
            </p>
          )}
        </div>

        {(series.length > 0 || notas.length > 0 || children) && (
          <button
            onClick={() => setAbierto((v) => !v)}
            aria-label={`Qué significa: ${titulo}`}
            aria-expanded={abierto}
            title="Qué significa este gráfico"
            style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
              background: abierto ? "var(--accent)" : "transparent",
              color: abierto ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${abierto ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 8, padding: "5px 10px", cursor: "pointer",
              fontSize: 12, fontWeight: 600, transition: "all .15s",
            }}
          >
            <FiHelpCircle size={14} />
            Cómo leerlo
          </button>
        )}
      </div>

      {abierto && (
        <div
          ref={caja}
          role="dialog"
          aria-label={`Explicación de ${titulo}`}
          style={{
            position: "absolute", top: "100%", right: 0, zIndex: 40,
            marginTop: 8, width: "min(340px, calc(100vw - 60px))",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12, padding: "14px 16px",
            boxShadow: "0 16px 40px rgba(0,0,0,.35)",
          }}
        >
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: series.length ? 10 : 6,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: ".05em",
              textTransform: "uppercase", color: "var(--text-secondary)",
            }}>
              Cómo leer este gráfico
            </span>
            <button
              onClick={() => setAbierto(false)}
              aria-label="Cerrar explicación"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-secondary)", padding: 2, display: "flex",
              }}
            >
              <FiX size={15} />
            </button>
          </div>

          {series.length > 0 && (
            <div style={{ display: "grid", gap: 9 }}>
              {series.map((s) => (
                <div key={s.nombre} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  {/* La muestra de color es lo que une la explicación con el
                      trazo del gráfico: sin ella habría que adivinar. */}
                  <span style={{
                    width: 12, height: 12, borderRadius: s.forma === "linea" ? 2 : 3,
                    background: s.color, flexShrink: 0, marginTop: 3,
                    border: s.color === "transparent" ? "1px dashed var(--text-secondary)" : "none",
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>
                      {s.nombre}
                    </div>
                    {s.descripcion && (
                      <div style={{
                        fontSize: 11.5, color: "var(--text-secondary)",
                        lineHeight: 1.5, marginTop: 1,
                      }}>
                        {s.descripcion}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {notas.length > 0 && (
            <div style={{
              marginTop: series.length ? 12 : 0,
              paddingTop: series.length ? 10 : 0,
              borderTop: series.length ? "1px solid var(--border)" : "none",
              display: "grid", gap: 6,
            }}>
              {notas.map((n, i) => (
                <p key={i} style={{
                  margin: 0, fontSize: 11.5, color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}>
                  {n}
                </p>
              ))}
            </div>
          )}

          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Paleta única para las series de los gráficos.
 *
 * Cada tono tiene un significado fijo en todo el sistema: el dinero siempre se
 * ve igual, lo predicho siempre se ve igual. Repartir colores al azar por
 * gráfico obliga a releer la leyenda en cada pantalla.
 */
export const COLORES_GRAFICO = {
  ingresos:    "#6366f1",   // dinero cobrado
  pos:         "#f59e0b",   // punto de venta
  membresias:  "#8b5cf6",   // planes
  asistencia:  "#0ea5e9",   // visitas al gimnasio
  real:        "#22c55e",   // dato medido
  prediccion:  "#a855f7",   // dato proyectado por el modelo
  alta:        "#22c55e",   // valor favorable
  baja:        "#ef4444",   // valor desfavorable
  neutro:      "#94a3b8",   // referencia o comparación
};
