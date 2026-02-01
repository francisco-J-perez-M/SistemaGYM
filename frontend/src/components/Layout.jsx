import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import "../css/CSSUnificado.css";

export default function Layout({ role = "admin" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    
    // RUTAS ADMIN
    if (path === "/dashboard") return "overview";
    if (path === "/dashboard/members") return "miembros";
    if (path === "/dashboard/payments") return "pagos";
    if (path === "/dashboard/backups") return "backups";
    if (path === "/dashboard/restore") return "restore";

    // RUTAS ENTRENADOR
    if (path === "/trainer-dashboard") return "clients";
    if (path === "/trainer/schedule") return "schedule";
    if (path === "/trainer/sessions") return "sessions";
    if (path === "/trainer/routines") return "routines";
    if (path === "/trainer/reports") return "reports";
    if (path === "/trainer/profile") return "profile";

    // RUTAS RECEPCIONISTA
    if (path === "/receptionist-dashboard") return "checkins";
    if (path === "/receptionist/appointments") return "appointments";
    if (path === "/receptionist/payments") return "payments";
    if (path === "/receptionist/members") return "members";
    if (path === "/receptionist/messages") return "messages";
    if (path === "/receptionist/tasks") return "tasks";

    // RUTAS USUARIO
    if (path === "/user/dashboard") return "dashboard";
    if (path === "/user/routine") return "routine";
    if (path === "/user/progress") return "progress";
    if (path === "/user/body-metrics") return "body-metrics";
    if (path === "/user/meal-plan") return "meal-plan";
    if (path === "/user/health") return "health";
    if (path === "/user/payments") return "payments";
    if (path === "/user/renew") return "renew";
    if (path === "/user/profile") return "profile";

    return "";
  };

  const handleTabChange = (tabId) => {
    // NAVEGACIÓN ADMIN
    if (role === "admin") {
      const adminRoutes = {
        overview: "/dashboard",
        miembros: "/dashboard/members",
        pagos: "/dashboard/payments",
        backups: "/dashboard/backups",
        restore: "/dashboard/restore"
      };
      if (adminRoutes[tabId]) navigate(adminRoutes[tabId]);
    }

    // NAVEGACIÓN ENTRENADOR
    if (role === "trainer") {
      const trainerRoutes = {
        clients: "/trainer-dashboard",
        schedule: "/trainer/schedule",
        sessions: "/trainer/sessions",
        routines: "/trainer/routines",
        reports: "/trainer/reports",
        profile: "/trainer/profile"
      };
      if (trainerRoutes[tabId]) navigate(trainerRoutes[tabId]);
    }

    // NAVEGACIÓN RECEPCIONISTA
    if (role === "receptionist") {
      const receptionistRoutes = {
        checkins: "/receptionist-dashboard",
        appointments: "/receptionist/appointments",
        payments: "/receptionist/payments",
        members: "/receptionist/members",
        messages: "/receptionist/messages",
        tasks: "/receptionist/tasks"
      };
      if (receptionistRoutes[tabId]) navigate(receptionistRoutes[tabId]);
    }

    // NAVEGACIÓN USUARIO
    if (role === "user") {
      const userRoutes = {
        dashboard: "/user/dashboard",
        routine: "/user/routine",
        progress: "/user/progress",
        "body-metrics": "/user/body-metrics",
        "meal-plan": "/user/meal-plan",
        health: "/user/health",
        payments: "/user/payments",
        renew: "/user/renew",
        profile: "/user/profile"
      };
      if (userRoutes[tabId]) navigate(userRoutes[tabId]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <motion.div 
      className="dashboard-layout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Sidebar 
        role={role}
        activeTab={getActiveTab()} 
        onTabChange={handleTabChange} 
        onLogout={handleLogout} 
      />
      <motion.div 
        className="main-wrapper" 
        style={{ width: '100%' }}
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Outlet />
      </motion.div>
    </motion.div>
  );
}