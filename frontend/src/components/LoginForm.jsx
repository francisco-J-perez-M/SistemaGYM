import { useState, useRef, useEffect } from "react";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";
import useTheme from "../hooks/useTheme"; // Importamos el hook
import "../css/CSSUnificado.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Lógica del Tema
  const { theme, changeTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // 1. Definimos los mismos iconos SVG profesionales
  const themeOptions = [
    { 
      id: "light", label: "Claro", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg> 
    },
    { 
      id: "dark", label: "Oscuro", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg> 
    },
    { 
      id: "forest", label: "Bosque", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L4 13h5l-2 9h10l-2-9h5z" /></svg> 
    },
    { 
      id: "nebula", label: "Nebulosa", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg> 
    },
  ];

  const currentTheme = themeOptions.find(t => t.id === theme);

  // 2. Cerrar menú al hacer click fuera
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

  return (
    <div className="split-login-container">
      {/* Lado izquierdo */}
      <div className="login-left-side">
        <div className="brand-logo-container">
          <h1 className="brand-text-logo">GYM PRO</h1>
        </div>
        <div className="brand-hero-text">
          <h2>Supera tus límites,</h2>
          <h2>define tu futuro.</h2>
          <div className="hero-indicators">
            <span className="active"></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      {/* Lado derecho */}
      <div className="login-right-side">
        
        {/* --- NUEVO: BOTÓN DE TEMA FLOTANTE --- */}
        <div className="login-theme-wrapper" ref={menuRef}>
          <button 
            className={`theme-toggle-btn login-variant ${showThemeMenu ? 'active' : ''}`}
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            type="button" // Importante para que no envíe el formulario
          >
             <span className="theme-toggle-icon">{currentTheme?.icon}</span>
             <span className="theme-btn-text" style={{marginLeft: '8px', fontSize: '13px'}}>Tema</span>
          </button>

          {showThemeMenu && (
            <div className="theme-dropdown login-dropdown-pos">
              {themeOptions.map(t => (
                <button
                  key={t.id}
                  className={`theme-option ${theme === t.id ? "active" : ""}`}
                  onClick={() => {
                    changeTheme(t.id);
                    setShowThemeMenu(false);
                  }}
                  type="button"
                >
                  <span className="theme-icon">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* ------------------------------------- */}

        <div className="login-card">
          <div className="login-header">
            <h2>Iniciar Sesión</h2>
            <p className="login-subtitle">Bienvenido de nuevo, ingresa tus credenciales.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-dark-container">
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-container">
                <label htmlFor="password">Contraseña</label>
              </div>
              <div className="input-dark-container">
                <input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-options">
                <div className="remember-me">
                <input type="checkbox" id="remember" className="custom-checkbox" />
                <label htmlFor="remember">Recordar mi cuenta</label>
                </div>
                <a href="/forgot-password" className="forgot-password">¿Olvidaste tu contraseña?</a>
            </div>

            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Procesando...
                </>
              ) : (
                "Ingresar al sistema"
              )}
            </button>

            <p className="register-link">
              ¿No tienes una cuenta? <a href="/register">Regístrate aquí</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}