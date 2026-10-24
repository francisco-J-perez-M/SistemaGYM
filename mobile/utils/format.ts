/**
 * Utilidades de formateo seguro para datos de la API.
 *
 * El problema raíz: Flask/MongoDB puede devolver fechas como objetos
 * (`{ $date: "..." }`) en lugar de strings ISO, lo que causa
 * `TypeError: undefined is not a function` cuando se llama `.slice()`
 * o `.split()` sobre un valor que no es string.
 *
 * Todas las funciones aquí aceptan `any` y devuelven un tipo seguro.
 */

/**
 * Convierte cualquier valor tipo fecha a un string "YYYY-MM-DD".
 * Devuelve '' si el valor es falsy o no convertible.
 */
export function toDateStr(val: any, chars = 10): string {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, chars);
  if (val instanceof Date) return val.toISOString().slice(0, chars);
  // Fecha MongoDB en formato extendido: { $date: "2025-01-01T..." }
  if (typeof val === 'object' && val.$date) return toDateStr(val.$date, chars);
  // Timestamp de segundos (Firestore / MongoDB interno)
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString().slice(0, chars);
  }
  return String(val).slice(0, chars);
}

/**
 * Garantiza que un valor sea string. Devuelve `fallback` si no lo es.
 */
export function toStr(val: any, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (val == null) return fallback;
  return String(val);
}

/**
 * Obtiene la inicial de un nombre de forma segura.
 * Devuelve `fallback` si el valor no es un string no vacío.
 */
export function toInitial(val: any, fallback = '?'): string {
  if (!val || typeof val !== 'string') return fallback;
  return val.charAt(0).toUpperCase();
}

/**
 * Extrae el primer nombre de un nombre completo de forma segura.
 */
export function toFirstName(val: any, fallback = ''): string {
  if (!val || typeof val !== 'string') return fallback;
  return val.split(' ')[0] ?? fallback;
}

/**
 * Filtra una lista por un término de búsqueda en múltiples campos string.
 * Convierte los campos a string de forma segura antes de comparar.
 */
export function matchesSearch(item: any, keys: string[], term: string): boolean {
  if (!term) return true;
  const lower = term.toLowerCase();
  return keys.some((k) => toStr(item?.[k]).toLowerCase().includes(lower));
}

/**
 * Garantiza que un valor devuelto por la API sea un array.
 * Si el API devuelve un objeto envolvente ({ data: [...] }) o null/undefined,
 * devuelve siempre un array vacío.
 */
export function toArray<T>(val: T[] | null | undefined | any): T[] {
  return Array.isArray(val) ? val : [];
}
