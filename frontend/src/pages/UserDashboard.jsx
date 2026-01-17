import { useState } from "react";
import Sidebar from "../components/Sidebar"; // <--- Importamos el componente
import "../css/Dashboard.css";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("home");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="dashboard-layout">
      
      {/* Usamos el componente Sidebar pasando el rol de usuario */}
      <Sidebar 
        role="user" 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* CONTENIDO PRINCIPAL */}
      <div className="main-wrapper">
        <header className="top-header">
            <h2 className="page-title">¡Hola, Carlos!</h2>
            <div className="header-right">
                 <div className="user-profile">
                    <div className="avatar">CM</div>
                    <div className="user-info">
                        <span className="name">Carlos Mendoza</span>
                        <span className="role">Miembro Premium</span>
                    </div>
                 </div>
            </div>
        </header>

        <main className="dashboard-content">
             {/* Banner de bienvenida */}
            <div className="welcome-section" style={{marginBottom: '30px'}}>
                <div className="welcome-content">
                    <div className="welcome-text">
                        <h2>Hoy es día de Pierna 🦵</h2>
                        <p>Rutina programada de 45 min.</p>
                    </div>
                    <div className="action-buttons">
                        <button className="btn-primary">Ver Rutina</button>
                    </div>
                </div>
            </div>

            {/* Contenido específico del usuario (Kpis de peso, clases, etc) */}
             <div className="kpi-grid">
                <div className="stat-card">
                    <h3>Días Asistidos</h3>
                    <p className="stat-value">12</p>
                </div>
                <div className="stat-card highlight-border">
                    <h3>Próxima Clase</h3>
                    <p className="stat-value highlight">Yoga</p>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}