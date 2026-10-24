/**
 * TrainerMessages.jsx — Bandeja de mensajes del entrenador.
 *
 * Antes el chat vivía como una pestaña dentro de "Solicitudes PT", así que para
 * leer un mensaje había que entrar a una pantalla de solicitudes. Son dos
 * tareas distintas: hablar con los clientes actuales y atender peticiones de
 * quienes todavía no lo son.
 *
 * La conversación en sí es el mismo componente `TabChat` que ya existía; aquí
 * solo se le da pantalla propia y encabezado.
 *
 * Cuando se llega desde una solicitud (botón "Chat"), el miembro viaja en el
 * estado de navegación y la conversación se abre directamente.
 */
import { useLocation } from "react-router-dom";
import { FiMessageSquare } from "react-icons/fi";
import { motion } from "framer-motion";
import { TabChat } from "./TrainerRequests";
import "../../css/CSSUnificado.css";

export default function TrainerMessages() {
  const { state } = useLocation();
  const miembroInicial = state?.miembro ?? null;

  return (
    <div className="page-container">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent), var(--accent-soft))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 18px var(--border-hover)",
          }}>
            <FiMessageSquare size={26} color="#fff" />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Mensajes</h1>
            <p style={{ margin: "3px 0 0", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
              Conversaciones con tus clientes
            </p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <TabChat chatTarget={miembroInicial} onClearTarget={() => {}} />
      </motion.div>
    </div>
  );
}
