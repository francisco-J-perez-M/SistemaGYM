/**
 * pages/RegisterGym.jsx -- Onboarding de nuevo gimnasio (Sprint 3 / US16)
 *
 * Formulario de 2 pasos:
 *   Paso 1 — Datos del gimnasio (nombre, email, teléfono)
 *   Paso 2 — Datos del administrador (nombre, email, contraseña)
 *
 * Al completar llama a POST /api/onboarding/register-gym, guarda el JWT
 * y redirige al dashboard de admin.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiEyeOff, FiAlertTriangle, FiCheck, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { registerGym } from "../api/auth";
import useTheme from "../hooks/useTheme";

const STEPS = ["Gimnasio", "Administrador"];

export default function RegisterGym() {
  const navigate  = useNavigate();
  const { theme } = useTheme();

  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [gymData, setGymData] = useState({
    nombre: "", email_contacto: "", telefono: "",
  });
  const [adminData, setAdminData] = useState({
    nombre: "", email: "", password: "",
  });

  // ── Validación por paso ───────────────────────────────────────────────────
  const validarPaso0 = () => {
    if (!gymData.nombre.trim())         return "El nombre del gimnasio es requerido";
    if (!gymData.email_contacto.trim()) return "El correo de contacto es requerido";
    if (!/\S+@\S+\.\S+/.test(gymData.email_contacto)) return "Correo de contacto inválido";
    return null;
  };

  const validarPaso1 = () => {
    if (!adminData.nombre.trim())  return "El nombre del administrador es requerido";
    if (!adminData.email.trim())   return "El correo del administrador es requerido";
    if (!/\S+@\S+\.\S+/.test(adminData.email)) return "Correo de administrador inválido";
    if (adminData.password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    return null;
  };

  const avanzar = () => {
    const err = validarPaso0();
    if (err) { setError(err); return; }
    setError("");
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validarPaso1();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    try {
      const res = await registerGym(gymData, adminData);

      // Guardar token y datos de usuario como hace Login
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.admin));

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Variantes ─────────────────────────────────────────────────────────────
  const slide = {
    hidden:  { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit:    { opacity: 0, x: -40, transition: { duration: 0.25 } },
  };

  return (
    <div className="split-login-container" style={{ minHeight: "100vh" }}>

      {/* Panel izquierdo — hero */}
      <motion.div
        className="login-left-side"
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.75)),
            url('https://img.freepik.com/foto-gratis/vista-frontal-entrenador-fisico-masculino-posando-brazos-cruzados_23-2148239739.jpg?w=740')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <motion.div
          className="brand-logo-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h1 className="brand-text-logo">GYM<span style={{ color: "var(--accent)" }}>PRO</span></h1>
        </motion.div>
        <div className="brand-hero-text">
          <motion.h2 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.7 }}>
            Registra
          </motion.h2>
          <motion.h2 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.7 }}>
            tu gimnasio.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            style={{ color: "rgba(255,255,255,0.75)", marginTop: 16, maxWidth: 280, lineHeight: 1.6 }}
          >
            14 días de prueba gratis.<br />Sin tarjeta de crédito.
          </motion.p>
        </div>
      </motion.div>

      {/* Panel derecho — formulario */}
      <motion.div
        className="login-right-side"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="login-card" style={{ maxWidth: 440, width: "100%" }}>

          {/* Indicador de pasos */}
          <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
            {STEPS.map((label, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: "100%", height: 4, borderRadius: 2,
                  background: i <= step ? "var(--accent)" : "var(--border-color, #333)",
                  transition: "background 0.3s",
                }} />
                <span style={{ fontSize: 11, color: i <= step ? "var(--accent)" : "var(--text-muted, #888)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Éxito */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ textAlign: "center", padding: "32px 0" }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "var(--accent)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <FiCheck size={32} color="#fff" />
                </div>
                <h3 style={{ margin: "0 0 8px" }}>¡Gimnasio registrado!</h3>
                <p style={{ color: "var(--text-muted, #888)" }}>Redirigiendo al dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!success && (
            <>
              <div className="login-header">
                <h2 style={{ marginBottom: 4 }}>
                  {step === 0 ? "Datos del gimnasio" : "Cuenta de administrador"}
                </h2>
                <p className="login-subtitle">
                  {step === 0
                    ? "Información básica de tu gimnasio"
                    : "El administrador principal de la plataforma"}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {/* ── Paso 0: Datos del gimnasio ── */}
                {step === 0 && (
                  <motion.form key="paso0" variants={slide} initial="hidden" animate="visible" exit="exit"
                    onSubmit={(e) => { e.preventDefault(); avanzar(); }}
                    className="login-form"
                  >
                    {[
                      { id: "nombre",         label: "Nombre del gimnasio", type: "text", placeholder: "FitZone Monterrey" },
                      { id: "email_contacto", label: "Correo de contacto",  type: "email", placeholder: "contacto@fitzone.mx" },
                      { id: "telefono",       label: "Teléfono (opcional)", type: "tel",  placeholder: "+52-81-1234-5678" },
                    ].map(({ id, label, type, placeholder }) => (
                      <div className="form-group" key={id}>
                        <label htmlFor={id}>{label}</label>
                        <div className="input-dark-container">
                          <input
                            id={id} type={type} placeholder={placeholder}
                            value={gymData[id]}
                            onChange={(e) => setGymData({ ...gymData, [id]: e.target.value })}
                          />
                        </div>
                      </div>
                    ))}

                    <AnimatePresence>
                      {error && (
                        <motion.div className="error-message"
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <FiAlertTriangle style={{ marginRight: 6 }} />{error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button type="submit" className="login-button">
                      Siguiente <FiArrowRight style={{ marginLeft: 8 }} />
                    </button>

                    <p className="register-link" style={{ marginTop: 16 }}>
                      ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
                    </p>
                  </motion.form>
                )}

                {/* ── Paso 1: Datos del admin ── */}
                {step === 1 && (
                  <motion.form key="paso1" variants={slide} initial="hidden" animate="visible" exit="exit"
                    onSubmit={handleSubmit}
                    className="login-form"
                  >
                    <div className="form-group">
                      <label htmlFor="adm_nombre">Nombre completo</label>
                      <div className="input-dark-container">
                        <input id="adm_nombre" type="text" placeholder="Juan Pérez"
                          value={adminData.nombre}
                          onChange={(e) => setAdminData({ ...adminData, nombre: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="adm_email">Correo del administrador</label>
                      <div className="input-dark-container">
                        <input id="adm_email" type="email" placeholder="juan@fitzone.mx"
                          value={adminData.email}
                          onChange={(e) => setAdminData({ ...adminData, email: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="adm_pass">Contraseña</label>
                      <div className="input-dark-container password-input-wrapper">
                        <input id="adm_pass" type={showPass ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                          value={adminData.password}
                          onChange={(e) => setAdminData({ ...adminData, password: e.target.value })} />
                        <button type="button" className="password-toggle-btn" onClick={() => setShowPass(!showPass)}>
                          {showPass ? <FiEye /> : <FiEyeOff />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div className="error-message"
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <FiAlertTriangle style={{ marginRight: 6 }} />{error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div style={{ display: "flex", gap: 12 }}>
                      <button type="button" className="login-button"
                        style={{ flex: "0 0 auto", padding: "12px 20px", background: "transparent", border: "1px solid var(--border-color, #444)" }}
                        onClick={() => { setStep(0); setError(""); }}
                      >
                        <FiArrowLeft />
                      </button>
                      <button type="submit" className="login-button" disabled={loading} style={{ flex: 1 }}>
                        {loading ? <span className="spinner" style={{ display: "inline-block", width: 18, height: 18,
                          border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                          borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          : "Crear gimnasio"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
