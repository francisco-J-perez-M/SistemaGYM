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
  /** Periodo que abarcan los datos. Se muestra junto al título. */
  periodo,
  /** Resultado de describirTendencia(): qué hace la serie y cuánto. */
  comportamiento,
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
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{
              fontSize: 15, fontWeight: 700, margin: 0,
              color: "var(--text-primary)",
            }}>
              {titulo}
            </h3>
            {/* El periodo va en una etiqueta junto al título: así se sabe qué
                rango se está viendo sin bajar la vista al eje, que es lo que
                pasaba con títulos genéricos como "últimos 6 meses". */}
            {periodo && (
              <span style={{
                fontSize: 10.5, fontWeight: 700, letterSpacing: ".02em",
                padding: "2px 8px", borderRadius: 20,
                background: "var(--bg-input)", color: "var(--text-secondary)",
                border: "1px solid var(--border)", whiteSpace: "nowrap",
              }}>
                {periodo}
              </span>
            )}
          </div>

          {subtitulo && (
            <p style={{
              fontSize: 12, color: "var(--text-secondary)", margin: "3px 0 0",
              lineHeight: 1.45,
            }}>
              {subtitulo}
            </p>
          )}

          {/* Qué hace la serie. Sin esto cada quien estima la pendiente a ojo,
              con el riesgo de leerla al revés si el eje no arranca en cero. */}
          {comportamiento?.texto && (
            <p style={{
              fontSize: 12, margin: "5px 0 0", lineHeight: 1.45,
              color: comportamiento.color || "var(--text-secondary)",
              fontWeight: 600,
            }}>
              {comportamiento.texto}
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
 *
 * Los tonos son de intensidad media-alta a propósito. El sistema tiene tema
 * claro y oscuro, y un color pálido que se lee bien sobre fondo oscuro
 * desaparece sobre blanco: los amarillos claros que había antes eran
 * prácticamente invisibles en el tema claro.
 *
 * También están elegidos para distinguirse entre sí con daltonismo rojo-verde,
 * que es el más común: no hay dos series que se diferencien solo por ser una
 * roja y otra verde.
 */
export const COLORES_GRAFICO = {
  ingresos:    "#4F46E5",   // indigo — dinero cobrado
  pos:         "#EA7317",   // naranja — punto de venta
  membresias:  "#7C3AED",   // violeta — planes
  asistencia:  "#0891B2",   // cian — visitas al gimnasio
  real:        "#059669",   // verde — dato medido
  prediccion:  "#C026D3",   // fucsia — dato proyectado por el modelo
  alta:        "#059669",   // valor favorable
  baja:        "#DC2626",   // valor desfavorable
  neutro:      "#64748B",   // referencia o comparación
};

/**
 * Secuencia para gráficos con un número variable de categorías, como el pastel
 * de métodos de pago. El orden importa: dos colores consecutivos nunca son
 * parecidos, para que dos porciones contiguas se distingan.
 */
export const SERIES_GRAFICO = [
  "#4F46E5",   // indigo
  "#EA7317",   // naranja
  "#0891B2",   // cian
  "#DB2777",   // rosa
  "#059669",   // verde
  "#CA8A04",   // ámbar oscuro
  "#7C3AED",   // violeta
  "#DC2626",   // rojo
];

/**
 * Rejilla y elementos atenuados.
 *
 * La cuadrícula usaba `var(--border)`, que en el tema claro queda casi blanca y
 * no da referencia para leer las alturas. Este gris intermedio se ve en ambos
 * temas sin competir con los datos.
 */
export const COLOR_REJILLA = "rgba(148,163,184,0.35)";

/**
 * Relleno de las barras que NO están destacadas.
 *
 * Antes era un amarillo al 20 % de opacidad, invisible sobre fondo claro: en la
 * gráfica de asistencia por día solo se distinguía la barra del día con más
 * visitas y el resto parecía vacío.
 */
export const COLOR_ATENUADO = "rgba(100,116,139,0.35)";

/**
 * Props para rotular un eje en recharts.
 *
 * Un eje sin rótulo obliga a deducir qué mide: "8k" puede ser pesos, visitas o
 * miembros. Se centraliza aquí para que todos los gráficos lo pongan igual.
 *
 *   <XAxis dataKey="mes" label={ejeX("Mes")} />
 *   <YAxis label={ejeY("Pesos (MXN)")} />
 */
export const ejeX = (titulo) => ({
  value: titulo,
  position: "insideBottom",
  offset: -4,
  fill: "var(--text-secondary)",
  fontSize: 11,
  fontWeight: 600,
});

export const ejeY = (titulo) => ({
  value: titulo,
  angle: -90,
  position: "insideLeft",
  style: { textAnchor: "middle" },
  fill: "var(--text-secondary)",
  fontSize: 11,
  fontWeight: 600,
});

/**
 * Importe con separador de miles, sin decimales.
 *
 *   dinero(7298.4) → "$7,298"
 */
export const dinero = (v) => {
  const n = Math.round(Number(v) || 0);
  // El signo va delante del símbolo: "-$200", no "$-200".
  return `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("es-MX")}`;
};

/**
 * Índices del valor más alto y del más bajo de una serie.
 *
 * Los ceros se descartan por defecto: en una serie de ingresos, un mes sin
 * cobros es ausencia de dato, no el mínimo del periodo, y etiquetarlo con "$0"
 * ocuparía sitio sin informar de nada.
 */
export function extremosDeSerie(valores, omitirCeros = true) {
  const puntos = (valores || [])
    .map((v, i) => ({ v: typeof v === "number" ? v : Number(v), i }))
    .filter(({ v }) => Number.isFinite(v) && (!omitirCeros || v !== 0));

  if (puntos.length === 0) return new Map();

  let alto = puntos[0];
  let bajo = puntos[0];
  for (const p of puntos) {
    if (p.v > alto.v) alto = p;
    if (p.v < bajo.v) bajo = p;
  }

  const marcas = new Map([[alto.i, "max"]]);
  // Con un solo punto, o con toda la serie plana, el mínimo es el máximo:
  // rotularlo dos veces superpondría las dos etiquetas.
  if (bajo.i !== alto.i && bajo.v !== alto.v) marcas.set(bajo.i, "min");
  return marcas;
}

/**
 * Etiqueta el pico y el valle de una serie con su importe exacto.
 *
 * El eje vertical va en miles ("$8k") porque rotular cada marca con el importe
 * completo lo haría ilegible; el coste es que la cifra concreta del pico —que
 * es justo la que se busca— queda por deducir. Esto la escribe donde está.
 *
 * Solo los dos extremos: rotular los seis o doce puntos de la serie amontona
 * las etiquetas y estorba más de lo que aclara.
 *
 * Se pasa como contenido de LabelList, que lo clona una vez por punto:
 *
 *   <Line dataKey="pagos" ...>
 *     <LabelList content={<ImporteExtremos valores={datos.map(d => d.pagos)} />} />
 *   </Line>
 */
export function ImporteExtremos({
  valores,
  formato = dinero,
  omitirCeros = true,
  index,
  viewBox,
  ...resto
}) {
  const marcas = extremosDeSerie(valores, omitirCeros);
  const tipo = marcas.get(index);
  if (!tipo) return null;

  // recharts entrega la posición como props sueltas y también dentro de
  // `viewBox`. Se leen ambas por si cambia en una versión posterior.
  const x = Number.isFinite(resto.x) ? resto.x : viewBox?.x;
  const y = Number.isFinite(resto.y) ? resto.y : viewBox?.y;
  const width = Number.isFinite(resto.width) ? resto.width : viewBox?.width;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  // En una barra, `width` es su ancho y `y` el borde superior, así que ambas
  // etiquetas van encima. En una línea, `width` es cero y (x, y) es el propio
  // vértice: el máximo se rotula arriba y el mínimo abajo, para no chocar con
  // la curva.
  const esBarra = Number.isFinite(width) && width > 0;
  const cx = esBarra ? x + width / 2 : x;
  const cy = esBarra
    ? y - 6
    : tipo === "max"
      ? y - 11
      : y + 19;

  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      fontSize={11}
      fontWeight={700}
      fill="var(--text-primary)"
      /* Contorno del color del fondo: la etiqueta cae sobre la rejilla y sobre
         la propia línea, y sin él se lee a medias. */
      stroke="var(--bg-card)"
      strokeWidth={3.5}
      strokeLinejoin="round"
      style={{ paintOrder: "stroke" }}
    >
      {formato(valores?.[index])}
    </text>
  );
}

/**
 * Rango que abarcan los datos, en texto.
 *
 * Un título como "Ingresos últimos 6 meses" no dice CUÁLES seis meses, y el
 * lector tiene que bajar la vista al eje para averiguarlo. Peor aún si el
 * gráfico se comparte en una captura, donde el eje puede quedar fuera.
 *
 * Se calcula del propio dato en lugar de escribirlo a mano, para que no quede
 * desfasado cuando cambie el periodo consultado.
 *
 *   rangoPeriodo(ingresos)                 → "Mar 2026 a Ago 2026"
 *   rangoPeriodo(ventas, "mes")            → "2026-05 a 2026-07"
 */
export function rangoPeriodo(items, campo = "label") {
  const etiquetas = (items || [])
    .map((d) => d?.[campo])
    .filter((v) => v != null && String(v).trim() !== "");

  if (etiquetas.length === 0) return "";
  if (etiquetas.length === 1) return String(etiquetas[0]);
  return `${etiquetas[0]} a ${etiquetas[etiquetas.length - 1]}`;
}

/**
 * Cómo se comporta la serie: si sube, baja o se mantiene, y cuánto.
 *
 * Compara el primer y el último valor. Es la lectura que casi siempre se busca
 * en una serie temporal y que, sin decirla, cada quien estima a ojo mirando la
 * pendiente —con el riesgo de leerla al revés cuando el eje no arranca en cero.
 *
 * Devuelve null cuando no hay base de comparación: inventar un porcentaje sobre
 * un punto de partida en cero daría un "+∞ %" que no significa nada.
 */
export function describirTendencia(valores, { unidad = "", esDinero = false } = {}) {
  const nums = (valores || [])
    .map((v) => (typeof v === "number" ? v : Number(v)))
    .filter((v) => Number.isFinite(v));

  if (nums.length < 2) return null;

  const inicio = nums[0];
  const fin    = nums[nums.length - 1];
  const delta  = fin - inicio;

  const fmt = (v) =>
    esDinero
      ? `$${Math.round(v).toLocaleString("es-MX")}`
      : `${Math.round(v).toLocaleString("es-MX")}${unidad}`;

  if (inicio <= 0) {
    return {
      direccion: delta > 0 ? "sube" : delta < 0 ? "baja" : "estable",
      texto: `Cerró en ${fmt(fin)}. Sin base de comparación al inicio del periodo.`,
      color: "var(--text-secondary)",
    };
  }

  const pct = (delta / inicio) * 100;
  // Bajo el 2 % es ruido, no una tendencia: llamarlo subida o bajada sería
  // darle un significado que no tiene.
  if (Math.abs(pct) < 2) {
    return {
      direccion: "estable",
      texto: `Se mantiene estable: ${fmt(inicio)} al inicio y ${fmt(fin)} al final.`,
      color: "var(--text-secondary)",
    };
  }

  const sube = pct > 0;
  return {
    direccion: sube ? "sube" : "baja",
    texto: `${sube ? "Al alza" : "A la baja"}: de ${fmt(inicio)} a ${fmt(fin)} `
         + `(${sube ? "+" : ""}${pct.toFixed(1)} % en el periodo).`,
    color: sube ? COLORES_GRAFICO.alta : COLORES_GRAFICO.baja,
  };
}
