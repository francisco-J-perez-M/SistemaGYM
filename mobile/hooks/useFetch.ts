/**
 * useFetch — hook de fetching genérico.
 *
 * FIX SDK 56 / Reanimated 4.3.x:
 * El plugin Babel de Reanimated transforma este módulo como worklet cuando
 * detecta named imports de React, reemplazando useState/useEffect/useCallback
 * con stubs undefined (crash "undefined is not a function" en updateFunctionComponent).
 *
 * Solución: acceder a los hooks vía React.useState etc. El plugin no puede
 * reemplazar accesos al namespace del objeto React.
 *
 * Adicionalmente se usa Promise-chaining (sin async/await) para evitar que
 * el plugin transforme la función interna del useCallback como worklet async.
 *
 * Caché de lectura (SCRUM-168 / HU-30):
 * Pasar `{ cache: true }` (o una clave explícita) activa guardado-en-éxito y
 * caída-a-caché-en-falla-de-red para ese fetch — ver services/offline/cache.ts.
 * Es estrictamente opt-in: ninguna pantalla existente cambia de
 * comportamiento hasta que pase la opción explícitamente.
 */
import React from 'react';
import api from '../services/api';
import { guardarCache, leerCache } from '../services/offline/cache';

interface FetchState<T> {
  data:      T | null;
  loading:   boolean;
  error:     string | null;
  refetch:   () => void;
  /** true si `data` viene del caché local (no de una respuesta fresca). */
  fromCache: boolean;
  /** ISO 8601 de cuándo se guardó la copia en caché que se está mostrando. */
  cachedAt:  string | null;
}

interface FetchOptions {
  /**
   * Activa caché de lectura para este fetch. `true` usa `url` como clave;
   * pasar una cadena permite una clave explícita cuando el mismo endpoint
   * se llama con distintos `params` y cada combinación debe cachear aparte.
   * Por defecto no hay caché — el comportamiento de las pantallas que no
   * pasan esta opción no cambia.
   */
  cache?: boolean | string;
}

export function useFetch<T>(
  url: string,
  params?: Record<string, any>,
  options?: FetchOptions,
): FetchState<T> {
  const [data,      setData]      = React.useState<T | null>(null);
  const [loading,   setLoading]   = React.useState(true);
  const [error,     setError]     = React.useState<string | null>(null);
  const [fromCache, setFromCache] = React.useState(false);
  const [cachedAt,  setCachedAt]  = React.useState<string | null>(null);

  const claveCache = options?.cache
    ? (typeof options.cache === 'string' ? options.cache : url)
    : null;

  const doFetch = React.useCallback(() => {
    if (!url) { setLoading(false); setData(null); return; }
    setLoading(true);
    setError(null);
    api
      .get<T>(url, { params })
      .then((res) => {
        setData(res.data);
        setFromCache(false);
        setCachedAt(null);
        if (claveCache) {
          guardarCache(claveCache, res.data).catch(() => {});
        }
      })
      .catch((err: any) => {
        // HU-30: sin "response" la petición no llegó al servidor (sin
        // conexión) — con caché habilitada, se cae al último dato guardado
        // en vez de mostrar error y dejar la pantalla vacía. Se retorna la
        // promesa para que .finally() espere a que esto termine.
        if (claveCache && !err?.response) {
          return leerCache<T>(claveCache).then((entrada) => {
            if (entrada) {
              setData(entrada.datos);
              setFromCache(true);
              setCachedAt(entrada.actualizadoEn);
              setError(null);
            } else {
              setError(err?.message ?? 'Sin conexión y sin datos guardados');
            }
          });
        }
        setError(
          err?.response?.data?.error ?? err?.message ?? 'Error desconocido',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, claveCache]);

  React.useEffect(() => {
    doFetch();
  }, [doFetch]);

  return { data, loading, error, refetch: doFetch, fromCache, cachedAt };
}
