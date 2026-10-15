import { useOutletContext } from "react-router-dom";

/**
 * useFuncionesPlan — SCRUM-224.
 *
 * Lee las banderas de función del plan contratado por el gimnasio de la
 * sesión actual, publicadas por Layout.jsx a través de <Outlet context=.../>
 * a partir de GET /api/auth/me (campo "funciones_plan" -- ver app/auth/
 * routes.py::me()). Cualquier pantalla montada dentro del <Outlet/> de
 * Layout puede llamar este hook sin hacer una petición propia: el dato ya
 * se pidió una vez por navegación, junto con el rol verificado.
 *
 * Esto es solo la capa de UI para anticipar el bloqueo (mostrar el aviso
 * ANTES de que el usuario intente la acción). La fuente de verdad real
 * sigue siendo el backend: @require_funcion_plan() en utils/security.py
 * devuelve 402 igual si se llama al endpoint directamente, sin pasar por
 * esta pantalla -- ver la bitácora técnica, entrada de SCRUM-224.
 *
 * @returns {Record<string, boolean>} ej. { rutinas_ia: false, analiticas_ia: true, ... }
 *          Si el contexto no está disponible (p. ej. un componente
 *          renderizado fuera del <Outlet/> de Layout, como en un test
 *          aislado), devuelve {} -- cualquier bandera leída de ahí sale
 *          `undefined`, que los componentes consumidores (ver
 *          BloqueoFuncionPlan) tratan como "no se sabe, no bloquear",
 *          nunca como "bloqueado por accidente".
 */
export function useFuncionesPlan() {
  const ctx = useOutletContext();
  return ctx?.funcionesPlan || {};
}

export default useFuncionesPlan;
