//frontend\src\components\LoginForm.jsx
import { useState } from "react";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";
import "../css/LoginForm.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const result = await login(email, password);

    // Guardar token y usuario
    localStorage.setItem("token", result.access_token);
    localStorage.setItem("user", JSON.stringify(result.user));

    // Redirección por rol
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
      {/* Lado izquierdo: Imagen de Gimnasio y Branding */}
      <div className="login-left-side">
        <div className="brand-logo-container">
           {/* Puedes reemplazar este texto por tu logo SVG si tienes uno */}
          <h1 className="brand-text-logo">GYM PRO</h1>
        </div>
        
        <div className="brand-hero-text">
          <h2>Supera tus límites,</h2>
          <h2>define tu futuro.</h2>
          {/* Elementos decorativos tipo carrusel como en la imagen de referencia */}
          <div className="hero-indicators">
            <span className="active"></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      {/* Lado derecho: Formulario Oscuro */}
      <div className="login-right-side">
        <div className="login-card">
          <div className="login-header">
            <h2>Iniciar Sesión</h2>
            <p className="login-subtitle">Bienvenido de nuevo, ingresa tus credenciales.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Campo Email */}
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

            {/* Campo Contraseña */}
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

            {/* Recordar usuario y Olvidé contraseña */}
            <div className="form-options">
                <div className="remember-me">
                <input type="checkbox" id="remember" className="custom-checkbox" />
                <label htmlFor="remember">Recordar mi cuenta</label>
                </div>
                <a href="/forgot-password" className="forgot-password">¿Olvidaste tu contraseña?</a>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Botón de envío */}
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Procesando...
                </>
              ) : (
                "Ingresar al sistema"
              )}
            </button>

            {/* Enlace de registro */}
            <p className="register-link">
              ¿No tienes una cuenta? <a href="/register">Regístrate aquí</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}