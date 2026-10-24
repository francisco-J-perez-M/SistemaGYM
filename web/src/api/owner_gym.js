import axios from "axios";

const API = axios.create({ baseURL: "/api" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Dashboard ─────────────────────────────────────────────────────────────
export const getOwnerDashboard   = ()           => API.get("/owner_gym/dashboard");
export const getOwnerIngresos    = (meses = 6)  => API.get("/owner_gym/dashboard/ingresos", { params: { meses } });
export const getOwnerActividad   = (limit = 20) => API.get("/owner_gym/dashboard/actividad", { params: { limit } });
export const getOwnerAlertas     = ()           => API.get("/owner_gym/alertas");

// ── Perfil del gimnasio ───────────────────────────────────────────────────
export const getOwnerPerfil      = ()     => API.get("/owner_gym/perfil");
export const updateOwnerPerfil   = (data) => API.put("/owner_gym/perfil", data);
// Datos de la PERSONA propietaria, distintos de los del gimnasio.
export const updateOwnerPropietario = (data) =>
  API.put("/owner_gym/perfil/propietario", data);

// ── Reportes ejecutivos ───────────────────────────────────────────────────
// idGimnasio: opcional -- reporte de OTRA sucursal de la misma organización
// (ver _resolver_gimnasio_objetivo() en reportes_negocio.py). Sin él, la
// propia sucursal del token.
export const getReporteOpciones = (idGimnasio) =>
  API.get("/owner_gym/reportes/opciones", {
    params: idGimnasio ? { id_gimnasio: idGimnasio } : {},
  });
/** Sucursales sobre las que el usuario puede pedir reporte (todas si es
 *  Propietario, solo las asignadas si es Administrador). */
export const getReporteSucursales = () => API.get("/owner_gym/reportes/sucursales");
/** Descarga el PDF como blob; el navegador no puede seguir un enlace con JWT. */
export const descargarReportePdf = (params) =>
  API.get("/owner_gym/reportes/pdf", { params, responseType: "blob" });

// ── Staff (entrenadores + recepcionistas) ─────────────────────────────────
export const getStaff            = (params = {}) => API.get("/owner_gym/staff", { params });
export const getStaffMember      = (id)          => API.get(`/owner_gym/staff/${id}`);
export const crearStaff          = (data)        => API.post("/owner_gym/staff", data);
export const toggleStaff         = (id)          => API.patch(`/owner_gym/staff/${id}/toggle`);
export const updateStaff         = (id, data)    => API.put(`/owner_gym/staff/${id}`, data);

// ── Tipos de membresía ────────────────────────────────────────────────────
export const getMembresias       = (params = {}) => API.get("/owner_gym/membresias", { params });
export const crearMembresia      = (data)        => API.post("/owner_gym/membresias", data);
export const editarMembresia     = (id, data)    => API.put(`/owner_gym/membresias/${id}`, data);
export const toggleMembresia     = (id)          => API.patch(`/owner_gym/membresias/${id}/toggle`);
export const eliminarMembresia   = (id)          => API.delete(`/owner_gym/membresias/${id}`);

// ── Miembros (reutiliza endpoints existentes) ─────────────────────────────
export const getMiembros         = (params = {}) => API.get("/miembros", { params });

// ── Pagos (reutiliza endpoints existentes) ────────────────────────────────
export const getPagos            = (params = {}) => API.get("/pagos", { params });

// ── Ventas POS ────────────────────────────────────────────────────────────
export const getVentas           = (params = {}) => API.get("/ventas", { params });
export const registrarVenta      = (data)        => API.post("/ventas", data);

// ── Productos POS ─────────────────────────────────────────────────────────
export const getProductos        = (params = {}) => API.get("/owner_gym/productos", { params });
export const crearProducto       = (data)        => API.post("/owner_gym/productos", data);
export const editarProducto      = (id, data)    => API.put(`/owner_gym/productos/${id}`, data);
export const toggleProducto      = (id)          => API.patch(`/owner_gym/productos/${id}/toggle`);
export const eliminarProducto    = (id)          => API.delete(`/owner_gym/productos/${id}`);

// ── Sucursales (HU-45 / SCRUM-222) ────────────────────────────────────────
// Gestión exclusiva de Propietario: alta/edición/activación de sucursales
// de su organización y su ocupación (miembros/staff) frente al plan.
export const getSucursales         = ()        => API.get("/owner_gym/sucursales");
export const getSucursalesCapacidad = ()       => API.get("/owner_gym/sucursales/capacidad");
// SCRUM-223: sucursales usadas vs. tope del plan de TODA mi organización
// (antes el plan vivía por sucursal; ahora lo contrata la organización).
export const getLimiteSucursales    = ()       => API.get("/owner_gym/sucursales/limite");
export const crearSucursal         = (data)     => API.post("/owner_gym/sucursales", data);
export const editarSucursal        = (id, data) => API.put(`/owner_gym/sucursales/${id}`, data);
export const toggleSucursal        = (id)       => API.patch(`/owner_gym/sucursales/${id}/toggle`);

// ── Administradores de sucursal (HU-45 / SCRUM-222) ───────────────────────
// A propósito viven aquí y no en Staff: un Administrador se da de alta ya
// atado a una o varias sucursales de la organización, algo que el modal de
// Staff no modela (ese alcance es de AsignacionUsuario, no un simple rol).
export const getAdministradores        = ()            => API.get("/owner_gym/administradores");
export const crearAdministrador         = (data)        => API.post("/owner_gym/administradores", data);
export const reasignarSucursalesAdmin   = (id, sucursales) =>
  API.put(`/owner_gym/administradores/${id}/sucursales`, { sucursales });
export const toggleAdministrador        = (id)          => API.patch(`/owner_gym/administradores/${id}/toggle`);
