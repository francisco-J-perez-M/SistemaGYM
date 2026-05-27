import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMail, FiSend, FiInbox, FiStar, FiTrash2,
  FiChevronRight, FiAlertCircle, FiBell,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const MOCK_MESSAGES = [
  {
    id: 1, from: "Sistema", subject: "Membresías por vencer esta semana", time: "Hace 5 min",
    body: "Los siguientes miembros tienen membresías que vencen en los próximos 7 días:\n• María García — vence el 20/05\n• Juan Pérez — vence el 22/05\n• Carlos López — vence el 23/05\n\nSe recomienda contactarlos para renovación.",
    type: "alerta", read: false, starred: false,
  },
  {
    id: 2, from: "Coach López", subject: "Cambio de horario - Lunes 10am", time: "Hace 1 hora",
    body: "Necesito reagendar mi clase del lunes de 10am a 11am por una cita médica. ¿Puedes actualizar el calendario por favor?",
    type: "mensaje", read: false, starred: true,
  },
  {
    id: 3, from: "Sistema", subject: "Pago pendiente — Pedro Sánchez", time: "Hace 2 horas",
    body: "El miembro Pedro Sánchez tiene un pago pendiente de $500 MXN correspondiente a la mensualidad de mayo. Su membresía vence en 3 días.",
    type: "alerta", read: true, starred: false,
  },
  {
    id: 4, from: "Gerencia", subject: "Horarios Semana Santa actualizado", time: "Ayer",
    body: "Les informo que durante Semana Santa el gimnasio operará de 8am a 4pm. Favor de avisar a los miembros y actualizar la pizarra de entrada.",
    type: "mensaje", read: true, starred: false,
  },
  {
    id: 5, from: "Sistema", subject: "Nuevo registro — Ana Torres", time: "Hace 2 días",
    body: "Se ha registrado un nuevo miembro: Ana Torres. Membresía: Mensual. Por favor actualiza su expediente y dale la bienvenida.",
    type: "bienvenida", read: true, starred: false,
  },
];

const TYPE_ICON = {
  alerta:     { icon: <FiAlertCircle size={14} />, color: "var(--warning)", bg: "rgba(234,179,8,0.12)" },
  mensaje:    { icon: <FiMail size={14} />,         color: "var(--accent-soft)", bg: "var(--accent-dim)" },
  bienvenida: { icon: <FiBell size={14} />,         color: "var(--success)", bg: "rgba(34,197,94,0.12)" },
};

