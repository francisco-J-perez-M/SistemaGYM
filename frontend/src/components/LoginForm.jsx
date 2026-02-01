import { useState, useRef, useEffect } from "react";
import { login } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import useTheme from "../hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import "../css/CSSUnificado.css";
import { FiSun, FiMoon, FiStar, FiEye, FiEyeOff, FiAlertTriangle } from "react-icons/fi";
import { GiPineTree } from "react-icons/gi";


export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      localStorage.setItem("token", result.access_token);
      localStorage.setItem("user", JSON.stringify(result.user));

      if (result.user.role === "Administrador") {
        navigate("/dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Variantes de animación para los elementos
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  const leftSideVariants = {
    hidden: { opacity: 0, x: -100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const heroTextVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.2,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    })
  };

  return (
    <div className="split-login-container">
      {/* Lado izquierdo - Imagen con animación */}
      <motion.div 
        className="login-left-side"
        variants={leftSideVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="brand-logo-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="brand-text-logo">GYM PRO</h1>
        </motion.div>
        
        <div className="brand-hero-text">
          <motion.h2
            custom={0}
            variants={heroTextVariants}
            initial="hidden"
            animate="visible"
          >
            Supera tus límites,
          </motion.h2>
          <motion.h2
            custom={1}
            variants={heroTextVariants}
            initial="hidden"
            animate="visible"
          >
            define tu futuro.
          </motion.h2>
        </div>

        {/* Indicadores animados */}
        <motion.div 
          className="hero-indicators"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.span 
            className="active"
            animate={{ width: [10, 30, 10, 30] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <span></span>
          <span></span>
        </motion.div>
      </motion.div>

      {/* Lado derecho - Formulario con animación */}
      <motion.div 
        className="login-right-side"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Botón de temas con animación */}
        <div className="login-theme-wrapper" ref={menuRef}>
          <motion.button 
            className={`theme-toggle-btn login-variant ${showThemeMenu ? 'active' : ''}`}
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="theme-toggle-icon">{currentTheme?.icon}</span>
            <span className="theme-btn-text" style={{marginLeft: '8px', fontSize: '13px'}}>Tema</span>
          </motion.button>

          <AnimatePresence>
            {showThemeMenu && (
              <motion.div 
                className="theme-dropdown login-dropdown-pos"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                {themeOptions.map((t, idx) => (
                  <motion.button
                    key={t.id}
                    className={`theme-option ${theme === t.id ? "active" : ""}`}
                    onClick={() => { changeTheme(t.id); setShowThemeMenu(false); }}
                    type="button"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ x: 5 }}
                  >
                    <span className="theme-icon">{t.icon}</span>
                    <span>{t.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div 
          className="login-card"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="login-header" variants={itemVariants}>
            <h2>Iniciar Sesión</h2>
            <p className="login-subtitle">Bienvenido de nuevo.</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="login-form">
            <motion.div className="form-group" variants={itemVariants}>
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-dark-container">
                <motion.input
                  id="email" 
                  type="email" 
                  placeholder="ejemplo@correo.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  disabled={loading}
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>

            <motion.div className="form-group" variants={itemVariants}>
              <label htmlFor="password">Contraseña</label>
              <div className="input-dark-container password-input-wrapper">
                <motion.input
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="******"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={loading}
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? <FiEye /> : <FiEyeOff />}
                </motion.button>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  className="error-message"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 25 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.span
                    initial={{ x: -10 }}
                    animate={{ x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <FiAlertTriangle style={{ marginRight: 6 }} />
{error}

                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              type="submit" 
              className="login-button" 
              disabled={loading}
              variants={itemVariants}
              whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <motion.span 
                  className="spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                "Ingresar al sistema"
              )}
            </motion.button>

            <motion.p className="register-link" variants={itemVariants}>
              ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
            </motion.p>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
