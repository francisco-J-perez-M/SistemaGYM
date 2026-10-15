import { FiLock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

/**
 * BloqueoFuncionPlan — SCRUM-224.
 *
 * Overlay reutilizable para una función que el plan contratado del
 * gimnasio/organización no incluye. En vez de ocultar el panel o dejar
 * solo el aviso en rojo que aparecía tras un intento fallido, envuelve el
 * contenido restringido, lo DESENFOCA (blur) y muestra encima un recuadro
 * centrado explicando la restricción -- así queda claro que la función
 * existe (no está rota ni ausente) pero no está disponible en este plan,
 * sin dejar ver el contenido de detrás.
 *
 * El blur es puramente visual. La fuente de verdad real sigue siendo el
 * backend: @require_funcion_plan() en utils/security.py devuelve 402 si
 * se intenta la acción igual (p. ej. llamando al endpoint directamente) --
 * esto solo evita que el usuario llegue a intentarlo sin saber que está
 * bloqueado, mostrando el aviso desde que la pantalla carga (ver el hook
 * useFuncionesPlan, alimentado por GET /api/auth/me).
 *
 * @param {boolean}  permitido        - true si el plan SÍ incluye la función
 *        (o si todavía no se sabe -- ver useFuncionesPlan: el default es
 *        no bloquear ante la duda, el backend bloquea de verdad si hace falta).
 * @param {string}   nombreFuncion    - nombre legible, ej. "Importación de rutinas con IA".
 * @param {string}   [planSugerido]   - plan mínimo que la incluye, ej. "Pro".
 * @param {boolean}  [puedeMejorarPlan=false] - true si el rol actual administra
 *        la suscripción (Propietario/Administrador) y puede navegar a mejorarla.
 *        En falso (Entrenador, Recepcionista, ...) se omite el botón y se
 *        indica que lo gestione el propietario del gimnasio.
 * @param {ReactNode} children
 */
export default function BloqueoFuncionPlan({
  permitido,
  nombreFuncion,
  planSugerido,
  puedeMejorarPlan = false,
  children,
}) {
  const navigate = useNavigate();

  if (permitido) return children;

  return (
    <div style={{ position: "relative" }}>
      <div
        aria-hidden="true"
        style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}
      >
        {children}
      </div>

      <div
        style={{
          position: "absolute", inset: 0, zIndex: 5,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(10,10,14,.35)", borderRadius: 12, padding: 20,
        }}
      >
        <div
          style={{
            maxWidth: 360, width: "100%", textAlign: "center",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "28px 26px",
            boxShadow: "0 12px 40px rgba(0,0,0,.3)",
          }}
        >
          <div
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(245,158,11,.12)", color: "#f59e0b",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <FiLock size={20} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
            Función no disponible en tu plan
          </h3>
          <p
            style={{
              fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6,
              marginBottom: puedeMejorarPlan ? 18 : 0,
            }}
          >
            <strong style={{ color: "var(--text-primary)" }}>{nombreFuncion}</strong> no está
            incluida en el plan contratado por tu gimnasio
            {planSugerido ? <> — disponible desde el plan <strong>{planSugerido}</strong></> : ""}.
            {!puedeMejorarPlan && " Pídele al propietario del gimnasio que mejore el plan para usarla."}
          </p>
          {puedeMejorarPlan && (
            <button
              className="btn-compact-primary"
              onClick={() => navigate("/owner/subscription")}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Ver planes y mejorar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