export default function ReceptionistMessages() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [selected, setSelected] = useState(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ to: "", subject: "", body: "" });
  const [filter, setFilter] = useState("todos");

  const unread = messages.filter(m => !m.read).length;

  const visible = messages.filter(m => {
    if (filter === "no_leidos") return !m.read;
    if (filter === "destacados") return m.starred;
    return true;
  });

  const markRead = (id) =>
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));

  const toggleStar = (id, e) => {
    e.stopPropagation();
    setMessages(prev => prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
  };

  const deleteMsg = (id, e) => {
    e.stopPropagation();
    if (selected?.id === id) setSelected(null);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const openMessage = (msg) => {
    markRead(msg.id);
    setSelected(msg);
    setComposing(false);
  };

  const sendDraft = () => {
    if (!draft.to.trim() || !draft.subject.trim()) return;
    setMessages(prev => [{
      id: Date.now(), from: "Tú", subject: draft.subject, time: "Ahora",
      body: draft.body, type: "mensaje", read: true, starred: false,
    }, ...prev]);
    setDraft({ to: "", subject: "", body: "" });
    setComposing(false);
  };

  return (
    <div className="dashboard-content">
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Mensajes
            {unread > 0 && (
              <span style={{
                marginLeft: "10px", background: "var(--accent)", color: "#fff",
                borderRadius: "99px", fontSize: "11px", fontWeight: 700, padding: "2px 8px",
              }}>{unread}</span>
            )}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Notificaciones y comunicados internos
          </p>
        </div>
        <motion.button
          onClick={() => { setComposing(true); setSelected(null); }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "9px 16px", background: "var(--accent)",
            border: "none", color: "#fff", borderRadius: "var(--r-md)",
            cursor: "pointer", fontSize: "13px", fontWeight: 600,
          }}
        >
          <FiSend size={14} /> Nuevo mensaje
        </motion.button>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "16px", alignItems: "start" }}>
        {/* Panel izquierdo: lista */}
        <div>
          {/* Filtros */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            {[
              { id: "todos",       label: "Todos",     icon: <FiInbox size={13} /> },
              { id: "no_leidos",   label: "No leídos", icon: <FiMail size={13} /> },
              { id: "destacados",  label: "Destacados",icon: <FiStar size={13} /> },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                  padding: "7px 8px", borderRadius: "var(--r-md)", fontSize: "11px", fontWeight: 600,
                  cursor: "pointer",
                  background: filter === f.id ? "var(--accent-dim)" : "var(--bg-input)",
                  border: filter === f.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                  color: filter === f.id ? "var(--accent-soft)" : "var(--text-secondary)",
                }}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <AnimatePresence>
              {visible.map((msg, i) => {
                const t = TYPE_ICON[msg.type] || TYPE_ICON.mensaje;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }} transition={{ delay: i * 0.04 }}
                    onClick={() => openMessage(msg)}
                    style={{
                      padding: "12px 14px", borderRadius: "var(--r-md)", cursor: "pointer",
                      background: selected?.id === msg.id ? "var(--accent-dim)" :
                                  !msg.read ? "var(--bg-input)" : "transparent",
                      border: selected?.id === msg.id ? "1px solid var(--accent)" : "1px solid transparent",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: t.bg, display: "flex", alignItems: "center",
                        justifyContent: "center", color: t.color, flexShrink: 0,
                      }}>
                        {t.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{
                            fontSize: "12px", fontWeight: msg.read ? 500 : 700,
                            color: "var(--text-primary)", overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "140px",
                          }}>
                            {msg.from}
                          </span>
                          <span style={{ fontSize: "10px", color: "var(--text-secondary)", flexShrink: 0 }}>
                            {msg.time}
                          </span>
                        </div>
                        <div style={{
                          fontSize: "12px", color: msg.read ? "var(--text-secondary)" : "var(--text-primary)",
                          fontWeight: msg.read ? 400 : 600, marginTop: "2px",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {msg.subject}
                        </div>
                      </div>
                    </div>

                    <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "2px" }}>
                      <button onClick={(e) => toggleStar(msg.id, e)} style={{
                        background: "none", border: "none", cursor: "pointer", padding: "2px",
                        color: msg.starred ? "var(--warning)" : "var(--text-secondary)",
                      }}>
                        <FiStar size={12} />
                      </button>
                      <button onClick={(e) => deleteMsg(msg.id, e)} style={{
                        background: "none", border: "none", cursor: "pointer", padding: "2px",
                        color: "var(--text-secondary)",
                      }}>
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Panel derecho: detalle o redactar */}
        <div className="chart-card" style={{ minHeight: "400px" }}>
          {composing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
                Nuevo mensaje
              </h3>
              {[
                { label: "Para", key: "to", placeholder: "Destinatario" },
                { label: "Asunto", key: "subject", placeholder: "Asunto del mensaje" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700,
                    color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                    {f.label}
                  </label>
                  <input type="text" value={draft[f.key]} placeholder={f.placeholder}
                    onChange={e => setDraft(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px",
                      background: "var(--bg-input)", border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)", color: "var(--text-primary)", fontSize: "13px",
                      boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700,
                  color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                  Mensaje
                </label>
                <textarea rows={8} value={draft.body} placeholder="Escribe tu mensaje…"
                  onChange={e => setDraft(p => ({ ...p, body: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px",
                    background: "var(--bg-input)", border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)", color: "var(--text-primary)", fontSize: "13px",
                    resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button onClick={() => setComposing(false)} style={{
                  padding: "9px 18px", background: "transparent", border: "1px solid var(--border)",
                  color: "var(--text-secondary)", borderRadius: "var(--r-md)", cursor: "pointer", fontSize: "13px"
                }}>Cancelar</button>
                <button onClick={sendDraft} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "9px 18px", background: "var(--accent)", border: "none",
                  color: "#fff", borderRadius: "var(--r-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                }}>
                  <FiSend size={13} /> Enviar
                </button>
              </div>
            </motion.div>
          ) : selected ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {selected.subject}
                  </h3>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    De: <strong>{selected.from}</strong> · {selected.time}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background: "var(--bg-input)", border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)", padding: "6px 12px", color: "var(--text-secondary)",
                  cursor: "pointer", fontSize: "12px",
                }}>
                  ✕ Cerrar
                </button>
              </div>
              <div style={{
                background: "var(--bg-input)", borderRadius: "var(--r-md)", padding: "18px",
                fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.7,
                whiteSpace: "pre-line",
              }}>
                {selected.body}
              </div>
            </motion.div>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              height: "300px", color: "var(--text-secondary)", gap: "12px",
            }}>
              <FiInbox size={40} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: "14px" }}>Selecciona un mensaje para leerlo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
