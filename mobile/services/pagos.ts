/**
 * services/pagos.ts — Pagos en línea desde la app móvil (PayPal / Mercado Pago).
 *
 * Flujo adoptado (el estándar y permitido por las tiendas para servicios físicos
 * como una membresía de gimnasio):
 *   1. La app pide al backend crear el cobro -> recibe una URL de pago.
 *   2. Se abre esa URL en el navegador del sistema (WebBrowser).
 *   3. Al terminar, la pasarela redirige a la web, que devuelve el control a la
 *      app mediante el deep link gympro:// (scheme declarado en app.json).
 *   4. La app consulta el estado real de la transacción contra el backend.
 *
 * Nunca se manejan datos de tarjeta dentro de la app: el cobro ocurre en el
 * entorno seguro de la pasarela.
 */
import * as WebBrowser from 'expo-web-browser';
import api from './api';

export type ProveedorPago = 'paypal' | 'mercadopago';
export type ContextoPago = 'membresia' | 'producto' | 'suscripcion';

export interface MetodoPago {
  proveedor: ProveedorPago;
  nombre: string;
  modo: 'sandbox' | 'live';
  moneda: string;
}

export interface TransaccionPago {
  id: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado' | 'reembolsado';
  monto: number;
  moneda: string;
  descripcion?: string | null;
  proveedor: ProveedorPago;
  contexto: ContextoPago;
  fecha_pago?: string | null;
}

export interface ResultadoPagoApp {
  estado: TransaccionPago['estado'] | 'interrumpido';
  transaccion?: TransaccionPago;
  mensaje?: string;
}

/**
 * Métodos de pago disponibles según quién cobra.
 *
 * Membresías y productos los cobra EL GIMNASIO con sus propias credenciales.
 * La suscripción SaaS la cobra LA PLATAFORMA, cuyas credenciales viven en
 * variables de entorno del servidor. Son dos endpoints distintos y confundirlos
 * hace que el owner vea los métodos de su gimnasio al pagar su propia
 * suscripción, o que no vea ninguno si su gimnasio no tiene pasarelas.
 */
export async function getMetodosPago(contexto?: ContextoPago): Promise<MetodoPago[]> {
  const ruta = contexto === 'suscripcion' ? '/pagos/metodos-plataforma' : '/pagos/metodos';
  const { data } = await api.get(ruta);
  return data?.metodos ?? [];
}

/** Consulta (y confirma contra la pasarela) el estado de una transacción. */
export async function getEstadoPago(txId: number): Promise<TransaccionPago> {
  const { data } = await api.get(`/pagos/estado/${txId}`);
  return data?.transaccion;
}

/**
 * Ejecuta el flujo completo de pago: crea el cobro, abre el navegador y, al
 * volver a la app, confirma el estado real de la transacción.
 */
export async function pagarEnApp(params: {
  proveedor: ProveedorPago;
  contexto: ContextoPago;
  monto: number;
  descripcion?: string;
  referenciaLocal?: string | number | null;
  emailPagador?: string | null;
  /**
   * Datos que el backend necesita para aplicar el efecto del pago cuando la
   * pasarela lo confirme. En una venta de POS son los artículos y el miembro:
   * sin ellos el pago se cobra pero no se registra la venta ni baja el stock.
   * Ver _aplicar_venta en api/app/routes/pagos_online.py.
   */
  metadatos?: Record<string, any> | null;
}): Promise<ResultadoPagoApp> {
  const { data } = await api.post('/pagos/checkout', {
    proveedor: params.proveedor,
    contexto: params.contexto,
    monto: params.monto,
    descripcion: params.descripcion ?? 'Pago GymPro',
    referencia_local: params.referenciaLocal ?? null,
    email_pagador: params.emailPagador ?? null,
    metadatos: params.metadatos ?? null,
    origen: 'mobile',
  });

  const urlPago: string | undefined = data?.url_pago;
  const txId: number | undefined = data?.transaccion_id;

  if (!urlPago || !txId) {
    return { estado: 'interrumpido', mensaje: 'El servidor no devolvió la URL de pago.' };
  }

  // 'gympro://pago' es el destino de retorno; el scheme está declarado en app.json
  await WebBrowser.openAuthSessionAsync(urlPago, 'gympro://pago');

  // Al cerrarse el navegador se confirma el estado real contra la pasarela.
  // Se reintenta un par de veces: algunas pasarelas tardan segundos en acreditar.
  for (let intento = 0; intento < 3; intento++) {
    try {
      const tx = await getEstadoPago(txId);
      if (tx?.estado && tx.estado !== 'pendiente') {
        return { estado: tx.estado, transaccion: tx };
      }
      if (intento < 2) await new Promise((r) => setTimeout(r, 2500));
      else return { estado: 'pendiente', transaccion: tx };
    } catch (e: any) {
      if (intento === 2) {
        return {
          estado: 'interrumpido',
          mensaje: e?.response?.data?.msg ?? 'No se pudo confirmar el pago.',
        };
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return { estado: 'pendiente' };
}

/** Texto amigable para mostrar al usuario según el resultado. */
export function mensajePorEstado(estado: ResultadoPagoApp['estado']): {
  titulo: string; texto: string; ok: boolean;
} {
  switch (estado) {
    case 'aprobado':
      return { titulo: 'Pago completado', texto: 'Tu pago se registró correctamente.', ok: true };
    case 'pendiente':
      return { titulo: 'Pago en proceso',
        texto: 'La pasarela aún está confirmando el pago. Se acreditará en breve.', ok: true };
    case 'rechazado':
      return { titulo: 'Pago rechazado',
        texto: 'La pasarela no autorizó el cobro. Intenta con otro método.', ok: false };
    case 'cancelado':
      return { titulo: 'Pago cancelado', texto: 'No se realizó ningún cargo.', ok: false };
    default:
      return { titulo: 'Pago sin confirmar',
        texto: 'No pudimos confirmar el resultado. Revisa tu historial de pagos.', ok: false };
  }
}
