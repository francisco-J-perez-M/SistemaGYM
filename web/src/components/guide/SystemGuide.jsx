/**
 * SystemGuide.jsx — Guía interactiva del sistema, paso a paso, por rol.
 *
 * - <GuideProvider role>: se monta en el Layout (no superadmin). Maneja el estado
 *   del modal y la apertura automática en el primer inicio de sesión (localStorage).
 * - useGuide(): hook para abrir la guía desde cualquier parte (p. ej. el dashboard).
 * - <GuideButton/>: botón listo para colocar en el dashboard.
 *
 * Solo iconos (react-icons), sin emojis.
 */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHelpCircle, FiX, FiArrowLeft, FiArrowRight, FiCheck, FiExternalLink, FiBookOpen,
} from "react-icons/fi";
import { GUIDES, GUIDE_TITLES } from "./guideData";

const GuideContext = createContext({ available: false, openGuide: () => {} });

export function useGuide() {
  return useContext(GuideContext);
}

const seenKey = (role) => `gympro_guide_seen_${role}`;

export function GuideProvider({ role, children }) {
  const steps = GUIDES[role] || [];
  const available = steps.length > 0;

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const markSeen = useCallback(() => {
    try { localStorage.setItem(seenKey(role), "1"); } catch { /* ignore */ }
  }, [role]);

  const openGuide = useCallback(() => { setIdx(0); setOpen(true); }, []);
  const closeGuide = useCallback(() => { setOpen(false); markSeen(); }, [markSeen]);

  // Apertura automática en el primer inicio de sesión del rol.
  useEffect(() => {
    if (!available) return;
    let seen = "1";
    try { seen = localStorage.getItem(seenKey(role)); } catch { /* ignore */ }
    if (!seen) {
      const t = setTimeout(() => { setIdx(0); setOpen(true); }, 700);
      return () => clearTimeout(t);
    }
  }, [available, role]);

  return (
    <GuideContext.Provider value={{ available, openGuide }}>
      {children}
      {open && available && (
        <GuideModal
          role={role}
          steps={steps}
          idx={idx}
          setIdx={setIdx}
          onClose={closeGuide}
        />
      )}
    </GuideContext.Provider>
  );
}

