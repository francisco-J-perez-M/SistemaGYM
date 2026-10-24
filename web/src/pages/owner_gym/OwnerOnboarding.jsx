/**
 * OwnerOnboarding.jsx — Wizard de bienvenida para dueños de gimnasio.
 *
 * Solo aparece en el primer login (primer_login === true en el JWT).
 * Pasos:
 *   0 — Configuración del gimnasio (descripción, dirección, horario, redes)
 *   1 — Pantalla de éxito → redirige al dashboard
 *
 * Nota: el tipo de establecimiento ya fue seleccionado al registrar el gimnasio.
 * La contraseña ya fue creada en el mismo formulario de registro.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck, FiArrowRight, FiArrowLeft,
  FiAlertTriangle, FiUsers, FiTag, FiClipboard, FiClock,
} from "react-icons/fi";
import { completeOnboarding } from "../../api/auth";
import "../../css/CSSUnificado.css";

/* ── Scrollbar personalizado para TimePicker ─────────────────────────────── */
const TIMEPICKER_STYLE = `
  .tp-col::-webkit-scrollbar { width: 4px; }
  .tp-col::-webkit-scrollbar-track { background: transparent; }
  .tp-col::-webkit-scrollbar-thumb { background: var(--border-dark); border-radius: 99px; }
  .tp-col::-webkit-scrollbar-thumb:hover { background: var(--accent); }
`;

