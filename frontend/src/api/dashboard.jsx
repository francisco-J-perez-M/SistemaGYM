import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:5000/api", // Asegúrate que coincida con tu backend
});

// Interceptor para incluir el Token automáticamente
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================= DASHBOARD KPIs ================= */

// Esta función trae TODOS los KPIs calculados desde el Backend en una sola petición
export const getDashboardKPIs = async () => {
  const res = await API.get("/dashboard/kpis");
  return res.data;
};