/**
 * POSCheckoutModal.jsx — Modal de confirmacion de cobro con seleccion
 * de miembro y datos segun metodo de pago (Efectivo / Tarjeta / Transferencia).
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCheck, FiAlertCircle, FiCreditCard, FiRefreshCw, FiDollarSign, FiUser, FiLock } from "react-icons/fi";
import { registrarVenta } from "../../api/owner_gym";

const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
const nowStr = () => new Date().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });

const inputSt = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px",
  background: "var(--bg-dark, #0f1117)",
  border: "1px solid var(--border, rgba(255,255,255,.12))",
  borderRadius: 8, color: "var(--text-primary, #f1f5f9)", fontSize: 14, outline: "none",
};
const labelSt = {
  display: "block", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: ".06em",
  color: "var(--text-secondary, #94a3b8)", marginBottom: 5,
};

export default function CheckoutModal({ cart, miembros, onClose, onComplete }) {
  const [miembro,    setMiembro]  = useState("");
  const [metodo,     setMetodo]   = useState("Efectivo");
  const [tarjeta,    setTarjeta]  = useState("");
  const [referencia, setRef]      = useState("");
  const [loading,    setLoading]  = useState(false);
  const [err,        setErr]      = useState("");

  // Si el usuario autenticado es un Miembro, se auto-asigna la venta a él.
  // lockedMiembro: { pgId: number, nombre: string } | null
  const [lockedMiembro, setLockedMiembro] = useState(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u.role === "Miembro" || u.role === "user") {
        setLockedMiembro({ pgId: parseInt(u.id, 10), nombre: u.nombre || "" });
      }
    } catch { /* si no hay user en storage, no bloqueamos */ }
  }, []);

  const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);

  const handlePagar = async () => {
    if (metodo === "Tarjeta"       && !tarjeta.trim())    { setErr("Ingresa el numero de tarjeta");        return; }
    if (metodo === "Transferencia" && !referencia.trim()) { setErr("Ingresa la referencia de transferencia"); return; }
    setLoading(true); setErr("");
    try {
      // Miembro auto-asignado (rol Miembro): usa el PG user ID para el lookup de email en backend.
      // Selección manual (staff): usa el Mongo _id tal cual — se almacena en ventas sin conversión.
      const id_miem   = lockedMiembro
        ? lockedMiembro.pgId
        : (miembro || null);
      const nom_miem  = lockedMiembro
        ? lockedMiembro.nombre
        : (miembros.find(m => String(m.id) === String(miembro))?.nombre || "");

      const payload = {
        items:          cart.map(({ id, nombre, precio, qty, categoria }) => ({ id, nombre, precio, qty, categoria })),
        total,
        metodo_pago:    metodo,
        id_miembro:     id_miem,
        nombre_miembro: nom_miem,
        numero_tarjeta: metodo === "Tarjeta"       ? tarjeta    : "",
        referencia:     metodo === "Transferencia" ? referencia : "",
      };
      const res = await registrarVenta(payload);
      onComplete({ ...payload, id: res.data?.id, fecha: nowStr() });
    } catch (e) {
      setErr(e.response?.data?.error || "Error al registrar la venta");
      setLoading(false);
    }
  };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9992, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 9993, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, pointerEvents: "none" }}>
        <div style={{ background: "var(--bg-card, #1a1d2e)", border: "1px solid var(--border, rgba(255,255,255,.08))", borderRadius: 12, padding: 0, maxWidth: 460, width: "100%", pointerEvents: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid var(--border, rgba(255,255,255,.08))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FiDollarSign size={18} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Confirmar cobro</h3>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><FiX size={18} /></button>
          </div>

          {/* Resumen de items */}
          <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--border, rgba(255,255,255,.08))", maxHeight: 160, overflowY: "auto" }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, fontSize: 13 }}>
                <span style={{ color: "var(--text-primary)" }}>
                  {item.nombre} <span style={{ color: "var(--text-secondary)" }}>x{item.qty}</span>
                </span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>{fmt(item.precio * item.qty)}</span>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Miembro */}
            <div>
              <label style={labelSt}>
                <FiUser style={{ display: "inline", marginRight: 4 }} size={11} />
                Miembro {lockedMiembro ? "" : "(opcional)"}
              </label>

              {lockedMiembro ? (
                /* Compra propia: campo bloqueado, asignado automáticamente */
                <div style={{
                  ...inputSt,
                  display: "flex", alignItems: "center", gap: 10,
                  cursor: "default", userSelect: "none",
                  border: "1px solid rgba(99,102,241,.4)",
                  background: "rgba(99,102,241,.07)",
                }}>
                  <FiUser size={14} color="#6366f1" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600 }}>{lockedMiembro.nombre}</span>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 10, fontWeight: 700, color: "#6366f1",
                    background: "rgba(99,102,241,.18)", borderRadius: 99,
                    padding: "2px 8px", flexShrink: 0,
                  }}>
                    <FiLock size={9} /> Tú
                  </span>
                </div>
              ) : (
                /* Staff: selector libre de miembro */
                <select style={inputSt} value={miembro} onChange={e => setMiembro(e.target.value)}>
                  <option value="">Venta sin miembro asociado</option>
                  {miembros.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Metodo de pago */}
            <div>
              <label style={labelSt}>Metodo de pago</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { id: "Efectivo",      label: "Efectivo"     },
                  { id: "Tarjeta",       label: "Tarjeta"      },
                  { id: "Transferencia", label: "Transferencia" },
                ].map(m => (
                  <button key={m.id} type="button" onClick={() => { setMetodo(m.id); setErr(""); }}
                    style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: metodo === m.id ? "#6366f1" : "var(--bg-input, rgba(255,255,255,.05))",
                      color: metodo === m.id ? "#fff" : "var(--text-secondary)" }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo condicional */}
            {metodo === "Tarjeta" && (
              <div>
                <label style={labelSt}><FiCreditCard style={{ display: "inline", marginRight: 4 }} size={11} />Numero de tarjeta</label>
                <input style={inputSt} placeholder="**** **** **** ****" value={tarjeta} onChange={e => setTarjeta(e.target.value)} maxLength={19} />
              </div>
            )}
            {metodo === "Transferencia" && (
              <div>
                <label style={labelSt}><FiRefreshCw style={{ display: "inline", marginRight: 4 }} size={11} />Referencia / CLABE</label>
                <input style={inputSt} placeholder="Referencia de transferencia" value={referencia} onChange={e => setRef(e.target.value)} />
              </div>
            )}

            {err && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "8px 12px", color: "#ef4444", fontSize: 12 }}>
                <FiAlertCircle size={14} /> {err}
              </div>
            )}

            {/* Total + boton */}
            <div style={{ borderTop: "1px solid var(--border, rgba(255,255,255,.08))", paddingTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Total a cobrar</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9" }}>{fmt(total)}</span>
              </div>
              <button onClick={handlePagar} disabled={loading}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
                  background: loading ? "#4f46e5" : "#6366f1", color: "#fff",
                  fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.8 : 1 }}>
                {loading ? "Procesando..." : <><FiCheck size={16} /> Confirmar cobro</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
