import { useEffect, useRef, useState } from "react";
import "../css/CSSUnificado.css";
import {
  getDashboardSummary,
  triggerBackup,
  getBackupStatus,
} from "../api/backups";

export default function BackupsDashboard() {
  const [summary, setSummary] = useState(null);
  const [backupPlan, setBackupPlan] = useState([]);
  const [backupType, setBackupType] = useState("incremental");

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(null);

  const pollingRef = useRef(null);

  /* ================= CARGA INICIAL ================= */
  useEffect(() => {
    loadDashboard();
    checkBackupStatus();
    return stopPolling;
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await getDashboardSummary();
      setSummary(data);
      setBackupPlan(data.backup_plan || []);
    } catch (error) {
      console.error("Error cargando dashboard", error);
    }
  };

  /* ================= POLLING ================= */
  const startPolling = () => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await getBackupStatus();
        setIsRunning(data.is_running);
        setProgress(data.progress_percentage);
        setCurrentStep(data.current_step);

        if (!data.is_running) stopPolling();
      } catch (error) {
        console.error("Error polling status", error);
        stopPolling();
      }
    }, 2500);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const checkBackupStatus = async () => {
    try {
      const { data } = await getBackupStatus();
      if (data.is_running) {
        setIsRunning(true);
        setProgress(data.progress_percentage);
        setCurrentStep(data.current_step);
        startPolling();
      }
    } catch (error) {
      console.error("Error verificando estado", error);
    }
  };

  /* ================= ACCIÓN MANUAL ================= */
  const handleTriggerBackup = async () => {
    try {
      const { data } = await triggerBackup(backupType);
      if (data.status === "running") {
        setIsRunning(true);
        startPolling();
      }
    } catch (error) {
      console.error("Error iniciando respaldo", error);
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <header className="top-header">
        <h2 className="page-title">Gestión de Copias de Seguridad</h2>
      </header>

      <main className="dashboard-content">

        {/* ================= KPI ================= */}
        <div className="kpi-grid">
          <div className="stat-card highlight-border">
            <div className="stat-header">
              <h3>Estado del sistema</h3>
              <span className={`status-badge ${isRunning ? "warning" : "success"}`}>
                {isRunning ? "En ejecución" : "OK"}
              </span>
            </div>

            <p className="stat-detail">Último respaldo realizado</p>
            <p className="stat-value">
              {summary?.last_backup
                ? new Date(summary.last_backup).toLocaleString()
                : "No disponible"}
            </p>
          </div>

          <div className="stat-card">
            <h3>Frecuencia configurada</h3>
            <p className="stat-value highlight">
              {summary?.config?.frequency || "-"}
            </p>
            <p className="stat-detail">
              Próximo:{" "}
              {summary?.config?.next_scheduled
                ? new Date(summary.config.next_scheduled).toLocaleString()
                : "-"}
            </p>
          </div>

          <div className="stat-card">
            <h3>Tipo actual</h3>
            <p className="stat-value">
              {summary?.config?.default_type || "-"}
            </p>
          </div>
        </div>

        {/* ================= ACCIONES MANUALES (DISEÑO MEJORADO) ================= */}
<div className="stat-card control-panel-card">
  <div className="stat-header">
    <h3>Centro de Comando</h3>
    {isRunning && (
      <span className="status-badge warning pulse-animation">
        Procesando
      </span>
    )}
  </div>

  <p className="stat-detail">
    Seleccione el protocolo de respaldo a ejecutar.
  </p>

  {/* Selector de Tipo (Segmented Control) */}
  <div className="backup-type-selector">
    <button
      className={`type-option ${backupType === "incremental" ? "active" : ""}`}
      onClick={() => setBackupType("incremental")}
      disabled={isRunning}
    >
      <span className="type-label">Incremental</span>
      <span className="type-desc">Solo cambios</span>
    </button>
    
    <button
      className={`type-option ${backupType === "full" ? "active" : ""}`}
      onClick={() => setBackupType("full")}
      disabled={isRunning}
    >
      <span className="type-label">Completo</span>
      <span className="type-desc">Base de datos total</span>
    </button>
  </div>

  {/* Botón de Acción Principal */}
  <div className="action-wrapper">
    <button
      className={`btn-primary btn-block ${isRunning ? "btn-loading" : ""}`}
      onClick={handleTriggerBackup}
      disabled={isRunning}
    >
      {isRunning ? (
        <>
          <div className="spinner-small"></div>
          <span>Ejecutando...</span>
        </>
      ) : (
        <>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" height="20" viewBox="0 0 24 24" 
            fill="none" stroke="currentColor" strokeWidth="2" 
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span>Iniciar Respaldo {backupType === 'full' ? 'Completo' : 'Parcial'}</span>
        </>
      )}
    </button>
  </div>
</div>

        {/* ================= PROGRESO + PLAN ================= */}
        <div className="charts-row">

          {/* PROGRESO */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Progreso del respaldo</h3>
            </div>

            <div className="retention-chart">
              <div
                className="circular-progress"
                style={{
                  background: `
                    conic-gradient(
                      var(--accent-color) 0% ${progress}%,
                      var(--input-bg-dark) ${progress}% 100%
                    )
                  `,
                }}
              >
                <div className="inner-circle">
                  <span className="percentage">{progress}%</span>
                </div>
              </div>

              <p className="stat-detail" style={{ marginTop: "12px" }}>
                {currentStep || "Sin proceso activo"}
              </p>
            </div>
          </div>

          {/* PLAN DE COPIAS */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Plan de Copias de Seguridad</h3>
            </div>

            <ul className="exercises-list">
              {backupPlan.length === 0 ? (
                <li className="exercise-item">
                  <span className="stat-detail">
                    No hay plan configurado
                  </span>
                </li>
              ) : (
                backupPlan.map((plan, index) => (
                  <li className="exercise-item" key={index}>
                    <div className="exercise-details">
                      <span className="exercise-name">{plan.title}</span>
                      <span className="exercise-sets">{plan.desc}</span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

        </div>
      </main>
    </>
  );
}
