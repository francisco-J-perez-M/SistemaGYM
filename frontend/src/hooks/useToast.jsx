// hooks/useToast.js
// Sistema de toasts y confirmaciones reutilizable para todos los CRUDs
// Uso: const { toast, confirm } = useToast();

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/* ─────────────────────────────────────────────
   ICONOS INTERNOS (sin dependencias externas)
───────────────────────────────────────────── */
const Icons = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  trash: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  ),
  warning_big: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   ESTILOS GLOBALES (inyectados una sola vez)
───────────────────────────────────────────── */
const TOAST_STYLES = `
  @keyframes toast-in {
    from { opacity: 0; transform: translateX(110%) scale(0.92); }
    to   { opacity: 1; transform: translateX(0)   scale(1); }
  }
  @keyframes toast-out {
    from { opacity: 1; transform: translateX(0)   scale(1);    max-height: 80px; margin-bottom: 10px; }
    to   { opacity: 0; transform: translateX(110%) scale(0.88); max-height: 0;   margin-bottom: 0; }
  }
  @keyframes toast-progress {
    from { width: 100%; }
    to   { width: 0%; }
  }
  @keyframes modal-backdrop-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes modal-content-in {
    from { opacity: 0; transform: scale(0.88) translateY(20px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  @keyframes shake-once {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
  .toast-entering { animation: toast-in  0.35s cubic-bezier(0.22,1,0.36,1) both; }
  .toast-exiting  { animation: toast-out 0.3s  cubic-bezier(0.22,1,0.36,1) both; }
  .modal-shake    { animation: shake-once 0.4s ease; }
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const tag = document.createElement("style");
  tag.innerHTML = TOAST_STYLES;
  document.head.appendChild(tag);
  stylesInjected = true;
}

/* ─────────────────────────────────────────────
   CONFIGURACIÓN DE VARIANTES
───────────────────────────────────────────── */
const VARIANTS = {
  success: {
    icon: Icons.success,
    color: "var(--success)",
    bg: "var(--success-bg)",
    border: "var(--success)",
  },
  error: {
    icon: Icons.error,
    color: "var(--danger)",
    bg: "var(--danger-bg)",
    border: "var(--danger)",
  },
  warning: {
    icon: Icons.warning,
    color: "var(--warning)",
    bg: "var(--warning-bg)",
    border: "var(--warning)",
  },
  info: {
    icon: Icons.info,
    color: "var(--info)",
    bg: "var(--info-bg)",
    border: "var(--info)",
  },
};

/* ─────────────────────────────────────────────
   COMPONENTE: TOAST INDIVIDUAL
───────────────────────────────────────────── */
function Toast({ id, type = "success", title, message, duration = 4000, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);
  const v = VARIANTS[type] || VARIANTS.success;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(id), 300);
  }, [id, onRemove]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, duration);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, duration]);

  return (
    <div
      className={exiting ? "toast-exiting" : "toast-entering"}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        background: "var(--bg-card)",
        border: `1px solid ${v.border}`,
        borderLeft: `3px solid ${v.border}`,
        borderRadius: "var(--r-lg)",
        padding: "14px 16px",
        marginBottom: "10px",
        maxWidth: "380px",
        width: "100%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={dismiss}
    >
      {/* Icono */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: v.bg,
          color: v.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {v.icon}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
            {title}
          </p>
        )}
        {message && (
          <p style={{
            margin: title ? "3px 0 0" : 0,
            fontSize: "12px",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {message}
          </p>
        )}
      </div>

      {/* Botón cerrar */}
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-tertiary)",
          cursor: "pointer",
          padding: "2px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}
      >
        {Icons.close}
      </button>

      {/* Barra de progreso */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "2px",
          background: v.color,
          opacity: 0.5,
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE: CONFIRM DIALOG
───────────────────────────────────────────── */
function ConfirmDialog({ config, onClose }) {
  const {
    title = "¿Confirmar acción?",
    message,
    type = "danger",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    onConfirm,
  } = config;

  const [shaking, setShaking] = useState(false);
  const backdropRef = useRef(null);

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const confirmColors = {
    danger:  { bg: "var(--danger)",  hover: "#cc0038", shadow: "rgba(255,23,68,0.3)" },
    warning: { bg: "var(--warning)", hover: "#cc8f00", shadow: "rgba(255,179,0,0.3)" },
    success: { bg: "var(--success)", hover: "#00b85c", shadow: "rgba(0,230,118,0.3)" },
    info:    { bg: "var(--info)",    hover: "#00aacf", shadow: "rgba(0,212,255,0.3)" },
  };
  const c = confirmColors[type] || confirmColors.danger;

  const dialogIcon = type === "danger" ? Icons.trash : Icons.warning_big;
  const iconBg = {
    danger:  "var(--danger-bg)",
    warning: "var(--warning-bg)",
    success: "var(--success-bg)",
    info:    "var(--info-bg)",
  }[type];
  const iconColor = {
    danger:  "var(--danger)",
    warning: "var(--warning)",
    success: "var(--success)",
    info:    "var(--info)",
  }[type];

  return createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "20px",
        backdropFilter: "blur(4px)",
        animation: "modal-backdrop-in 0.2s ease",
      }}
    >
      <div
        className={shaking ? "modal-shake" : ""}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)",
          animation: "modal-content-in 0.3s cubic-bezier(0.22,1,0.36,1)",
          overflow: "hidden",
        }}
      >
        {/* Franja superior de color */}
        <div style={{
          height: "3px",
          background: c.bg,
          borderRadius: "var(--r-xl) var(--r-xl) 0 0",
        }} />

        <div style={{ padding: "28px 28px 24px" }}>
          {/* Ícono + Título */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: iconBg,
              color: iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {dialogIcon}
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.3,
              }}>
                {title}
              </h3>
              {message && (
                <p style={{
                  margin: "8px 0 0",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}>
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                color: "var(--text-secondary)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--border-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              style={{
                padding: "10px 22px",
                background: c.bg,
                border: "none",
                borderRadius: "var(--r-md)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: `0 4px 16px ${c.shadow}`,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = c.hover;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = c.bg;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─────────────────────────────────────────────
   CONTENEDOR DE TOASTS (portal)
───────────────────────────────────────────── */
function ToastContainer({ toasts, onRemove }) {
  return createPortal(
    <div
      style={{
        position: "fixed",
        top: "80px",        /* debajo del navbar */
        right: "20px",
        zIndex: 99998,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <Toast {...t} onRemove={onRemove} />
        </div>
      ))}
    </div>,
    document.body
  );
}

/* ─────────────────────────────────────────────
   HOOK PRINCIPAL: useToast
   
   Uso:
   const { toast, confirm, ToastPortal } = useToast();
   
   toast.success("Guardado", "El miembro fue creado correctamente.");
   toast.error("Error", "No se pudo conectar al servidor.");
   toast.warning("Advertencia", "Este campo está vacío.");
   toast.info("Info", "Los cambios se aplicarán al recargar.");
   
   await confirm({
     title: "¿Desactivar miembro?",
     message: "Esta acción puede revertirse desde la papelera.",
     type: "danger",
     confirmText: "Sí, desactivar",
     cancelText: "No, cancelar",
   });
   // Devuelve Promise<boolean>
───────────────────────────────────────────── */
let idCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const [dialogConfig, setDialogConfig] = useState(null);

  useEffect(() => { injectStyles(); }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, title, message, duration = 4200) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const toast = {
    success: (title, message, duration)  => addToast("success", title, message, duration),
    error:   (title, message, duration)  => addToast("error",   title, message, duration),
    warning: (title, message, duration)  => addToast("warning", title, message, duration),
    info:    (title, message, duration)  => addToast("info",    title, message, duration),
  };

  const confirm = useCallback((config) => {
    return new Promise((resolve) => {
      setDialogConfig({
        ...config,
        onConfirm: () => resolve(true),
      });
    });
  }, []);

  /* Portales que deben renderizarse en el componente raíz */
  const ToastPortal = () => (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {dialogConfig && (
        <ConfirmDialog
          config={dialogConfig}
          onClose={() => {
            setDialogConfig(null);
          }}
        />
      )}
    </>
  );

  return { toast, confirm, ToastPortal };
}

export default useToast;