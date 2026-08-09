import axios from "axios";

export const BASE_URL = "";

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Interceptor para inyectar el token en cada petición
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// GET ahora acepta el parámetro search
export const getMiembros = (page = 1, mostrarInactivos = false, search = "") =>
  API.get(`/miembros?page=${page}&inactivos=${mostrarInactivos}&search=${search}`);

export const createMiembro = (data) => API.post("/miembros", data);
export const updateMiembro = (id, data) => API.put(`/miembros/${id}`, data);
export const deleteMiembro = (id) => API.delete(`/miembros/${id}`);
export const reactivateMiembro = (id) => API.put(`/miembros/${id}/reactivar`);

/** Historial paginado de días asistidos al gimnasio por un miembro. */
export const getAsistenciasMiembro = (id, page = 1, perPage = 10) =>
  API.get(`/miembros/${id}/asistencias?page=${page}&per_page=${perPage}`);