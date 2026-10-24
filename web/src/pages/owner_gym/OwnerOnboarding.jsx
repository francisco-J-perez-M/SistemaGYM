/**
 * OwnerOnboarding.jsx — Wizard de bienvenida para dueños de gimnasio.
 *
 * Se muestra únicamente en el primer login (primer_login === true en el JWT).
 * Pasos:
 *   1. Cambio de contraseña (obligatorio)
 *   2. Configuración del gimnasio (tipo, ubicación, horario, redes)
 *   3. Pantalla de éxito → redirige al dashboard
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye, FiEyeOff, FiCheck, FiArrowRight, FiArrowLeft,
  FiAlertTriangle, FiSettings, FiUsers, FiTag, FiClipboard,
  FiActivity, FiZap, FiFeather, FiShield, FiTarget, FiDroplet, FiStar,
} from "react-icons/fi";
import { completeOnboarding } from "../../api/auth";
import "../../css/CSSUnificado.css";

// ── Tipos de gimnasio (mirror de backend) ──────────────────────────────────
const GYM_TYPES = [
  { id: "gimnasio_tradicional", label: "Gimnasio Tradicional",  description: "Pesas, cardio y musculación libre",           Icon: FiActivity },
  { id: "crossfit_functional",  label: "CrossFit / Funcional",  description: "WODs, clases y entrenamiento en grupo",        Icon: FiZap      },
  { id: "yoga_pilates",         label: "Yoga / Pilates",         description: "Clases grupales y sesiones privadas",          Icon: FiFeather  },
  { id: "artes_marciales",      label: "Artes Marciales",        description: "BJJ, MMA, Karate, Boxeo y más",                Icon: FiShield   },
  { id: "spinning_cycling",     label: "Spinning / Ciclismo",    description: "Clases de spinning y ciclismo indoor",         Icon: FiTarget   },
  { id: "natacion",             label: "Natación / Acuático",    description: "Carriles, cursos y competencias",              Icon: FiDroplet  },
  { id: "boutique_studio",      label: "Estudio Boutique",       description: "Clases premium con cupo limitado",             Icon: FiStar     },
  { id: "otro",                 label: "Otro / Personalizado",   description: "Configura la plataforma desde cero",           Icon: FiSettings },
];

const STEPS = ["Contraseña", "Mi Gimnasio", "¡Listo!"];

const slide = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

export default function OwnerOnboarding() {
  const navigate = useNavigate();

  // Leer datos del usuario desde localStorage
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  // Redirigir si ya completó el onboarding
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    if (!storedUser.primer_login) navigate("/owner");
  }, []);

  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Paso 1 — contraseña
  const [pass, setPass]         = useState({ nueva: "", confirmar: "" });
  const [showPass, setShowPass] = useState({ nueva: false, confirmar: false });

  // Paso 2 — gimnasio
  const [tipoGym, setTipoGym]   = useState(null);
  const [gymForm, setGymForm]   = useState({
    descripcion:      "",
    direccion:        "",
    horario_apertura: "06:00",
    horario_cierre:   "22:00",
    capacidad_maxima: "",
    instagram:        "",
    facebook:         "",
    website:          "",
  });

  const gf = (field) => (val) => setGymForm(prev => ({ ...prev, [field]: val }));

  // ── Paso 1: validar y avanzar ──────────────────────────────────────────────
  const handlePassNext = () => {
    if (pass.nueva.length < 8)              { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (pass.nueva !== pass.confirmar)      { setError("Las contraseñas no coinciden"); return; }
    setError(""); setStep(1);
  };

  // ── Paso 2: enviar todo al backend ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!tipoGym) { setError("Selecciona el tipo de tu establecimiento"); return; }
    setError(""); setLoading(true);

    try {
      const res = await completeOnboarding({
        nueva_password: pass.nueva,
        gym: {
          tipo_gimnasio:    tipoGym,
          descripcion:      gymForm.descripcion,
          direccion:        gymForm.direccion,
          horario_apertura: gymForm.horario_apertura,
          horario_cierre:   gymForm.horario_cierre,
          capacidad_maxima: gymForm.capacidad_maxima ? parseInt(gymForm.capacidad_maxima) : 0,
          redes: {
            instagram: gymForm.instagram,
            facebook:  gymForm.facebook,
            website:   gymForm.website,
          },
        },
      });

      // Actualizar token y user en localStorage
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify({
        ...storedUser,
        primer_login: false,
      }));

      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const irAlDashboard = () => navigate("/owner");

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

      {/* Card central */}
      <div style={{
        width: "100%",
        maxWidth: step === 1 ? 660 : 480,
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
              <span style={{ fontSize: 10, fontWeight: 600, color: i <= step ? "var(--accent)" : "var(--text-secondary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Paso 0: Contraseña ────────────────────────────────────────── */}
          {step === 0 && (
            <motion.div key="paso0" variants={slide} initial="hidden" animate="visible" exit="exit">
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                  Bienvenido, {gymNombre.split(" ")[0]}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                  Por seguridad, establece una contraseña personal antes de empezar.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { key: "nueva",     label: "Nueva contraseña",     placeholder: "Mínimo 8 caracteres" },
                  { key: "confirmar", label: "Confirmar contraseña",  placeholder: "Repite la contraseña" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6, display: "block" }}>{label}</label>
                    <div className="input-dark-container password-input-wrapper">
                      <input
                        type={showPass[key] ? "text" : "password"}
                        placeholder={placeholder}
                        value={pass[key]}
                        onChange={e => setPass(p => ({ ...p, [key]: e.target.value }))}
                        style={{ background: "transparent", border: "none", outline: "none", width: "100%", color: "var(--text-primary)", fontSize: 14 }}
                      />
                      <button type="button" className="password-toggle-btn" onClick={() => setShowPass(p => ({ ...p, [key]: !p[key] }))}>
                        {showPass[key] ? <FiEye /> : <FiEyeOff />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Indicador de fortaleza */}
                {pass.nueva && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {[8, 12, 16].map((threshold, i) => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: pass.nueva.length >= threshold
                          ? i === 0 ? "var(--danger-color)" : i === 1 ? "var(--warning-color)" : "var(--success-color)"
                          : "var(--border-dark)",
                        transition: "background 0.3s",
                      }} />
                    ))}
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 8 }}>
                      {pass.nueva.length < 8 ? "Muy corta" : pass.nueva.length < 12 ? "Aceptable" : pass.nueva.length < 16 ? "Buena" : "Excelente"}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="error-message" style={{ marginTop: 16 }}>
                  <FiAlertTriangle style={{ marginRight: 6 }} />{error}
                </div>
              )}

              <button
                onClick={handlePassNext}
                className="login-button"
                style={{ marginTop: 24, width: "100%" }}
              >
                Continuar <FiArrowRight style={{ marginLeft: 8 }} />
              </button>
            </motion.div>
          )}

          {/* ── Paso 1: Configuración del gimnasio ───────────────────────── */}
          {step === 1 && (
            <motion.div key="paso1" variants={slide} initial="hidden" animate="visible" exit="exit">
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Configura tu gimnasio</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
                  Esta información personaliza la plataforma para tu tipo de establecimiento.
                </p>
              </div>

              {/* Tipo de gimnasio */}
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                Tipo de establecimiento
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
                {GYM_TYPES.map(tipo => {
                  const sel = tipoGym === tipo.id;
                  return (
                    <motion.button
                      key={tipo.id}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setTipoGym(tipo.id); setError(""); }}
                      style={{
                        padding: "12px 10px",
                        borderRadius: 10,
                        border: `2px solid ${sel ? "var(--accent)" : "var(--border-dark)"}`,
                        background: sel ? "rgba(251,227,121,0.08)" : "var(--bg-input)",
                        cursor: "pointer",
                        textAlign: "center",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                        position: "relative",
                      }}
                    >
                      {sel && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{
                          position: "absolute", top: 6, right: 6,
                          width: 16, height: 16, borderRadius: "50%",
                          background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <FiCheck size={9} color="#000" />
                        </motion.div>
                      )}
                      <tipo.Icon size={24} color={sel ? "var(--accent)" : "var(--text-secondary)"} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: sel ? "var(--accent)" : "var(--text-primary)", lineHeight: 1.3 }}>
                        {tipo.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Campos de información */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { field: "descripcion",      label: "Descripción",      type: "text",   placeholder: "El mejor gym de la ciudad",    full: true },
                  { field: "direccion",         label: "Dirección",        type: "text",   placeholder: "Av. Principal 123, Ciudad",    full: true },
                  { field: "horario_apertura",  label: "Apertura",         type: "time",   placeholder: "06:00",                        full: false },
                  { field: "horario_cierre",    label: "Cierre",           type: "time",   placeholder: "22:00",                        full: false },
                  { field: "capacidad_maxima",  label: "Capacidad máxima", type: "number", placeholder: "Ej. 80 personas",              full: false },
                  { field: "instagram",         label: "Instagram",        type: "text",   placeholder: "@migym",                       full: false },
                  { field: "facebook",          label: "Facebook",         type: "text",   placeholder: "fb.com/migym",                 full: false },
                  { field: "website",           label: "Sitio web",        type: "url",    placeholder: "https://migym.mx",             full: true },
                ].map(({ field, label, type, placeholder, full }) => (
                  <div key={field} style={{ gridColumn: full ? "1 / -1" : "auto" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 5, display: "block" }}>
                      {label}
                    </label>
                    <div className="input-dark-container" style={{ padding: "10px 14px" }}>
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
              </div>

              {error && (
                <div className="error-message" style={{ marginTop: 16 }}>
                  <FiAlertTriangle style={{ marginRight: 6 }} />{error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => { setError(""); setStep(0); }}
                  style={{
                    padding: "13px 18px", borderRadius: 10,
                    background: "transparent", border: "1px solid var(--border-dark)",
                    color: "var(--text-secondary)", cursor: "pointer", fontSize: 14,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <FiArrowLeft /> Atrás
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

          {/* ── Paso 2: ¡Listo! ──────────────────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="paso2"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: "center", padding: "8px 0 16px" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
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
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}
                  >
                    <item.Icon size={18} color="var(--accent)" />
                    <span style={{ color: "var(--text-secondary)" }}>{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                onClick={irAlDashboard}
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
