import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiLoader, FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";
import Sidebar from "./Sidebar";
import SystemGuide from "../guide/SystemGuide";
import {
  useRoutineImportJob, dismissRoutineImportJob, cancelRoutineImportJob,
} from "../../hooks/useRoutineImportJob";
import { useToast } from "../../hooks/useToast";

const ROLE_MAP = {
  owner_gym:    ["owner_gym", "admin", "administrador"],
  trainer:      ["trainer", "entrenador"],
  receptionist: ["receptionist", "recepcionista"],
  user:         ["user", "miembro"],
  superadmin:   ["superadmin"],
};

const ROUTE_MAP = {
  owner_gym: {
    "/owner":              "ow-dashboard",
    "/owner/members":      "ow-miembros",
    "/owner/payments":     "ow-pagos",
    "/owner/pos":          "ow-pos",
    "/owner/staff":        "ow-staff",
    "/owner/memberships":  "ow-membresias",
    "/owner/mi-perfil":    "ow-mi-perfil",
    "/owner/profile":      "ow-profile",
    "/owner/reportes":     "ow-reportes",
    "/owner/subscription": "ow-subscription",
    "/owner/pagos-online": "ow-pagos-online",
    "/owner/backups":      "ow-backups",
    "/owner/mapreduce":    "ow-mapreduce",
    "/owner/kmeans":       "ow-kmeans",
    "/owner/regresion":    "ow-regresion",
    "/owner/analytics":    "ow-analytics",
  },
  trainer: {
    // El panel del entrenador tenía su ruta apuntando al id de "Mis Clientes",
    // por eso no aparecía Dashboard en el menú y la sección quedaba huérfana.
    "/trainer-dashboard":         "tr-dashboard",
    "/trainer/clients":           "clients",
    "/trainer/messages":          "messages",
    "/trainer/schedule":          "schedule",
    "/trainer/routines":          "routines",
    "/trainer/diets":             "diets",
    "/trainer/reports":           "reports",
    "/trainer/profile":           "profile",
    "/trainer/pos":               "pos",
    "/trainer/requests":          "requests",
    "/trainer/trainer-kmeans":    "trainer-kmeans",
    "/trainer/trainer-regresion": "trainer-regresion",
  },
  receptionist: {
    "/receptionist-dashboard":    "rec-dashboard",
    "/receptionist/checkins":     "checkins",
    "/receptionist/appointments": "appointments",
    "/receptionist/payments":     "payments",
    "/receptionist/members":      "members",
    "/receptionist/pos":          "pos",
    "/receptionist/messages":     "messages",
    "/receptionist/tasks":        "tasks",
    "/receptionist/mapreduce":    "rec-mapreduce",
    "/receptionist/kmeans":       "rec-kmeans",
    "/receptionist/regresion":    "rec-regresion",
    "/receptionist/analytics":    "rec-analytics",
  },
  user: {
    "/user/dashboard":    "dashboard",
    "/user/routine":      "routine",
    "/user/workout-log":  "workout-log",
    "/user/progress":     "progress",
    "/user/body-metrics": "body-metrics",
    "/user/meal-plan":    "nutrition",
    "/user/nutrition":    "nutrition",
    "/user/recipes":      "nutrition",
    "/user/health":       "health",
    "/user/payments":     "payments",
    "/user/renew":        "renew",
    "/user/profile":      "profile",
    "/user/pos":          "pos",
    "/user/prediction":   "prediction",
    "/user/training":     "training-hub",
  },
  superadmin: {
    "/superadmin":                 "sa-dashboard",
    "/superadmin/gimnasios":       "sa-gimnasios",
    "/superadmin/suscripciones":   "sa-suscripciones",
    "/superadmin/planes":          "sa-planes",
    "/superadmin/usuarios":        "sa-usuarios",
    "/superadmin/backups":         "sa-backups",
    "/superadmin/analytics":       "sa-analytics",
    "/superadmin/modelos":         "sa-modelos",
  },
};

