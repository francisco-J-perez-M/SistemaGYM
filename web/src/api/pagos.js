/**
 * api/pagos.js — Cliente de las pasarelas de pago (PayPal y Mercado Pago).
 *
 * Dos grupos de llamadas:
 *   - Configuración (solo dueño del gimnasio): registra las credenciales con las
 *     que SU gimnasio cobrará. El dinero cae directo en su cuenta.
 *   - Checkout (cualquier rol autorizado): inicia un cobro y consulta su estado.
 */
import axios from "axios";

const API = axios.create({ baseURL: "/api" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // El superadmin puede operar sobre un gimnasio concreto
  const gym = localStorage.getItem("sa_gym_id");
  if (gym) config.headers["X-Gym-ID"] = gym;
  return config;
});

// ── Configuración de cobros del gimnasio ──────────────────────────────────────

export const getPasarelas = () => API.get("/owner/pasarelas");

export const guardarPasarela = (proveedor, data) =>
  API.put(`/owner/pasarelas/${proveedor}`, data);

export const probarPasarela = (proveedor) =>
  API.post(`/owner/pasarelas/${proveedor}/probar`);

export const togglePasarela = (proveedor) =>
  API.patch(`/owner/pasarelas/${proveedor}/toggle`);

export const eliminarPasarela = (proveedor) =>
  API.delete(`/owner/pasarelas/${proveedor}`);

// ── Checkout ──────────────────────────────────────────────────────────────────

/** Métodos de pago en línea activos en el gimnasio actual. */
export const getMetodosPago = () => API.get("/pagos/metodos");

/**
 * Inicia un cobro y devuelve la URL de pago.
 * @param {object} p
 * @param {"paypal"|"mercadopago"} p.proveedor
 * @param {"membresia"|"producto"|"suscripcion"} p.contexto
 * @param {number} p.monto
 * @param {string} p.descripcion
 * @param {string} [p.referencia_local] id del miembro, venta o suscripción
 */
export const crearCheckout = (p) => API.post("/pagos/checkout", p);

/** Consulta (y confirma con la pasarela) el estado de una transacción. */
export const getEstadoPago = (txId) => API.get(`/pagos/estado/${txId}`);

/**
 * Atajo: crea el cobro y redirige el navegador a la pasarela.
 * Devuelve la transacción creada por si se quiere guardar antes de salir.
 */
export const pagarYRedirigir = async (payload) => {
  const { data } = await crearCheckout(payload);
  if (data?.url_pago) window.location.href = data.url_pago;
  return data;
};
