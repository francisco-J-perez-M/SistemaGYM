import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

const ROLE_MAP = {
  admin:        ["admin", "administrador"],
  trainer:      ["trainer", "entrenador"],
  receptionist: ["receptionist", "recepcionista"],
  user:         ["user", "miembro"],
  superadmin:   ["superadmin"],
};

const ROUTE_MAP = {
  admin: {
    "/dashboard":           "overview",
    "/dashboard/members":   "miembros",
    "/dashboard/payments":  "pagos",
    "/dashboard/pos":       "pos",
    "/dashboard/backups":   "backups",
    "/dashboard/restore":   "restore",
    "/dashboard/mapreduce": "mapreduce",
    "/dashboard/kmeans":    "kmeans",
    "/dashboard/regresion": "regresion",
    "/dashboard/analytics": "analytics",
  },
  trainer: {
    "/trainer-dashboard":         "clients",
    "/trainer/clients":           "clients",
    "/trainer/schedule":          "schedule",
    "/trainer/sessions":          "sessions",
    "/trainer/routines":          "routines",
    "/trainer/reports":           "reports",
    "/trainer/profile":           "profile",
    "/trainer/pos":               "pos",
    "/trainer/trainer-kmeans":    "trainer-kmeans",
    "/trainer/trainer-regresion": "trainer-regresion",
  },
  receptionist: {
    "/receptionist-dashboard":    "checkins",
    "/receptionist/appointments": "appointments",
    "/receptionist/payments":     "payments",
    "/receptionist/members":      "members",
    "/receptionist/pos":          "pos",
    "/receptionist/messages":     "messages",
    "/receptionist/tasks":        "tasks",
  },
  user: {
    "/user/dashboard":    "dashboard",
    "/user/routine":      "routine",
    "/user/progress":     "progress",
    "/user/body-metrics": "body-metrics",
    "/user/meal-plan":    "meal-plan",
    "/user/recipes":      "recipes",
    "/user/health":       "health",
    "/user/payments":     "payments",
    "/user/renew":        "renew",
    "/user/profile":      "profile",
    "/user/pos":          "pos",
    "/user/prediction":   "prediction",
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
  admin: {
    overview:  "/dashboard",
    miembros:  "/dashboard/members",
    pagos:     "/dashboard/payments",
    pos:       "/dashboard/pos",
    backups:   "/dashboard/backups",
    restore:   "/dashboard/restore",
    mapreduce: "/dashboard/mapreduce",
    kmeans:    "/dashboard/kmeans",
    regresion: "/dashboard/regresion",
    analytics: "/dashboard/analytics",
    cancelaciones: "/dashboard/analytics",
  },
  trainer: {
    clients:           "/trainer/clients",
    schedule:          "/trainer/schedule",
    sessions:          "/trainer/sessions",
    routines:          "/trainer/routines",
    reports:           "/trainer/reports",
    profile:           "/trainer/profile",
    pos:               "/trainer/pos",
    "trainer-kmeans":    "/trainer/trainer-kmeans",
    "trainer-regresion": "/trainer/trainer-regresion",
  },
  receptionist: {
    checkins:     "/receptionist-dashboard",
    appointments: "/receptionist/appointments",
    payments:     "/receptionist/payments",
    members:      "/receptionist/members",
    pos:          "/receptionist/pos",
    messages:     "/receptionist/messages",
    tasks:        "/receptionist/tasks",
  },
  user: {
    dashboard:     "/user/dashboard",
    routine:       "/user/routine",
    progress:      "/user/progress",
    "body-metrics":"/user/body-metrics",
    "meal-plan":   "/user/meal-plan",
    recipes:       "/user/recipes",
    health:        "/user/health",
    payments:      "/user/payments",
    renew:         "/user/renew",
    profile:       "/user/profile",
    pos:           "/user/pos",
    prediction:    "/user/prediction",
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

export default function Layout({ role = "admin" }) {
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
        background: "var(--bg-dark, #0f1117)",
      }}
    >
      {showSidebar && (
        <Sidebar
          role={role}
          activeTab={activeTab}
          onTabChange={handleNav}
          onLogout={handleLogout}
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
    </div>
  );
}
