import axios from "axios";

const API = axios.create({ baseURL: "/api" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Gimnasios ─────────────────────────────────────────────────────
export const getGimnasios     = (params = {}) => API.get("/superadmin/gimnasios", { params });
export const getGimnasio      = (id)          => API.get(`/superadmin/gimnasios/${id}`);
export const toggleGimnasio   = (id)          => API.patch(`/superadmin/gimnasios/${id}/toggle`);
export const getMetricasGim   = (id)          => API.get(`/superadmin/gimnasios/${id}/metricas`);

// ── Suscripciones ─────────────────────────────────────────────────
export const getSuscripciones  = (params = {}) => API.get("/superadmin/suscripciones", { params });
export const getSuscripcion    = (id)           => API.get(`/superadmin/suscripciones/${id}`);
export const cambiarPlanSub    = (id, plan_id)  => API.patch(`/superadmin/suscripciones/${id}/plan`, { plan_id });
export const cambiarEstadoSub  = (id, estado, razon) =>
  API.patch(`/superadmin/suscripciones/${id}/estado`, { estado, razon });

// ── Planes ────────────────────────────────────────────────────────
export const getPlanes    = ()          => API.get("/superadmin/planes");
export const crearPlan    = (data)      => API.post("/superadmin/planes", data);
export const editarPlan   = (id, data)  => API.put(`/superadmin/planes/${id}`, data);
export const togglePlan   = (id)        => API.patch(`/superadmin/planes/${id}/toggle`);

// ── Usuarios ──────────────────────────────────────────────────────
export const getUsuarios     = (params = {}) => API.get("/superadmin/usuarios", { params });
export const getUsuario      = (id)           => API.get(`/superadmin/usuarios/${id}`);
export const impersonar      = (id)           => API.post(`/superadmin/usuarios/${id}/impersonate`);
export const toggleUsuario   = (id)           => API.patch(`/superadmin/usuarios/${id}/toggle`);

// ── Backups admin ─────────────────────────────────────────────────
export const getBackupStatus      = ()         => API.get("/superadmin/backups/status");
export const triggerBackup        = (tipo)     => API.post("/superadmin/backups/trigger", { tipo });
export const getBackupHistorial   = (params)   => API.get("/superadmin/backups/historial", { params });
export const deleteBackupEntry    = (job_id)   => API.delete(`/superadmin/backups/historial/${job_id}`);
export const getSchedule          = ()         => API.get("/superadmin/backups/schedule");
export const updateSchedule       = (data)     => API.post("/superadmin/backups/schedule", data);

// ── Analytics plataforma ──────────────────────────────────────────
export const getAnalyticsPlataforma = () => API.get("/superadmin/analytics/plataforma");
export const refreshAnalytics       = () => API.post("/superadmin/analytics/plataforma");
export const getProyeccion          = () => API.get("/superadmin/analytics/proyeccion");
export const getChurnGimnasios      = () => API.get("/superadmin/analytics/churn-gimnasios");
export const getCrecimiento         = () => API.get("/superadmin/analytics/crecimiento");
