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
 */
import React from 'react';
import api from '../services/api';

interface FetchState<T> {
  data:     T | null;
  loading:  boolean;
  error:    string | null;
  refetch:  () => void;
}

export function useFetch<T>(url: string, params?: Record<string, any>): FetchState<T> {
  const [data,    setData]    = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState<string | null>(null);

  const doFetch = React.useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<T>(url, { params })
      .then((res) => {
        setData(res.data);
      })
      .catch((err: any) => {
        setError(
          err?.response?.data?.error ?? err?.message ?? 'Error desconocido',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  React.useEffect(() => {
    doFetch();
  }, [doFetch]);

  return { data, loading, error, refetch: doFetch };
}
