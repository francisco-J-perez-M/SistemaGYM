import axios from "axios";

const API = axios.create({ baseURL: "/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Registra una venta del Punto de Venta.
 * @param {{ items, total, metodo_pago, id_miembro?, nombre_miembro?, numero_tarjeta?, referencia? }} data
 */
export const registrarVenta = (data) => API.post("/ventas", data);

/**
 * Lista ventas paginadas (panel admin).
 */
export const getVentas = (page = 1, per_page = 10) =>
  API.get(`/ventas?page=${page}&per_page=${per_page}`).then(r => r.data);
