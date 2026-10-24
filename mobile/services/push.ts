/**
 * push.ts — Registro y manejo de notificaciones push (Expo).
 *
 * IMPORTANTE — Expo Go:
 *   Desde SDK 53, `expo-notifications` ejecuta un efecto secundario AL IMPORTARSE
 *   (auto-registro del device push token) que LANZA un error en Expo Go. Por eso
 *   NO importamos el módulo a nivel superior: lo cargamos de forma diferida
 *   (lazy require) y SOLO cuando NO estamos en Expo Go. Así la app arranca normal
 *   en Expo Go y el push funciona en un development/production build.
 *
 * Para push real:  npx expo run:android   (o un build de EAS)
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';
import { ENDPOINTS } from '../constants/Api';

// Detección de Expo Go (no soporta push remoto).
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  (Constants as any).executionEnvironment === 'storeClient';

/** Carga diferida de expo-notifications. Devuelve null en Expo Go o si falla. */
function loadNotifications(): any | null {
  if (isExpoGo) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-notifications');
  } catch {
    return null;
  }
}

function loadDevice(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-device');
  } catch {
    return null;
  }
}

/** Configura cómo se muestran las notificaciones en foreground. */
export function configureNotificationHandler(): void {
  const Notifications = loadNotifications();
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList:   true,
        shouldPlaySound:  true,
        shouldSetBadge:   true,
      }),
    });
  } catch { /* no-op */ }
}

/**
 * Pide permisos, obtiene el Expo push token y lo registra en el backend.
 * Devuelve el token, o null si no aplica (Expo Go, emulador, sin permisos).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo) {
    if (__DEV__) console.log('[push] Expo Go no soporta push remoto — usa un development build');
    return null;
  }

  const Notifications = loadNotifications();
  const Device = loadDevice();
  if (!Notifications) return null;

  if (Device && Device.isDevice === false) {
    if (__DEV__) console.log('[push] emulador — sin push');
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'GymPro',
        importance: Notifications.AndroidImportance?.DEFAULT ?? 3,
        lightColor: '#6c63ff',
      });
    }

    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    const tokenResp = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token: string = tokenResp.data;

    try {
      await api.post(ENDPOINTS.PUSH_TOKEN, { token, platform: Platform.OS });
    } catch (e) {
      if (__DEV__) console.log('[push] no se pudo registrar token en backend', e);
    }
    return token;
  } catch (e) {
    if (__DEV__) console.log('[push] error registrando push', e);
    return null;
  }
}

/**
 * Suscribe listeners de foreground y de tap. Devuelve una función de limpieza.
 */
export function setupNotificationListeners(onChange?: (notif: any) => void): () => void {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};
  try {
    const recv = Notifications.addNotificationReceivedListener((n: any) => onChange?.(n));
    const resp = Notifications.addNotificationResponseReceivedListener((r: any) => onChange?.(r));
    return () => { recv?.remove?.(); resp?.remove?.(); };
  } catch {
    return () => {};
  }
}