function GuideModal({ role, steps, idx, setIdx, onClose }) {
  const navigate = useNavigate();
  const step = steps[idx];
  const Icon = step.icon;
  const isFirst = idx === 0;
  const isLast = idx === steps.length - 1;
  const pct = Math.round(((idx + 1) / steps.length) * 100);

  const next = () => (isLast ? onClose() : setIdx((i) => Math.min(i + 1, steps.length - 1)));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));
  const goSection = () => { if (step.route) navigate(step.route); };

  return (
    <div style={S.overlay} role="dialog" aria-modal="true" aria-label="Guía del sistema">
      <div style={S.card}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <span style={S.headerIcon}><FiBookOpen /></span>
            <div>
              <h2 style={S.title}>{GUIDE_TITLES[role] || "Guía del sistema"}</h2>
              <span style={S.stepCount}>Paso {idx + 1} de {steps.length}</span>
            </div>
          </div>
          <button style={S.iconBtn} onClick={onClose} aria-label="Cerrar guía"><FiX size={20} /></button>
        </div>

        {/* Progreso */}
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: `${pct}%` }} />
        </div>

        {/* Contenido del paso */}
        <div style={S.body}>
          <div style={S.stepIcon}><Icon size={34} /></div>
          <h3 style={S.stepTitle}>{step.title}</h3>
          <p style={S.stepBody}>{step.body}</p>
          {step.route && (
            <button style={S.sectionBtn} onClick={goSection}>
              <FiExternalLink /> Ver esta sección
            </button>
          )}
        </div>

        {/* Puntos de navegación */}
        <div style={S.dots}>
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ir al paso ${i + 1}`}
              style={{ ...S.dot, ...(i === idx ? S.dotActive : {}) }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button style={S.skipBtn} onClick={onClose}>Saltar guía</button>
          <div style={S.footerRight}>
            <button style={{ ...S.navBtn, opacity: isFirst ? 0.4 : 1, cursor: isFirst ? "default" : "pointer" }}
              onClick={prev} disabled={isFirst}>
              <FiArrowLeft /> Anterior
            </button>
            <button style={S.primaryBtn} onClick={next}>
              {isLast ? (<><FiCheck /> Finalizar</>) : (<>Siguiente <FiArrowRight /></>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Botón para abrir la guía — colócalo en el dashboard. */
export function GuideButton({ style = {} }) {
  const { available, openGuide } = useGuide();
  if (!available) return null;
  return (
    <button style={{ ...S.launchBtn, ...style }} onClick={openGuide} aria-label="Abrir guía del sistema">
      <FiHelpCircle size={18} /> Guía del sistema
    </button>
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
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 20px", borderBottom: "1px solid var(--border, #2d3748)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerIcon: {
    width: 38, height: 38, borderRadius: 10, display: "inline-flex",
    alignItems: "center", justifyContent: "center",
    background: "var(--accent-dim, rgba(108,99,255,.15))", color: "var(--accent, #6c63ff)", fontSize: 18,
  },
  title: { margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary, #fff)" },
  stepCount: { fontSize: 12, color: "var(--text-secondary, #94a3b8)" },
  iconBtn: {
    background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)",
    cursor: "pointer", padding: 4, display: "inline-flex",
  },
  progressTrack: { height: 4, background: "var(--bg-input, #0f1117)" },
  progressFill: { height: "100%", background: "var(--accent, #6c63ff)", transition: "width .3s ease" },
  body: { padding: "26px 24px 8px", textAlign: "center", overflowY: "auto" },
  stepIcon: {
    width: 70, height: 70, borderRadius: 20, margin: "0 auto 16px",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--accent-dim, rgba(108,99,255,.15))", color: "var(--accent, #6c63ff)",
  },
  stepTitle: { margin: "0 0 10px", fontSize: 19, fontWeight: 700, color: "var(--text-primary, #fff)" },
  stepBody: { margin: "0 auto", maxWidth: 420, fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary, #94a3b8)" },
  sectionBtn: {
    marginTop: 18, display: "inline-flex", alignItems: "center", gap: 7,
    background: "var(--accent-dim, rgba(108,99,255,.12))", color: "var(--accent, #6c63ff)",
    border: "1px solid var(--accent, #6c63ff)", borderRadius: 10, padding: "8px 16px",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  dots: { display: "flex", justifyContent: "center", gap: 6, padding: "16px 0 4px", flexWrap: "wrap" },
  dot: {
    width: 8, height: 8, borderRadius: 99, border: "none", padding: 0, cursor: "pointer",
    background: "var(--border, #2d3748)", transition: "all .2s",
  },
  dotActive: { width: 22, background: "var(--accent, #6c63ff)" },
  footer: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", borderTop: "1px solid var(--border, #2d3748)", gap: 10,
  },
  footerRight: { display: "flex", alignItems: "center", gap: 8 },
  skipBtn: {
    background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)",
    fontSize: 13, cursor: "pointer", fontWeight: 500,
  },
  navBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: "var(--bg-input, #1e293b)", color: "var(--text-secondary, #cbd5e1)",
    border: "1px solid var(--border, #2d3748)", borderRadius: 10, padding: "8px 14px",
    fontSize: 13, fontWeight: 600,
  },
  primaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "var(--accent, #6c63ff)", color: "#fff", border: "none",
    borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  launchBtn: {
    display: "inline-flex", alignItems: "center", gap: 7,
    background: "var(--accent-dim, rgba(108,99,255,.12))", color: "var(--accent, #6c63ff)",
    border: "1px solid var(--accent, #6c63ff)", borderRadius: 10, padding: "9px 16px",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
};
