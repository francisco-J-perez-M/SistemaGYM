// web/src/api/cliente.js — cliente HTTP centralizado del portal.
//
// Actividad 09, PR-01 (M. Arriaga Mora): antes cada módulo de web/src/api
// leía el token con localStorage.getItem("token") y lo adjuntaba a mano en
// la cabecera Authorization. localStorage es legible por CUALQUIER script
// que corra en el origen -- incluido el de una dependencia comprometida o
// una inyección -- así que una sola vulnerabilidad de scripting entregaba
// la sesión completa, y el valor sobrevivía al cierre del navegador.
//
// La API ahora TAMBIÉN emite el JWT en una cookie HttpOnly (ver
// api/app/auth/routes.py y JWT_TOKEN_LOCATION en api/app/config.py), que
// el navegador adjunta solo con `credentials: "include"` y que JavaScript
// no puede leer.
//
// Migración incremental, a propósito: convertir TODA la aplicación de una
// vez (56 archivos leen el token de localStorage, incluida la ventana de
// impersonación de superadmin) es un cambio demasiado grande para aplicar
// de golpe sin volver a probar cada pantalla. Por eso este cliente manda
// la cookie Y, si todavía existe un token en localStorage, también la
// cabecera Authorization -- la API acepta cualquiera de las dos
// (JWT_TOKEN_LOCATION = ["headers", "cookies"]; headers tiene prioridad).
// Así los módulos que ya pasan por aquí (completeOnboarding, la guarda de
// navegación de Layout.jsx) funcionan igual para todos los roles --
// incluida la impersonación, que inyecta su propio token en localStorage
// sin tocar la cookie de la sesión original -- mientras el resto de la
// aplicación se migra módulo por módulo. El cierre completo del hueco de
// PR-01 (cero lecturas de localStorage en todo el frontend) queda anotado
// como seguimiento, no como "ya resuelto".
export async function peticion(ruta, opciones = {}) {
  let token = null;
  try { token = localStorage.getItem("token"); } catch { /* ignore */ }

  const respuesta = await fetch(ruta, {
    ...opciones,
    credentials: "include", // envía (y recibe) la cookie de sesión
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opciones.headers || {}),
    },
  });

  if (respuesta.status === 401) {
    // Sesión vencida o revocada: no tiene sentido devolver el error al
    // componente que llamó, directo al inicio de sesión.
    window.location.replace("/");
    return null;
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.msg || "Error en la petición");
  return datos;
}
