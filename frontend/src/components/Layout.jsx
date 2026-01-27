// src/components/Layout.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../css/CSSUnificado.css"; // Asegúrate de importar tus estilos aquí o en App

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determinar qué tab iluminar según la URL actual
  const getActiveTab = () => {
  const path = location.pathname;

  if (path === "/dashboard") return "overview";
  if (path === "/dashboard/members") return "miembros";
  if (path === "/dashboard/payments") return "pagos";
  if (path === "/dashboard/backups") return "backups";
  if (path === "/dashboard/restore") return "restore";

  return "";
};


  // Lógica de navegación CENTRALIZADA
  const handleTabChange = (tabId) => {
  switch (tabId) {
    case "overview":
      navigate("/dashboard");
      break;

    case "miembros":
      navigate("/dashboard/members");
      break;

    case "pagos":
      navigate("/dashboard/payments");
      break;

    case "backups":
      navigate("/dashboard/backups");
      break;

    case "restore":
      navigate("/dashboard/restore");
      break;

    case "users":
      navigate("/dashboard/users");
      break;

    default:
      break;
  }
};


  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="dashboard-layout">
      {/* La Sidebar siempre está presente */}
      <Sidebar 
        role="admin" // Ojo: Aquí podrías hacerlo dinámico leyendo el user del localStorage
        activeTab={getActiveTab()} 
        onTabChange={handleTabChange} 
        onLogout={handleLogout} 
      />

      {/* Outlet renderiza el componente de la ruta actual (Dashboard, Backups, etc.) */}
      <div className="main-wrapper" style={{ width: '100%' }}>
        <Outlet />
      </div>
    </div>
  );
}