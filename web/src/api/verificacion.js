import axios from "axios";

const API = axios.create({ baseURL: "/api" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Verificación de membresía entre sucursales (HU-47 / SCRUM-218) ───────
// Exactamente uno de los dos criterios; nunca ambos ni ninguno (ver
// routes/compartido/verificacion_sucursal.py).
export const verificarMiembro = ({ numeroSocio, nombre }) =>
  API.get("/miembros/verificar", {
    params: numeroSocio ? { numero_socio: numeroSocio } : { nombre },
  });

// ── Traslado de sucursal (HU-48 / SCRUM-219) ──────────────────────────────
// idGimnasioDestino es opcional: si se omite, el backend usa la sucursal
// del propio token (caso de Verificar Visitante, "traer este visitante a
// mi sucursal"); si se manda, es el traslado masivo desde Miembros,
// "empujar a los seleccionados hacia otra sucursal que yo elijo".
export const trasladarMiembros = (idsMiembro, idGimnasioDestino) =>
  API.post("/miembros/trasladar", {
    ids_miembro: idsMiembro,
    ...(idGimnasioDestino ? { id_gimnasio_destino: idGimnasioDestino } : {}),
  });

/** Sucursales hacia las que el usuario actual puede trasladar miembros
 *  (todas si es Propietario, solo las asignadas si es Administrador). */
export const getSucursalesDestino = () => API.get("/miembros/sucursales-destino");
