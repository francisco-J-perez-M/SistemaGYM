/**
 * MuscleMap2D.jsx — Mapa muscular 2D (SCRUM-101 + retro de Miguel 13/oct).
 *
 * Sustituye al modelo 3D (BodyModel/BodyViewer, @react-three/fiber + three):
 * ese modelo acumulaba tres defectos abiertos (renderizado, rendimiento y
 * pérdida de contexto WebGL al volver de segundo plano) y exigía WebGL, que
 * castiga a los dispositivos de gama baja —mayoría entre los socios del
 * gimnasio piloto—. Esta representación es un SVG plano: pesa kilobytes en
 * vez de megabytes, no depende de WebGL y se renderiza de inmediato.
 *
 * Silueta: v2 (13/oct), con una región de verdad por grupo anatómico
 * (trapecio, dorsales, pectorales, abdomen + oblicuos, deltoides, brazo
 * superior + antebrazo, glúteos, cuádriceps/isquiotibiales, pantorrillas)
 * en vez de los óvalos/rectángulos genéricos de la v1 — más cerca de las
 * referencias que compartió Miguel. Cada región usa un degradado radial
 * (claro al centro, color de intensidad en el borde) para un acabado
 * "pulido" en vez de un relleno plano.
 *
 * Color = VOLUMEN DE TRABAJO relativo (getMuscleGroupWork), igual que la
 * v1: la región se "ilumina" (se acerca al rojo) conforme más se entrena
 * ESE grupo en relación con el grupo más trabajado del periodo. Es una
 * escala relativa y continua -progreso visual inmediato-, pero no dice
 * si el volumen absoluto es mucho o poco; para eso se agregó el sistema
 * de RANGOS/medallas (bronce/plata/oro/platino) por volumen ABSOLUTO
 * acumulado, mostrado como chip debajo de la silueta, y no en el color
 * de la región (mezclar dos escalas en un solo canal visual confunde más
 * de lo que ayuda). Los umbrales de rango son un primer valor razonable,
 * no calibrado con datos reales de uso — ajustar cuando haya historial
 * suficiente de los socios del gimnasio piloto.
 *
 * Simplificación consciente que se mantiene: las regiones siguen
 * agrupadas en los mismos 6 grupos canónicos del backend (Piernas, Pecho,
 * Espalda, Hombros, Brazos, Core) — glúteos/isquiotibiales caen dentro de
 * "Piernas", oblicuos dentro de "Core". "Cardio" y "General" no tienen
 * región propia y se listan aparte.
 */
import { useState, useEffect, useCallback } from "react";
import { FiActivity, FiRefreshCw, FiAward } from "react-icons/fi";
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

/** Aclara un color "rgb(r, g, b)" mezclándolo hacia blanco (para el centro
 *  del degradado radial — look "pulido", no un relleno plano). */
function aclarar(rgbStr, factor) {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgbStr);
  if (!m) return rgbStr;
  const [r, g, b] = [+m[1], +m[2], +m[3]].map((v) => Math.round(v + (255 - v) * factor));
  return `rgb(${r}, ${g}, ${b})`;
}

// Grupos con región anatómica propia en el SVG.
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

// ───────────────────────── Rangos / medallas ───────────────────────────────
// Por VOLUMEN ABSOLUTO acumulado en el periodo (no relativo al máximo, a
// diferencia del color) — representa "cuánto has entrenado este músculo en
// total", para que tenga sentido como logro aunque entrenes todo parejo.
// Umbrales de arranque, pendientes de calibrar con datos reales de uso.
const RANGOS = [
  { id: "platino", nombre: "Platino", min: 12000, color: "#93C5FD" },
  { id: "oro",      nombre: "Oro",     min: 5000,  color: "#FBBF24" },
  { id: "plata",    nombre: "Plata",   min: 1500,  color: "#CBD5E1" },
  { id: "bronce",   nombre: "Bronce",  min: 300,   color: "#D97706" },
];
function rangoDe(volumen) {
  return RANGOS.find((r) => (volumen || 0) >= r.min) || null;
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
  rangos: { display: "flex", flexWrap: "wrap", gap: 8, padding: "0 20px 18px" },
  rangoChip: {
    display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999,
    background: "var(--bg-input)", border: "1px solid var(--border)",
  },
  rangoDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
  rangoTexto: { fontSize: 11.5, color: "var(--text-primary)", fontWeight: 600 },
  rangoSub: { fontSize: 10.5, color: "var(--text-secondary)", fontWeight: 400 },
};

