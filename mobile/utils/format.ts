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
 * Fecha local del dispositivo como "YYYY-MM-DD".
 *
 * NO se usa toISOString(): ese método convierte a UTC, así que un movimiento
 * de las 19:00 en México (UTC-6) se mostraría con la fecha del día siguiente.
 * Se leen los componentes locales, que ya respetan la zona del teléfono.
 */
function ymdLocal(d: Date): string {
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Convierte cualquier valor tipo fecha a un string "YYYY-MM-DD" en la zona
 * horaria del dispositivo. Devuelve '' si el valor es falsy o no convertible.
 */
export function toDateStr(val: any, chars = 10): string {
  if (!val) return '';

  // Cadena ya en formato fecha (YYYY-MM-DD...): se recorta tal cual. Viene así
  // del backend, que la calcula en la zona del gimnasio; reinterpretarla como
  // Date la desplazaría otra vez.
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, chars);
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? val.slice(0, chars) : ymdLocal(d).slice(0, chars);
  }

  if (val instanceof Date) return ymdLocal(val).slice(0, chars);

  // Fecha MongoDB en formato extendido: { $date: "2025-01-01T..." }
  if (typeof val === 'object' && val.$date) return toDateStr(val.$date, chars);

  // Timestamp de segundos (Firestore / MongoDB interno)
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return ymdLocal(new Date(val.seconds * 1000)).slice(0, chars);
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
 *
 * El genérico usa `T = any` por defecto a propósito. Sin ese valor por defecto,
 * una llamada sin tipo explícito —`toArray(venta.items)`— infiere `unknown[]`,
 * y cualquier acceso posterior (`it.nombre`) es un error de compilación. Como
 * la mitad de las llamadas del proyecto son sobre respuestas sin tipar, eso
 * generaba cientos de errores en pantallas que funcionan perfectamente.
 *
 * Donde sí interesa el tipado se sigue pasando el genérico, y ahí TypeScript
 * comprueba igual que antes:
 *     toArray<Movimiento>(data?.movimientos)
 */
export function toArray<T = any>(val: T[] | null | undefined | any): T[] {
  return Array.isArray(val) ? val : [];
}
