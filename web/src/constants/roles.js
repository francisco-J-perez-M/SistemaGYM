// constants/roles.js — Catálogo único y canónico de roles del sistema (SCRUM-107).
//
// Por qué existe: ROL_BADGE y ROUTE_FOR_ROLE vivían duplicados dentro de
// SuperadminUsuarios.jsx, y Layout.jsx mantenía por su cuenta otra lista
// (ROLE_MAP) para decidir qué rol del JWT autoriza cada panel. Cada vista
// podía divergir de las demás sin que nada lo notara — exactamente la causa
// raíz documentada en SCRUM-87/SCRUM-88. Este módulo es ahora la única
// fuente: ninguna vista debe volver a declarar su propia lista de roles.
//
// El identificador canónico de cada rol es el valor EXACTO que llega en
// `role` desde /api/auth/me (y que puebla seed_pg.py en la tabla `roles` de
// PostgreSQL): "superadmin" en minúsculas, "Propietario", "Entrenador",
// "Recepcionista" y "Miembro" capitalizados. No es un descuido de estilo:
// es el dato real contra el que compara el backend. normalizarRol() existe
// para que ninguna comparación en el frontend tenga que saber esto de
// memoria.
//
// Migración 019 (backend, 2026-10-14): "owner_gym" se renombró a
// "Propietario" en la base. Se conserva como alias PERMANENTE más abajo
// -- no es legado a limpiar -- porque un token ya emitido (refresh de
// hasta 90 días) puede seguir trayendo el valor viejo en el claim "role".
//
// Migración 020 (backend, HU-45): "Administrador" es un rol nuevo y real
// -- alcance de una sucursal, no de la organización completa como
// Propietario. Reutiliza el panel owner_gym (misma UI, scope distinto
// resuelto en el backend vía AsignacionUsuario); ver utils/alcance.py.

export const ROL_SUPERADMIN = "superadmin";
export const ROL_PROPIETARIO = "Propietario"; // antes ROL_OWNER_GYM = "owner_gym"
export const ROL_ADMINISTRADOR = "Administrador"; // nuevo, HU-45 (migración 020)
export const ROL_ENTRENADOR = "Entrenador";
export const ROL_RECEPCIONISTA = "Recepcionista";
export const ROL_MIEMBRO = "Miembro";

// Variantes legadas/informales → identificador canónico (en minúsculas,
// porque normalizarRol() minuscula antes de buscar).
//
// Migración 020 (HU-45): "Administrador" ya es un rol real y distinto de
// Propietario -- "administrador"/"admin" dejan de ser sinónimos de
// Propietario y apuntan al rol nuevo. "owner" sigue siendo Propietario.
const ALIASES = {
  superadmin: ROL_SUPERADMIN,
  owner_gym: ROL_PROPIETARIO,
  propietario: ROL_PROPIETARIO,
  owner: ROL_PROPIETARIO,
  administrador: ROL_ADMINISTRADOR,
  admin: ROL_ADMINISTRADOR,
  entrenador: ROL_ENTRENADOR,
  trainer: ROL_ENTRENADOR,
  recepcionista: ROL_RECEPCIONISTA,
  receptionist: ROL_RECEPCIONISTA,
  miembro: ROL_MIEMBRO,
  user: ROL_MIEMBRO,
  member: ROL_MIEMBRO,
};

// Resuelve cualquier variante conocida (alias, mayúsculas/minúsculas) a su
// identificador canónico. Si no coincide con nada conocido, devuelve el
// valor recibido en minúsculas sin inventar un canónico.
export function normalizarRol(valor) {
  const clave = String(valor || "").trim().toLowerCase();
  return ALIASES[clave] || clave;
}

// Rótulo de presentación por rol canónico.
export const ROL_LABEL = {
  [ROL_SUPERADMIN]: "Superadmin",
  [ROL_PROPIETARIO]: "Propietario",
  [ROL_ADMINISTRADOR]: "Administrador",
  [ROL_ENTRENADOR]: "Entrenador",
  [ROL_RECEPCIONISTA]: "Recepcionista",
  [ROL_MIEMBRO]: "Miembro",
};

// Variante de color de badge por rol canónico (claves en minúsculas: se
// consultan siempre vía normalizarRol(valor).toLowerCase()).
export const ROL_BADGE = {
  [ROL_SUPERADMIN.toLowerCase()]: "info",
  [ROL_PROPIETARIO.toLowerCase()]: "warn",
  [ROL_ADMINISTRADOR.toLowerCase()]: "warn",
  [ROL_ENTRENADOR.toLowerCase()]: "pos",
  [ROL_RECEPCIONISTA.toLowerCase()]: "purple",
  [ROL_MIEMBRO.toLowerCase()]: "ghost",
};

// Ruta de destino por rol canónico (claves en minúsculas, mismo criterio).
export const ROUTE_FOR_ROLE = {
  [ROL_SUPERADMIN.toLowerCase()]: "/superadmin",
  [ROL_PROPIETARIO.toLowerCase()]: "/owner",
  [ROL_ADMINISTRADOR.toLowerCase()]: "/owner",
  [ROL_ENTRENADOR.toLowerCase()]: "/trainer-dashboard",
  [ROL_RECEPCIONISTA.toLowerCase()]: "/receptionist-dashboard",
  [ROL_MIEMBRO.toLowerCase()]: "/user/dashboard",
};

// Roles del JWT que autorizan cada panel de Layout.jsx (clave = prop `role`
// de <Layout>, en el vocabulario de rutas de App.jsx; valores = variantes
// aceptadas del rol real, ya en minúsculas porque Layout compara con
// sesion.rol, que ya viene en minúsculas).
export const ROLES_PERMITIDOS_POR_PANEL = {
  // Clave = prop `role` de <Layout> (vocabulario de rutas de App.jsx, sin
  // cambios); valores = variantes de ROL aceptadas -- "propietario" es la
  // que de verdad llega ahora en sesion.rol tras la migración 019,
  // "owner_gym" se queda como compatibilidad con sesiones ya iniciadas.
  // "administrador"/"admin" (HU-45) entran al mismo panel: el backend
  // acota lo que ven por sucursal activa, no la ruta del frontend.
  owner_gym: ["propietario", "owner_gym", "owner", "administrador", "admin"],
  trainer: ["trainer", "entrenador"],
  receptionist: ["receptionist", "recepcionista"],
  user: ["user", "miembro"],
  superadmin: ["superadmin"],
};
