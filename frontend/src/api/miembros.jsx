import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================= MIEMBROS ================= */

// Modificado: Ahora acepta página y si queremos ver inactivos
export const getMiembros = (page = 1, mostrarInactivos = false) => 
  API.get(`/miembros?page=${page}&inactivos=${mostrarInactivos}`);

export const createMiembro = (data) => API.post("/miembros", data);

export const updateMiembro = (id, data) =>
  API.put(`/miembros/${id}`, data);

export const deleteMiembro = (id) =>
  API.delete(`/miembros/${id}`);

// Nuevo: Para reactivar un usuario inactivo
export const reactivateMiembro = (id) => 
  API.put(`/miembros/${id}/reactivar`);