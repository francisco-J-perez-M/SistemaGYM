/**
 * SelectorFecha.jsx — calendario propio para elegir un día o una semana.
 *
 * Reemplaza al <input type="date"> nativo en Pagos y Reportes: el picker del
 * navegador no se puede re-estilar por CSS (siempre sale con fondo blanco,
 * sin importar el tema elegido en GymPro), así que la única forma de que el
 * calendario respete el tema del sistema es dibujarlo nosotros mismos, con
 * las mismas variables CSS (--bg-card, --accent, etc.) que ya usa el resto
 * de la app -- por eso funciona igual en los 7+ temas sin tocarlo de nuevo.
 *
 * modo="dia"    -> clic en un día lo selecciona (un solo día resaltado).
 * modo="semana" -> la semana completa (lunes a domingo) a la que pertenece
 *                  el día bajo el mouse o el clic se resalta entera, nunca
 *                  un día suelto -- así se elige explícitamente "la semana",
 *                  no un día que por detrás se traduce en una semana.
 *
 * Sin dependencias nuevas: los íconos son SVG inline (el proyecto ya tiene
 * un subpaquete de react-icons/fi incompleto en este equipo -- ver bitácora
 * 2026-10-21 -- así que este componente no agrega otro punto de falla).
 */
import { useEffect, useRef, useState } from "react";

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const CalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const ChevL = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const ChevR = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const pad2 = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseISO = (iso) => {
  const [y, m, d] = (iso || "").split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : new Date();
};
// Lunes de la semana que contiene `d` -- misma convención (lunes = inicio de
// semana) que rangoSemana() en OwnerReportes.jsx y PagosDashboard.jsx.
const lunesDe = (d) => {
  const dow = (d.getDay() + 6) % 7;
  const l = new Date(d);
  l.setDate(d.getDate() - dow);
  return l;
};

const C = {
  card:   "var(--bg-card)",
  input:  "var(--bg-input, var(--bg-main))",
  border: "var(--border)",
  t1:     "var(--text-primary, #f1f5f9)",
  t2:     "var(--text-secondary, #94a3b8)",
  accent: "var(--accent, #6366f1)",
  accentDim: "var(--accent-dim, rgba(99,102,241,.18))",
};

const navBtnStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 24, height: 24, borderRadius: 7, border: "none",
  background: "transparent", color: C.t1, cursor: "pointer",
};

export default function SelectorFecha({
  value, onChange, max, modo = "dia", label, align = "left", style,
}) {
  const [abierto, setAbierto]   = useState(false);
  const [vista, setVista]       = useState(() => parseISO(value || max));
  const [hoverISO, setHoverISO] = useState(null);
  const ref = useRef(null);

  // Al abrir, el mes visible siempre arranca en el de la fecha ya elegida
  // (o en el del tope `max` si todavía no hay ninguna) -- nunca se queda
  // "atorado" en el mes que se dejó al cerrar la última vez.
  useEffect(() => {
    if (abierto) setVista(parseISO(value || max));
  }, [abierto]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    const esc   = (e) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  const maxDate = max ? parseISO(max) : null;
  const seleccionado = value ? parseISO(value) : null;
  const semanaSelISO   = modo === "semana" && seleccionado ? toISO(lunesDe(seleccionado)) : null;
  const semanaHoverISO = modo === "semana" && hoverISO ? toISO(lunesDe(parseISO(hoverISO))) : null;

  const anio = vista.getFullYear();
  const mes  = vista.getMonth();
  const primerDia = new Date(anio, mes, 1);
  const offset = (primerDia.getDay() + 6) % 7; // lunes = 0 ... domingo = 6
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < offset; i++) {
    celdas.push({ d: new Date(anio, mes, 1 - (offset - i)), fuera: true });
  }
  for (let dia = 1; dia <= diasEnMes; dia++) {
    celdas.push({ d: new Date(anio, mes, dia), fuera: false });
  }
  while (celdas.length < 42) {
    const ultimo = celdas[celdas.length - 1].d;
    celdas.push({ d: new Date(ultimo.getFullYear(), ultimo.getMonth(), ultimo.getDate() + 1), fuera: true });
  }

  const cambiarMes = (delta) => setVista((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));

  const elegir = (d) => {
    onChange(toISO(d));
    setAbierto(false);
  };

  const irAHoy = () => {
    const hoy = new Date();
    const destino = maxDate && hoy > maxDate ? maxDate : hoy;
    setVista(destino);
    elegir(destino);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block", ...style }}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
          border: `1.5px solid ${abierto ? C.accent : C.border}`,
          background: C.input, color: C.t1, cursor: "pointer",
        }}
      >
        <CalIcon />
        {label}
      </button>

      {abierto && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 8px)",
            [align === "right" ? "right" : "left"]: 0,
            zIndex: 50, width: 272, padding: 14, borderRadius: 14,
            background: C.card, border: `1px solid ${C.border}`,
            boxShadow: "0 12px 32px rgba(0,0,0,.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button type="button" onClick={() => cambiarMes(-1)} style={navBtnStyle}><ChevL /></button>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: "capitalize", color: C.t1 }}>
              {MESES_LARGO[mes]} {anio}
            </span>
            <button type="button" onClick={() => cambiarMes(1)} style={navBtnStyle}><ChevR /></button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 2 }}>
            {DIAS_SEMANA.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, color: C.t2, padding: "4px 0" }}>
                {d}
              </div>
            ))}
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}
            onMouseLeave={() => setHoverISO(null)}
          >
            {celdas.map(({ d, fuera }) => {
              const iso = toISO(d);
              const deshabilitado = !!(maxDate && d > maxDate);
              const semanaDeEsta  = modo === "semana" ? toISO(lunesDe(d)) : null;
              const esSemanaSel   = modo === "semana" && semanaDeEsta === semanaSelISO;
              const esSemanaHover = modo === "semana" && !esSemanaSel && semanaDeEsta === semanaHoverISO;
              const esDiaSel      = modo === "dia" && !!seleccionado && iso === toISO(seleccionado);
              const esHoy         = iso === toISO(new Date());
              const resaltado     = esDiaSel || esSemanaSel;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={deshabilitado}
                  onMouseEnter={() => !deshabilitado && setHoverISO(iso)}
                  onClick={() => !deshabilitado && elegir(d)}
                  style={{
                    padding: "7px 0", fontSize: 12, borderRadius: 7, border: "none",
                    cursor: deshabilitado ? "default" : "pointer",
                    fontWeight: resaltado ? 800 : 600,
                    color: deshabilitado ? C.t2 : fuera ? C.t2 : C.t1,
                    opacity: deshabilitado ? 0.35 : fuera ? 0.45 : 1,
                    background: resaltado ? C.accent : esSemanaHover ? C.accentDim : "transparent",
                    outline: esHoy && !resaltado ? `1px solid ${C.accent}` : "none",
                    outlineOffset: -1,
                  }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
            <button
              type="button"
              onClick={irAHoy}
              style={{ background: "none", border: "none", color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
