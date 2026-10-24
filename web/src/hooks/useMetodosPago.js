/**
 * useMetodosPago — Métodos de cobro disponibles en una pantalla de pago.
 *
 * El sistema acepta únicamente tres formas de pago:
 *   Efectivo       se cobra en caja y se registra manualmente
 *   PayPal         cobro en línea (redirige a la pasarela)
 *   Mercado Pago   cobro en línea (redirige a la pasarela)
 *
 * PayPal y Mercado Pago solo aparecen si el gimnasio los tiene configurados y
 * activos (Configuración → Cobros en línea). Para el contexto "suscripcion" se
 * consultan las pasarelas de la plataforma en lugar de las del gimnasio.
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

const DESCRIPCIONES = {
  paypal: "Paga con tu cuenta PayPal",
  mercadopago: "Tarjeta, SPEI o saldo",
};

export default function useMetodosPago(contexto = "membresia", { incluirEfectivo = true } = {}) {
  const [pasarelas, setPasarelas] = useState([]);
  const [cargando, setCargando]   = useState(true);

  useEffect(() => {
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
  }, [contexto]);

  const metodos = [
    ...(incluirEfectivo ? [METODO_EFECTIVO] : []),
    ...pasarelas.map((p) => ({
      id: p.proveedor,                 // "paypal" | "mercadopago"
      label: p.nombre,                 // "PayPal" | "Mercado Pago"
      desc: DESCRIPCIONES[p.proveedor] || "Pago en línea",
      esPasarela: true,
      proveedor: p.proveedor,
      modo: p.modo,                    // sandbox | live
      moneda: p.moneda,
    })),
  ];

  return { metodos, pasarelas, cargando };
}
