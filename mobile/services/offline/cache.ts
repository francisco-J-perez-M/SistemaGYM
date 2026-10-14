/**
 * services/offline/cache.ts — caché de lectura por endpoint (SCRUM-168 / HU-30).
 *
 * hooks/useFetch.ts escribe aquí tras cada GET exitoso (cuando la pantalla
 * pide `{ cache: true }`) y lee de aquí únicamente cuando el GET falla por
 * falta de red — un dato de caché nunca sustituye una respuesta fresca del
 * servidor, solo rellena el hueco mientras no hay conexión.
 */
import { leerJSON, escribirJSON } from './storage';

export interface EntradaCache<T> {
  datos: T;
  actualizadoEn: string; // ISO 8601 — hora en que se guardó esta copia
}

const PREFIJO = '@gympro/cache/';

function claveDe(id: string): string {
  return `${PREFIJO}${id}`;
}

export async function guardarCache<T>(id: string, datos: T): Promise<void> {
  const entrada: EntradaCache<T> = { datos, actualizadoEn: new Date().toISOString() };
  await escribirJSON(claveDe(id), entrada);
}

export async function leerCache<T>(id: string): Promise<EntradaCache<T> | null> {
  return leerJSON<EntradaCache<T> | null>(claveDe(id), null);
}
