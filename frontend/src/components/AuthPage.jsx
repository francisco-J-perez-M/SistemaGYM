import { useState, useRef, useEffect } from "react";
import { login, register } from "../api/auth";
import { useNavigate } from "react-router-dom";
import useTheme from "../hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import "../css/CSSUnificado.css";
import { 
  FiSun, FiMoon, FiStar, FiEye, FiEyeOff, FiAlertTriangle 
} from "react-icons/fi";
import { GiPineTree } from "react-icons/gi";

export default function AuthPage() {
  // --- ESTADOS GENERALES ---
  const [isLoginView, setIsLoginView] = useState(true); // Controla qué vista mostrar
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // --- ESTADOS DE DATOS ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerData, setRegisterData] = useState({
    nombre: "", email: "", password: "", telefono: "", sexo: "M"
  });

  const { theme, changeTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const themeOptions = [
    { id: "light", label: "Claro", icon: <FiSun /> },
    { id: "dark", label: "Oscuro", icon: <FiMoon /> },
    { id: "forest", label: "Bosque", icon: <GiPineTree /> },
    { id: "nebula", label: "Nebulosa", icon: <FiStar /> },
  ];

  const currentTheme = themeOptions.find(t => t.id === theme);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- MANEJADORES DE SUBMIT ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      localStorage.setItem("token", result.access_token);

      const userData = {
        id: result.user.id,
        nombre: result.user.nombre,
        email: result.user.email,
        role: result.user.role,
        access_level: result.user.access_level || "basico",
        membership_plan: result.user.membership_plan || "Sin Plan",
        peso_inicial: result.user.peso_inicial, 
        perfil_completo: result.user.perfil_completo
      };

      localStorage.setItem("user", JSON.stringify(userData));

      if ((userData.role === "Miembro" || userData.role === "user") && !userData.peso_inicial) {
          navigate("/complete-profile");
          return;
      }

      const userRole = userData.role;
      if (userRole === "Administrador" || userRole === "admin") navigate("/dashboard");
      else if (userRole === "Entrenador" || userRole === "trainer") navigate("/trainer-dashboard");
      else if (userRole === "Recepcionista" || userRole === "receptionist") navigate("/receptionist-dashboard");
      else navigate("/user/dashboard");

    } catch (err) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register(registerData);
      // Tras registro exitoso, limpiamos, mostramos mensaje y cambiamos a la vista de login
      setError("¡Cuenta creada con éxito! Por favor, inicia sesión.");
      setTimeout(() => {
        setError("");
        setIsLoginView(true);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.id]: e.target.value });
  };

  // --- VARIANTES DE ANIMACIÓN ---
  // Animación para que el formulario entre desde los lados (slide effect)
  const formVariants = {
    hidden: (isLogin) => ({
      opacity: 0,
      x: isLogin ? -50 : 50,
    }),
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    },
    exit: (isLogin) => ({
      opacity: 0,
      x: isLogin ? 50 : -50,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    })
  };

  const imageSideVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1 } }
  };

  return (
    <div className="split-login-container">
      
      {/* --- LADO IZQUIERDO (IMAGEN Y TEXTO DINÁMICO) --- */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={isLoginView ? 'login-bg' : 'register-bg'}
          className="login-left-side"
          variants={imageSideVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            backgroundImage: isLoginView 
              ? `linear-gradient(160deg, rgba(10,12,22,0.5) 0%, rgba(10,12,22,0.82) 100%), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')`
              : `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%), url('https://img.freepik.com/foto-gratis/entrenamiento-hombre-fuerte-gimnasio_1303-23478.jpg?semt=ais_user_personalization&w=740&q=80')`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          <div className="brand-logo-container">
            <h1 className="brand-text-logo">GYM PRO</h1>
          </div>
          
          <div className="brand-hero-text">
            <h2>{isLoginView ? "Supera tus límites," : "Transforma"}</h2>
            <h2>{isLoginView ? "define tu futuro." : "tu cuerpo."}</h2>
          </div>

          <div className="hero-indicators">
            <motion.span className={isLoginView ? "active" : ""} />
            <motion.span className={!isLoginView ? "active" : ""} />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* --- LADO DERECHO (FORMULARIOS INTERCAMBIABLES) --- */}
      <motion.div className="login-right-side" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
        
        {/* BOTÓN DE TEMAS */}
        <div className="login-theme-wrapper" ref={menuRef}>
          <motion.button className={`theme-toggle-btn login-variant ${showThemeMenu ? 'active' : ''}`} onClick={() => setShowThemeMenu(!showThemeMenu)} type="button">
            <span className="theme-toggle-icon">{currentTheme?.icon}</span>
            <span className="theme-btn-text" style={{marginLeft: '8px', fontSize: '13px'}}>Tema</span>
          </motion.button>

          <AnimatePresence>
            {showThemeMenu && (
              <motion.div className="theme-dropdown login-dropdown-pos" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {themeOptions.map((t) => (
                  <button key={t.id} className={`theme-option ${theme === t.id ? "active" : ""}`} onClick={() => { changeTheme(t.id); setShowThemeMenu(false); }} type="button">
                    <span className="theme-icon">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="login-card custom-auth-card">
          
          {/* TABS PARA INTERCAMBIAR VISTAS */}
          <div className="auth-tabs">
            <button className={`auth-tab ${isLoginView ? 'active' : ''}`} onClick={() => { setIsLoginView(true); setError(""); }}>
              Iniciar Sesión
            </button>
            <button className={`auth-tab ${!isLoginView ? 'active' : ''}`} onClick={() => { setIsLoginView(false); setError(""); }}>
              Crear Cuenta
            </button>
          </div>

          <AnimatePresence mode="wait" custom={isLoginView}>
            {/* =========================================
                VISTA DE LOGIN
            ========================================= */}
            {isLoginView ? (
              <motion.div key="login" custom={isLoginView} variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <div className="login-header">
                  <h2>Bienvenido de nuevo</h2>
                  <p className="login-subtitle">Ingresa tus credenciales para continuar.</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="login-form">
                  <div className="form-group">
                    <label htmlFor="email">Correo electrónico</label>
                    <div className="input-dark-container">
                      <input id="email" type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <div className="input-dark-container password-input-wrapper">
                      <input id="password" type={showPassword ? "text" : "password"} placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                      <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <FiEye /> : <FiEyeOff />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="error-message">
                      <FiAlertTriangle /> <span>{error}</span>
                    </div>
                  )}

                  <motion.button type="submit" className="login-button" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {loading ? <span className="spinner" /> : "Ingresar al sistema"}
                  </motion.button>
                </form>
              </motion.div>

            ) : (
              
              /* =========================================
                  VISTA DE REGISTRO
              ========================================= */
              <motion.div key="register" custom={isLoginView} variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <div className="login-header">
                  <h2>Únete al equipo</h2>
                  <p className="login-subtitle">Crea tu cuenta en GYM PRO hoy mismo.</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="login-form">
                  <div className="register-grid">
                    <div className="form-group grid-full-width">
                      <label htmlFor="nombre">Nombre Completo</label>
                      <div className="input-dark-container">
                        <input id="nombre" type="text" placeholder="Ej. Juan Pérez" value={registerData.nombre} onChange={handleRegisterChange} required />
                      </div>
                    </div>

                    <div className="form-group grid-full-width">
                      <label htmlFor="email">Correo electrónico</label>
                      <div className="input-dark-container">
                        <input id="email" type="email" placeholder="correo@ejemplo.com" value={registerData.email} onChange={handleRegisterChange} required />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="password">Contraseña</label>
                      <div className="input-dark-container password-input-wrapper">
                        <input id="password" type={showPassword ? "text" : "password"} placeholder="******" value={registerData.password} onChange={handleRegisterChange} required />
                        <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <FiEye /> : <FiEyeOff />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="telefono">Teléfono</label>
                      <div className="input-dark-container">
                        <input id="telefono" type="text" placeholder="1234-5678" value={registerData.telefono} onChange={handleRegisterChange} />
                      </div>
                    </div>

                    <div className="form-group grid-full-width">
                      <label htmlFor="sexo">Sexo</label>
                      <div className="input-dark-container">
                        <select id="sexo" value={registerData.sexo} onChange={handleRegisterChange}>
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className={`error-message ${error.includes('éxito') ? 'success-message' : ''}`} style={error.includes('éxito') ? { background: 'var(--success-bg)', borderColor: 'var(--success)', color: 'var(--success)'} : {}}>
                      <FiAlertTriangle style={error.includes('éxito') ? {color: 'var(--success)'} : {}} /> 
                      <span style={error.includes('éxito') ? {color: 'var(--success)'} : {}}>{error}</span>
                    </div>
                  )}

                  <motion.button type="submit" className="login-button" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {loading ? <span className="spinner" /> : "Completar Registro"}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}