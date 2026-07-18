/**
 * SystemGuide.jsx — Guía contextual INMERSIVA por vista (estilo spotlight).
 *
 * Para cada paso, si la vista tiene etiquetado el componente (data-guide), la
 * guía lo RESALTA y oscurece/difumina el resto de la pantalla, colocando la
 * explicación junto al elemento. Si el paso no tiene objetivo (o no se encuentra
 * en el DOM), cae a una tarjeta centrada. Solo iconos, sin emojis.
 */
import { useEffect, useState, useLayoutEffect, useCallback, useRef } from "react";
import { FiX, FiArrowLeft, FiArrowRight, FiCheck, FiBookOpen } from "react-icons/fi";
import { resolveGuide } from "./viewGuides";

const PAD = 8;          // margen alrededor del elemento resaltado
const TIP_W = 380;      // ancho del globo de explicación

export default function SystemGuide({ open, path, onClose }) {
  const guide = resolveGuide(path);
  const steps = guide.steps || [];
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const tipRef = useRef(null);
  const [tipH, setTipH] = useState(0);

  useEffect(() => { if (open) setIdx(0); }, [open, path]);

  // Mide la altura real del globo para poder encuadrarlo dentro de la pantalla.
  useLayoutEffect(() => {
    if (tipRef.current) setTipH(tipRef.current.offsetHeight);
  }, [idx, rect, open]);

  const step = steps.length ? steps[Math.min(idx, steps.length - 1)] : null;

  // Localiza y mide el elemento objetivo del paso actual.
  const measure = useCallback(() => {
    if (!open || !step) return;
    const el = step.target ? document.querySelector(step.target) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) { setRect({ top: r.top, left: r.left, width: r.width, height: r.height }); return; }
    }
    setRect(null);
  }, [open, step]);

  // Al cambiar de paso: lleva el elemento al centro y mide tras el scroll.
  useLayoutEffect(() => {
    if (!open || !step) return;
    const el = step.target ? document.querySelector(step.target) : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const t = setTimeout(measure, el ? 360 : 0);
    return () => clearTimeout(t);
  }, [open, idx, path, step, measure]);

  // Recalcula al redimensionar o hacer scroll.
  useEffect(() => {
    if (!open) return;
    const fn = () => measure();
    window.addEventListener("resize", fn);
    window.addEventListener("scroll", fn, true);
    return () => { window.removeEventListener("resize", fn); window.removeEventListener("scroll", fn, true); };
  }, [open, measure]);

  if (!open || !step) return null;

  const Icon = step.icon;
  const isFirst = idx === 0;
  const isLast = idx === steps.length - 1;
  const pct = Math.round(((idx + 1) / steps.length) * 100);
  const next = () => (isLast ? onClose() : setIdx((i) => Math.min(i + 1, steps.length - 1)));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  // Contenido del globo / tarjeta (compartido entre los dos modos).
  const content = (
    <>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={S.headerIcon}><FiBookOpen /></span>
          <div>
            <h2 style={S.title}>{guide.title}</h2>
            <span style={S.stepCount}>Paso {idx + 1} de {steps.length}</span>
          </div>
        </div>
        <button style={S.iconBtn} onClick={onClose} aria-label="Cerrar guía"><FiX size={20} /></button>
      </div>
      <div style={S.progressTrack}><div style={{ ...S.progressFill, width: `${pct}%` }} /></div>
      <div style={S.body}>
        <div style={S.stepIcon}><Icon size={28} /></div>
        <h3 style={S.stepTitle}>{step.title}</h3>
        <p style={S.stepBody}>{step.body}</p>
      </div>
      <div style={S.dots}>
        {steps.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Paso ${i + 1}`}
            style={{ ...S.dot, ...(i === idx ? S.dotActive : {}) }} />
        ))}
      </div>
      <div style={S.footer}>
        <button style={S.skipBtn} onClick={onClose}>Saltar guía</button>
        <div style={S.footerRight}>
          <button style={{ ...S.navBtn, opacity: isFirst ? 0.4 : 1, cursor: isFirst ? "default" : "pointer" }}
            onClick={prev} disabled={isFirst}>
            <FiArrowLeft /> Anterior
          </button>
          <button style={S.primaryBtn} onClick={next}>
            {isLast ? (<><FiCheck /> Entendido</>) : (<>Siguiente <FiArrowRight /></>)}
          </button>
        </div>
      </div>
    </>
  );

  // ── Modo tarjeta centrada (sin objetivo o no encontrado) ───────────────────
  if (!rect) {
    return (
      <div style={S.overlay} role="dialog" aria-modal="true">
        <div style={S.card}>{content}</div>
      </div>
    );
  }

  // ── Modo spotlight (resalta el elemento, difumina el resto) ────────────────
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const R = {
    top: Math.max(0, rect.top - PAD),
    left: Math.max(0, rect.left - PAD),
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
  const panel = { position: "fixed", background: "rgba(8,10,16,0.62)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", zIndex: 9998 };

  // Coloca el globo debajo del elemento si cabe; si no, arriba; y en cualquier
  // caso lo mantiene DENTRO de la pantalla (clamp) para que no se corte.
  const H = tipH || 340;                       // altura real del globo (estimada hasta medir)
  const margin = 12;
  const belowTop = R.top + R.height + 14;
  const aboveTop = R.top - H - 14;
  let tipTop;
  if (belowTop + H <= vh - margin) tipTop = belowTop;       // cabe abajo
  else if (aboveTop >= margin)      tipTop = aboveTop;       // cabe arriba
  else                              tipTop = vh - H - margin; // no cabe: pegar y hacer scroll interno
  tipTop = Math.max(margin, Math.min(tipTop, vh - H - margin));
  const tipVert = { top: tipTop };
  let tipLeft = rect.left + rect.width / 2 - TIP_W / 2;
  tipLeft = Math.max(16, Math.min(tipLeft, vw - TIP_W - 16));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} role="dialog" aria-modal="true">
      {/* 4 paneles que oscurecen y difuminan todo MENOS el elemento */}
      <div style={{ ...panel, top: 0, left: 0, right: 0, height: R.top }} />
      <div style={{ ...panel, top: R.top + R.height, left: 0, right: 0, bottom: 0 }} />
      <div style={{ ...panel, top: R.top, left: 0, width: R.left, height: R.height }} />
      <div style={{ ...panel, top: R.top, left: R.left + R.width, right: 0, height: R.height }} />

      {/* Anillo resaltado alrededor del elemento */}
      <div style={{
        position: "fixed", top: R.top, left: R.left, width: R.width, height: R.height,
        border: "2px solid var(--accent, #6c63ff)", borderRadius: 12,
        boxShadow: "0 0 0 3px rgba(108,99,255,.35), 0 0 26px rgba(108,99,255,.55)",
        pointerEvents: "none", zIndex: 9999, transition: "all .25s ease",
      }} />

      {/* Globo de explicación junto al elemento */}
      <div ref={tipRef} style={{ position: "fixed", left: tipLeft, width: TIP_W, maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100vh - 24px)", overflowY: "auto", zIndex: 10000, ...tipVert, ...S.tip }}>
        {content}
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  card: {
    width: "100%", maxWidth: 520, background: "var(--bg-card, #161a23)",
    border: "1px solid var(--border, #2d3748)", borderRadius: 18,
    boxShadow: "0 24px 60px rgba(0,0,0,0.45)", overflow: "hidden",
    display: "flex", flexDirection: "column", maxHeight: "92vh",
  },
  tip: {
    background: "var(--bg-card, #161a23)", border: "1px solid var(--accent, #6c63ff)",
    borderRadius: 16, boxShadow: "0 18px 50px rgba(0,0,0,0.5)", overflow: "hidden",
    display: "flex", flexDirection: "column",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px", borderBottom: "1px solid var(--border, #2d3748)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerIcon: {
    width: 34, height: 34, borderRadius: 9, display: "inline-flex",
    alignItems: "center", justifyContent: "center",
    background: "var(--accent-dim, rgba(108,99,255,.15))", color: "var(--accent, #6c63ff)", fontSize: 16,
  },
  title: { margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary, #fff)" },
  stepCount: { fontSize: 11.5, color: "var(--text-secondary, #94a3b8)" },
  iconBtn: {
    background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)",
    cursor: "pointer", padding: 4, display: "inline-flex",
  },
  progressTrack: { height: 4, background: "var(--bg-input, #0f1117)" },
  progressFill: { height: "100%", background: "var(--accent, #6c63ff)", transition: "width .3s ease" },
  body: { padding: "20px 22px 6px", textAlign: "center" },
  stepIcon: {
    width: 60, height: 60, borderRadius: 18, margin: "0 auto 14px",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--accent-dim, rgba(108,99,255,.15))", color: "var(--accent, #6c63ff)",
  },
  stepTitle: { margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "var(--text-primary, #fff)" },
  stepBody: { margin: "0 auto", maxWidth: 420, fontSize: 13.5, lineHeight: 1.65, color: "var(--text-secondary, #94a3b8)" },
  dots: { display: "flex", justifyContent: "center", gap: 6, padding: "14px 0 4px", flexWrap: "wrap" },
  dot: {
    width: 7, height: 7, borderRadius: 99, border: "none", padding: 0, cursor: "pointer",
    background: "var(--border, #2d3748)", transition: "all .2s",
  },
  dotActive: { width: 20, background: "var(--accent, #6c63ff)" },
  footer: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px", borderTop: "1px solid var(--border, #2d3748)", gap: 10,
  },
  footerRight: { display: "flex", alignItems: "center", gap: 8 },
  skipBtn: {
    background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)",
    fontSize: 12.5, cursor: "pointer", fontWeight: 500,
  },
  navBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: "var(--bg-input, #1e293b)", color: "var(--text-secondary, #cbd5e1)",
    border: "1px solid var(--border, #2d3748)", borderRadius: 9, padding: "7px 12px",
    fontSize: 12.5, fontWeight: 600,
  },
  primaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "var(--accent, #6c63ff)", color: "#fff", border: "none",
    borderRadius: 9, padding: "7px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
  },
};
