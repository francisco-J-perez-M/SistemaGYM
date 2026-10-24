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

const CLAVE_ACCESO             = 'access_token';
const CLAVE_REFRESCO           = 'refresh_token';
const CLAVE_USUARIO            = 'user_data';
// Actividad 09, PR-01 (J. C. Pérez Nava): revocación en el servidor
// pendiente de confirmar. Si clearSession() no pudo avisar al backend
// (sin red, por ejemplo), el refresco queda aquí y se reintenta en el
// siguiente arranque con conexión -- ver loadSession().
const CLAVE_REVOCAR_PENDIENTE  = 'revoke_pending_refresh_token';

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
    // Actividad 09, PR-02 (J. C. Pérez Nava): el servidor ROTA el token de
    // refresco en cada renovación y revoca el presentado. Antes solo se
    // guardaba el access_token nuevo y el de refresco original se seguía
    // usando sin límite durante sus 90 días completos.
    const { data } = await axios.post<{
      access_token: string; refresh_token?: string; user?: AuthUser;
    }>(
      `${API_BASE_URL}${ENDPOINTS.REFRESH}`,
      {},
      { headers: { Authorization: `Bearer ${refresh}` }, timeout: 15_000 },
    );
    if (!data?.access_token) return null;

    await actualizarAccessToken(data.access_token);
    if (data.refresh_token) {
      // Guardar el nuevo ANTES de devolver: si la aplicación muere aquí,
      // el token viejo ya no sirve y el usuario simplemente vuelve a entrar.
      await SecureStore.setItemAsync(CLAVE_REFRESCO, data.refresh_token);
    }
    if (data.user) await actualizarUsuario(data.user);
    return { token: data.access_token, user: data.user };
  } catch {
    return null;
  }
}

/**
 * Cierra la sesión en el servidor y luego limpia el dispositivo.
 *
 * Actividad 09, PR-01 (J. C. Pérez Nava): antes clearSession() solo
 * borraba el almacén local -- el token de refresco seguía siendo válido
 * en el servidor durante sus 90 días completos, así que quien tuviera una
 * copia conservaba el acceso aunque el usuario "cerrara sesión".
 */
export async function clearSession(): Promise<void> {
  const refresco = await SecureStore.getItemAsync(CLAVE_REFRESCO);

  if (refresco) {
    try {
      await axios.post(
        `${API_BASE_URL}${ENDPOINTS.LOGOUT}`,
        {},
        { headers: { Authorization: `Bearer ${refresco}` }, timeout: 8_000 },
      );
    } catch {
      // Sin red o el servidor no respondió: queda pendiente y se reintenta
      // en el siguiente arranque (ver loadSession). El usuario debe poder
      // salir de la aplicación igual, estando desconectado.
      try { await SecureStore.setItemAsync(CLAVE_REVOCAR_PENDIENTE, refresco); } catch { /* best-effort */ }
    }
  }

  await SecureStore.deleteItemAsync(CLAVE_ACCESO);
  await SecureStore.deleteItemAsync(CLAVE_REFRESCO);
  await SecureStore.deleteItemAsync(CLAVE_USUARIO);
}

/**
 * Reintenta revocar en el servidor un cierre de sesión que quedó pendiente
 * por falta de red. Pensada para llamarse una vez al arrancar la app
 * (junto a loadSession), cuando ya puede haber conexión de nuevo.
 */
export async function reintentarRevocacionPendiente(): Promise<void> {
  const pendiente = await SecureStore.getItemAsync(CLAVE_REVOCAR_PENDIENTE);
  if (!pendiente) return;
  try {
    await axios.post(
      `${API_BASE_URL}${ENDPOINTS.LOGOUT}`,
      {},
      { headers: { Authorization: `Bearer ${pendiente}` }, timeout: 8_000 },
    );
    await SecureStore.deleteItemAsync(CLAVE_REVOCAR_PENDIENTE);
  } catch {
    // Sigue sin red; se reintentará en el próximo arranque.
  }
}
