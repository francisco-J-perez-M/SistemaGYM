import "../css/CSSUnificado.css";


export default function BackupsDashboard() {
  return (
    <>
      <header className="top-header">
        <h2 className="page-title">Copias de Seguridad</h2>
      </header>

      <main className="dashboard-content">
        <div className="stat-card">
          <h3>Estado del sistema</h3>
          <p>
            Último respaldo: <strong>No disponible</strong>
          </p>
        </div>

        <div className="stat-card">
          <h3>Acciones</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button className="btn-primary">Crear respaldo</button>
            <button className="btn-outline">Restaurar respaldo</button>
          </div>
        </div>
      </main>
    </>
  );
}