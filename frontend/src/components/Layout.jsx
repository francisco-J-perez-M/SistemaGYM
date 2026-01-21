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
    if (path === "/dashboard/backups") return "backups";
    if (path === "/user-dashboard") return "progress"; // Ejemplo para usuario
    return "";
  };

  // Lógica de navegación CENTRALIZADA
  const handleTabChange = (tabId) => {
    switch (tabId) {
      case "overview":
        navigate("/dashboard");
        break;
      case "backups":
      case "restore": // Si ambos llevan al mismo sitio
        navigate("/dashboard/backups");
        break;
      case "users":
        // navigate("/dashboard/users"); // Cuando crees esta ruta
        break;
      case "finance":
        // navigate("/dashboard/finance"); // Cuando crees esta ruta
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