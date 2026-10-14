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
// PostgreSQL): "superadmin" y "owner_gym" en minúsculas, pero "Entrenador",
// "Recepcionista" y "Miembro" capitalizados. No es un descuido de estilo:
// es el dato real contra el que compara el backend, y cambiarlo exigiría
// una migración de base de datos. normalizarRol() existe para que ninguna
// comparación en el frontend tenga que saber esto de memoria.

export const ROL_SUPERADMIN = "superadmin";
export const ROL_OWNER_GYM = "owner_gym";
export const ROL_ENTRENADOR = "Entrenador";
export const ROL_RECEPCIONISTA = "Recepcionista";
export const ROL_MIEMBRO = "Miembro";

// Variantes legadas/informales → identificador canónico (en minúsculas,
// porque normalizarRol() minuscula antes de buscar). "administrador"/
// "admin"/"owner" son sinónimos de owner_gym, no un rol aparte: no existe
// un rol "administrador" independiente en la tabla `roles`.
const ALIASES = {
  superadmin: ROL_SUPERADMIN,
  owner_gym: ROL_OWNER_GYM,
  administrador: ROL_OWNER_GYM,
  admin: ROL_OWNER_GYM,
  owner: ROL_OWNER_GYM,
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
  [ROL_OWNER_GYM]: "Owner Gym",
  [ROL_ENTRENADOR]: "Entrenador",
  [ROL_RECEPCIONISTA]: "Recepcionista",
  [ROL_MIEMBRO]: "Miembro",
};

// Variante de color de badge por rol canónico (claves en minúsculas: se
// consultan siempre vía normalizarRol(valor).toLowerCase()).
export const ROL_BADGE = {
  [ROL_SUPERADMIN.toLowerCase()]: "info",
  [ROL_OWNER_GYM.toLowerCase()]: "warn",
  [ROL_ENTRENADOR.toLowerCase()]: "pos",
  [ROL_RECEPCIONISTA.toLowerCase()]: "purple",
  [ROL_MIEMBRO.toLowerCase()]: "ghost",
};

// Ruta de destino por rol canónico (claves en minúsculas, mismo criterio).
export const ROUTE_FOR_ROLE = {
  [ROL_SUPERADMIN.toLowerCase()]: "/superadmin",
  [ROL_OWNER_GYM.toLowerCase()]: "/owner",
  [ROL_ENTRENADOR.toLowerCase()]: "/trainer-dashboard",
  [ROL_RECEPCIONISTA.toLowerCase()]: "/receptionist-dashboard",
  [ROL_MIEMBRO.toLowerCase()]: "/user/dashboard",
};

// Roles del JWT que autorizan cada panel de Layout.jsx (clave = prop `role`
// de <Layout>, en el vocabulario de rutas de App.jsx; valores = variantes
// aceptadas del rol real, ya en minúsculas porque Layout compara con
// sesion.rol, que ya viene en minúsculas).
export const ROLES_PERMITIDOS_POR_PANEL = {
  owner_gym: ["owner_gym", "admin", "administrador", "owner"],
  trainer: ["trainer", "entrenador"],
  receptionist: ["receptionist", "recepcionista"],
  user: ["user", "miembro"],
  superadmin: ["superadmin"],
};
