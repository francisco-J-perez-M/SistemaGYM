import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiSearch,
  FiTrendingUp,
  FiTrendingDown,
  FiEdit,
  FiBarChart2,
  FiActivity,
  FiX,
  FiAlertCircle
} from "react-icons/fi";
import trainerService from "../services/trainerService";
import { useToast } from "../hooks/useToast";
import "../css/CSSUnificado.css";

export default function TrainerClients() {
  const { toast, ToastPortal } = useToast();

  const [searchTerm, setSearchTerm]       = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [filterStatus, setFilterStatus]   = useState("all");
  const [clients, setClients]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);

  /* ── Carga ── */
  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await trainerService.getClients(page, searchTerm, filterStatus);
      setClients(res.clients);
      setTotalPages(res.pagination?.total_pages || 1);
    } catch (err) {
      const msg = err.message || "Error al cargar clientes";
      setError(msg);
      toast.error("Error al cargar", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, [page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      loadClients();
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm, filterStatus]);

  /* ── KPIs ── */
  const totalClients     = clients.length;
  const averageProgress  = clients.length > 0
    ? Math.round(clients.reduce((acc, c) => acc + (c.progress || 0), 0) / clients.length)
    : 0;
  const averageAttendance = clients.length > 0
    ? Math.round(clients.reduce((acc, c) => acc + (c.attendance || 0), 0) / clients.length)
    : 0;
  const totalSessions = clients.reduce((acc, c) => acc + (c.sessionsTotal || 0), 0);

  /* ── Animaciones ── */
  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getTrendIcon = (trend) => {
    if (trend === "up")   return <FiTrendingUp  style={{ color: "var(--success)" }} />;
    if (trend === "down") return <FiTrendingDown style={{ color: "var(--danger)"  }} />;
    return <FiActivity style={{ color: "var(--text-secondary)" }} />;
  };

  const statusLabel = (s) => ({
    active:   "Activo",
    inactive: "Inactivo",
    risk:     "En riesgo",
  }[s] || s);

  const statusColor = (s) => ({
    active:   "var(--success)",
    risk:     "var(--warning)",
    inactive: "var(--text-secondary)",
  }[s] || "var(--text-secondary)");

  /* ── Loading inicial ── */
  if (loading && clients.length === 0) {
    return (
      <div className="dashboard-content">
        <ToastPortal />
        <div className="loading-spinner">
          <motion.div
            className="spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p style={{ marginTop: 20, color: "var(--text-secondary)" }}>Cargando clientes…</p>
        </div>
      </div>
    );
  }

  /* ── Error sin datos ── */
  if (error && clients.length === 0) {
    return (
      <div className="dashboard-content">
        <ToastPortal />
        <motion.div className="chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="empty-state">
            <FiAlertCircle size={48} style={{ color: "var(--danger)", marginBottom: 15 }} />
            <h3>Error al cargar los datos</h3>
            <p>{error}</p>
            <motion.button
              className="btn-compact-primary"
              onClick={loadClients}
              style={{ marginTop: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Reintentar
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Vista principal ── */
  return (
    <div className="dashboard-content">
      <ToastPortal />

      {/* Welcome */}
      <motion.div
        className="welcome-section"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="welcome-content">
          <div className="welcome-text">
            <h2>Mis Clientes</h2>
            <p>Gestiona y monitorea el progreso de tus clientes</p>
          </div>
          <FiUsers size={50} style={{ color: "var(--accent)", opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div
        className="kpi-grid"
        style={{ marginTop: 25, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: "Total Clientes",    value: totalClients,      detail: "Activos en el programa",  highlight: true  },
          { label: "Progreso Promedio", value: `${averageProgress}%`,  detail: "Hacia sus objetivos"       },
          { label: "Asistencia",        value: `${averageAttendance}%`, detail: "Tasa de asistencia"        },
          { label: "Sesiones Totales",  value: totalSessions,     detail: "Este mes",                highlight: true  },
        ].map((kpi) => (
          <motion.div className="stat-card" variants={itemVariants} key={kpi.label}>
            <div className="stat-header"><h3>{kpi.label}</h3></div>
            <div className={`stat-value${kpi.highlight ? " highlight" : ""}`}>{kpi.value}</div>
            <div className="stat-detail">{kpi.detail}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Búsqueda y filtros */}
      <motion.div
        className="chart-card"
        style={{ marginTop: 25 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ display: "flex", gap: 15, alignItems: "center", flexWrap: "wrap" }}>
          <div className="input-dark-container with-icon" style={{ flex: 1, minWidth: 250 }}>
            <FiSearch size={18} style={{ color: "var(--text-secondary)" }} />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar cliente…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm("")}>
                <FiX />
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {["all", "active", "inactive", "risk"].map((status) => (
              <motion.button
                key={status}
                className="btn-outline-small"
                onClick={() => setFilterStatus(status)}
                style={{
                  background:   filterStatus === status ? "var(--accent)" : "transparent",
                  color:        filterStatus === status ? "#fff"          : "var(--text-secondary)",
                  borderColor:  filterStatus === status ? "var(--accent)" : "var(--border)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {{ all: "Todos", active: "Activos", inactive: "Inactivos", risk: "En riesgo" }[status]}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Lista de clientes */}
      <motion.div
        className="chart-card"
        style={{ marginTop: 20 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="chart-header">
          <h3>Clientes ({clients.length})</h3>
          {totalPages > 1 && (
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Página {page} de {totalPages}
            </span>
          )}
        </div>

        <motion.div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 15,
            marginTop: 20,
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {clients.map((client, idx) => (
            <motion.div
              key={client.id}
              variants={itemVariants}
              className="member-card-hover"
              style={{
                background:   "var(--bg-input)",
                border:       "1px solid var(--border)",
                borderRadius: 12,
                padding:      20,
                cursor:       "pointer",
              }}
              onClick={() => setSelectedClient(client)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Cabecera */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div className="avatar" style={{ width: 50, height: 50, fontSize: 18 }}>
                    {client.name?.split(" ").map((n) => n[0]).join("") || "?"}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{client.name}</h4>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {client.age || "?"} años · {client.goal || "Sin objetivo"}
                    </p>
                  </div>
                </div>
                {getTrendIcon(client.trend)}
              </div>

              {/* Stats rápidos */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 15, fontSize: 12 }}>
                {[
                  { label: "Racha",      value: `${client.streak || 0} días`, color: "var(--accent)"  },
                  { label: "Asistencia", value: `${client.attendance || 0}%`, color: "var(--success)" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "var(--bg-card)", padding: 8, borderRadius: 8, textAlign: "center" }}>
                    <div style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Barra de progreso */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Progreso</span>
                  <span style={{
                    fontWeight: 700,
                    color: (client.progress || 0) >= 80 ? "var(--success)" : "var(--accent)",
                  }}>
                    {client.progress || 0}%
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--bg-card)", borderRadius: 3, overflow: "hidden" }}>
                  <motion.div
                    style={{
                      height:       "100%",
                      background:   (client.progress || 0) >= 80 ? "var(--success)" : "var(--accent)",
                      borderRadius: 3,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${client.progress || 0}%` }}
                    transition={{ delay: 0.3 + idx * 0.05, duration: 0.8 }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                paddingTop: 15, borderTop: "1px solid var(--border)",
                fontSize: 11, color: "var(--text-secondary)",
              }}>
                <span>
                  Estado:{" "}
                  <span style={{ color: statusColor(client.status), fontWeight: 600 }}>
                    {statusLabel(client.status)}
                  </span>
                </span>
                <span>{client.sessionsTotal || 0} sesiones</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty */}
        {clients.length === 0 && !loading && (
          <div className="empty-state">
            <FiUsers size={48} style={{ opacity: 0.3, marginBottom: 15 }} />
            <h3>No se encontraron clientes</h3>
            <p>Intenta con otro término de búsqueda o ajusta los filtros</p>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <motion.div
            style={{
              display: "flex", justifyContent: "center", alignItems: "center",
              gap: 15, marginTop: 25, paddingTop: 15,
              borderTop: "1px solid var(--border)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              className="btn-outline-small"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              style={{ opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? "not-allowed" : "pointer" }}
              whileHover={page !== 1 ? { scale: 1.05 } : {}}
              whileTap={page !== 1 ? { scale: 0.95 } : {}}
            >
              Anterior
            </motion.button>
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Página {page} de {totalPages}
            </span>
            <motion.button
              className="btn-outline-small"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              style={{ opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? "not-allowed" : "pointer" }}
              whileHover={page !== totalPages ? { scale: 1.05 } : {}}
              whileTap={page !== totalPages ? { scale: 0.95 } : {}}
            >
              Siguiente
            </motion.button>
          </motion.div>
        )}

        {/* Spinner de página */}
        {loading && clients.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{
                width: 30, height: 30,
                border: "3px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                margin: "0 auto",
              }}
            />
          </div>
        )}
      </motion.div>

      {/* ── Modal detalle ── */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000, padding: 20,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedClient(null)}
          >
            <motion.div
              style={{
                background: "var(--bg-card)", borderRadius: 16,
                maxWidth: 600, width: "100%", maxHeight: "90vh",
                overflow: "auto", border: "1px solid var(--border)",
              }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                padding: 25, borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                  <div className="avatar" style={{ width: 60, height: 60, fontSize: 24 }}>
                    {selectedClient.name?.split(" ").map((n) => n[0]).join("") || "?"}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 20, marginBottom: 5 }}>{selectedClient.name}</h3>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                      {selectedClient.age || "?"} años · {selectedClient.goal || "Sin objetivo"}
                    </p>
                  </div>
                </div>
                <motion.button
                  className="icon-btn"
                  onClick={() => setSelectedClient(null)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX size={20} />
                </motion.button>
              </div>

              {/* Contenido */}
              <div style={{ padding: 25 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 15 }}>
                  Estadísticas de Progreso
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {selectedClient.stats &&
                    Object.entries(selectedClient.stats).map(([key, values]) => {
                      if (!values || (values.initial === 0 && values.current === 0 && values.goal === 0)) return null;
                      const pct = Math.min(
                        ((values.current - values.initial) / (values.goal - values.initial)) * 100,
                        100
                      );
                      return (
                        <div key={key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                            <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
                              {{ weight: "Peso (kg)", muscle: "Masa Muscular (%)", fat: "Grasa Corporal (%)" }[key] || key}
                            </span>
                            <span style={{ color: "var(--text-secondary)" }}>
                              {values.initial} → {values.current} / {values.goal}
                            </span>
                          </div>
                          <div style={{ height: 8, background: "var(--bg-input)", borderRadius: 4, position: "relative" }}>
                            <motion.div
                              style={{ height: "100%", background: "var(--accent)", borderRadius: 4, position: "absolute" }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.2, duration: 0.8 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div style={{ marginTop: 25, display: "flex", gap: 10 }}>
                  <motion.button
                    className="btn-compact-primary"
                    style={{ flex: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiEdit size={16} /> Editar Perfil
                  </motion.button>
                  <motion.button
                    className="btn-compact-primary"
                    style={{ flex: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiBarChart2 size={16} /> Ver Historial
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}