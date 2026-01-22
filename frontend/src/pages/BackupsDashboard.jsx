import { useEffect, useRef, useState } from "react";
import "../css/CSSUnificado.css";
import {
  getDashboardSummary,
  triggerBackup,
  getBackupStatus,
  downloadFile, // <--- Importamos la nueva función
} from "../api/backups";

export default function BackupsDashboard() {
  const [summary, setSummary] = useState(null);
  const [backupPlan, setBackupPlan] = useState([]);
  const [backupType, setBackupType] = useState("incremental");

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(null);
  
  // NUEVO ESTADO: Para guardar las URLs de los archivos generados
  const [downloadLinks, setDownloadLinks] = useState(null);

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

        // Si terminó, guardamos los archivos y paramos polling
        if (!data.is_running) {
          if (data.files) {
            setDownloadLinks(data.files); // Guardamos los links recibidos del backend
          }
          stopPolling();
          loadDashboard(); // Recargar para actualizar la fecha de "último backup"
        }
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
      // Si hay archivos de una ejecución previa reciente, los cargamos
      if (data.files) setDownloadLinks(data.files);
      
      if (data.is_running) {
        setIsRunning(true);
        setProgress(data.progress_percentage);
        setCurrentStep(data.current_step);
        // Limpiamos links viejos mientras corre uno nuevo
        setDownloadLinks(null); 
        startPolling();
      }
    } catch (error) {
      console.error("Error verificando estado", error);
    }
  };

  /* ================= ACCIÓN MANUAL ================= */
  const handleTriggerBackup = async () => {
    try {
      setDownloadLinks(null); // Limpiar descargas anteriores
      const { data } = await triggerBackup(backupType);
      if (data.status === "running") {
        setIsRunning(true);
        startPolling();
      }
    } catch (error) {
      console.error("Error iniciando respaldo", error);
    }
  };

  /* ================= DESCARGA DE ARCHIVOS ================= */
  const handleDownload = async (fileKey, url) => {
    try {
      const response = await downloadFile(url);
      
      // Crear un link temporal en el navegador
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      link.href = downloadUrl;
      
      // Asignar extensión correcta
      const ext = fileKey === 'excel' ? 'xlsx' : fileKey; 
      link.setAttribute("download", `backup_completo.${ext}`);
      
      document.body.appendChild(link);
      link.click();
      
      // Limpieza
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error descargando archivo", error);
      alert("Error al descargar el archivo");
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

        {/* ================= CONTROL PANEL ================= */}
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

        {/* ================= PROGRESO + RESULTADOS ================= */}
        <div className="charts-row">

          {/* PROGRESO Y DESCARGAS */}
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

              <p className="stat-detail" style={{ marginTop: "12px", textAlign: "center" }}>
                {currentStep || "Esperando instrucciones..."}
              </p>

              {/* === SECCIÓN DE DESCARGA AQUÍ === */}
              {!isRunning && downloadLinks && (
                 <div className="downloads-grid" style={{ marginTop: '20px', width: '100%', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {downloadLinks.sql && (
                        <button 
                            className="btn-mini btn-sql" 
                            onClick={() => handleDownload('sql', downloadLinks.sql)}
                            style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', background: '#f0f0f0', fontSize: '0.85rem' }}
                        >
                            💾 SQL
                        </button>
                    )}
                    {downloadLinks.excel && (
                        <button 
                            className="btn-mini btn-excel" 
                            onClick={() => handleDownload('excel', downloadLinks.excel)}
                            style={{ padding: '8px 12px', border: '1px solid #107c41', borderRadius: '6px', cursor: 'pointer', background: '#dff6dd', color: '#107c41', fontSize: '0.85rem' }}
                        >
                            📊 Excel
                        </button>
                    )}
                    {downloadLinks.pdf && (
                        <button 
                            className="btn-mini btn-pdf" 
                            onClick={() => handleDownload('pdf', downloadLinks.pdf)}
                            style={{ padding: '8px 12px', border: '1px solid #d32f2f', borderRadius: '6px', cursor: 'pointer', background: '#fce4e4', color: '#d32f2f', fontSize: '0.85rem' }}
                        >
                            📄 PDF
                        </button>
                    )}
                 </div>
              )}
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