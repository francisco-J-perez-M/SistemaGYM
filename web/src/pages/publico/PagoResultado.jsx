/**
 * PagoResultado.jsx — Páginas de retorno tras el checkout.
 *
 * La pasarela devuelve al usuario a /pago/exito?tx=<id> o /pago/cancelado?tx=<id>.
 * En el caso de éxito se consulta al backend para confirmar el estado real del
 * pago contra la pasarela (no se confía en la URL de retorno).
 *
 * Se exporta un único componente parametrizado por la prop `resultado`.
 */
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiXCircle, FiClock, FiArrowLeft } from "react-icons/fi";
import { getEstadoPago } from "../../api/pagosOnline";

const wrap = {
  minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
  background: "var(--bg-input)", padding: 24,
};
const card = {
  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16,
  padding: "36px 40px", maxWidth: 520, width: "100%", textAlign: "center",
};

/**
 * Panel al que volver según el rol de la sesión. Sin esto, "/" lleva a la
 * pantalla de acceso y parece que la sesión se cerró.
 */
function rutaInicio() {
  let rol = "";
  try {
    const guardado = localStorage.getItem("user") || localStorage.getItem("user_data");
    rol = (guardado ? JSON.parse(guardado)?.rol || JSON.parse(guardado)?.role : "") || "";
  } catch {
    rol = "";
  }
  const destinos = {
    owner_gym:     "/owner",
    admin:         "/owner",
    administrador: "/owner",
    superadmin:    "/superadmin",
    trainer:       "/trainer",
    entrenador:    "/trainer",
    receptionist:  "/receptionist",
    recepcionista: "/receptionist",
    user:          "/user/dashboard",
    miembro:       "/user/dashboard",
  };
  return destinos[String(rol).toLowerCase()] || "/user/dashboard";
}

const ESTADOS = {
  aprobado:  { icon: FiCheckCircle, color: "var(--success)", titulo: "¡Pago completado!",
               texto: "Tu pago se registró correctamente. Gracias." },
  pendiente: { icon: FiClock, color: "var(--warning)", titulo: "Pago en proceso",
               texto: "La pasarela aún está confirmando el pago. Te avisaremos en cuanto se acredite." },
  rechazado: { icon: FiXCircle, color: "var(--danger)", titulo: "Pago rechazado",
               texto: "La pasarela no autorizó el cobro. Intenta con otro método." },
  cancelado: { icon: FiXCircle, color: "var(--text-secondary)", titulo: "Pago cancelado",
               texto: "Cancelaste el proceso de pago. No se realizó ningún cargo." },
};

export default function PagoResultado({ resultado = "exito" }) {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const txId      = params.get("tx");
  const [estado, setEstado]   = useState(resultado === "cancelado" ? "cancelado" : null);
  const [detalle, setDetalle] = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (resultado === "cancelado" || !txId) return;
    let vivo = true;
    (async () => {
      try {
        const { data } = await getEstadoPago(txId);
        if (!vivo) return;
        setDetalle(data.transaccion);
        setEstado(data.transaccion?.estado || "pendiente");
      } catch (e) {
        if (!vivo) return;
        setError(e?.response?.data?.msg || "No se pudo confirmar el pago.");
        setEstado("pendiente");
      }
    })();
    return () => { vivo = false; };
  }, [txId, resultado]);

  const conf = ESTADOS[estado] || null;
  const Icono = conf?.icon || FiClock;

  return (
    <div style={wrap}>
      <div style={card}>
        {!conf ? (
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Confirmando tu pago…</p>
        ) : (
          <>
            <Icono style={{ fontSize: 56, color: conf.color, marginBottom: 14 }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
              {conf.titulo}
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
              {conf.texto}
            </p>

            {detalle && (
              <div style={{
                background: "var(--bg-input)", borderRadius: 10, padding: "14px 16px",
                textAlign: "left", fontSize: 13, marginBottom: 22,
              }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: 6 }}>
                  Referencia: <b style={{ color: "var(--text-primary)" }}>#{detalle.id}</b>
                </p>
                <p style={{ color: "var(--text-secondary)", marginBottom: 6 }}>
                  Concepto: <b style={{ color: "var(--text-primary)" }}>{detalle.descripcion || "—"}</b>
                </p>
                <p style={{ color: "var(--text-secondary)" }}>
                  Monto: <b style={{ color: "var(--text-primary)" }}>
                    ${Number(detalle.monto || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} {detalle.moneda}
                  </b>
                </p>
              </div>
            )}

            {error && (
              <p style={{ fontSize: 12.5, color: "var(--warning)", marginBottom: 16 }}>{error}</p>
            )}

            <button
              onClick={() => navigate(rutaInicio())}
              style={{
                border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14,
                fontWeight: 600, cursor: "pointer", background: "var(--accent)", color: "#111",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              <FiArrowLeft /> Volver al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
