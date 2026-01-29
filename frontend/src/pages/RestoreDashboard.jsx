import { useEffect, useState } from "react";
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
  // Cargar historial
  // ===============================
  const loadBackups = async () => {
    try {
      setLoading(true);
      const res = await getBackupHistory();
      setBackups(res.data || []);
    } catch (error) {
      console.error("Error cargando backups", error);
      alert("Error al cargar el historial de respaldos");
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

    const confirm = window.confirm(
      `⚠ ATENCIÓN ⚠\n\n¿Deseas restaurar el respaldo:\n\n${filename}\n\nEsta acción sobrescribirá TODA la base de datos actual.`
    );

    if (!confirm) return;

    try {
      setIsRestoring(true);
      await restoreBackup(fullPath);
      alert("✅ Base de datos restaurada correctamente");
      loadBackups();
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.detail ||
        "❌ Error al restaurar la base de datos"
      );
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

        {/* ALERTA DE RESTAURACIÓN */}
        {isRestoring && (
          <div
            className="welcome-section pulse-animation"
            style={{ borderColor: "var(--warning-color)" }}
          >
            <h3 style={{ color: "var(--warning-color)" }}>
              ⚠ Restaurando base de datos...
            </h3>
            <p>No cierres ni recargues esta ventana.</p>
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
                    <td colSpan="5" className="text-center">
                      Cargando respaldos...
                    </td>
                  </tr>
                )}

                {!loading && currentBackups.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center">
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
                        <td style={{ fontWeight: "bold" }}>{filename}</td>
                        <td>{formatDate(backup.date)}</td>
                        <td>{backup.size}</td>
                        <td>
                          <span className="status-badge normal">
                            {backup.type}
                          </span>
                        </td>
                        <td>
                          {isSQL ? (
                            <button
                              className="btn-download pdf"
                              style={{ backgroundColor: "#08111e" }}
                              onClick={() => handleRestore(backup.url)}
                              disabled={isRestoring}
                            >
                              Restaurar
                            </button>
                          ) : (
                            <span style={{ opacity: 0.5 }}>
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
              >
                Anterior
              </button>
              <button
                className="btn-download"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
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
          <div className="table-section" style={{ opacity: 0.85 }}>
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
