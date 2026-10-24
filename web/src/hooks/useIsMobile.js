import { useState, useEffect } from "react";

/**
 * useIsMobile -- true cuando el viewport es igual o mas angosto que
 * `breakpoint` (768px por defecto, el mismo que usa el grueso de los
 * media queries de CSSUnificado.css). Usa matchMedia (no un listener de
 * "resize" en crudo) para no recalcular en cada pixel de un arrastre de
 * redimensionado.
 *
 * Pensado para los pocos lugares donde la responsividad no se puede
 * resolver solo con CSS: layouts armados con estilos inline (Sidebar.jsx
 * es el caso principal) donde un media query de hoja de estilos no tiene
 * ninguna clase de la que agarrarse.
 */
export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}
