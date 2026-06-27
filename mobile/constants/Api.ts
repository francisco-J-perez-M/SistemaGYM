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
  USER_PAYMENTS:      '/user/payments',          // GET  /api/user/payments  (stats + historial)
  USER_HEALTH:        '/user/health',            // GET/POST /api/user/health (condiciones + medidas)
  USER_HEALTH_MEDICAL:'/user/health/medical',    // PUT /api/user/health/medical (info médica)
  MEMBERSHIP_PAYMENT_METHODS: '/user/membership/payment-methods', // GET métodos recientes

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
  TRAINER_DIETS:      '/trainer/diets',          // GET/POST/PUT/DELETE /api/trainer/diets
  TRAINER_RECIPES:    '/trainer/recipes',        // GET/POST /api/trainer/recipes

  // ── Owner Gym / Admin ─────────────────────────────────────────────────────
  // owner_*_bp: url_prefix="/api/owner_gym"
  ADMIN_KPIS:         '/owner_gym/dashboard',    // GET /api/owner_gym/dashboard (estructura anidada)
  OWNER_PROFILE:      '/owner_gym/perfil',       // GET /api/owner_gym/perfil
  OWNER_STAFF:        '/owner_gym/staff',        // GET /api/owner_gym/staff
  OWNER_MEMBRESIAS:   '/owner_gym/membresias',   // GET /api/owner_gym/membresias (tipos de membresía)
  OWNER_INGRESOS:     '/owner_gym/dashboard/ingresos',   // GET ?meses=6  → tendencia mensual
  OWNER_ACTIVIDAD:    '/owner_gym/dashboard/actividad',  // GET ?limit=20 → feed reciente

  // ── IA / Analítica (Spark) — /api/analytics/* ─────────────────────────────
  ANALYTICS_KMEANS:        '/analytics/kmeans',        // GET ?k=3 → segmentación de miembros
  ANALYTICS_CANCELACIONES: '/analytics/cancelaciones', // GET → riesgo de cancelación

  // ── Reportes descargables — /api/reports/* ────────────────────────────────
  REPORT_INGRESOS_PDF: '/reports/mapreduce/pdf',  // GET PDF de ingresos por periodo
  REPORT_MIEMBROS_PDF: '/reports/miembros/pdf',   // GET PDF de miembros

  // ── Recepcionista — /api/recepcionista/* ──────────────────────────────────
  RECEP_DASHBOARD:    '/recepcionista/dashboard',  // GET KPIs del día
  RECEP_CHECKINS:     '/recepcionista/checkins',   // GET/POST check-ins de hoy
  RECEP_MEMBERS:      '/recepcionista/members',    // GET ?q= lista de miembros
  RECEP_PAYMENTS:     '/recepcionista/payments',   // GET pagos

  // Rutas compartidas sin prefix (url hardcodeada)
  MIEMBROS:           '/miembros',               // GET /api/miembros  (paginado)
  PAGOS:              '/pagos',                  // GET /api/pagos     (paginado)
  PAGOS_TODOS:        '/pagos/todos',            // GET feed unificado membresías + ventas POS
  MEMBRESIAS:         '/membresias',             // GET /api/membresias (tipos generales)

  // Notificaciones
  NOTIFICACIONES:       '/notificaciones',           // GET /api/notificaciones
  NOTIFICACIONES_LEER_TODAS: '/notificaciones/leer-todas', // PATCH marca todas como leídas
  PUSH_TOKEN:           '/notificaciones/push-token', // POST registra Expo push token
  // Trainer — Sesiones / ejercicios / solicitudes PT
  TRAINER_EXERCISES:     '/trainer/exercises',   // GET /api/trainer/exercises
  TRAINER_PT_REQUESTS:  '/trainer/pt-requests',  // GET/PATCH
  TRAINER_CHAT_BASE:    '/trainer/chat',           // GET|POST /trainer/chat/<miembro_pg_id>
  TRAINER_CHAT_UNREAD:  '/trainer/chat/unread-summary', // GET

  // Owner Gym — Perfil del Gym (GET /api/owner_gym/perfil devuelve datos del gimnasio)
  OWNER_GYM_PROFILE:    '/owner_gym/perfil',      // GET /api/owner_gym/perfil
  OWNER_PRODUCTOS:      '/owner_gym/productos',    // GET /api/owner_gym/productos
  OWNER_VENTAS:         '/ventas',                 // GET /api/ventas (ventas_bp hardcoded)

  // Member — POS
  // El catálogo de productos es compartido (owner_gym/productos).
  // Las ventas se crean/consultan vía /api/ventas (misma ruta que admin).
  USER_PRODUCTOS:       '/owner_gym/productos',    // GET /api/owner_gym/productos (catálogo visible al miembro)
  USER_VENTAS:          '/ventas',                 // GET /api/ventas (historial filtrado por gimnasio)
  USER_COMPRAR:         '/ventas',                 // POST /api/ventas (registrar compra)

  // Member — Entrenamiento (training_bp en /api/user/training)
  USER_TRAINERS_LIST:   '/user/training/trainers', // GET /api/user/training/trainers
  USER_ASSIGNED_ROUTINES: '/user/training/assigned-routines', // GET /api/user/training/assigned-routines
  USER_CHAT_BASE:       '/user/training/chat',     // GET|POST /api/user/training/chat/<trainer_id>
  USER_PT_REQUEST:      '/user/training/pt-request', // GET|POST /api/user/training/pt-request

  // Aliases legacy (mantenidos para no romper otras pantallas)
  USER_TRAINER:         '/user/training/trainers',
  USER_CHAT:            '/user/training/chat',
  USER_SEND_MSG:        '/user/training/chat',
} as const;
