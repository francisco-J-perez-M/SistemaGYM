import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../api/auth";
import {
  FiArrowLeft, FiMail, FiEye, FiEyeOff, FiAlertTriangle, FiCheckCircle, FiLock,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

/**
 * Recuperación de contraseña por correo (código de 6 dígitos).
 * Paso 1: pedir correo → backend envía el código.
 * Paso 2: ingresar código + nueva contraseña → restablecer.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [email, setEmail]     = useState("");
  const [code, setCode]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState("");
  const [info, setInfo]       = useState("");
  const [loading, setLoading] = useState(false);

  const enviarCodigo = async (e) => {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      setInfo(res.msg || "Si el correo está registrado, te enviamos un código.");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const restablecer = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase(), code.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const wrap = {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--bg, #0f0f1a)", padding: 20,
  };
  const card = {
    width: "100%", maxWidth: 420, background: "var(--bg-card, #16213e)",
    border: "1px solid var(--border, #2d3748)", borderRadius: 18, padding: 28,
    color: "var(--text, #e2e8f0)",
  };
  const inputBox = {
    display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input, #1e293b)",
    border: "1px solid var(--border, #2d3748)", borderRadius: 10, padding: "10px 12px", marginTop: 6,
  };
  const inputEl = { flex: 1, background: "transparent", border: "none", outline: "none", color: "inherit", fontSize: 14 };
  const btn = {
    width: "100%", marginTop: 18, padding: "12px 16px", borderRadius: 10, border: "none",
    background: "var(--accent, #6c63ff)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
  };
  const label = { fontSize: 13, fontWeight: 600, color: "var(--text-secondary, #94a3b8)" };

  return (
    <div style={wrap}>
      <div style={card}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary, #94a3b8)", textDecoration: "none", fontSize: 13, marginBottom: 14 }}>
          <FiArrowLeft /> Volver a iniciar sesión
        </Link>

        <h2 style={{ margin: "0 0 4px" }}>Recuperar contraseña</h2>
        <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: 14, marginTop: 0 }}>
          {step === 1
            ? "Ingresa tu correo y te enviaremos un código de 6 dígitos."
            : "Revisa tu correo, escribe el código y define tu nueva contraseña."}
        </p>

        {info && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.12)", color: "#22c55e", padding: "10px 12px", borderRadius: 10, fontSize: 13, margin: "10px 0" }}>
            <FiCheckCircle /> <span>{info}</span>
          </div>
        )}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.12)", color: "#ef4444", padding: "10px 12px", borderRadius: 10, fontSize: 13, margin: "10px 0" }}>
            <FiAlertTriangle /> <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={enviarCodigo}>
            <label style={label}>Correo electrónico</label>
            <div style={inputBox}>
              <FiMail color="var(--text-secondary, #94a3b8)" />
              <input style={inputEl} type="email" placeholder="ejemplo@correo.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <button style={btn} type="submit" disabled={loading}>
              {loading ? "Enviando…" : "Enviar código"}
            </button>
          </form>
        ) : (
          <form onSubmit={restablecer}>
            <label style={label}>Código de 6 dígitos</label>
            <div style={inputBox}>
              <input style={{ ...inputEl, letterSpacing: 4, textAlign: "center", fontSize: 18 }}
                inputMode="numeric" maxLength={6} placeholder="______" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required disabled={loading} />
            </div>

            <label style={{ ...label, display: "block", marginTop: 14 }}>Nueva contraseña</label>
            <div style={inputBox}>
              <FiLock color="var(--text-secondary, #94a3b8)" />
              <input style={inputEl} type={showPass ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ background: "none", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer" }}>
                {showPass ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>

            <label style={{ ...label, display: "block", marginTop: 14 }}>Confirmar contraseña</label>
            <div style={inputBox}>
              <FiLock color="var(--text-secondary, #94a3b8)" />
              <input style={inputEl} type={showPass ? "text" : "password"} placeholder="Repite la contraseña"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} required disabled={loading} />
            </div>

            <button style={btn} type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Restablecer contraseña"}
            </button>
            <button type="button" onClick={enviarCodigo} disabled={loading}
              style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "var(--accent, #6c63ff)", fontSize: 13, cursor: "pointer" }}>
              Reenviar código
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
