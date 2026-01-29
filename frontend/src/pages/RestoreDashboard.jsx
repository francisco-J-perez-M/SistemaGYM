import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "../css/CSSUnificado.css";
import { getBackupHistory, restoreBackup } from "../api/backups";

const RestoreDashboard = () => {
  const [backups, setBackups] = useState([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [loading, setLoading] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ===============================
  // CONFIGURACIÓN DE ALERTAS (ESTILO PRO)
  // ===============================
  
  // 1. Toast: Para notificaciones pequeñas en la esquina (Éxito/Error)
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: 'var(--bg-card-dark)', // Usa tu variable de fondo
    color: 'var(--text-primary)',      // Usa tu variable de texto
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  // 2. Modal Estilizado: Para confirmaciones peligrosas
  const showConfirmModal = async (filename) => {
    return Swal.fire({
      title: '¿Estás seguro?',
      html: `Vas a restaurar: <strong>${filename}</strong>.<br/><br/>
             <span style="color: var(--danger-color)">⚠ Esta acción sobrescribirá TODA la base de datos actual.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--accent-color)', // Tu amarillo/verde
      cancelButtonColor: '#d33',
      confirmButtonText: '<span style="color: var(--text-on-accent)">Sí, restaurar</span>',
      cancelButtonText: 'Cancelar',
      background: 'var(--bg-card-dark)',
      color: 'var(--text-primary)',
      focusConfirm: false,
      backdrop: `rgba(0,0,0,0.6)` // Fondo oscurecido
    });
  };

  // ===============================
  // Cargar historial
  // ===============================
  const loadBackups = async () => {
    try {
      setLoading(true);
      const res = await getBackupHistory();
      setBackups(res.data || []);
    } catch (error) {
      console.error("Error cargando backups", error);
      // Reemplazo de alert con Toast de error
      Toast.fire({
        icon: 'error',
        title: 'Error al cargar historial'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  // ===============================
  // Restaurar backup
  // ===============================
  const handleRestore = async (fullPath) => {
    const filename = getCleanFilename(fullPath);

    // 1. Usar el nuevo Modal Pro en lugar de window.confirm
    const result = await showConfirmModal(filename);

    if (!result.isConfirmed) return;

    try {
      setIsRestoring(true);
      
      // Mostrar loading modal bloqueante mientras restaura
      Swal.fire({
        title: 'Restaurando...',
        html: 'Por favor no cierres la ventana.',
        allowOutsideClick: false,
        background: 'var(--bg-card-dark)',
        color: 'var(--text-primary)',
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await restoreBackup(fullPath);
      
      // Cerrar loading y mostrar éxito
      Swal.close(); 
      
      await Swal.fire({
        icon: 'success',
        title: '¡Restauración Completada!',
        text: 'La base de datos ha sido actualizada correctamente.',
        confirmButtonColor: 'var(--accent-color)',
        confirmButtonText: '<span style="color: var(--text-on-accent)">Entendido</span>',
        background: 'var(--bg-card-dark)',
        color: 'var(--text-primary)',
      });

      loadBackups();

    } catch (error) {
      console.error(error);
      Swal.close(); // Asegurar que se cierre el loading
      
      Swal.fire({
        icon: 'error',
        title: 'Falló la restauración',
        text: error?.response?.data?.detail || "Ocurrió un error inesperado.",
        background: 'var(--bg-card-dark)',
        color: 'var(--text-primary)',
        confirmButtonColor: 'var(--danger-color)'
      });

    } finally {
      setIsRestoring(false);
    }
  };

  // ===============================
  // Helpers
  // ===============================
  const getCleanFilename = (path) =>
    path ? path.split(/[/\\]/).pop() : "—";

  const formatDate = (date) =>
    date ? new Date(date).toLocaleString() : "-";

  // ===============================
  // Separación de datos
  // ===============================
  const restoreLogs = backups.filter(b => b.type === "restore");
  const availableBackups = backups.filter(b => b.type !== "restore");

  // ===============================
  // Paginación
  // ===============================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBackups = availableBackups.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(availableBackups.length / itemsPerPage);

  // ===============================
  // Render
  // ===============================
  return (
    <>
      {/* HEADER */}
      <header className="top-header">
        <h2 className="page-title">Gestión y Restauración de Respaldos</h2>
      </header>

      <main className="dashboard-content">

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="stat-card highlight-border">
            <h3>Estado del Sistema</h3>
            <p className="stat-value">Saludable</p>
            <p className="stat-detail success">
              Base de datos conectada
            </p>
          </div>

          <div className="stat-card">
            <h3>Total de Respaldos</h3>
            <p className="stat-value highlight">
              {availableBackups.length}
            </p>
            <p className="stat-detail">
              Disponibles para restaurar
            </p>
          </div>
        </div>

        {/* ALERTA VISUAL EN UI (Mantén esta, es útil visualmente) */}
        {isRestoring && (
          <div
            className="welcome-section pulse-animation"
            style={{ borderColor: "var(--warning-color)", marginBottom: '20px' }}
          >
            <div className="welcome-content" style={{justifyContent: 'flex-start', gap: '15px'}}>
               {/* Un pequeño spinner inline */}
               <div className="spinner-small" style={{borderColor: 'var(--warning-color)', borderLeftColor: 'transparent'}}></div>
               <div>
                <h3 style={{ color: "var(--warning-color)", fontSize: '18px' }}>
                  Restaurando base de datos...
                </h3>
                <p style={{fontSize: '14px'}}>El sistema puede estar inestable durante unos segundos.</p>
               </div>
            </div>
          </div>
        )}

        {/* ============================= */}
        {/* TABLA: RESPALDOS DISPONIBLES */}
        {/* ============================= */}
        <div className="table-section">
          <div className="section-header">
            <h3>Respaldos Disponibles</h3>
            <span style={{ fontSize: "0.85em", color: "#666" }}>
              Página {currentPage} de {totalPages || 1}
            </span>
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
                {loading && (
                  <tr>
                    <td colSpan="5" className="text-center" style={{padding: '40px'}}>
                      <div className="loading-spinner">
                        <div className="dashboard-spinner"></div>
                        <p>Cargando respaldos...</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && currentBackups.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center" style={{padding: '30px', color: 'var(--text-secondary)'}}>
                      No hay respaldos disponibles
                    </td>
                  </tr>
                )}

                {!loading &&
                  currentBackups.map((backup, index) => {
                    const filename = getCleanFilename(backup.url);
                    const isSQL = filename.endsWith(".sql");

                    return (
                      <tr key={index}>
                        <td style={{ fontWeight: "600", color: 'var(--text-primary)' }}>{filename}</td>
                        <td style={{color: 'var(--text-secondary)'}}>{formatDate(backup.date)}</td>
                        <td style={{color: 'var(--text-secondary)'}}>{backup.size}</td>
                        <td>
                          <span className="status-badge normal">
                            {backup.type}
                          </span>
                        </td>
                        <td>
                          {isSQL ? (
                            <button
                              className="btn-download pdf"
                              // Usamos estilos inline para override específico o clase de tu CSS
                              style={{ 
                                backgroundColor: "rgba(255, 77, 77, 0.1)", 
                                color: "var(--danger-color)",
                                border: "1px solid var(--danger-color)"
                              }}
                              onClick={() => handleRestore(backup.url)}
                              disabled={isRestoring}
                            >
                              Restaurar
                            </button>
                          ) : (
                            <span style={{ opacity: 0.5, fontSize: '12px' }}>
                              No restaurable
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          {availableBackups.length > itemsPerPage && (
            <div className="pagination-controls">
              <button
                className="btn-download"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                style={{opacity: currentPage === 1 ? 0.5 : 1}}
              >
                Anterior
              </button>
              <span className="page-info">Página {currentPage}</span>
              <button
                className="btn-download"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                style={{opacity: currentPage === totalPages ? 0.5 : 1}}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* ============================= */}
        {/* HISTORIAL DE RESTAURACIONES */}
        {/* ============================= */}
        {restoreLogs.length > 0 && (
          <div className="table-section" style={{ opacity: 0.85, marginTop: '40px' }}>
            <div className="section-header">
              <h3>Historial de Restauraciones</h3>
            </div>

            <div className="custom-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {restoreLogs.map((log, index) => (
                    <tr key={index}>
                      <td>{getCleanFilename(log.url)}</td>
                      <td>{formatDate(log.date)}</td>
                      <td>
                        <span className="status-badge success">
                          Completado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </>
  );
};

export default RestoreDashboard;