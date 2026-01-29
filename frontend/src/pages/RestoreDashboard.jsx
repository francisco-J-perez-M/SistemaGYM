import React, { useState } from "react";
import "../css/CSSUnificado.css";

const RestoreDashboard = () => {
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Mock data
  const backups = [
    { id: 1, name: "backup_v2_final.sql", date: "28 Ene 2026 - 10:30 AM", size: "12.5 MB", type: "Manual" },
    { id: 2, name: "auto_backup_daily.sql", date: "27 Ene 2026 - 00:00 AM", size: "12.4 MB", type: "Automático" },
    { id: 3, name: "backup_pre_cambios.sql", date: "25 Ene 2026 - 14:15 PM", size: "11.8 MB", type: "Manual" },
    { id: 4, name: "initial_structure.sql", date: "15 Ene 2026 - 09:00 AM", size: "4.2 MB", type: "Sistema" },
  ];

  const handleCreateBackup = () => {
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      alert("¡Respaldo creado exitosamente! (Simulación)");
    }, 2000);
  };

  const handleRestore = (filename) => {
    if (
      window.confirm(
        `¿Estás SEGURO de restaurar ${filename}?\n\nEsta acción sobrescribirá los datos actuales.`
      )
    ) {
      setIsRestoring(true);
      setTimeout(() => {
        setIsRestoring(false);
        alert(`Sistema restaurado desde: ${filename}`);
      }, 3000);
    }
  };

  return (
    <>
      {/* HEADER */}
      <header className="top-header">
        <h2 className="page-title">Restaurar Respaldo</h2>
      </header>

      {/* CONTENIDO */}
      <main className="dashboard-content">

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="stat-card highlight-border">
            <h3>Estado del Sistema</h3>
            <p className="stat-value">Saludable</p>
            <p className="stat-detail success">Base de datos conectada</p>
          </div>

          <div className="stat-card">
            <h3>Total de Respaldos</h3>
            <p className="stat-value highlight">{backups.length}</p>
            <p className="stat-detail">Disponibles para restaurar</p>
          </div>

          
        </div>

        {/* ALERTA RESTAURANDO */}
        {isRestoring && (
          <div className="welcome-section pulse-animation" style={{ borderColor: "var(--warning-color)" }}>
            <h3 style={{ color: "var(--warning-color)" }}>
              ⚠ Restaurando base de datos...
            </h3>
            <p>No cierres esta ventana.</p>
          </div>
        )}

        {/* TABLA */}
        <div className="table-section">
          <div className="section-header">
            <h3>Historial de Respaldos</h3>
          </div>

          <div className="custom-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Fecha</th>
                  <th>Tamaño</th>
                  <th>Tipo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td>{backup.name}</td>
                    <td>{backup.date}</td>
                    <td>{backup.size}</td>
                    <td>
                      <span className="status-badge normal">{backup.type}</span>
                    </td>
                    <td>
                      <button
                        className="btn-download pdf"
                        onClick={() => handleRestore(backup.name)}
                      >
                        Restaurar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </>
  );
};

export default RestoreDashboard;
