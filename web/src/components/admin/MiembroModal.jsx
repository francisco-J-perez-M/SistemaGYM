import React, { useEffect } from "react";
import { createPortal } from "react-dom";

/* ── Iconos inline ─────────────────────────────────────────────────────── */
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

/* ── Estilos ────────────────────────────────────────────────────────────── */
const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 9000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0, 0, 0, 0.65)",
  backdropFilter: "blur(4px)",
  padding: "24px 16px",
};

const cardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  width: "100%",
  maxWidth: 620,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
  display: "flex",
  flexDirection: "column",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "20px 24px 16px",
  borderBottom: "1px solid var(--border)",
  position: "sticky",
  top: 0,
  background: "var(--bg-card)",
  zIndex: 1,
  borderRadius: "16px 16px 0 0",
};

const iconWrapStyle = (editing) => ({
  width: 40,
  height: 40,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: editing
    ? "rgba(245, 158, 11, 0.15)"
    : "rgba(99, 102, 241, 0.15)",
  color: editing ? "var(--warning)" : "var(--accent-soft)",
  flexShrink: 0,
});

const titleBlockStyle = {
  flex: 1,
};

const closeBtnStyle = {
  background: "var(--bg-input)",
  border: "none",
  borderRadius: 8,
  color: "rgba(255,255,255,0.6)",
  cursor: "pointer",
  padding: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.2s, color 0.2s",
  flexShrink: 0,
};

const bodyStyle = {
  padding: "20px 24px 24px",
  overflowY: "auto",
};

/* ── Componente ─────────────────────────────────────────────────────────── */
export default function MiembroModal({ open, title, onClose, children, editingId }) {
  /* Bloquear scroll del body mientras el modal está abierto */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* Cerrar con Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const isEditing = Boolean(editingId);

  return createPortal(
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={headerStyle}>
          <div style={iconWrapStyle(isEditing)}>
            {isEditing ? <EditIcon /> : <UserPlusIcon />}
          </div>
          <div style={titleBlockStyle}>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#fff", lineHeight: 1.2 }}>
              {title}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
              {isEditing ? "Modifica los datos del miembro" : "Completa los datos para registrar al miembro"}
            </div>
          </div>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
