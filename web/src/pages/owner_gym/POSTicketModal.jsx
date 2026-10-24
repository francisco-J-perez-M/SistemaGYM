/**
 * POSTicketModal.jsx — Recibo / comprobante de venta con opcion de imprimir.
 */
import { createPortal } from "react-dom";
import { FiX, FiPrinter, FiCheck } from "react-icons/fi";

const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export default function TicketModal({ venta, onClose }) {
  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9994, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 9995, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, pointerEvents: "none" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 0, maxWidth: 380, width: "100%", pointerEvents: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px 0" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Comprobante de venta</span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><FiX size={16} /></button>
          </div>

          <div style={{ padding: "14px 22px 22px", fontFamily: "monospace" }}>
            {/* Encabezado */}
            <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "1px dashed var(--border)" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--accent)", letterSpacing: 3 }}>GYM PRO</div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>Punto de Venta</div>
              <div style={{ fontSize: 10, color: "var(--text-tertiary, var(--text-tertiary))", marginTop: 4 }}>{venta.fecha}</div>
              {venta.id && (
                <div style={{ fontSize: 9, color: "var(--text-tertiary)", marginTop: 2 }}>
                  #{venta.id.slice(-8).toUpperCase()}
                </div>
              )}
            </div>

            {/* Cliente */}
            {venta.nombre_miembro && (
              <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px dashed var(--border)", fontSize: 12 }}>
                <span style={{ color: "var(--text-secondary)" }}>Cliente: </span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{venta.nombre_miembro}</span>
              </div>
            )}

            {/* Items */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-tertiary)", marginBottom: 6, borderBottom: "1px solid rgba(255,255,255,.06)", paddingBottom: 4 }}>
                <span>ARTICULO</span><span>IMPORTE</span>
              </div>
              {venta.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-primary)", flex: 1 }}>
                    {item.nombre} <span style={{ color: "var(--text-secondary)" }}>x{item.qty}</span>
                  </span>
                  <span style={{ color: "var(--success)", fontWeight: 700, marginLeft: 8 }}>{fmt(item.precio * item.qty)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 900 }}>
                <span style={{ color: "var(--text-primary)" }}>TOTAL</span>
                <span style={{ color: "var(--success)" }}>{fmt(venta.total)}</span>
              </div>
            </div>

            {/* Metodo de pago */}
            <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 10, fontSize: 11, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Metodo:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{venta.metodo_pago}</span>
              </div>
              {venta.numero_tarjeta && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Tarjeta:</span>
                  <span style={{ color: "var(--text-primary)" }}>.... {venta.numero_tarjeta.slice(-4)}</span>
                </div>
              )}
              {venta.referencia && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Referencia:</span>
                  <span style={{ color: "var(--text-primary)" }}>{venta.referencia}</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 10, color: "var(--text-tertiary)", borderTop: "1px dashed var(--border)", paddingTop: 12 }}>
              Gracias por tu compra
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", gap: 10, padding: "0 22px 20px" }}>
            <button onClick={() => window.print()}
              style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <FiPrinter size={14} /> Imprimir
            </button>
            <button onClick={onClose}
              style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <FiCheck size={14} /> Cerrar
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
