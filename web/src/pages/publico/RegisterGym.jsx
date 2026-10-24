/**
 * pages/RegisterGym.jsx -- Onboarding de nuevo gimnasio
 *
 * Paso 0 — Tipo de establecimiento (visual card grid)
 * Paso 1 — Datos del gimnasio (nombre, email, teléfono)
 * Paso 2 — Datos del administrador (nombre, email, contraseña segura)
 */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiEyeOff, FiAlertTriangle, FiCheck, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import {
  FaDumbbell, FaFire, FaLeaf, FaFistRaised,
  FaBicycle, FaSwimmer, FaGem, FaCog,
} from "react-icons/fa";
import { registerGym, getPlanesPublicos } from "../../api/auth";
import useTheme from "../../hooks/useTheme";
import { passwordStrength } from "../../utils/passwordStrength";

const GYM_TYPES = [
  { id: "gimnasio_tradicional", label: "Gimnasio Tradicional",  description: "Pesas, cardio y musculación libre",           Icon: FaDumbbell  },
  { id: "crossfit_functional",  label: "CrossFit / Funcional",  description: "WODs, clases y entrenamiento en grupo",        Icon: FaFire      },
  { id: "yoga_pilates",         label: "Yoga / Pilates",         description: "Clases grupales y sesiones privadas",          Icon: FaLeaf      },
  { id: "artes_marciales",      label: "Artes Marciales",        description: "BJJ, MMA, Karate, Boxeo y más",                Icon: FaFistRaised},
  { id: "spinning_cycling",     label: "Spinning / Ciclismo",    description: "Clases de spinning y ciclismo indoor",         Icon: FaBicycle   },
  { id: "natacion",             label: "Natación / Acuático",    description: "Carriles, cursos y competencias",              Icon: FaSwimmer   },
  { id: "boutique_studio",      label: "Estudio Boutique",       description: "Clases premium con cupo limitado",             Icon: FaGem       },
  { id: "otro",                 label: "Otro / Personalizado",   description: "Configura la plataforma desde cero",           Icon: FaCog       },
];

const STEPS = ["Tipo", "Gimnasio", "Plan", "Administrador"];

// Fortaleza de contraseña -- ver utils/passwordStrength.js
const passStrength = passwordStrength;

const btnBack = {
  display: "flex", alignItems: "center", gap: 5,
  padding: "10px 16px", borderRadius: "var(--r-md, 8px)",
  background: "transparent", border: "1px solid var(--border-color, #444)",
  color: "var(--text-secondary, #aaa)", cursor: "pointer",
  fontSize: 12.5, fontWeight: 600,
};

