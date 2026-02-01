import { useEffect, useRef, useState } from "react";
import "../css/CSSUnificado.css";
import {
  getDashboardSummary,
  triggerBackup,
  getBackupStatus,
  downloadFile,
} from "../api/backups";

export default function BackupsDashboard() {
  // --- Estados de Datos ---
  const [summary, setSummary] = useState(null);
  const [backupPlan, setBackupPlan] = useState([]);
  const [recentBackups, setRecentBackups] = useState([]);
  const [backupType, setBackupType] = useState("incremental");

  // --- Estados de Ejecución ---
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState(null);

  const pollingRef = useRef(null);

  /* ================= INIT ================= */
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
      setRecentBackups(data.recent_history || []);
    } catch (err) {
      console.error("Error cargando dashboard:", err);
    }
  };

  /* ================= POLLING ================= */
  const startPolling = () => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await getBackupStatus();
        setIsRunning(data.is_running);
        setProgress(data.progress_percentage || 0);
        setCurrentStep(data.current_step);

        if (!data.is_running) {
          if (data.files) setDownloadLinks(data.files);
          stopPolling();
          loadDashboard();
        }
      } catch (err) {
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
      if (data.files) setDownloadLinks(data.files);

      if (data.is_running) {
        setIsRunning(true);
        setProgress(data.progress_percentage);
        setCurrentStep(data.current_step);
        setDownloadLinks(null);
        startPolling();
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= ACCIONES ================= */
  const handleTriggerBackup = async () => {
    try {
      setDownloadLinks(null);
      const { data } = await triggerBackup(backupType);
      if (data.status === "running") {
        setIsRunning(true);
        startPolling();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async (fileType, urlOrFilename) => {
    try {
      let filename;
      if (urlOrFilename.includes('/')) {
        filename = urlOrFilename.split('/').pop();
      } else {
        filename = urlOrFilename;
      }

      const response = await downloadFile(filename);

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error al descargar:", error);
      alert("Error al descargar archivo. Verifique que el archivo existe.");
    }
  };

  /* ================= UI RENDER ================= */
  return (
    <>
      <header className="top-header">
        <h2 className="page-title">Gestión de Copias de Seguridad</h2>
      </header>

      <main className="dashboard-content">

        {/* 1. KPIs SUPERIORES */}
        <div className="kpi-grid">
          <div className="stat-card highlight-border">
            <div className="stat-header">
              <h3>Estado del Sistema</h3>
              <span className={`status-badge ${isRunning ? "warning pulse-animation" : "normal"}`}>
                {isRunning ? "Procesando" : "Operativo"}
              </span>
            </div>
            <p className="stat-detail">Último respaldo exitoso</p>
            <p className="stat-value">
              {summary?.last_backup
                ? new Date(summary.last_backup).toLocaleString()
                : "--/--/----"}
            </p>
          </div>

          <div className="stat-card">
            <h3>Próximo Programado</h3>
            <div className="card-icon-wrapper" style={{ marginBottom: '5px', marginTop: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <p className="stat-value highlight" style={{ fontSize: '20px' }}>
              {summary?.config?.next_scheduled
                ? new Date(summary.config.next_scheduled).toLocaleDateString()
                : "No programado"}
            </p>
            <p className="stat-detail">
              {summary?.config?.next_scheduled 
                ? new Date(summary.config.next_scheduled).toLocaleTimeString() 
                : ""}
            </p>
          </div>
        </div>

        {/* 2. ÁREA PRINCIPAL: CONTROL + PROGRESO */}
        <div className="charts-row" style={{ gridTemplateColumns: "1.5fr 1fr" }}>

          {/* IZQUIERDA: Panel de Control */}
          <div className="stat-card control-panel-card">
            <div className="stat-header">
              <h3>Centro de Comando</h3>
            </div>

            <p className="stat-detail">Seleccione el tipo de respaldo manual a ejecutar.</p>

            <div className="backup-type-selector">
              {[
                { id: "incremental", title: "Incremental", desc: "Solo cambios recientes" },
                { id: "differential", title: "Diferencial", desc: "Desde último Full" },
                { id: "full", title: "Completo", desc: "Base de datos entera" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`type-option ${backupType === t.id ? "active" : ""}`}
                  onClick={() => setBackupType(t.id)}
                  disabled={isRunning}
                >
                  <strong className="type-label">{t.title}</strong>
                  <span className="type-desc">{t.desc}</span>
                </button>
              ))}
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>
                      Iniciar {
                        backupType === 'full' ? 'Completo' :
                          backupType === 'differential' ? 'Diferencial' : 'Incremental'
                      }
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* DERECHA: Progreso y Descargas - BARRA CORREGIDA */}
          <div className="stat-card">
            <div className="chart-header">
              <h3>Monitor de Proceso</h3>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              gap: '15px'
            }}>
              {/* Círculo de progreso CORREGIDO */}
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `conic-gradient(
                    var(--accent-color) ${progress * 3.6}deg, 
                    var(--input-bg-dark) ${progress * 3.6}deg
                  )`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    background: 'var(--bg-card-dark)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '24px',
                    color: 'var(--text-primary)'
                  }}
                >
                  {progress}%
                </div>
              </div>

              <p className="stat-detail" style={{ textAlign: "center", minHeight: '20px' }}>
                {isRunning ? currentStep : (downloadLinks ? "Respaldo Finalizado" : "Sistema en espera")}
              </p>

              {/* BOTONES DE DESCARGA */}
              {!isRunning && downloadLinks && (
                <div className="download-buttons-container">
                  {downloadLinks.sql && (
                    <button className="btn-download sql" onClick={() => handleDownload('sql', downloadLinks.sql)}>
                      <span className="icon" style={{ display: 'flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                        </svg>
                      </span>
                      SQL
                    </button>
                  )}
                  {downloadLinks.excel && (
                    <button className="btn-download excel" onClick={() => handleDownload('excel', downloadLinks.excel)}>
                      <span className="icon" style={{ display: 'flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="3" y1="9" x2="21" y2="9"></line>
                          <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                      </span>
                      Excel
                    </button>
                  )}
                  {downloadLinks.pdf && (
                    <button className="btn-download pdf" onClick={() => handleDownload('pdf', downloadLinks.pdf)}>
                      <span className="icon" style={{ display: 'flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      </span>
                      PDF
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. ZONA INFERIOR: HISTORIAL Y PLAN */}
        <div className="charts-row">

          {/* HISTORIAL RECIENTE */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Historial Reciente (Últimos 3)</h3>
            </div>

            {recentBackups && recentBackups.length > 0 ? (
              <div className="custom-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBackups.slice(0, 3).map((bk, i) => (
                      <tr key={i}>
                        <td>
                          {new Date(bk.date).toLocaleDateString()} {' '}
                          {new Date(bk.date).toLocaleTimeString()}
                        </td>
                        <td>
                          <span className={`status-badge ${
                            bk.type === 'full' ? 'urgent' :
                            bk.type === 'differential' ? 'warning' :
                            'normal'
                          }`}>
                            {bk.type === 'full' ? 'COMPLETO' :
                             bk.type === 'differential' ? 'DIFERENCIAL' :
                             'INCREMENTAL'}
                          </span>
                        </td>
                        <td>
                          {bk.url && !bk.error ? (
                            <button
                              className="btn-outline-small"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => {
                                const filename = bk.url.split('/').pop().split('\\').pop();
                                handleDownload('sql', filename);
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              Descargar
                            </button>
                          ) : (
                            <span className="stat-detail" style={{ color: 'var(--danger-color)' }}>
                              {bk.error ? 'Error' : 'No disponible'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="stat-detail" style={{ padding: '20px', textAlign: 'center' }}>
                No hay historial disponible.
              </p>
            )}
          </div>

          {/* PLAN DE COPIAS */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Plan Configurado</h3>
            </div>
            <ul className="exercises-list">
              {backupPlan.length === 0 ? (
                <li className="exercise-item">
                  <span className="stat-detail">No hay plan automático</span>
                </li>
              ) : (
                backupPlan.map((plan, index) => (
                  <li className="exercise-item" key={index}>
                    <div className="exercise-details">
                      <span className="exercise-name">{plan.title}</span>
                      <span className="exercise-sets">{plan.desc}</span>
                    </div>
                    <div className="exercise-checkbox">
                      <div className="checkbox checked" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
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