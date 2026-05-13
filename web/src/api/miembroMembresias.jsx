import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================= MIEMBRO - MEMBRESÍAS ================= */

export const getMembresiasPorExpirar = (dias = 7) =>
  API.get(`/miembro-membresias/expiran?dias=${dias}`);
