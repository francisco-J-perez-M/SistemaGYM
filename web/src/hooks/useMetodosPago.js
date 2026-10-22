/**
 * useMetodosPago — Métodos de cobro disponibles en una pantalla de pago.
 *
 * El sistema acepta estas formas de pago:
 *   Efectivo       se cobra en caja y se registra manualmente
 *   Transferencia  el cliente transfirió aparte; staff lo registra a mano
 *   PayPal         cobro en línea (redirige a la pasarela)
 *   Mercado Pago   cobro en línea (redirige a la pasarela)
 *
 * Efectivo y Transferencia son ambos manuales -- no hay conciliación contra
 * un banco ni comprobante adjunto, es el mismo nivel de confianza que ya
 * tenía "Efectivo" desde antes (quien cobra responde por lo que registra).
 * PayPal y Mercado Pago solo aparecen si el gimnasio los tiene configurados y
 * activos (Configuración → Cobros en línea). Para el contexto "suscripcion" se
 * consultan las pasarelas de la plataforma en lugar de las del gimnasio.
 *
 * `soloManual` (Propietario/Administrador/Recepcionista cobrando en el
 * portal web): fuerza Efectivo + Transferencia únicamente y NUNCA consulta
 * pasarelas, aunque el gimnasio las tenga activas. PayPal y Mercado Pago
 * requieren que el pagador use su propia cuenta, así que ese cobro debe
 * hacerlo el miembro -- solo está disponible en la app móvil para que él
 * mismo renueve con esos métodos. El staff en la web solo cobra lo que puede
 * recibir en mano o confirmar por transferencia.
 *
 * Uso:
 *   const { metodos, cargando } = useMetodosPago("membresia");
 *   // metodos: [{ id, label, desc, esPasarela, proveedor }]
 */
import { useState, useEffect } from "react";
import { getMetodosPago, getMetodosPlataforma } from "../api/pagosOnline";

export const METODO_EFECTIVO = {
  id: "Efectivo",
  label: "Efectivo",
  desc: "Pago en caja",
  esPasarela: false,
  proveedor: null,
};

export const METODO_TRANSFERENCIA = {
  id: "Transferencia",
  label: "Transferencia",
  desc: "El cliente ya transfirió; se registra a mano",
  esPasarela: false,
  proveedor: null,
};

const DESCRIPCIONES = {
  paypal: "Paga con tu cuenta PayPal",
  mercadopago: "Tarjeta, SPEI o saldo",
};

export default function useMetodosPago(
  contexto = "membresia",
  { incluirEfectivo = true, soloManual = false } = {},
) {
  const [pasarelas, setPasarelas] = useState([]);
  const [cargando, setCargando]   = useState(!soloManual);

  useEffect(() => {
    // soloManual nunca consulta pasarelas -- ni siquiera para mostrarlas
    // deshabilitadas. Es una decisión de negocio (no un filtro visual), así
    // que ni se pide el catálogo.
    if (soloManual) {
      setPasarelas([]);
      setCargando(false);
      return;
    }
    let vivo = true;
    (async () => {
      setCargando(true);
      try {
        const { data } = contexto === "suscripcion"
          ? await getMetodosPlataforma()
          : await getMetodosPago();
        if (vivo) setPasarelas(data?.metodos ?? []);
      } catch {
        if (vivo) setPasarelas([]);   // sin pasarelas: queda solo efectivo
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => { vivo = false; };
  }, [contexto, soloManual]);

  const metodos = [
    ...(incluirEfectivo ? [METODO_EFECTIVO, METODO_TRANSFERENCIA] : []),
    ...(soloManual ? [] : pasarelas.map((p) => ({
      id: p.proveedor,                 // "paypal" | "mercadopago"
      label: p.nombre,                 // "PayPal" | "Mercado Pago"
      desc: DESCRIPCIONES[p.proveedor] || "Pago en línea",
      esPasarela: true,
      proveedor: p.proveedor,
      modo: p.modo,                    // sandbox | live
      moneda: p.moneda,
    }))),
  ];

  return { metodos, pasarelas, cargando };
}
