/**
 * MuscleMap2D.jsx — Mapa muscular 2D (SCRUM-101 + retro de Miguel 13/oct).
 *
 * Silueta: v3 (13/oct) — reemplaza el SVG hecho a mano (óvalos/paths
 * genéricos por grupo) por `Body`, una silueta anatómica real de 23
 * músculos con contorno vectorial real, incorporada al código fuente del
 * proyecto en `./body-anatomy` (adaptación de la librería de código
 * abierto react-muscle-highlighter — ver NOTICE.md en esa carpeta). No es
 * una dependencia externa: el código vive dentro de GymPro, sin paquete
 * npm adicional que instalar ni mantener por fuera.
 *
 * Simplificada a modelo masculino: el perfil del socio no registra género
 * todavía (ver NOTICE.md si se agrega ese dato más adelante y se quiere
 * vendorizar también el modelo femenino).
 *
 * Color = VOLUMEN DE TRABAJO relativo (getMuscleGroupWork), igual que en
 * v1/v2: cada músculo se "ilumina" (se acerca al rojo) conforme más se
 * entrena su grupo canónico en relación con el grupo más trabajado del
 * periodo. El sistema de RANGOS/medallas (bronce/plata/oro/platino) por
 * volumen ABSOLUTO acumulado sigue siendo un canal visual separado (chip
 * debajo de la silueta), por la misma razón de siempre: mezclar dos
 * escalas en un solo color confunde más de lo que ayuda.
 *
 * Los 23 músculos de `Body` se reducen a los mismos 6 grupos canónicos del
 * backend (Piernas, Pecho, Espalda, Hombros, Brazos, Core) vía
 * GROUP_SLUG_MAP; los músculos sin grupo mapeado (cuello, manos, pies,
 * tobillos, rodillas, cabeza, cabello) se quedan con su color base gris de
 * la silueta — "Cardio" y "General" tampoco tienen región propia y se
 * listan aparte, como antes.
 */
import { useState, useEffect, useCallback } from "react";
import { FiActivity, FiRefreshCw, FiAward } from "react-icons/fi";
import { getMuscleGroupWork } from "../../api/workouts";
import Body from "./body-anatomy/Body";

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

// Grupos canónicos con región propia (ya no hay "sin región en el mapa"
// dentro de estos 6 — cada uno mapea a 1+ slugs anatómicos de `Body`).
const GRUPOS_CON_REGION = ["Piernas", "Pecho", "Espalda", "Hombros", "Brazos", "Core"];

// Mapa de los 6 grupos canónicos del backend a los slugs anatómicos de
// `Body` (23 músculos). Slugs no listados aquí (cabeza, cabello, cuello,
// manos, pies, tobillos, rodillas) quedan con su color base de la silueta.
const GROUP_SLUG_MAP = {
  Piernas: ["quadriceps", "hamstring", "calves", "gluteal", "adductors", "tibialis"],
  Pecho: ["chest"],
  Espalda: ["trapezius", "upper-back", "lower-back"],
  Hombros: ["deltoids"],
  Brazos: ["biceps", "triceps", "forearm"],
  Core: ["abs", "obliques"],
};

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

/** Construye el `data` de `Body`: un color por slug anatómico mapeado,
 *  tomado de la intensidad de su grupo canónico. Los slugs sin grupo no se
 *  incluyen — `Body` los deja con su color base propio. */
function construirDataSilueta(intensidades) {
  const data = [];
  for (const [grupo, slugs] of Object.entries(GROUP_SLUG_MAP)) {
    const color = colorPorIntensidad(intensidades[grupo] || 0);
    for (const slug of slugs) data.push({ slug, color });
  }
  return data;
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
  const dataSilueta = construirDataSilueta(intensidades);

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
              <Body side="front" scale={0.75} data={dataSilueta} defaultFill="#475569" border="rgba(0,0,0,0.28)" />
            </div>
            <div style={S.svgCol}>
              <span style={S.vistaLabel}>Posterior</span>
              <Body side="back" scale={0.75} data={dataSilueta} defaultFill="#475569" border="rgba(0,0,0,0.28)" />
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
