/**
 * BotonesPago.jsx — Selector de método de pago en línea reutilizable.
 *
 * Muestra un botón por cada pasarela que el gimnasio tenga activa y, al pulsarlo,
 * crea el cobro y redirige al usuario a PayPal o Mercado Pago. Si el gimnasio no
 * ha configurado ningún método, muestra un aviso en lugar de botones.
 *
 * Uso:
 *   <BotonesPago contexto="membresia" monto={499} descripcion="Membresía mensual"
 *                referenciaLocal={idMiembro} onAntesDePagar={guardarBorrador} />
 */
import { useState, useEffect } from "react";
import { FiCreditCard, FiLoader } from "react-icons/fi";
import Swal from "sweetalert2";
import { getMetodosPago, pagarYRedirigir } from "../../api/pagos";

const COLORES = {
  paypal:      { bg: "#ffc439", fg: "#111827" },
  mercadopago: { bg: "#00b1ea", fg: "#ffffff" },
};

export default function BotonesPago({
  contexto = "membresia",
  monto = 0,
  descripcion = "",
  referenciaLocal = null,
  emailPagador = null,
  onAntesDePagar = null,
  deshabilitado = false,
}) {
  const [metodos, setMetodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const { data } = await getMetodosPago();
        if (vivo) setMetodos(data.metodos || []);
      } catch {
        if (vivo) setMetodos([]);
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => { vivo = false; };
  }, []);

  const pagar = async (proveedor) => {
    if (!monto || monto <= 0) {
      Swal.fire({ icon: "warning", title: "Monto inválido",
        text: "El importe debe ser mayor que cero.",
        background: "var(--bg-card)", color: "var(--text-primary)" });
      return;
    }
    setProcesando(proveedor);
    try {
      if (onAntesDePagar) await onAntesDePagar();
      await pagarYRedirigir({
        proveedor, contexto, monto,
        descripcion: descripcion || "Pago GymPro",
        referencia_local: referenciaLocal,
        email_pagador: emailPagador,
      });
      // pagarYRedirigir cambia window.location; si vuelve, hubo algo raro
    } catch (e) {
      Swal.fire({ icon: "error", title: "No se pudo iniciar el pago",
        text: e?.response?.data?.msg || "Intenta de nuevo más tarde.",
        background: "var(--bg-card)", color: "var(--text-primary)" });
      setProcesando(null);
    }
  };

  if (cargando) {
    return <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Cargando métodos de pago…</p>;
  }

  if (!metodos.length) {
    return (
      <div style={{
        background: "var(--bg-input)", borderRadius: 8, padding: "12px 14px",
        fontSize: 12.5, color: "var(--text-secondary)", borderLeft: "3px solid var(--warning)",
      }}>
        Este gimnasio aún no tiene activados los pagos en línea. El dueño puede
        configurarlos en Configuración → Cobros en línea.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {metodos.map((m) => {
        const c = COLORES[m.proveedor] || { bg: "var(--accent)", fg: "#111" };
        const enCurso = procesando === m.proveedor;
        return (
          <button
            key={m.proveedor}
            onClick={() => pagar(m.proveedor)}
            disabled={deshabilitado || !!procesando}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: "none", borderRadius: 10, padding: "11px 18px",
              fontSize: 14, fontWeight: 700, cursor: procesando ? "wait" : "pointer",
              background: c.bg, color: c.fg,
              opacity: deshabilitado || (procesando && !enCurso) ? 0.6 : 1,
            }}
          >
            {enCurso ? <FiLoader /> : <FiCreditCard />}
            {enCurso ? "Redirigiendo…" : `Pagar con ${m.nombre}`}
            {m.modo === "sandbox" && (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 6,
                background: "rgba(0,0,0,.18)",
              }}>
                PRUEBAS
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
