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

/* ================= MIEMBRO - MEMBRESÍAS ================= */

export const getMembresiasPorExpirar = (dias = 7) =>
  API.get(`/miembro-membresias/expiran?dias=${dias}`);
