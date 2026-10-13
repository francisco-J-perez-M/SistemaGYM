/**
 * services/offline/storage.ts — helpers JSON sobre AsyncStorage.
 *
 * Todo el módulo offline (cache.ts, queue.ts) lee y escribe JSON plano; estos
 * dos helpers son el único punto que conoce AsyncStorage directamente, para
 * no repetir JSON.parse/stringify ni el manejo de errores (dispositivo sin
 * espacio, storage corrupto o no disponible) en cada archivo.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function leerJSON<T>(clave: string, porDefecto: T): Promise<T> {
  try {
    const crudo = await AsyncStorage.getItem(clave);
    if (!crudo) return porDefecto;
    return JSON.parse(crudo) as T;
  } catch {
    return porDefecto;
  }
}

export async function escribirJSON<T>(clave: string, valor: T): Promise<void> {
  try {
    await AsyncStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // No-bloqueante: si el dispositivo no tiene espacio o el storage no está
    // disponible, la pantalla ya tiene el dato en memoria — solo se pierde
    // la persistencia de ESTA escritura, no la sesión actual del usuario.
  }
}
