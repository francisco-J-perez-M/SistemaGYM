import axios from "axios";

// Cliente centralizado del área de recepción: inyecta el token vigente en
// cada petición (en vez de recalcular headers manualmente en cada componente).
const API = axios.create({ baseURL: "/api" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Tareas de recepción ──────────────────────────────────────────
export const getTasks    = (params = {}) => API.get("/recepcionista/tasks", { params });
export const createTask  = (data)        => API.post("/recepcionista/tasks", data);
export const updateTask  = (id, data)    => API.patch(`/recepcionista/tasks/${id}`, data);
export const deleteTask  = (id)          => API.delete(`/recepcionista/tasks/${id}`);