/* ── TimePicker custom ────────────────────────────────────────────────────── */
function TimePicker({ value, onChange }) {
  const [open,    setOpen]   = useState(false);
  const [openUp,  setOpenUp] = useState(false);   // flip hacia arriba si no cabe abajo
  const ref     = useRef(null);
  const dropRef = useRef(null);

  const [hh, mm] = (value || "06:00").split(":").map(Number);

  // Inyectar estilos de scrollbar una sola vez
  useEffect(() => {
    if (!document.getElementById("tp-scrollbar-style")) {
      const tag = document.createElement("style");
      tag.id = "tp-scrollbar-style";
      tag.textContent = TIMEPICKER_STYLE;
      document.head.appendChild(tag);
    }
  }, []);

  // Cierra al clic afuera
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Detecta si el dropdown se saldría del viewport por abajo → abre hacia arriba
  useEffect(() => {
    if (!open || !ref.current) return;
    const triggerRect = ref.current.getBoundingClientRect();
    const spaceBelow  = window.innerHeight - triggerRect.bottom;
    setOpenUp(spaceBelow < 230);   // 230px ≈ altura del dropdown
  }, [open]);

  const hours   = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];
  const fmt     = (n) => String(n).padStart(2, "0");
  const display = `${fmt(hh)}:${fmt(mm)}`;

  const select = (newH, newM) => { onChange(`${fmt(newH)}:${fmt(newM)}`); setOpen(false); };

  const colStyle = {
    display: "flex", flexDirection: "column", gap: 2,
    maxHeight: 196, overflowY: "auto",
    scrollbarWidth: "thin", scrollbarColor: "var(--border-dark) transparent",
  };
  const itemStyle = (active) => ({
    padding: "7px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13,
    fontWeight: active ? 700 : 400, textAlign: "center",
    background: active ? "var(--accent)" : "transparent",
    color: active ? "var(--bg-dark, #0f1117)" : "var(--text-primary)",
    transition: "background 0.15s", whiteSpace: "nowrap",
  });

  // Scroll automático al valor seleccionado al abrir
  const hrRef = useRef(null);
  useEffect(() => {
    if (open && hrRef.current) {
      const active = hrRef.current.querySelector("[data-active='true']");
      if (active) active.scrollIntoView({ block: "center" });
    }
  }, [open]);

  const dropPos = openUp
    ? { bottom: "calc(100% + 6px)", top: "auto" }
    : { top:    "calc(100% + 6px)", bottom: "auto" };

  const motionInit = openUp ? { opacity: 0, y: 6 } : { opacity: 0, y: -6 };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px",
          background: "var(--bg-input)",
          border: `1px solid ${open ? "var(--accent)" : "var(--border-dark)"}`,
          borderRadius: "var(--r-md, 8px)",
          cursor: "pointer", userSelect: "none", transition: "border-color 0.2s",
        }}
      >
        <FiClock size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>
          {display}
        </span>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropRef}
            initial={{ ...motionInit, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ ...motionInit, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", ...dropPos, left: 0, zIndex: 300,
              background: "var(--bg-card)",
              border: "1px solid var(--border-dark)",
              borderRadius: 10,
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
              display: "flex", overflow: "hidden", minWidth: 160,
            }}
          >
            {/* Horas */}
            <div ref={hrRef} className="tp-col" style={{ ...colStyle, borderRight: "1px solid var(--border-dark)", padding: "6px 4px" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textAlign: "center", padding: "4px 0 6px", textTransform: "uppercase", letterSpacing: "0.5px", position: "sticky", top: 0, background: "var(--bg-card)" }}>Hora</span>
              {hours.map(h => (
                <div key={h} data-active={h === hh} style={itemStyle(h === hh)}
                  onClick={() => select(h, mm)}
                  onMouseEnter={e => { if (h !== hh) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { if (h !== hh) e.currentTarget.style.background = "transparent"; }}
                >
                  {fmt(h)}
                </div>
              ))}
            </div>

            {/* Minutos */}
            <div className="tp-col" style={{ ...colStyle, padding: "6px 4px" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textAlign: "center", padding: "4px 0 6px", textTransform: "uppercase", letterSpacing: "0.5px", position: "sticky", top: 0, background: "var(--bg-card)" }}>Min</span>
              {minutes.map(m => (
                <div key={m} data-active={m === mm} style={itemStyle(m === mm)}
                  onClick={() => select(hh, m)}
                  onMouseEnter={e => { if (m !== mm) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { if (m !== mm) e.currentTarget.style.background = "transparent"; }}
                >
                  {fmt(m)}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STEPS = ["Mi Gimnasio", "¡Listo!"];

const slide = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

export default function OwnerOnboarding() {
  const navigate = useNavigate();

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    if (!storedUser.primer_login) navigate("/owner");
  }, []);

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [gymForm, setGymForm] = useState({
    descripcion:      "",
    direccion:        "",
    horario_apertura: "06:00",
    horario_cierre:   "22:00",
    capacidad_maxima: "",
    instagram:        "",
    facebook:         "",
  });

  const gf = (field) => (val) => setGymForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const res = await completeOnboarding({
        // Sin nueva_password (ya se estableció en el registro)
        // Sin tipo_gimnasio (ya se seleccionó al registrar el gimnasio)
        gym: {
          descripcion:      gymForm.descripcion,
          direccion:        gymForm.direccion,
          horario_apertura: gymForm.horario_apertura,
          horario_cierre:   gymForm.horario_cierre,
          capacidad_maxima: gymForm.capacidad_maxima ? parseInt(gymForm.capacidad_maxima) : 0,
          redes: {
            instagram: gymForm.instagram,
            facebook:  gymForm.facebook,
          },
        },
      });

      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify({
        ...storedUser,
        primer_login: false,
      }));

      setStep(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const gymNombre = storedUser.nombre || "Administrador";

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-dark)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: step === 0 ? 620 : 480,
        background: "var(--bg-card)",
        border: "1px solid var(--border-dark)",
        borderRadius: 20,
        padding: "36px 36px 32px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        transition: "max-width 0.4s ease",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>
            GYM<span style={{ color: "var(--accent)" }}>PRO</span>
          </span>
        </div>

        {/* Indicador de pasos */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: "100%", height: 4, borderRadius: 2,
                background: i <= step ? "var(--accent)" : "var(--border-dark)",
                transition: "background 0.4s",
              }} />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: i <= step ? "var(--accent)" : "var(--text-secondary)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Paso 0: Configuración del gimnasio ── */}
          {step === 0 && (
            <motion.div key="paso0" variants={slide} initial="hidden" animate="visible" exit="exit">
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                  Bienvenido, {gymNombre.split(" ")[0]}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
                  Completa la información de tu gimnasio para personalizar la plataforma.
                </p>
              </div>

              {/* Campos del gimnasio */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { field: "descripcion",     label: "Descripción",      type: "text",   placeholder: "El mejor gym de la ciudad",  full: true  },
                  { field: "direccion",        label: "Dirección",        type: "text",   placeholder: "Av. Principal 123, Ciudad",  full: true  },
                  { field: "capacidad_maxima", label: "Capacidad máxima", type: "number", placeholder: "Ej. 80 personas",           full: false },
                  { field: "instagram",        label: "Instagram",        type: "text",   placeholder: "@migym",                    full: false },
                  { field: "facebook",         label: "Facebook",         type: "text",   placeholder: "fb.com/migym",              full: false },
                ].map(({ field, label, type, placeholder, full }) => (
                  <div key={field} style={{ gridColumn: full ? "1 / -1" : "auto" }}>
                    <label style={{
                      fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
                      letterSpacing: "0.5px", textTransform: "uppercase",
                      marginBottom: 5, display: "block",
                    }}>
                      {label}
                    </label>
                    <div style={{
                      padding: "10px 14px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-dark)",
                      borderRadius: "var(--r-md, 8px)",
                      transition: "border-color 0.2s",
                    }}
                      onFocusCapture={e => e.currentTarget.style.borderColor = "var(--accent)"}
                      onBlurCapture={e => e.currentTarget.style.borderColor = "var(--border-dark)"}
                    >
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={gymForm[field]}
                        onChange={e => gf(field)(e.target.value)}
                        min={type === "number" ? 1 : undefined}
                        style={{ background: "transparent", border: "none", outline: "none", width: "100%", color: "var(--text-primary)", fontSize: 13 }}
                      />
                    </div>
                  </div>
                ))}

                {/* Horario — TimePicker custom */}
                {[
                  { field: "horario_apertura", label: "Apertura" },
                  { field: "horario_cierre",   label: "Cierre"   },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label style={{
                      fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
                      letterSpacing: "0.5px", textTransform: "uppercase",
                      marginBottom: 5, display: "block",
                    }}>
                      {label}
                    </label>
                    <TimePicker
                      value={gymForm[field]}
                      onChange={v => gf(field)(v)}
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="error-message" style={{ marginTop: 16 }}>
                  <FiAlertTriangle style={{ marginRight: 6 }} />{error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => navigate("/owner")}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "13px 18px", borderRadius: 10,
                    background: "transparent", border: "1px solid var(--border-dark)",
                    color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  }}
                >
                  <FiArrowLeft size={14} /> Omitir
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="login-button"
                  style={{ flex: 1 }}
                >
                  {loading
                    ? <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    : <><FiCheck style={{ marginRight: 6 }} />Completar configuración</>
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Paso 1: ¡Listo! ── */}
          {step === 1 && (
            <motion.div key="paso1"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: "center", padding: "8px 0 16px" }}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <FiCheck size={36} color="#000" />
              </motion.div>

              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>¡Gimnasio listo!</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 28, maxWidth: 340, margin: "0 auto 28px" }}>
                Tu plataforma ya está configurada. Ahora puedes agregar miembros, personal y membresías.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, textAlign: "left", background: "var(--bg-input)", borderRadius: 12, padding: "16px 20px" }}>
                {[
                  { Icon: FiUsers,     text: "Registra tu equipo (entrenadores y recepcionistas)" },
                  { Icon: FiTag,       text: "Crea los planes de membresía de tu gimnasio" },
                  { Icon: FiClipboard, text: "Agrega tus primeros miembros" },
                ].map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}
                  >
                    <item.Icon size={18} color="var(--accent)" />
                    <span style={{ color: "var(--text-secondary)" }}>{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                onClick={() => navigate("/owner")}
                className="login-button"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: "100%" }}
              >
                Ir al Dashboard <FiArrowRight style={{ marginLeft: 8 }} />
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
