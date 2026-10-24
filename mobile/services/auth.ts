/**
 * services/auth.ts — Acceso y persistencia de la sesión.
 *
 * La sesión sobrevive al cierre de la aplicación: se guardan el access token,
 * el token de refresco y los datos del usuario en el almacén seguro del
 * sistema (Keychain en iOS, Keystore en Android). Solo se borran cuando el
 * usuario cierra sesión a propósito.
 *
 * El access token caduca a las 8 horas; el de refresco, a los 90 días. Cuando
 * el primero expira, el interceptor de services/api.ts pide uno nuevo con el
 * segundo, sin que el usuario note nada.
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, ENDPOINTS } from '../constants/Api';
import type { AuthUser } from '../types';

export interface LoginResponse {
  access_token:   string;
  refresh_token?: string;
  user:           AuthUser;
}

const CLAVE_ACCESO   = 'access_token';
const CLAVE_REFRESCO = 'refresh_token';
const CLAVE_USUARIO  = 'user_data';

export async function loginRequest(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>(
    `${API_BASE_URL}${ENDPOINTS.LOGIN}`,
    { email, password },
    { timeout: 15_000 }
  );
  return res.data;
}

export async function persistSession(
  token: string,
  user: AuthUser,
  refresh?: string | null,
): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_ACCESO, token);
  await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(user));
  if (refresh) await SecureStore.setItemAsync(CLAVE_REFRESCO, refresh);
}

/** Reemplaza solo el access token tras un refresco. */
export async function actualizarAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_ACCESO, token);
}

/** Datos del usuario guardados, para reflejar cambios de perfil sin volver a entrar. */
export async function actualizarUsuario(user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(user));
}

export async function loadSession(): Promise<
  { token: string; user: AuthUser; refresh: string | null } | null
> {
  const token   = await SecureStore.getItemAsync(CLAVE_ACCESO);
  const userStr = await SecureStore.getItemAsync(CLAVE_USUARIO);
  const refresh = await SecureStore.getItemAsync(CLAVE_REFRESCO);
  if (!token || !userStr) return null;
  try {
    return { token, user: JSON.parse(userStr) as AuthUser, refresh };
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_REFRESCO);
}

/**
 * Pide un access token nuevo con el de refresco.
 * Devuelve null si el refresco ya no vale: ahí sí hay que volver a entrar.
 *
 * Usa axios directo y no el cliente de la aplicación para no caer en un bucle
 * con el propio interceptor que gestiona los 401.
 */
export async function refrescarSesion(): Promise<{ token: string; user?: AuthUser } | null> {
  const refresh = await getRefreshToken();
  if (!refresh) return null;
  try {
    const { data } = await axios.post<{ access_token: string; user?: AuthUser }>(
      `${API_BASE_URL}${ENDPOINTS.REFRESH}`,
      {},
      { headers: { Authorization: `Bearer ${refresh}` }, timeout: 15_000 },
    );
    if (!data?.access_token) return null;
    await actualizarAccessToken(data.access_token);
    if (data.user) await actualizarUsuario(data.user);
    return { token: data.access_token, user: data.user };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_ACCESO);
  await SecureStore.deleteItemAsync(CLAVE_REFRESCO);
  await SecureStore.deleteItemAsync(CLAVE_USUARIO);
}
