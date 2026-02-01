import { useState, useRef, useEffect } from "react";
import { register } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import useTheme from "../hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import "../css/CSSUnificado.css";
import { FiSun, FiMoon, FiStar, FiEye, FiEyeOff, FiAlertTriangle } from "react-icons/fi";
import { GiPineTree } from "react-icons/gi";


export default function RegisterForm() {
  const [formData, setFormData] = useState({
    nombre: "", email: "", password: "", telefono: "", sexo: "M"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register(formData);
      alert("¡Cuenta creada! Ahora puedes iniciar sesión.");
      navigate("/"); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Variantes de animación
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
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

  const imageSideVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div className="split-login-container register-layout">
      
      {/* SECCIÓN FORMULARIO (Izquierda) */}
      <motion.div 
        className="login-right-side"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        
        {/* Botón de Temas */}
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
                transition={{ duration: 0.2 }}
              >
                {themeOptions.map((t, idx) => (
                  <motion.button
                    key={t.id}
                    className={`theme-option ${theme === t.id ? "active" : ""}`}
                    onClick={() => {changeTheme(t.id); setShowThemeMenu(false);}}
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
          className="login-card register-variant"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="login-header" variants={itemVariants}>
            <h2>Crear Cuenta</h2>
            <p className="login-subtitle">Únete al equipo GYM PRO.</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="register-grid">
              
              <motion.div 
                className="form-group grid-full-width" 
                variants={itemVariants}
              >
                <label htmlFor="nombre">Nombre Completo</label>
                <div className="input-dark-container">
                  <motion.input 
                    id="nombre" 
                    type="text" 
                    placeholder="Ej. Juan Pérez" 
                    onChange={handleChange} 
                    required
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </motion.div>

              <motion.div 
                className="form-group grid-full-width" 
                variants={itemVariants}
              >
                <label htmlFor="email">Correo electrónico</label>
                <div className="input-dark-container">
                  <motion.input 
                    id="email" 
                    type="email" 
                    placeholder="correo@ejemplo.com" 
                    onChange={handleChange} 
                    required
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
                    onChange={handleChange} 
                    required
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

              <motion.div className="form-group" variants={itemVariants}>
                <label htmlFor="telefono">Teléfono</label>
                <div className="input-dark-container">
                  <motion.input 
                    id="telefono" 
                    type="text" 
                    placeholder="1234-5678" 
                    onChange={handleChange}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </motion.div>

              <motion.div 
                className="form-group grid-full-width" 
                variants={itemVariants}
              >
                <label htmlFor="sexo">Sexo</label>
                <div className="input-dark-container">
                  <motion.select 
                    id="sexo" 
                    onChange={handleChange} 
                    value={formData.sexo}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </motion.select>
                </div>
              </motion.div>
            </div>

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
                "Completar Registro"
              )}
            </motion.button>

            <motion.p className="register-link" variants={itemVariants}>
              ¿Ya tienes cuenta? <Link to="/">Inicia sesión aquí</Link>
            </motion.p>
          </form>
        </motion.div>
      </motion.div>

      {/* SECCIÓN IMAGEN (Derecha) */}
      <motion.div 
        className="login-left-side register-image-side"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%), url('https://img.freepik.com/foto-gratis/entrenamiento-hombre-fuerte-gimnasio_1303-23478.jpg?semt=ais_user_personalization&w=740&q=80')`,
          backgroundPosition: 'center top'
        }}
        variants={imageSideVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="brand-logo-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <h1 className="brand-text-logo">GYM PRO</h1>
        </motion.div>

        <div className="brand-hero-text" style={{ textAlign: 'right', width: '100%' }}>
          <motion.h2
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Transforma
          </motion.h2>
          <motion.h2
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            tu cuerpo.
          </motion.h2>
        </div>
      </motion.div>

    </div>
  );
}
