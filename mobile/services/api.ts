/**
 * Cliente HTTP centralizado.
 *
 * - Adjunta Authorization y X-Gym-ID en cada petición.
 * - Cuando el access token caduca (401), pide uno nuevo con el token de
 *   refresco y reintenta la petición original. El usuario no se entera.
 * - Solo si el refresco también falla se cierra la sesión.
 *
 * Es lo que hace que la sesión se comporte como en WhatsApp o YouTube: se
 * mantiene abierta indefinidamente y solo termina si el usuario sale a
 * propósito o pasan 90 días sin usar la aplicación.
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, ENDPOINTS } from '../constants/Api';

let _gymId: number | null = null;
let _onUnauthorized: (() => void) | null = null;

export function configureApi(gymId: number | null, onUnauthorized: () => void) {
  _gymId           = gymId;
  _onUnauthorized  = onUnauthorized;
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — adjuntar JWT y gym tenant
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (_gymId) {
    config.headers['X-Gym-ID'] = String(_gymId);
  }
  return config;
});

/**
 * Refresco en curso, compartido entre peticiones.
 *
 * Si cinco llamadas fallan a la vez con 401, todas esperan al mismo refresco en
 * lugar de disparar cinco. Sin esto, la primera renovaría el token y las otras
 * cuatro usarían un refresco ya consumido.
 */
let refrescoEnCurso: Promise<string | null> | null = null;

async function obtenerTokenNuevo(): Promise<string | null> {
  if (refrescoEnCurso) return refrescoEnCurso;

  refrescoEnCurso = (async () => {
    const refresh = await SecureStore.getItemAsync('refresh_token');
    if (!refresh) return null;
    try {
      // axios directo, no `api`: si usara el cliente con interceptor, un 401 en
      // el propio refresco entraría en un bucle infinito.
      const { data } = await axios.post<{ access_token: string }>(
        `${API_BASE_URL}${ENDPOINTS.REFRESH}`,
        {},
        { headers: { Authorization: `Bearer ${refresh}` }, timeout: 15_000 },
      );
      if (!data?.access_token) return null;
      await SecureStore.setItemAsync('access_token', data.access_token);
      return data.access_token;
    } catch {
      return null;
    } finally {
      refrescoEnCurso = null;
    }
  })();

  return refrescoEnCurso;
}

// Response interceptor — renovar la sesión antes de rendirse
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original: any = error.config;
    const es401 = error.response?.status === 401;

    // `_reintentado` evita repetir el ciclo si la petición ya se reintentó una
    // vez: si vuelve a dar 401 con un token recién emitido, el problema no es
    // la caducidad y hay que cerrar sesión de verdad.
    if (es401 && original && !original._reintentado) {
      original._reintentado = true;
      const nuevo = await obtenerTokenNuevo();
      if (nuevo) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${nuevo}`;
        return api(original);
      }
    }

    if (es401) {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user_data');
      _onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default api;
