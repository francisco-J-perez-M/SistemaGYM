/**
 * CambiarPasswordInicial.jsx — SCRUM-224.
 *
 * Pasarela obligatoria para cualquier cuenta (Miembro, Entrenador,
 * Recepcionista, Administrador) cuya contraseña actual no eligió la
 * propia persona: la generó el sistema al crear la cuenta, o la reseteó
 * un Propietario/Administrador (ver Usuario.debe_cambiar_password,
 * migración 025). No aplica al Propietario: su wizard equivalente es
 * OwnerOnboarding.jsx (primer_login), porque él SÍ elige su propia
 * contraseña al registrarse.
 *
 * AuthPage.jsx redirige aquí ANTES que a cualquier otro destino post-login
 * si debe_cambiar_password viene en true -- ver handleLoginSubmit(). Esta
 * pantalla, a su vez, no deja avanzar a ningún panel hasta que el cambio
 * se confirme contra el backend (PUT /api/auth/cambiar-password-inicial).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiAlertTriangle, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { cambiarPasswordInicial } from "../../api/auth";
import { passwordStrength } from "../../utils/passwordStrength";
import "../../css/CSSUnificado.css";

export default function CambiarPasswordInicial() {
  const navigate = useNavigate();

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword]  = useState("");
  const [showPass,        setShowPass]         = useState(false);
  const [loading,         setLoading]          = useState(false);
  const [error,           setError]            = useState("");

  const strength = passwordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await cambiarPasswordInicial(password);

      localStorage.setItem("token", res.access_token);
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "{}"); }
        catch { return {}; }
      })();
      localStorage.setItem("user", JSON.stringify({
        ...storedUser,
        ...res.user,
        debe_cambiar_password: false,
      }));

      // Mismo switch de roles que AuthPage.jsx tras un login normal --
      // esta pantalla es el único tramo intermedio antes de llegar ahí,
      // así que no vale la pena extraer un helper compartido por un solo
      // punto de uso adicional.
      const role = (res.user.role || "").toLowerCase();
      if (role === "entrenador") navigate("/trainer-dashboard");
      else if (role === "recepcionista") navigate("/receptionist-dashboard");
      else if (role === "administrador" || role === "owner_gym" || role === "propietario") navigate("/owner");
      else navigate("/user/dashboard");
    } catch (e) {
      setError(e.message || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Mismo patrón de contención de scroll que OwnerOnboarding.jsx
    // (ver su comentario SCRUM-224 / item A): overflowY:auto en el
    // contenedor en vez de min-height:100vh a secas.
    <div style={{
      minHeight: "100vh",
      overflowY: "auto",
      background: "var(--bg-input)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 440,
        margin: "auto 0",
        background: "var(--bg-card)",
        border: "1px solid var(--border-dark)",
        borderRadius: 20,
        padding: "36px 36px 32px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", margin: "0 auto 14px",
            background: "rgba(108,99,255,0.12)", color: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FiLock size={20} />
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>
            Crea tu contraseña
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
            Por seguridad, antes de continuar necesitas cambiar la contraseña
            temporal que te enviamos por correo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="nueva_pass">Nueva contraseña</label>
            <div className="input-dark-container password-input-wrapper">
              <input
                id="nueva_pass"
                type={showPass ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <button type="button" className="password-toggle-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>

            {password && strength && (
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
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmar_pass">Confirmar contraseña</label>
            <div className="input-dark-container">
              <input
                id="confirmar_pass"
                type={showPass ? "text" : "password"}
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ marginTop: 4 }}>
              <FiAlertTriangle style={{ marginRight: 6 }} />{error}
            </div>
          )}

          <button type="submit" disabled={loading} className="login-button" style={{ marginTop: 10 }}>
            {loading
              ? <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              : <><FiCheck style={{ marginRight: 6 }} />Continuar</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
