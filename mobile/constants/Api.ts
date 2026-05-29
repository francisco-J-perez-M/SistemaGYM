/**
 * Resolución automática de la URL de la API.
 *
 * Estrategia (en orden de prioridad):
 *
 * 1. Variable de entorno EXPO_PUBLIC_API_BASE_URL  → producción / Docker con IP explícita
 * 2. Constants.expoConfig.hostUri                  → detección automática en dev
 *    Expo codifica la IP del Metro bundler en el QR code que escanea el dispositivo.
 *    `hostUri` tiene la forma "192.168.x.x:8081", por lo que basta extraer el host
 *    para saber qué máquina está corriendo la API (misma máquina = mismo host).
 * 3. Fallback para emuladores:
 *    - Android emulator: 10.0.2.2 (alias del host en AVD)
 *    - iOS simulator:    localhost
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiUrl(): string {
  // 1. Variable de entorno explícita (producción / CI)
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl;

  if (__DEV__) {
    // 2. Auto-detección mediante el hostUri de Expo
    //    hostUri = "192.168.x.x:8081"  (IP real de la máquina en la red local)
    const hostUri =
      Constants.expoConfig?.hostUri ??
      // expo-router SDK 53 puede exponerlo aquí:
      (Constants as any).manifest2?.extra?.expoClient?.hostUri;

    if (hostUri) {
      // Extraer solo el host (sin puerto)
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:8080/api`;
      }
    }

    // 3. Fallback para emuladores
    if (Platform.OS === 'android') {
      // 10.0.2.2 es el alias de "host machine" en Android Virtual Device (AVD)
      return 'http://10.0.2.2:8080/api';
    }

    // iOS simulator
    return 'http://localhost:8080/api';
  }

  return 'http://localhost:8080/api';
}

export const API_BASE_URL = resolveApiUrl();

// Debug: útil para saber qué URL se resolvió
if (__DEV__) {
  console.log('[GymPro] API_BASE_URL →', API_BASE_URL);
}

/**
 * ENDPOINTS — rutas relativas a API_BASE_URL (/api).
 *
 * Correspondencia con blueprints Flask:
 *
 *  Auth       auth_bp             url_prefix="/api/auth"
 *  Member     user_*_bp           urls hardcodeadas como /api/user/...
 *  Trainer    trainer_bp          url_prefix="/api/trainer"
 *  Owner Gym  owner_*_bp          url_prefix="/api/owner_gym"
 *  Shared     miembros_bp / pagos url hardcodeada /api/miembros, /api/pagos
 *  Shared     notificaciones_bp   url_prefix="/api/notificaciones"
 */
export const ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  LOGIN:              '/auth/login',
  REGISTER:           '/auth/register',

  // ── Miembro ───────────────────────────────────────────────────────────────
  USER_DASHBOARD:     '/user/dashboard',        // GET  /api/user/dashboard
  USER_CHECKIN:       '/user/checkin',           // POST /api/user/checkin
  USER_PROFILE:       '/user/profile',           // GET  /api/user/profile
  USER_MEMBERSHIP:    '/user/membership',        // GET  /api/user/membership
  MEMBERSHIP_PLANS:   '/user/membership/plans',  // GET  /api/user/membership/plans
  MEMBERSHIP_RENEW:   '/user/membership/renew',  // POST /api/user/membership/renew
  USER_PROGRESS:      '/user/progress',          // POST /api/user/progress
  BODY_PROGRESS:      '/user/body-progress',     // GET/POST /api/user/body-progress
  WORKOUT_COMPLETE:   '/user/workout/complete',  // POST /api/user/workout/complete
  USER_ROUTINES:      '/user/routines',          // GET  /api/user/routines (user_routines_bp prefix=/api/user)

  // Nutrición
  DIETAS:             '/user/nutrition/dietas',  // GET /api/user/nutrition/dietas
  RECETAS:            '/user/nutrition/recetas', // GET /api/user/nutrition/recetas

  // ── Entrenador ────────────────────────────────────────────────────────────
  // trainer_bp: url_prefix="/api/trainer"
  TRAINER_DASHBOARD:  '/trainer/dashboard',      // GET /api/trainer/dashboard
  TRAINER_CLIENTS:    '/trainer/clients',        // GET /api/trainer/clients  (paginado)
  TRAINER_PROFILE:    '/trainer/profile',        // GET /api/trainer/profile
  TRAINER_ROUTINES:   '/trainer/routines',       // GET /api/trainer/routines
  TRAINER_SCHEDULE:   '/trainer/schedule',       // GET /api/trainer/schedule
  TRAINER_SESSIONS:   '/trainer/sessions',       // GET /api/trainer/sessions
  TRAINER_MEMBERS:    '/trainer/members',        // GET /api/trainer/members

  // ── Owner Gym / Admin ─────────────────────────────────────────────────────
  // owner_*_bp: url_prefix="/api/owner_gym"
  ADMIN_KPIS:         '/owner_gym/dashboard',    // GET /api/owner_gym/dashboard (estructura anidada)
  OWNER_PROFILE:      '/owner_gym/perfil',       // GET /api/owner_gym/perfil
  OWNER_STAFF:        '/owner_gym/staff',        // GET /api/owner_gym/staff
  OWNER_MEMBRESIAS:   '/owner_gym/membresias',   // GET /api/owner_gym/membresias (tipos de membresía)

  // Rutas compartidas sin prefix (url hardcodeada)
  MIEMBROS:           '/miembros',               // GET /api/miembros  (paginado)
  PAGOS:              '/pagos',                  // GET /api/pagos     (paginado)
  MEMBRESIAS:         '/membresias',             // GET /api/membresias (tipos generales)

  // Notificaciones
  NOTIFICACIONES:     '/notificaciones',         // GET /api/notificaciones
} as const;