const NAV_MAP = {
  owner_gym: {
    "ow-dashboard":  "/owner",
    "ow-miembros":   "/owner/members",
    "ow-pagos":      "/owner/payments",
    "ow-pos":        "/owner/pos",
    "ow-staff":      "/owner/staff",
    "ow-membresias": "/owner/memberships",
    "ow-mi-perfil":  "/owner/mi-perfil",
    "ow-profile":    "/owner/profile",
    "ow-reportes":   "/owner/reportes",
    "ow-subscription": "/owner/subscription",
    "ow-pagos-online": "/owner/pagos-online",
    "ow-backups":    "/owner/backups",
    "ow-mapreduce":  "/owner/mapreduce",
    "ow-kmeans":     "/owner/kmeans",
    "ow-regresion":  "/owner/regresion",
    "ow-analytics":  "/owner/analytics",
    "ow-cancelaciones": "/owner/analytics",
  },
  trainer: {
    "tr-dashboard":    "/trainer-dashboard",
    clients:           "/trainer/clients",
    messages:          "/trainer/messages",
    schedule:          "/trainer/schedule",
    routines:          "/trainer/routines",
    diets:             "/trainer/diets",
    reports:           "/trainer/reports",
    profile:           "/trainer/profile",
    pos:               "/trainer/pos",
    requests:          "/trainer/requests",
    "trainer-kmeans":    "/trainer/trainer-kmeans",
    "trainer-regresion": "/trainer/trainer-regresion",
  },
  receptionist: {
    "rec-dashboard": "/receptionist-dashboard",
    checkins:        "/receptionist/checkins",
    appointments:    "/receptionist/appointments",
    payments:        "/receptionist/payments",
    members:         "/receptionist/members",
    pos:             "/receptionist/pos",
    messages:        "/receptionist/messages",
    tasks:           "/receptionist/tasks",
    "rec-mapreduce":  "/receptionist/mapreduce",
    "rec-kmeans":     "/receptionist/kmeans",
    "rec-regresion":  "/receptionist/regresion",
    "rec-analytics":  "/receptionist/analytics",
    "rec-ai":         "/receptionist/analytics",
  },
  user: {
    dashboard:     "/user/dashboard",
    routine:       "/user/routine",
    "workout-log": "/user/workout-log",
    progress:      "/user/progress",
    "body-metrics":"/user/body-metrics",
    nutrition:     "/user/nutrition",
    health:        "/user/health",
    payments:      "/user/payments",
    renew:         "/user/renew",
    profile:       "/user/profile",
    pos:            "/user/pos",
    prediction:     "/user/prediction",
    "training-hub": "/user/training",
  },
  superadmin: {
    "sa-dashboard":    "/superadmin",
    "sa-gimnasios":    "/superadmin/gimnasios",
    "sa-suscripciones":"/superadmin/suscripciones",
    "sa-planes":       "/superadmin/planes",
    "sa-usuarios":     "/superadmin/usuarios",
    "sa-backups":      "/superadmin/backups",
    "sa-analytics":    "/superadmin/analytics",
    "sa-modelos":      "/superadmin/modelos",
  },
};

