import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import SystemGuide from "../guide/SystemGuide";

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
    "/owner/profile":      "ow-profile",
    "/owner/subscription": "ow-subscription",
    "/owner/backups":      "ow-backups",
    "/owner/mapreduce":    "ow-mapreduce",
    "/owner/kmeans":       "ow-kmeans",
    "/owner/regresion":    "ow-regresion",
    "/owner/analytics":    "ow-analytics",
  },
  trainer: {
    "/trainer-dashboard":         "clients",
    "/trainer/clients":           "clients",
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
    "ow-profile":    "/owner/profile",
    "ow-subscription": "/owner/subscription",
    "ow-backups":    "/owner/backups",
    "ow-mapreduce":  "/owner/mapreduce",
    "ow-kmeans":     "/owner/kmeans",
    "ow-regresion":  "/owner/regresion",
    "ow-analytics":  "/owner/analytics",
    "ow-cancelaciones": "/owner/analytics",
  },
  trainer: {
    clients:           "/trainer/clients",
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
  },
};

export default function Layout({ role = "owner_gym" }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/", { replace: true }); return; }
    try {
      const user     = JSON.parse(localStorage.getItem("user") || "{}");
      const userRole = (user.role || "").toLowerCase();
      const allowed  = (ROLE_MAP[role] || []);
      if (!allowed.includes(userRole)) navigate("/", { replace: true });
    } catch { navigate("/", { replace: true }); }
  }, [location.pathname, role, navigate]);

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
        flexDirection: "row",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-main)",
      }}
    >
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
          height: "100vh",
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
  );
}
