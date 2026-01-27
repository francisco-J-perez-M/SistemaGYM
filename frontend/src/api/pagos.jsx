// src/api/pagos.jsx
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

/* ================= PAGOS ================= */

export const registrarPago = (data) =>
  API.post("/pagos", data);

export const getPagos = () =>
  API.get("/pagos");