export default function RegisterGym() {
  const navigate  = useNavigate();
  const { theme } = useTheme();

  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [selectedType, setSelectedType] = useState(null);
  const [gymData, setGymData]     = useState({ nombre: "", email_contacto: "", telefono: "" });
  const [adminData, setAdminData] = useState({ nombre: "", email: "", password: "" });

  const [planes, setPlanes]             = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // Carga el catálogo de planes al montar (no depende del paso en el que
  // esté el usuario, así ya está listo cuando llegue al paso "Plan") y
  // preselecciona automáticamente el plan starter (gratuito) como default.
  useEffect(() => {
    (async () => {
      try {
        const lista = await getPlanesPublicos();
        setPlanes(lista);
        const starter = lista.find((p) => p.nombre === "starter");
        setSelectedPlanId((starter || lista[0])?.id ?? null);
      } catch {
        // Si falla, no bloquea el registro: el backend usa "starter" por
        // default cuando no se envía id_plan.
        setPlanes([]);
      } finally {
        setPlansLoading(false);
      }
    })();
  }, []);

  const strength = passStrength(adminData.password);

  const validarPaso0 = () => (!selectedType ? "Selecciona el tipo de establecimiento" : null);
  const validarPaso1 = () => {
    if (!gymData.nombre.trim())         return "El nombre del gimnasio es requerido";
    if (!gymData.email_contacto.trim()) return "El correo de contacto es requerido";
    if (!/\S+@\S+\.\S+/.test(gymData.email_contacto)) return "Correo de contacto inválido";
    return null;
  };
  const validarPasoPlan = () =>
    (!plansLoading && planes.length > 0 && !selectedPlanId) ? "Selecciona un plan para continuar" : null;
  const validarPaso3 = () => {
    if (!adminData.nombre.trim()) return "El nombre del administrador es requerido";
    if (!adminData.email.trim())  return "El correo del administrador es requerido";
    if (!/\S+@\S+\.\S+/.test(adminData.email)) return "Correo de administrador inválido";
    if (adminData.password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    return null;
  };

  const avanzar = () => {
    let err = null;
    if (step === 0)      err = validarPaso0();
    else if (step === 1) err = validarPaso1();
    else if (step === 2) err = validarPasoPlan();
    if (err) { setError(err); return; }
    setError(""); setStep(s => s + 1);
  };
  const retroceder = () => { setError(""); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validarPaso3();
    if (err) { setError(err); return; }
    setError(""); setLoading(true);
    try {
      const res = await registerGym(
        { ...gymData, tipo_gimnasio: selectedType },
        adminData,
        selectedPlanId,
      );
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify({
        ...res.admin,
        primer_login: true,
        id_gimnasio: res.gym?.id,
      }));
      setSuccess(true);
      setTimeout(() => navigate("/owner/bienvenida"), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const slide = {
    hidden:  { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit:    { opacity: 0, x: -40, transition: { duration: 0.25 } },
  };

  return (
    <motion.div
      className="split-login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >

      {/* Panel izquierdo: imagen de marca */}
      <motion.div
        className="auth-image-panel"
        style={{
          backgroundImage: "url('/auth-register-hero.jpg')",
          // Logo y leyenda de esta imagen quedan hacia la derecha; se
          // ancla el recorte ahí para no perderlos en pantallas angostas.
          backgroundPosition: "right center",
        }}
      >
        {/* Única pieza de texto sobre la imagen: la vista previa dinámica
            del tipo de gimnasio elegido en el paso 0. Se ancla abajo a la
            izquierda, lejos del logo/leyenda (arriba/abajo a la derecha)
            que ya trae la propia imagen. */}
        <AnimatePresence>
          {selectedType && (
            <motion.div key={selectedType} className="auth-image-caption"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                padding: "14px 20px",
                background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)",
                borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <div style={{ marginBottom: 6 }}>
                {(() => { const T = GYM_TYPES.find(t => t.id === selectedType); return T ? <T.Icon size={28} color="var(--accent)" /> : null; })()}
              </div>
              <p style={{ color: "#fff", fontWeight: 600, margin: 0 }}>
                {GYM_TYPES.find(t => t.id === selectedType)?.label}
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: "4px 0 0" }}>
                Los planes y módulos se configurarán automáticamente
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Panel derecho: formulario */}
      <div className="auth-form-panel">
        <div className="login-card" style={{ maxWidth: 480, width: "100%" }}>

          {/* Indicador de pasos */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {STEPS.map((label, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: "100%", height: 3, borderRadius: 2,
                  background: i <= step ? "var(--accent)" : "var(--border-color, #333)",
                  transition: "background 0.3s",
                }} />
                <span style={{ fontSize: 10.5, color: i <= step ? "var(--accent)" : "var(--text-muted, #888)" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Éxito */}
          <AnimatePresence>
            {success && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ textAlign: "center", padding: "32px 0" }}
              >
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
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
                  {step === 0 && "¿Qué tipo de establecimiento tienes?"}
                  {step === 1 && "Datos del gimnasio"}
                  {step === 2 && "Elige tu plan"}
                  {step === 3 && "Cuenta de administrador"}
                </h2>
                <p className="login-subtitle">
                  {step === 0 && "Personalizamos la plataforma según tu actividad"}
                  {step === 1 && "Información básica de tu establecimiento"}
                  {step === 2 && "Puedes cambiarlo después desde tu panel"}
                  {step === 3 && "El administrador principal de la plataforma"}
                </p>
              </div>

              <AnimatePresence mode="wait">

                {/* ── Paso 0: Tipo de gimnasio ── */}
                {step === 0 && (
                  <motion.div key="paso0" variants={slide} initial="hidden" animate="visible" exit="exit">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))", gap: 8, marginBottom: 16 }}>
                      {GYM_TYPES.map((tipo) => {
                        const isSelected = selectedType === tipo.id;
                        return (
                          <motion.button key={tipo.id} type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { setSelectedType(tipo.id); setError(""); }}
                            style={{
                              padding: "12px 8px", borderRadius: 10,
                              border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                              background: isSelected ? "var(--accent, #6c63ff)22" : "var(--bg-card)",
                              cursor: "pointer", textAlign: "center",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative",
                            }}
                          >
                            {isSelected && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <FiCheck size={10} color="#fff" />
                              </motion.div>
                            )}
                            <tipo.Icon size={22} color={isSelected ? "var(--accent)" : "var(--text-secondary, #aaa)"} />
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: isSelected ? "var(--accent)" : "var(--text-primary, #fff)", lineHeight: 1.3 }}>{tipo.label}</span>
                            <span style={{ fontSize: 9.5, color: "var(--text-muted, #888)", lineHeight: 1.3 }}>{tipo.description}</span>
                          </motion.button>
                        );
                      })}
                    </div>

                    {error && (
                      <motion.div className="error-message" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <FiAlertTriangle style={{ marginRight: 6 }} />{error}
                      </motion.div>
                    )}

                    <button type="button" className="login-button" onClick={avanzar} style={{ marginTop: 4 }}>
                      Siguiente <FiArrowRight style={{ marginLeft: 8 }} />
                    </button>
                    <p className="register-link" style={{ marginTop: 16 }}>
                      ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                    </p>
                  </motion.div>
                )}

                {/* ── Paso 1: Datos del gimnasio ── */}
                {step === 1 && (
                  <motion.form key="paso1" variants={slide} initial="hidden" animate="visible" exit="exit"
                    onSubmit={(e) => { e.preventDefault(); avanzar(); }} className="login-form"
                  >
                    {[
                      { id: "nombre",         label: "Nombre del gimnasio", type: "text",  placeholder: "FitZone Monterrey" },
                      { id: "email_contacto", label: "Correo de contacto",  type: "email", placeholder: "contacto@fitzone.mx" },
                      { id: "telefono",       label: "Teléfono (opcional)", type: "tel",   placeholder: "+52-81-1234-5678" },
                    ].map(({ id, label, type, placeholder }) => (
                      <div className="form-group" key={id}>
                        <label htmlFor={id}>{label}</label>
                        <div className="input-dark-container">
                          <input id={id} type={type} placeholder={placeholder}
                            value={gymData[id]}
                            onChange={(e) => setGymData({ ...gymData, [id]: e.target.value })} />
                        </div>
                      </div>
                    ))}

                    {error && (
                      <motion.div className="error-message" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <FiAlertTriangle style={{ marginRight: 6 }} />{error}
                      </motion.div>
                    )}

                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button type="button" style={btnBack} onClick={retroceder}>
                        <FiArrowLeft size={14} /> Atrás
                      </button>
                      <button type="submit" className="login-button" style={{ flex: 1 }}>
                        Siguiente <FiArrowRight style={{ marginLeft: 8 }} />
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* ── Paso 2: Selección de plan ── */}
                {step === 2 && (
                  <motion.div key="paso2plan" variants={slide} initial="hidden" animate="visible" exit="exit">
                    <div style={{
                      background: "rgba(108,99,255,0.08)", border: "1px solid var(--accent)",
                      borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12.5,
                      color: "var(--text-secondary, #ccc)", lineHeight: 1.5,
                    }}>
                      Por defecto te registramos con <strong>Starter</strong>, el plan gratuito y más
                      básico — perfecto para empezar. Puedes elegir otro ahora o cambiarlo después
                      desde tu panel de administración.
                    </div>

                    {plansLoading && (
                      <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted, #888)" }}>
                        Cargando planes…
                      </div>
                    )}

                    {!plansLoading && planes.length === 0 && (
                      <div style={{ textAlign: "center", padding: "12px 0", color: "var(--text-muted, #888)", fontSize: 13 }}>
                        No se pudieron cargar los planes en este momento — se usará el plan Starter
                        (gratuito) por defecto. Puedes cambiarlo luego desde tu panel.
                      </div>
                    )}

                    {!plansLoading && planes.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
                        {planes.map((plan) => {
                          const isSelected = selectedPlanId === plan.id;
                          const isStarter  = plan.nombre === "starter";
                          return (
                            <motion.button key={plan.id} type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                              onClick={() => { setSelectedPlanId(plan.id); setError(""); }}
                              style={{
                                textAlign: "left", padding: "14px 16px", borderRadius: 12,
                                border: `2px solid ${isSelected ? "var(--accent)" : "var(--border-color, #333)"}`,
                                background: isSelected ? "var(--accent, #6c63ff)22" : "var(--card-bg, #1e1e2e)",
                                cursor: "pointer", position: "relative",
                              }}
                            >
                              {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                  style={{ position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <FiCheck size={10} color="#fff" />
                                </motion.div>
                              )}
                              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "var(--accent)" : "var(--text-primary, #fff)", textTransform: "capitalize" }}>
                                  {plan.nombre}
                                </span>
                                {isStarter && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--success, #4cd964)", background: "rgba(76,217,100,0.14)", borderRadius: 6, padding: "2px 6px" }}>
                                    GRATIS
                                  </span>
                                )}
                                {plan.destacado && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "rgba(108,99,255,0.14)", borderRadius: 6, padding: "2px 6px" }}>
                                    RECOMENDADO
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-muted, #888)", marginBottom: 6 }}>
                                {plan.titulo_comercial || plan.descripcion}
                              </div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: isSelected ? "var(--accent)" : "var(--text-primary, #fff)" }}>
                                {plan.precio_mensual_mxn === 0 ? "Gratis" : plan.precio_display}
                              </div>
                              {Array.isArray(plan.caracteristicas) && plan.caracteristicas.length > 0 && (
                                <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 11.5, color: "var(--text-secondary, #ccc)", lineHeight: 1.6 }}>
                                  {plan.caracteristicas.slice(0, 3).map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {error && (
                      <motion.div className="error-message" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <FiAlertTriangle style={{ marginRight: 6 }} />{error}
                      </motion.div>
                    )}

                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button type="button" style={btnBack} onClick={retroceder}>
                        <FiArrowLeft size={14} /> Atrás
                      </button>
                      <button type="button" className="login-button" onClick={avanzar} style={{ flex: 1 }}>
                        Siguiente <FiArrowRight style={{ marginLeft: 8 }} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Paso 3: Datos del admin ── */}
                {step === 3 && (
                  <motion.form key="paso3" variants={slide} initial="hidden" animate="visible" exit="exit"
                    onSubmit={handleSubmit} className="login-form"
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

                      {/* Indicador de fortaleza */}
                      {adminData.password && strength && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                            {[0, 1, 2, 3].map(i => (
                              <div key={i} style={{
                                flex: 1, height: 3, borderRadius: 2,
                                background: i <= strength.level ? strength.color : "var(--border-color, #333)",
                                transition: "background 0.3s",
                              }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted, #888)", marginLeft: 8 }}>
                            · Usa mayúsculas, números y símbolos para mayor seguridad
                          </span>
                        </div>
                      )}
                    </div>

                    {error && (
                      <motion.div className="error-message" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <FiAlertTriangle style={{ marginRight: 6 }} />{error}
                      </motion.div>
                    )}

                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button type="button" style={btnBack} onClick={retroceder}>
                        <FiArrowLeft size={14} /> Atrás
                      </button>
                      <button type="submit" className="login-button" disabled={loading} style={{ flex: 1 }}>
                        {loading
                          ? <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          : <>Crear gimnasio <FiArrowRight style={{ marginLeft: 8 }} /></>
                        }
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
