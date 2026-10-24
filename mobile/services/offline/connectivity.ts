/**
 * services/offline/connectivity.ts — Monitor de conectividad (SCRUM-168 / HU-30).
 *
 * Única fuente de verdad sobre si el dispositivo tiene conexión a internet en
 * este momento. La usan:
 *   - hooks/useFetch.ts (vía cache.ts) para decidir cuándo caer al caché local.
 *   - services/offline/queue.ts para disparar la sincronización automática
 *     al reconectar.
 *   - Las pantallas que mueven dinero (membership.tsx, pos.tsx) para
 *     BLOQUEAR la acción en vez de encolarla — ver la nota en queue.ts sobre
 *     por qué esas acciones nunca se encolan.
 *
 * Se usa NetInfo (no solo "la última petición de axios falló") porque NetInfo
 * avisa el cambio de estado de red del sistema operativo, incluyendo el
 * momento exacto en que se recupera — ese es el evento que dispara el
 * drenado de la cola, y axios por sí solo no lo tiene.
 */
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { create } from 'zustand';

interface ConnectivityState {
  conectado: boolean;
  listo: boolean; // true tras la primera lectura real de NetInfo
  setEstado: (conectado: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  // Optimista por defecto: evita que la UI parpadee a "sin conexión" en el
  // primer render, antes de que NetInfo entregue su primer evento real.
  conectado: true,
  listo: false,
  setEstado: (conectado) => set({ conectado, listo: true }),
}));

function resolverConectado(estado: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>): boolean {
  // isInternetReachable puede venir null mientras el sistema aún no lo sabe;
  // en ese caso se asume conectado (mismo criterio optimista de arriba) en
  // vez de bloquear pantallas de pago por una lectura todavía incompleta.
  return !!estado.isConnected && estado.isInternetReachable !== false;
}

let suscrito = false;

/**
 * Arranca el listener global de conectividad. Llamar UNA sola vez, desde la
 * raíz de la app (app/_layout.tsx) — llamadas repetidas son no-op.
 */
export function iniciarMonitorConectividad(): void {
  if (suscrito) return;
  suscrito = true;

  NetInfo.fetch().then((estado) => {
    useConnectivityStore.getState().setEstado(resolverConectado(estado));
  });

  NetInfo.addEventListener((estado) => {
    useConnectivityStore.getState().setEstado(resolverConectado(estado));
  });
}

/** Lectura síncrona puntual — para usar dentro de un onPress o antes de un
 * fetch, no como fuente reactiva de un render (para eso, useConnectivityStore). */
export function estaConectado(): boolean {
  return useConnectivityStore.getState().conectado;
}
