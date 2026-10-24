import { useState, useRef, useEffect } from "react";
import { login } from "../../api/auth";
import { useNavigate, Link } from "react-router-dom";
import useTheme from "../../hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/CSSUnificado.css";
import { 
  FiSun, FiMoon, FiStar, FiEye, FiEyeOff, FiAlertTriangle 
} from "react-icons/fi";
import { GiPineTree } from "react-icons/gi";
import { normalizarRol, ROL_PROPIETARIO, ROL_ADMINISTRADOR, ROL_MIEMBRO, ROL_ENTRENADOR, ROL_RECEPCIONISTA } from "../../constants/roles";

export default function AuthPage() {
  // --- ESTADOS GENERALES ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- ESTADOS DE DATOS ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        perfil_completo: result.user.perfil_completo,
        primer_login: result.user.primer_login || false,
        debe_cambiar_password: result.user.debe_cambiar_password || false,  // SCRUM-224
      };

      localStorage.setItem("user", JSON.stringify(userData));

      // Normalizado (SCRUM-107 + migración 019): resuelve "owner_gym"
      // (tokens emitidos antes del rename), "Propietario" y los alias
      // informales al mismo identificador canónico.
      const userRole = normalizarRol(userData.role);

      // SCRUM-224: cuenta creada por un Propietario/Administrador (miembro,
      // staff, otro administrador) con una contraseña que no eligió esta
      // persona -- generada al crearla o reseteada manualmente -- va PRIMERO,
      // antes de cualquier otra redirección: no debe llegar a ningún panel
      // (ni siquiera al wizard de onboarding del Propietario) hasta cambiarla.
      if (userData.debe_cambiar_password) {
        navigate("/cambiar-password-inicial");
        return;
      }

      // Primer login de dueño de gimnasio → onboarding obligatorio
      if (userRole === ROL_PROPIETARIO && userData.primer_login) {
        navigate("/owner/bienvenida");
        return;
      }

      if (userRole === ROL_MIEMBRO && !userData.peso_inicial) {
          navigate("/complete-profile");
          return;
      }

      if (userRole === "superadmin") navigate("/superadmin");
      // HU-45 (migración 020): el Administrador de sucursal reutiliza el
      // mismo panel que el Propietario (owner_gym) -- ver roles.js. Antes
      // no tenía rama propia aquí y caía al "else" final (/user/dashboard,
      // el panel de Miembro); Layout.jsx lo rechazaba de inmediato porque
      // "administrador" no está en los roles permitidos de ese panel, y el
      // usuario terminaba de regreso en el login tras un parpadeo del
      // panel equivocado -- el bug reportado por el usuario.
      else if (userRole === ROL_PROPIETARIO || userRole === ROL_ADMINISTRADOR) navigate("/owner");
      else if (userRole === ROL_ENTRENADOR) navigate("/trainer-dashboard");
      else if (userRole === ROL_RECEPCIONISTA) navigate("/receptionist-dashboard");
      else navigate("/user/dashboard");

    } catch (err) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="split-login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >

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

      {/* --- PANEL IZQUIERDO: FORMULARIO --- */}
      <div className="auth-form-panel">
        <div className="login-card custom-auth-card">

          {/* TABS: "Iniciar Sesión" activa aquí; "Crear Cuenta" lleva al
              wizard de alta de gimnasio (layout espejado, ver RegisterGym.jsx) */}
          <div className="auth-tabs">
            <button className="auth-tab active" type="button">
              Iniciar Sesión
            </button>
            <button className="auth-tab" onClick={() => navigate("/register-gym")} type="button">
              Crear Cuenta
            </button>
          </div>

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

            <div style={{ textAlign: "right", marginTop: -8, marginBottom: 4 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: "var(--accent, #6c63ff)", textDecoration: "none" }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <div className="error-message">
                <FiAlertTriangle /> <span>{error}</span>
              </div>
            )}

            <motion.button type="submit" className="login-button" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {loading ? <span className="spinner" /> : "Ingresar al sistema"}
            </motion.button>

            <p style={{ textAlign: "center", marginTop: 14, fontSize: 13 }}>
              <a href="/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary, #94a3b8)", textDecoration: "none" }}>
                Política de Privacidad
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* --- PANEL DERECHO: IMAGEN DE MARCA --- */}
      <div
        className="auth-image-panel"
        style={{
          backgroundImage: "url('/auth-login-hero.jpg')",
          // El logo/leyenda de esta imagen quedan hacia la izquierda;
          // se ancla el recorte ahí para no perderlos en pantallas angostas.
          backgroundPosition: 'left center',
        }}
      />
    </motion.div>
  );
}