// ───────────────────────── Silueta anatómica (SVG, viewBox 220x460) ───────
// Una región por grupo (no por músculo individual): cada <path> se llena
// con un degradado radial propio (claro al centro -> color de intensidad
// al borde) para un acabado con volumen, no un relleno plano.
function Silueta({ vista, intensidades, idBase }) {
  const esFrontal = vista === "frontal";
  const colorDe = (grupo) => colorPorIntensidad(intensidades[grupo] || 0);

  // Un degradado por grupo (compartido entre regiones izquierda/derecha y
  // entre vistas, porque la intensidad del grupo es la misma en ambas).
  const grad = (grupo) => {
    const base = colorDe(grupo);
    const gid = `${idBase}-${grupo}`;
    return {
      id: gid,
      url: `url(#${gid})`,
      centro: aclarar(base, 0.55),
      borde: base,
    };
  };
  const gHombros  = grad("Hombros");
  const gPecho    = grad("Pecho");
  const gCore     = grad("Core");
  const gEspalda  = grad("Espalda");
  const gBrazos   = grad("Brazos");
  const gPiernas  = grad("Piernas");

  const grises = "#475569"; // cabeza/cuello/manos/pies — decorativos, sin grupo
  const trazo  = "rgba(0,0,0,0.28)";

  return (
    <svg viewBox="0 0 220 460" width={150} height={314} role="img"
         aria-label={`Mapa muscular, vista ${vista}`}>
      <defs>
        {[gHombros, gPecho, gCore, gEspalda, gBrazos, gPiernas].map((g) => (
          <radialGradient key={g.id} id={g.id} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={g.centro} />
            <stop offset="100%" stopColor={g.borde} />
          </radialGradient>
        ))}
      </defs>

      {/* Cabeza y cuello — decorativos, sin grupo asociado */}
      <ellipse cx={110} cy={30} rx={18} ry={20} fill={grises} />
      <rect x={100} y={48} width={20} height={14} fill={grises} />

      {/* Hombros / deltoides */}
      <ellipse cx={62}  cy={78} rx={18} ry={15} fill={gHombros.url} stroke={trazo} strokeWidth={1}><title>Hombros</title></ellipse>
      <ellipse cx={158} cy={78} rx={18} ry={15} fill={gHombros.url} stroke={trazo} strokeWidth={1}><title>Hombros</title></ellipse>

      {esFrontal ? (
        <>
          {/* Pectorales */}
          <path d="M76,66 Q110,56 144,66 L148,118 Q110,128 72,118 Z"
                fill={gPecho.url} stroke={trazo} strokeWidth={1}><title>Pecho</title></path>

          {/* Oblicuos */}
          <path d="M78,124 Q72,160 80,198 L88,198 L88,124 Z"
                fill={gCore.url} stroke={trazo} strokeWidth={1}><title>Core (oblicuos)</title></path>
          <path d="M142,124 Q148,160 140,198 L132,198 L132,124 Z"
                fill={gCore.url} stroke={trazo} strokeWidth={1}><title>Core (oblicuos)</title></path>

          {/* Abdomen (con líneas decorativas de "six-pack") */}
          <path d="M88,118 L132,118 L128,208 Q110,216 92,208 Z"
                fill={gCore.url} stroke={trazo} strokeWidth={1}><title>Core (abdomen)</title></path>
          <g stroke="rgba(0,0,0,0.18)" strokeWidth={1} pointerEvents="none">
            <line x1={110} y1={120} x2={110} y2={206} />
            <line x1={93}  y1={142} x2={127} y2={142} />
            <line x1={92}  y1={168} x2={128} y2={168} />
            <line x1={92}  y1={192} x2={126} y2={192} />
          </g>
        </>
      ) : (
        <>
          {/* Trapecio */}
          <path d="M92,64 L110,56 L128,64 L138,110 Q110,130 82,110 Z"
                fill={gEspalda.url} stroke={trazo} strokeWidth={1}><title>Espalda (trapecio)</title></path>

          {/* Dorsales */}
          <path d="M78,112 Q68,150 78,195 L96,195 L92,120 Z"
                fill={gEspalda.url} stroke={trazo} strokeWidth={1}><title>Espalda (dorsales)</title></path>
          <path d="M142,112 Q152,150 142,195 L124,195 L128,120 Z"
                fill={gEspalda.url} stroke={trazo} strokeWidth={1}><title>Espalda (dorsales)</title></path>

          {/* Lumbar */}
          <path d="M98,195 L122,195 L120,215 L100,215 Z"
                fill={gEspalda.url} stroke={trazo} strokeWidth={1}><title>Espalda (lumbar)</title></path>

          {/* Glúteos */}
          <path d="M84,215 Q78,245 92,252 L108,250 L106,215 Z"
                fill={gPiernas.url} stroke={trazo} strokeWidth={1}><title>Piernas (glúteos)</title></path>
          <path d="M136,215 Q142,245 128,252 L112,250 L114,215 Z"
                fill={gPiernas.url} stroke={trazo} strokeWidth={1}><title>Piernas (glúteos)</title></path>
        </>
      )}

      {/* Brazo superior (bíceps/tríceps) */}
      <path d="M54,82 Q44,110 48,145 L66,145 Q70,110 64,82 Z"
            fill={gBrazos.url} stroke={trazo} strokeWidth={1}><title>Brazos</title></path>
      <path d="M166,82 Q176,110 172,145 L154,145 Q150,110 156,82 Z"
            fill={gBrazos.url} stroke={trazo} strokeWidth={1}><title>Brazos</title></path>

      {/* Antebrazo */}
      <path d="M48,145 Q42,175 46,205 L62,205 Q66,175 64,145 Z"
            fill={gBrazos.url} stroke={trazo} strokeWidth={1}><title>Brazos (antebrazo)</title></path>
      <path d="M172,145 Q178,175 174,205 L158,205 Q154,175 156,145 Z"
            fill={gBrazos.url} stroke={trazo} strokeWidth={1}><title>Brazos (antebrazo)</title></path>

      {/* Manos — decorativas */}
      <ellipse cx={52}  cy={215} rx={9} ry={12} fill={grises} />
      <ellipse cx={168} cy={215} rx={9} ry={12} fill={grises} />

      {/* Muslos (cuádriceps de frente / isquiotibiales de espalda — mismo
          grupo canónico "Piernas", se dibujan igual en ambas vistas) */}
      <path d="M86,210 L108,212 L104,330 L82,328 Z"
            fill={gPiernas.url} stroke={trazo} strokeWidth={1}>
        <title>{esFrontal ? "Piernas (cuádriceps)" : "Piernas (isquiotibiales)"}</title>
      </path>
      <path d="M134,210 L112,212 L116,330 L138,328 Z"
            fill={gPiernas.url} stroke={trazo} strokeWidth={1}>
        <title>{esFrontal ? "Piernas (cuádriceps)" : "Piernas (isquiotibiales)"}</title>
      </path>

      {/* Pantorrillas */}
      <path d="M84,330 L104,330 L100,418 L86,418 Z"
            fill={gPiernas.url} stroke={trazo} strokeWidth={1}><title>Piernas (pantorrillas)</title></path>
      <path d="M136,330 L116,330 L120,418 L134,418 Z"
            fill={gPiernas.url} stroke={trazo} strokeWidth={1}><title>Piernas (pantorrillas)</title></path>

      {/* Pies — decorativos */}
      <ellipse cx={93}  cy={428} rx={14} ry={8} fill={grises} />
      <ellipse cx={127} cy={428} rx={14} ry={8} fill={grises} />
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
  const volumenPorGrupo = Object.fromEntries(grupos.map((g) => [g.grupo, g.volumen || 0]));
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
              <Silueta vista="frontal" intensidades={intensidades} idBase="mm2d-web-f" />
            </div>
            <div style={S.svgCol}>
              <span style={S.vistaLabel}>Posterior</span>
              <Silueta vista="posterior" intensidades={intensidades} idBase="mm2d-web-b" />
            </div>
          </div>

          <div style={S.leyenda}>
            <div style={S.leyendaBarra} />
            <span style={S.leyendaTexto}>Menos trabajado → Más trabajado (relativo a tu grupo más trabajado)</span>
          </div>

          {/* Rangos/medallas por grupo: logro por volumen ABSOLUTO acumulado,
              independiente de cómo se vea el color (que es relativo). */}
          <div style={S.rangos}>
            {GRUPOS_CON_REGION.map((grupo) => {
              const vol = volumenPorGrupo[grupo] || 0;
              const rango = rangoDe(vol);
              return (
                <div key={grupo} style={S.rangoChip} title={`${grupo}: ${vol} kg acumulados`}>
                  {/* El punto usa el color de intensidad del mapa (escala relativa,
                      "qué tan iluminado" se ve ese grupo ahora mismo); el ícono de
                      medalla usa el color de rango (escala absoluta, logro
                      acumulado) — son dos cosas distintas a propósito. */}
                  <span style={{ ...S.rangoDot, background: colorPorIntensidad(intensidades[grupo] || 0) }} />
                  <FiAward size={12} color={rango ? rango.color : "var(--text-secondary)"} />
                  <span style={S.rangoTexto}>
                    {grupo} <span style={S.rangoSub}>· {rango ? rango.nombre : "Sin rango"}</span>
                  </span>
                </div>
              );
            })}
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
