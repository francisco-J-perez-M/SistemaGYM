/**
 * MuscleMap2D.jsx — Mapa muscular 2D (SCRUM-101).
 *
 * Sustituye al modelo 3D (BodyModel/BodyViewer, @react-three/fiber + three):
 * ese modelo acumulaba tres defectos abiertos (renderizado, rendimiento y
 * pérdida de contexto WebGL al volver de segundo plano) y exigía WebGL, que
 * castiga a los dispositivos de gama baja —mayoría entre los socios del
 * gimnasio piloto—. Esta representación es un SVG plano: pesa kilobytes en
 * vez de megabytes, no depende de WebGL y se renderiza de inmediato.
 *
 * A diferencia del modelo anterior (que deformaba una malla 3D según peso /
 * % grasa / % músculo), este mapa colorea cada región según el VOLUMEN DE
 * TRABAJO registrado en la bitácora para ese grupo muscular
 * (getMuscleGroupWork), que es justo lo que pide la tarjeta: "la región
 * cambia de color según el volumen de trabajo registrado en ese grupo".
 *
 * Simplificación consciente: las regiones son formas geométricas simples
 * (óvalos/rectángulos redondeados) agrupadas por los mismos grupos
 * canónicos que ya usa el backend (Piernas, Pecho, Espalda, Hombros,
 * Brazos, Core) — no una ilustración anatómica. "Cardio" y "General" no
 * tienen una región corporal propia y se listan aparte para no perder ese
 * dato.
 */
import { useState, useEffect, useCallback } from "react";
import { FiActivity, FiRefreshCw } from "react-icons/fi";
import { getMuscleGroupWork } from "../../api/workouts";

// ───────────────────────── Escala de color por intensidad ─────────────────
// 0 = sin trabajo registrado (color base/neutro) → 1 = el grupo más
// trabajado del periodo (color cálido). Interpolación lineal en dos tramos
// para que el punto medio sea un color intermedio reconocible (ámbar).
const STOP_BASE  = [51, 65, 85];     // #334155 slate-700 (sin datos / bajo)
const STOP_MID   = [245, 158, 11];   // #F59E0B amber-500 (trabajo moderado)
const STOP_HOT   = [220, 38, 38];    // #DC2626 red-600   (trabajo intenso)