export default function Layout({ role = "owner_gym" }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Impersonación activa: se lee de "user._impersonated", escrito por
  // SuperadminUsuarios.jsx al impersonar. Vive en el Layout (compartido por
  // todos los roles) para que el control de salida esté visible sin importar
  // a qué panel navegue el superadmin mientras impersona. ──────────────────
  const [impersonating, setImpersonating] = useState(false);

  // ── Aviso de importación de rutinas por IA (background job) ─────────────
  // Vive en Layout (no solo en TrainerRoutines) para que el entrenador vea
  // el aviso sin importar en qué pantalla del panel esté, cumpliendo el
  // requisito de poder "volver al módulo y terminar su tarea de asignación
  // de ejercicios" mientras la IA procesa. El hook se llama siempre (reglas
  // de hooks); solo se muestra la UI para el rol trainer/entrenador.
  const routineImportJob = useRoutineImportJob();
  const [importBannerHidden, setImportBannerHidden] = useState(false);
  useEffect(() => { setImportBannerHidden(false); }, [routineImportJob?.job_id]);

  // Diálogo de confirmación propio (mismo look que el resto del sistema, ver
  // hooks/useToast.jsx) para el botón "Cancelar", en vez de window.confirm().
  const { confirm: confirmImportCancel, ToastPortal: ImportToastPortal } = useToast();

  const showImportBanner = role === "trainer" && !!routineImportJob && !importBannerHidden;

  const goToRoutineImport = () => {
    setImportBannerHidden(true);
    navigate("/trainer/routines?tab=import");
  };
  const closeImportBanner = () => {
    if (routineImportJob?.estado === "procesando") {
      // Solo oculta el aviso; el job sigue corriendo/sondeando en background.
      setImportBannerHidden(true);
    } else {
      // Estado terminal (listo/error): cerrar aquí descarta el resultado,
      // igual que hacerlo desde el propio módulo de Rutinas.
      dismissRoutineImportJob();
    }
  };

  // Distinto de closeImportBanner: esto SÍ cancela el job (no solo lo oculta).
  // Cubre el caso de un job que se quedó "procesando" para siempre -- por
  // ejemplo, tras reiniciar los contenedores a mitad del proceso -- donde ya
  // no hay garantía de que el backend vaya a responder nunca. Ver el mismo
  // botón en TrainerRoutines.jsx y JOB_STALE_AFTER_SECONDS en ia_jobs.py.
  const cancelImportJob = async () => {
    const ok = await confirmImportCancel({
      title: "¿Cancelar la importación en curso?",
      message: "Se perderá el progreso de este intento. Puedes volver a subir el archivo después.",
      type: "warning", confirmText: "Sí, cancelar", cancelText: "Seguir esperando",
    });
    if (!ok) return;
    cancelRoutineImportJob();
  };

  const readImpersonationState = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setImpersonating(!!user._impersonated);
    } catch { setImpersonating(false); }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/", { replace: true }); return; }
    try {
      const user     = JSON.parse(localStorage.getItem("user") || "{}");
      const userRole = (user.role || "").toLowerCase();
      const allowed  = (ROLE_MAP[role] || []);
      if (!allowed.includes(userRole)) navigate("/", { replace: true });
    } catch { navigate("/", { replace: true }); }
    readImpersonationState();
  }, [location.pathname, role, navigate]);

  const handleExitImpersonation = () => {
    const prevToken = sessionStorage.getItem("sa_prev_token");
    const prevUser  = sessionStorage.getItem("sa_prev_user");
    if (!prevToken || !prevUser) {
      // No hay sesión de superadmin que restaurar: no dejar al usuario
      // atrapado, forzar cierre de sesión y volver al login.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/", { replace: true });
      return;
    }
    localStorage.setItem("token", prevToken);
    localStorage.setItem("user",  prevUser);
    sessionStorage.removeItem("sa_prev_token");
    sessionStorage.removeItem("sa_prev_user");
    setImpersonating(false);
    navigate("/superadmin", { replace: true });
  };

  const noSidebar = ["/complete-profile", "/user/complete-profile"];
  const showSidebar = !noSidebar.includes(location.pathname);

  // ── Guía contextual del sistema (todos los roles menos superadmin) ──────────
  const guideEnabled = role !== "superadmin";
  const [guideOpen, setGuideOpen] = useState(false);
  const [guidePath, setGuidePath] = useState(location.pathname);

  const openGuide = () => { setGuidePath(location.pathname); setGuideOpen(true); };
  const closeGuide = () => {
    setGuideOpen(false);
    try { localStorage.setItem(`gympro_guide_seen_${role}`, "1"); } catch { /* ignore */ }
  };

  // Apertura automática en el primer inicio de sesión del rol.
  useEffect(() => {
    if (!guideEnabled) return;
    let seen = "1";
    try { seen = localStorage.getItem(`gympro_guide_seen_${role}`); } catch { /* ignore */ }
    if (!seen) {
      const t = setTimeout(() => { setGuidePath(location.pathname); setGuideOpen(true); }, 800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const activeTab = ROUTE_MAP[role]?.[location.pathname] ?? "";
  const handleNav = (tabId) => {
    const dest = NAV_MAP[role]?.[tabId];
    if (dest) navigate(dest);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-main)",
      }}
    >
      {impersonating && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "8px 18px",
            background: "#a855f7",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span>Estás viendo el sistema como este usuario (sesión de impersonación).</span>
          <button
            onClick={handleExitImpersonation}
            style={{
              border: "1px solid rgba(255,255,255,.5)",
              background: "rgba(255,255,255,.15)",
              color: "#fff",
              borderRadius: 6,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Volver a Superadmin
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "row", flex: 1, minHeight: 0 }}>
        {showSidebar && (
          <Sidebar
            role={role}
            activeTab={activeTab}
            onTabChange={handleNav}
            onLogout={handleLogout}
            onOpenGuide={guideEnabled ? openGuide : undefined}
          />
        )}

        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Outlet />
        </div>

        {guideEnabled && (
          <SystemGuide open={guideOpen} path={guidePath} onClose={closeGuide} />
        )}
      </div>

      {showImportBanner && (() => {
        const estado = routineImportJob.estado;
        const isDone  = estado === "listo";
        const isError = estado === "error";
        const isBusy  = !isDone && !isError;
        const pct     = routineImportJob.progreso_total
          ? Math.round((routineImportJob.progreso_actual / routineImportJob.progreso_total) * 100)
          : null;
        const color   = isError ? "var(--danger)" : isDone ? "var(--success)" : "var(--accent)";
        const bg      = isError ? "rgba(239,68,68,.1)" : isDone ? "rgba(16,185,129,.1)" : "rgba(99,102,241,.1)";
        const border  = isError ? "rgba(239,68,68,.3)" : isDone ? "rgba(16,185,129,.3)" : "rgba(99,102,241,.3)";
        return (
          <div
            role="status"
            style={{
              position: "fixed",
              right: 20,
              bottom: 20,
              zIndex: 2000,
              width: 320,
              maxWidth: "calc(100vw - 40px)",
              background: "var(--bg-card, #fff)",
              border: `1px solid ${border}`,
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,.18)",
              padding: "14px 16px",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <style>{`
              @keyframes spin{to{transform:rotate(360deg);}}
              @keyframes ia-progress-indeterminate{
                0%   { left: -35%; }
                100% { left: 100%; }
              }
            `}</style>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", background: bg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {isDone ? (
                <FiCheckCircle size={16} style={{ color }} />
              ) : isError ? (
                <FiAlertCircle size={16} style={{ color }} />
              ) : (
                <FiLoader size={16} style={{ color, animation: "spin 1s linear infinite" }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                {isDone ? "Importación de rutinas lista"
                  : isError ? "La importación de rutinas falló"
                  : "Importando rutinas con IA…"}
                {isBusy && pct !== null && <span style={{ color: "var(--accent)" }}> {pct}%</span>}
              </div>
              {/* Barra de progreso: determinada (bloque X de N) en cuanto se sabe
                  cuántos bloques hay que mandarle a Ollama; indeterminada
                  (deslizante) mientras todavía se está leyendo/parseando el
                  archivo -- así se ve que de verdad avanza, no solo un ícono
                  girando sin más información. Ver ia_jobs.py (progreso_actual/total). */}
              {isBusy && (
                <div style={{
                  height: 5, borderRadius: 4, background: "rgba(99,102,241,.15)",
                  overflow: "hidden", margin: "4px 0 8px", position: "relative",
                }}>
                  <div style={{
                    position: pct === null ? "absolute" : "static",
                    height: "100%", borderRadius: 4, background: "var(--accent)",
                    width: pct !== null ? `${pct}%` : "35%",
                    transition: pct !== null ? "width .4s ease" : "none",
                    animation: pct === null ? "ia-progress-indeterminate 1.3s ease-in-out infinite" : "none",
                  }} />
                </div>
              )}
              {isBusy && (
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>
                  {pct !== null
                    ? `Bloque ${routineImportJob.progreso_actual} de ${routineImportJob.progreso_total}`
                    : "Leyendo el archivo…"}
                </div>
              )}
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>
                {isDone
                  ? "Ya puedes revisar y guardar el resultado en el módulo de Rutinas."
                  : isError
                  ? (routineImportJob.error || "Ocurrió un error al procesar el archivo.")
                  : "Le avisaremos cuando el proceso de extracción termine — puedes seguir con tu tarea de asignación de ejercicios mientras tanto."}
              </div>
              <button
                onClick={goToRoutineImport}
                style={{
                  border: "none", background: color, color: "#fff",
                  borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isDone ? "Ver resultado" : isError ? "Ver detalle" : "Ver progreso"}
              </button>
              {estado === "procesando" && (
                <button
                  onClick={cancelImportJob}
                  title="Cancelar la importación en curso"
                  style={{
                    border: "1px solid rgba(99,102,241,.35)", background: "transparent",
                    color, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", marginLeft: 8,
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>

            <button
              onClick={closeImportBanner}
              aria-label="Cerrar aviso"
              style={{
                border: "none", background: "transparent", color: "var(--text-secondary)",
                cursor: "pointer", padding: 2, flexShrink: 0,
              }}
            >
              <FiX size={16} />
            </button>
          </div>
        );
      })()}
    </div>
  );
}
