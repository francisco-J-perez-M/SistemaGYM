import { useEffect, useState } from "react";
import "../css/CSSUnificado.css";
import {
  getBackupHistory,
  restoreBackup,
} from "../api/backups";

const RestoreDashboard = () => {
  const [backups, setBackups] = useState([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [loading, setLoading] = useState(true);

  // ===============================
  // Cargar historial de backups
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
  const handleRestore = async (filename) => {
    const confirm = window.confirm(
      `⚠ ATENCIÓN ⚠\n\n¿Deseas restaurar el respaldo:\n\n${filename}\n\nEsta acción sobrescribirá TODA la base de datos actual.`
    );

    if (!confirm) return;

    try {
      setIsRestoring(true);
      await restoreBackup(filename);
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
  const formatDate = (date) =>
    new Date(date).toLocaleString();

  const getFilename = (url) =>
    url ? url.split("/").pop() : "—";

  // ===============================
  // Render
  // ===============================
  return (
    <>
      {/* HEADER */}
      <header className="top-header">
        <h2 className="page-title">Restaurar Respaldo</h2>
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
              {backups.length}
            </p>
            <p className="stat-detail">
              Disponibles en historial
            </p>
          </div>
        </div>

        {/* ALERTA RESTAURANDO */}
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
                {loading && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Cargando respaldos...
                    </td>
                  </tr>
                )}

                {!loading && backups.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      No hay respaldos disponibles
                    </td>
                  </tr>
                )}

                {!loading &&
                  backups.map((backup, index) => {
                    const filename = getFilename(backup.url);
                    const isSQL = filename.endsWith(".sql");

                    return (
                      <tr key={index}>
                        <td>{filename}</td>
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
                              onClick={() =>
                                handleRestore(filename)
                              }
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
        </div>

      </main>
    </>
  );
};

export default RestoreDashboard;
