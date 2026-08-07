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
  FiAlertCircle,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar
} from "react-icons/fi";
import trainerService from "../../services/entrenador/trainerService";
import { useToast } from "../../hooks/useToast";
import "../../css/CSSUnificado.css";

/** Fecha legible, o null si no hay dato: la ficha omite lo que no sabe. */
const fechaCorta = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
};

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
  const [serverTotal, setServerTotal]     = useState(0);  // total real del servidor

  // Modal del cliente: historial + edición de objetivo
  const [clientHistory, setClientHistory] = useState(null);  // null = no cargado, [] = vacío
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingGoal, setEditingGoal]     = useState(false);
  const [goalInput, setGoalInput]         = useState("");
  const [savingGoal, setSavingGoal]       = useState(false);

  // Historial del miembro con entrenadores previos (mismo gimnasio)
  const [prevHistory, setPrevHistory] = useState(null);

  // Reiniciar el sub-estado del modal cada vez que se abre/cambia el cliente
  useEffect(() => {
    setClientHistory(null);
    setEditingGoal(false);
    setLoadingHistory(false);
    setGoalInput(selectedClient?.goal || "");
    setPrevHistory(null);
    if (selectedClient) {
      trainerService.getClientPrevHistory(selectedClient.id)
        .then(setPrevHistory)
        .catch(() => setPrevHistory(null));
    }
  }, [selectedClient]);

  const loadHistory = async () => {
    if (!selectedClient) return;
    setLoadingHistory(true);
    try {
      const data = await trainerService.getClientHistory(selectedClient.id);
      setClientHistory(data.historial || []);
    } catch (err) {
      toast.error("No se pudo cargar el historial", err.message);
      setClientHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleEditGoal = () => {
    if (editingGoal) { setEditingGoal(false); }
    else { setGoalInput(selectedClient?.goal || ""); setEditingGoal(true); }
  };

  const saveGoal = async () => {
    if (!selectedClient) return;
    const objetivo = goalInput.trim();
    setSavingGoal(true);
    try {
      await trainerService.updateClientGoal(selectedClient.id, { objetivo });
      setSelectedClient((c) => ({ ...c, goal: objetivo }));
      setClients((cs) => cs.map((c) => (c.id === selectedClient.id ? { ...c, goal: objetivo } : c)));
      setEditingGoal(false);
      toast.success("Objetivo actualizado");
    } catch (err) {
      toast.error("No se pudo guardar", err.message);
    } finally {
      setSavingGoal(false);
    }
  };

  /* ── Carga ── */
  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await trainerService.getClients(page, searchTerm, filterStatus);
      setClients(res.clients);
      setTotalPages(res.pagination?.total_pages || 1);
      setServerTotal(res.pagination?.total || 0);
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

  /* ── KPIs (usamos serverTotal para el total real; el resto es aproximado de la página actual) ── */
  const averageAttendance = clients.length > 0
    ? Math.round(clients.reduce((acc, c) => acc + (c.attendance || 0), 0) / clients.length)
    : 0;
  const totalSessions = clients.reduce((acc, c) => acc + (c.sessionsTotal || 0), 0);
  const activeClients = clients.filter(c => c.status === "active").length;
  const riskClients   = clients.filter(c => c.status === "risk" || c.status === "inactive").length;

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
          { label: "Total Clientes",   value: serverTotal,             detail: "Asignados a ti",          highlight: true  },
          { label: "Asistencia",       value: `${averageAttendance}%`, detail: "Promedio esta página"                      },
          { label: "En riesgo",        value: riskClients,             detail: "Baja asistencia / inactivos"               },
          { label: "Sesiones Totales", value: totalSessions,           detail: "Esta página",             highlight: true  },
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
          <h3>Clientes ({serverTotal})</h3>
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
                    {/* Sin fecha de nacimiento se omite la edad en lugar de
                        pintar un "?", que parecía un error del sistema. */}
                    <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {client.age ? `${client.age} años · ` : ""}
                      {client.goal || "Sin objetivo"}
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
                      {selectedClient.goal || "Sin objetivo definido"}
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
                  Resumen del cliente
                </h4>

                {/* Métricas reales del cliente */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 18 }}>
                  {[
                    { label: "Racha",            value: `${selectedClient.streak ?? 0} días` },
                    { label: "Asistencia",       value: `${selectedClient.attendance ?? 0}%` },
                    { label: "Sesiones totales", value: selectedClient.sessionsTotal ?? 0 },
                    { label: "Estado",           value: ({ active: "Activo", inactive: "Inactivo", risk: "En riesgo" }[selectedClient.status]) || selectedClient.status || "—" },
                  ].map((m) => (
                    <div key={m.label} style={{ background: "var(--bg-input)", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Datos personales y última medición corporal.
                    Solo se pintan los campos con dato: una ficha llena de
                    guiones no informa más que una corta. */}
                {(() => {
                  const filas = [
                    { icono: <FiUser size={13} />,     label: "Edad",          valor: selectedClient.age ? `${selectedClient.age} años` : null },
                    { icono: <FiUser size={13} />,     label: "Sexo",          valor: selectedClient.sex || null },
                    { icono: <FiMail size={13} />,     label: "Correo",        valor: selectedClient.email || null },
                    { icono: <FiPhone size={13} />,    label: "Teléfono",      valor: selectedClient.phone || null },
                    { icono: <FiCalendar size={13} />, label: "Miembro desde", valor: fechaCorta(selectedClient.memberSince) },
                  ].filter((f) => f.valor);

                  const medidas = [
                    { label: "Peso",       valor: selectedClient.weight  != null ? `${selectedClient.weight} kg` : null },
                    { label: "IMC",        valor: selectedClient.bmi     != null ? Number(selectedClient.bmi).toFixed(1) : null },
                    { label: "Grasa",      valor: selectedClient.bodyFat != null ? `${selectedClient.bodyFat}%` : null },
                  ].filter((m) => m.valor);

                  if (filas.length === 0 && medidas.length === 0) return null;

                  return (
                    <div style={{ marginBottom: 18 }}>
                      {filas.length > 0 && (
                        <>
                          <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Datos del cliente</h4>
                          <div style={{ display: "grid", gap: 6, marginBottom: medidas.length ? 16 : 0 }}>
                            {filas.map((f) => (
                              <div key={f.label} style={{
                                display: "flex", alignItems: "center", gap: 9,
                                background: "var(--bg-input)", borderRadius: 8, padding: "9px 12px",
                              }}>
                                <span style={{ color: "var(--accent)", display: "flex" }}>{f.icono}</span>
                                <span style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 100 }}>{f.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{f.valor}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {medidas.length > 0 && (
                        <>
                          <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Última medición</h4>
                          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 10px" }}>
                            {selectedClient.lastMeasured
                              ? `Registrada el ${fechaCorta(selectedClient.lastMeasured)}.`
                              : "Sin fecha de registro."}
                          </p>
                          <div style={{ display: "grid", gridTemplateColumns: `repeat(${medidas.length}, 1fr)`, gap: 10 }}>
                            {medidas.map((m) => (
                              <div key={m.label} style={{
                                background: "var(--bg-input)", borderRadius: 10, padding: "12px 14px", textAlign: "center",
                              }}>
                                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 3 }}>{m.label}</div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--accent)" }}>{m.valor}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Historial con entrenadores previos (mismo gimnasio) */}
                {prevHistory && ((prevHistory.resumen?.entrenadores_previos > 0) || (prevHistory.rutinas || []).length > 0) && (
                  <div style={{ marginBottom: 18 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Historial con entrenadores previos</h4>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 10px" }}>
                      Lo que este miembro ya trabajó en el gimnasio, para que continúes desde ahí.
                    </p>
                    {(prevHistory.entrenadores || []).length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                        {prevHistory.entrenadores.map((e, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input)", borderRadius: 8, padding: "8px 12px" }}>
                            <FiUsers size={13} style={{ color: "var(--accent)" }} />
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{e.nombre}</span>
                            <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, fontWeight: 700,
                              background: e.actual ? "rgba(16,185,129,.15)" : "var(--bg-card)",
                              color: e.actual ? "var(--success)" : "var(--text-secondary)" }}>
                              {e.actual ? "Actual (tú)" : (e.estado === "finalizada" ? "Anterior" : "Previo")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(prevHistory.rutinas || []).length > 0 && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", margin: "6px 0" }}>
                          Rutinas trabajadas ({prevHistory.resumen?.total_rutinas ?? prevHistory.rutinas.length}) · {prevHistory.resumen?.total_entrenamientos ?? 0} entrenamientos registrados
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {prevHistory.rutinas.slice(0, 8).map((r, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input)", borderRadius: 8, padding: "9px 12px", fontSize: 12, flexWrap: "wrap" }}>
                              <FiActivity size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
                              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.nombre}</span>
                              {r.dias > 0 && <span style={{ color: "var(--text-secondary)" }}>· {r.dias} día{r.dias === 1 ? "" : "s"}</span>}
                              <div style={{ flex: 1 }} />
                              {r.origen && (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                                  background: r.origen.startsWith("Asignada") ? "rgba(16,185,129,.15)" : "var(--bg-card)",
                                  color: r.origen.startsWith("Asignada") ? "var(--success)" : "var(--text-secondary)" }}>
                                  {r.origen}{r.nombre_entrenador ? `: ${r.nombre_entrenador}` : ""}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Objetivo (editable) */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Objetivo</div>
                  {editingGoal ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input
                        value={goalInput}
                        onChange={(e) => setGoalInput(e.target.value)}
                        placeholder="Ej. Pérdida de peso, hipertrofia…"
                        style={{ flex: 1, minWidth: 160, padding: "9px 12px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13 }}
                      />
                      <button className="btn-compact-primary" disabled={savingGoal} onClick={saveGoal}>
                        {savingGoal ? "Guardando…" : "Guardar"}
                      </button>
                      <button
                        className="btn-compact-primary"
                        style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                        onClick={() => { setEditingGoal(false); setGoalInput(selectedClient.goal || ""); }}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                      {selectedClient.goal || "Sin objetivo definido"}
                    </div>
                  )}
                </div>

                {/* Historial de sesiones */}
                {clientHistory !== null && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Historial de sesiones</div>
                    {clientHistory.length === 0 ? (
                      <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                        Este cliente aún no tiene sesiones registradas.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {clientHistory.map((s) => (
                          <div key={s.id_sesion} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-input)", borderRadius: 8, padding: "10px 12px" }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.type || s.nombre_sesion || "Sesión"}</div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s.date} · {s.time}</div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: "var(--bg-card)", color: "var(--text-secondary)" }}>
                              {({ completed: "Completada", scheduled: "Agendada", cancelled: "Cancelada", "in-progress": "En curso" }[s.status]) || s.status || "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div style={{ marginTop: 6, display: "flex", gap: 10 }}>
                  <motion.button
                    className="btn-compact-primary"
                    style={{ flex: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleEditGoal}
                  >
                    <FiEdit size={16} /> {editingGoal ? "Cerrar edición" : "Editar objetivo"}
                  </motion.button>
                  <motion.button
                    className="btn-compact-primary"
                    style={{ flex: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadHistory}
                    disabled={loadingHistory}
                  >
                    <FiBarChart2 size={16} /> {loadingHistory ? "Cargando…" : "Ver Historial"}
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