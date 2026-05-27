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

export const ENDPOINTS = {
  // Auth
  LOGIN:             '/login',
  REGISTER:          '/register',

  // Member
  USER_DASHBOARD:    '/user/dashboard',
  USER_CHECKIN:      '/user/checkin',
  USER_PROFILE:      '/user/profile',
  USER_MEMBERSHIP:   '/user/membership',
  MEMBERSHIP_PLANS:  '/user/membership/plans',
  MEMBERSHIP_RENEW:  '/user/membership/renew',
  USER_PROGRESS:     '/user/progress',
  BODY_PROGRESS:     '/user/body-progress',
  WORKOUT_COMPLETE:  '/user/workout/complete',

  // Nutrition
  DIETAS:            '/user/nutrition/dietas',
  RECETAS:           '/user/nutrition/recetas',

  // Trainer
  TRAINER_DASHBOARD: '/trainer/dashboard',
  TRAINER_CLIENTS:   '/trainer/clients',
  TRAINER_PROFILE:   '/trainer/profile',
  TRAINER_ROUTINES:  '/trainer/routines',
  TRAINER_SCHEDULE:  '/trainer/schedule',

  // Admin / Owner
  ADMIN_KPIS:        '/dashboard/kpis',
  MIEMBROS:          '/miembros',
  PAGOS:             '/pagos',
  MEMBRESIAS:        '/membresias',
  NOTIFICACIONES:    '/notificaciones',
} as const;