function mezclar(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

export function colorPorIntensidad(t) {
  const x = Math.max(0, Math.min(1, t || 0));
  const [r, g, b] = x <= 0.5 ? mezclar(STOP_BASE, STOP_MID, x / 0.5)
                              : mezclar(STOP_MID, STOP_HOT, (x - 0.5) / 0.5);
  return `rgb(${r}, ${g}, ${b})`;
}

// Grupos con región anatómica propia en el SVG (ver GRUPOS_SVG más abajo).
const GRUPOS_CON_REGION = ["Piernas", "Pecho", "Espalda", "Hombros", "Brazos", "Core"];

/** Normaliza la respuesta de getMuscleGroupWork a { grupo: intensidad 0..1 }. */
function calcularIntensidades(grupos) {
  const porGrupo = {};
  let max = 0;
  for (const g of grupos || []) {
    porGrupo[g.grupo] = g.volumen || 0;
    if (g.volumen > max) max = g.volumen;
  }
  const intensidades = {};
  for (const grupo of GRUPOS_CON_REGION) {
    const vol = porGrupo[grupo] || 0;
    intensidades[grupo] = max > 0 ? vol / max : 0;
  }
  return intensidades;
}

const S = {
  card: { display: "flex", flexDirection: "column" },
  svgRow: { display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap", padding: "10px 10px 4px" },
  svgCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  vistaLabel: { fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: .4 },
  leyenda: { display: "flex", alignItems: "center", gap: 10, padding: "4px 20px 16px", flexWrap: "wrap" },
  leyendaBarra: { width: 120, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${colorPorIntensidad(0)}, ${colorPorIntensidad(0.5)}, ${colorPorIntensidad(1)})` },
  leyendaTexto: { fontSize: 11, color: "var(--text-secondary)" },
  otros: { fontSize: 12, color: "var(--text-secondary)", padding: "0 20px 16px" },
  vacioCaja: { display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 10px", color: "var(--text-secondary)", gap: 6 },
  vacio: { fontSize: 13, lineHeight: 1.55, margin: 0, textAlign: "center" },
};

/** Una región del mapa: óvalo/rect redondeado relleno con el color de intensidad. */
function Region({ x, y, w, h, rx, color, titulo }) {
  return <rect x={x} y={y} width={w} height={h} rx={rx} fill={color}>
    <title>{titulo}</title>
  </rect>;
}

function Silueta({ vista, intensidades }) {
  const c = (grupo) => colorPorIntensidad(intensidades[grupo] || 0);
  const esFrontal = vista === "frontal";
  return (
    <svg viewBox="0 0 200 400" width={150} height={300} role="img"
         aria-label={`Mapa muscular, vista ${vista}`}>
      {/* Cabeza y cuello — decorativos, sin grupo asociado */}
      <circle cx={100} cy={28} r={20} fill="#475569" />
      <rect x={90} y={44} width={20} height={16} fill="#475569" />

      {/* Hombros */}
      <ellipse cx={58}  cy={76} rx={22} ry={16} fill={c("Hombros")}><title>Hombros</title></ellipse>
      <ellipse cx={142} cy={76} rx={22} ry={16} fill={c("Hombros")}><title>Hombros</title></ellipse>

      {/* Torso: pecho (frontal) o espalda (posterior) */}
      {esFrontal ? (
        <Region x={64} y={82} w={72} h={58} rx={16} color={c("Pecho")} titulo="Pecho" />
      ) : (
        <Region x={64} y={82} w={72} h={120} rx={16} color={c("Espalda")} titulo="Espalda" />
      )}

      {/* Core / abdomen — solo visible desde el frente */}
      {esFrontal && <Region x={72} y={142} w={56} h={56} rx={12} color={c("Core")} titulo="Core" />}

      {/* Brazos */}
      <Region x={26}  y={80} w={24} h={122} rx={12} color={c("Brazos")} titulo="Brazos" />
      <Region x={150} y={80} w={24} h={122} rx={12} color={c("Brazos")} titulo="Brazos" />

      {/* Piernas */}
      <Region x={66}  y={202} w={30} h={150} rx={15} color={c("Piernas")} titulo="Piernas" />
      <Region x={104} y={202} w={30} h={150} rx={15} color={c("Piernas")} titulo="Piernas" />
    </svg>
  );
}

export default function MuscleMap2D() {
  const [grupos, setGrupos]   = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    setCargando(true);
    getMuscleGroupWork({ dias: 90 })
      .then((r) => setGrupos(r.data?.grupos || []))
      .catch(() => setGrupos([]))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const hayTrabajo = grupos.some((g) => (g.volumen || 0) > 0);
  const intensidades = calcularIntensidades(grupos);
  const otros = grupos.filter((g) => !GRUPOS_CON_REGION.includes(g.grupo) && (g.volumen || 0) > 0);

  return (
    <div style={S.card}>
      <div className="chart-header">
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FiActivity /> Mapa muscular (últimos 90 días)
        </h3>
        <button
          onClick={cargar}
          title="Actualizar"
          style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 8px", color: "var(--text-secondary)", cursor: "pointer" }}
        >
          <FiRefreshCw size={13} />
        </button>
      </div>

      {cargando ? (
        <p style={{ ...S.vacio, padding: 20 }}>Cargando tu mapa muscular…</p>
      ) : !hayTrabajo ? (
        <div style={S.vacioCaja}>
          <FiActivity size={30} style={{ opacity: .3 }} />
          <p style={S.vacio}>
            Aún no hay entrenamientos registrados. El mapa se muestra en su color
            base: registra tu primer entrenamiento en la bitácora para empezar a
            verlo tomar color.
          </p>
        </div>
      ) : (
        <>
          <div style={S.svgRow}>
            <div style={S.svgCol}>
              <span style={S.vistaLabel}>Frontal</span>
              <Silueta vista="frontal" intensidades={intensidades} />
            </div>
            <div style={S.svgCol}>
              <span style={S.vistaLabel}>Posterior</span>
              <Silueta vista="posterior" intensidades={intensidades} />
            </div>
          </div>
          <div style={S.leyenda}>
            <div style={S.leyendaBarra} />
            <span style={S.leyendaTexto}>Menos trabajado → Más trabajado (relativo a tu grupo más trabajado)</span>
          </div>
          {otros.length > 0 && (
            <div style={S.otros}>
              Sin región en el mapa: {otros.map((g) => `${g.grupo} (${g.volumen} kg)`).join(" · ")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
