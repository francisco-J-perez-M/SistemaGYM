/**
 * reminders.ts — Notificaciones LOCALES proactivas (recordatorios en el dispositivo).
 *
 * Sigue el mismo patrón defensivo que push.ts:
 *   - carga diferida de expo-notifications (evita el crash de import en Expo Go),
 *   - guarda para Expo Go / falta de permisos,
 *   - cada programación va en try/catch para no romper la app si el API cambia.
 *
 * Programa: recordatorio diario de entrenamiento/racha y aviso(s) de
 * vencimiento de membresía. Son locales: no dependen del servidor de push.
 */
import Constants from 'expo-constants';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  (Constants as any).executionEnvironment === 'storeClient';

function loadNotifications(): any | null {
  if (isExpoGo) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-notifications');
  } catch {
    return null;
  }
}

async function ensurePermission(N: any): Promise<boolean> {
  try {
    const s = await N.getPermissionsAsync();
    let status = s.status;
    if (status !== 'granted') status = (await N.requestPermissionsAsync()).status;
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Trigger por fecha, tolerante a la versión del SDK. */
function dateTrigger(N: any, date: Date): any {
  const T = N.SchedulableTriggerInputTypes;
  return T ? { type: T.DATE, date } : { date };
}

/** Trigger diario repetido a una hora fija. */
function dailyTrigger(N: any, hour: number, minute: number): any {
  const T = N.SchedulableTriggerInputTypes;
  return T ? { type: T.DAILY, hour, minute } : { hour, minute, repeats: true };
}

export type MemberReminderInput = {
  membershipEnd?: string | null; // fecha_fin (ISO) de la membresía
  streakDays?: number;
};

/**
 * Cancela los recordatorios locales previos y los reprograma con datos frescos.
 * Idempotente: seguro de llamar en cada carga del dashboard.
 */
export async function refreshMemberReminders(input: MemberReminderInput): Promise<void> {
  const N = loadNotifications();
  if (!N) return;
  if (!(await ensurePermission(N))) return;

  // Limpia lo anterior (solo usamos scheduling local en este módulo).
  try { await N.cancelAllScheduledNotificationsAsync(); } catch { /* no-op */ }

  // 1) Recordatorio diario de entrenamiento / racha — 19:00
  try {
    const body =
      input.streakDays && input.streakDays > 0
        ? `Llevas ${input.streakDays} ${input.streakDays === 1 ? 'día' : 'días'} de racha. ¿Ya entrenaste hoy?`
        : '¿Listo para tu entrenamiento de hoy?';
    await N.scheduleNotificationAsync({
      content: { title: '¡No pierdas el ritmo! 💪', body },
      trigger: dailyTrigger(N, 19, 0),
    });
  } catch { /* no-op */ }

  // 2) Aviso(s) de vencimiento de membresía — 3 y 1 días antes, a las 10:00
  if (input.membershipEnd) {
    const end = new Date(input.membershipEnd);
    if (!isNaN(end.getTime())) {
      for (const dias of [3, 1]) {
        const when = new Date(end);
        when.setDate(when.getDate() - dias);
        when.setHours(10, 0, 0, 0);
        if (when.getTime() > Date.now()) {
          try {
            await N.scheduleNotificationAsync({
              content: {
                title: 'Tu membresía está por vencer',
                body: `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}. Renueva para no perder el acceso al gimnasio.`,
              },
              trigger: dateTrigger(N, when),
            });
          } catch { /* no-op */ }
        }
      }
    }
  }
}

/** Cancela todos los recordatorios locales (p. ej. al cerrar sesión). */
export async function clearMemberReminders(): Promise<void> {
  const N = loadNotifications();
  if (!N) return;
  try { await N.cancelAllScheduledNotificationsAsync(); } catch { /* no-op */ }
}
