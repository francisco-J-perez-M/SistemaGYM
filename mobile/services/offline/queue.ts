/**
 * services/offline/queue.ts — cola de escrituras diferidas (SCRUM-168 / HU-30).
 *
 * QUÉ SE ENCOLA (todo lo que NO mueve dinero):
 *   - Sesión de entrenamiento / series completadas  (WORKOUT_COMPLETE).
 *   - Medición de progreso corporal                  (USER_PROGRESS).
 *
 * QUÉ NUNCA SE ENCOLA — requisito explícito del ticket ("ningún movimiento
 * de dinero debe quedar en cola"):
 *   - Renovación de membresía (MEMBERSHIP_RENEW), en efectivo o con pasarela.
 *   - Pago con pasarela en línea (services/pagos.ts → pagarEnApp).
 *   - Compra en el punto de venta (USER_COMPRAR), en efectivo o con pasarela.
 *   Esas pantallas (membership.tsx, pos.tsx) usan estaConectado() para
 *   BLOQUEAR la acción con un mensaje claro en vez de llamar a
 *   encolarAccion(). No agregues un tipo de acción de dinero a este archivo
 *   sin acordarlo primero con el equipo — ver bitácora técnica, SCRUM-168.
 *
 * Resolución de conflictos por fecha: cada acción viaja con `capturadoEn`
 * (el momento en que el socio la realizó en el dispositivo, NO cuando
 * finalmente se sincroniza). Al enviarla se adjunta como `_capturado_en` en
 * el body — el backend la usa en vez de "ahora" al procesar la escritura
 * (ver api/app/utils/sync.py::resolver_capturado_en), para que la bitácora,
 * la racha de asistencia y las gráficas por fecha queden correctas aunque
 * la sincronización ocurra horas o días después de realizada la acción.
 *
 * Reintentos: una falla DE RED (sin respuesta del servidor — err.response
 * ausente, mismo criterio que `pagosSinConexion` en membership.tsx) deja la
 * acción en la cola para el siguiente intento, sin límite — pudo fallar
 * simplemente porque la conexión se cayó otra vez a medio sincronizar. Una
 * falla CON respuesta del servidor (400/422/etc., el servidor sí la evaluó
 * y la rechazó) se reintenta hasta MAX_INTENTOS y luego se descarta:
 * reintentarla indefinidamente nunca la volvería válida.
 */
import api from '../api';
import { leerJSON, escribirJSON } from './storage';
import { useConnectivityStore, estaConectado } from './connectivity';

export type TipoAccion = 'WORKOUT_COMPLETE' | 'BODY_PROGRESS';

export interface AccionEncolada {
  id: string;
  tipo: TipoAccion;
  endpoint: string;
  payload: Record<string, any>;
  capturadoEn: string; // ISO 8601, hora del dispositivo al momento de la acción
  intentos: number;
}

const CLAVE_COLA = '@gympro/offline/cola';
const MAX_INTENTOS = 2;

type Oyente = (cola: AccionEncolada[]) => void;
const oyentes = new Set<Oyente>();
let colaEnMemoria: AccionEncolada[] | null = null;
let sincronizando = false;

function notificar(cola: AccionEncolada[]): void {
  oyentes.forEach((fn) => fn(cola));
}

async function obtenerCola(): Promise<AccionEncolada[]> {
  if (colaEnMemoria) return colaEnMemoria;
  colaEnMemoria = await leerJSON<AccionEncolada[]>(CLAVE_COLA, []);
  return colaEnMemoria;
}

async function guardarCola(cola: AccionEncolada[]): Promise<void> {
  colaEnMemoria = cola;
  await escribirJSON(CLAVE_COLA, cola);
  notificar(cola);
}

/**
 * Suscripción para la UI (SyncStatusBadge): llama a `fn` de inmediato con el
 * estado actual y de nuevo cada vez que la cola cambia. Devuelve la función
 * para desuscribirse.
 */
export function suscribirseACola(fn: Oyente): () => void {
  oyentes.add(fn);
  obtenerCola().then(fn);
  return () => { oyentes.delete(fn); };
}

/**
 * Encola una escritura para cuando vuelva la conexión. `payload` debe traer
 * ya todo lo que el endpoint necesita (lo mismo que se enviaría en línea);
 * esta función solo agrega el sello de tiempo de captura.
 */
export async function encolarAccion(
  tipo: TipoAccion,
  endpoint: string,
  payload: Record<string, any>,
): Promise<void> {
  const accion: AccionEncolada = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    tipo,
    endpoint,
    payload,
    capturadoEn: new Date().toISOString(),
    intentos: 0,
  };
  const cola = await obtenerCola();
  await guardarCola([...cola, accion]);
}

/**
 * Procesa la cola en orden (FIFO). No-op si ya hay una sincronización en
 * curso o si no hay conexión en este momento — se vuelve a llamar sola
 * cuando NetInfo avise que la conexión se recuperó (ver
 * iniciarSincronizacionAutomatica más abajo).
 */
export async function sincronizarCola(): Promise<void> {
  if (sincronizando || !estaConectado()) return;
  sincronizando = true;
  try {
    const cola = await obtenerCola();
    const restantes: AccionEncolada[] = [];
    for (const accion of cola) {
      if (!estaConectado()) { restantes.push(accion); continue; }
      try {
        await api.post(accion.endpoint, { ...accion.payload, _capturado_en: accion.capturadoEn });
      } catch (err: any) {
        const falloDeRed = !err?.response;
        if (falloDeRed || accion.intentos + 1 < MAX_INTENTOS) {
          restantes.push({ ...accion, intentos: accion.intentos + 1 });
        } else {
          console.warn(`[offline-queue] "${accion.tipo}" descartada tras rechazo del servidor:`, err?.response?.data);
        }
      }
    }
    await guardarCola(restantes);
  } finally {
    sincronizando = false;
  }
}

let suscritoAutoSync = false;

/**
 * Arranca el drenado automático: sincroniza al recuperar conexión y, si ya
 * hay conexión al iniciar la app, intenta vaciar lo que haya quedado
 * pendiente de una sesión anterior. Llamar UNA sola vez desde app/_layout.tsx,
 * junto a iniciarMonitorConectividad().
 */
export function iniciarSincronizacionAutomatica(): void {
  if (suscritoAutoSync) return;
  suscritoAutoSync = true;

  useConnectivityStore.subscribe((estado, anterior) => {
    if (estado.conectado && !anterior.conectado) {
      sincronizarCola();
    }
  });

  if (estaConectado()) sincronizarCola();
}
