/**
 * services/media.ts — Selección de imágenes y documentos.
 *
 * Envuelve expo-image-picker y expo-document-picker con carga defensiva: si el
 * módulo nativo no está en el build instalado, en vez de reventar al arrancar
 * se devuelve un aviso que la pantalla puede mostrar. Es el mismo patrón que
 * usa ExerciseDetailSheet con expo-video.
 *
 * Ambos paquetes traen código nativo, así que después de instalarlos hay que
 * regenerar el development build:
 *     npx expo install expo-image-picker expo-document-picker
 *     eas build --profile development --platform android
 *
 * Todo se devuelve como data URL base64 porque así es como el backend guarda
 * las imágenes (columna de texto), sin depender de un servidor de archivos.
 */
let ImagePicker: any = null;
let DocumentPicker: any = null;
let FS: any = null;

try { ImagePicker    = require('expo-image-picker'); }    catch { /* sin módulo */ }
try { DocumentPicker = require('expo-document-picker'); } catch { /* sin módulo */ }
try { FS = require('expo-file-system/legacy'); }
catch { try { FS = require('expo-file-system'); } catch { FS = null; } }

export interface ResultadoMedia {
  ok:      boolean;
  /** Contenido en data URL, listo para enviar al backend. */
  dataUrl?: string;
  /** Nombre original del archivo, solo en documentos. */
  nombre?: string;
  /** Motivo por el que no se obtuvo nada; null si el usuario canceló. */
  error?:  string | null;
}

const FALTA_MODULO =
  'Esta función necesita una versión más reciente de la aplicación. ' +
  'Pide al equipo un build actualizado.';

/**
 * Abre la galería para elegir una foto de perfil.
 *
 * Se recorta en cuadrado y se comprime: las imágenes viajan en base64 dentro
 * de la fila del usuario, así que una foto de cámara sin comprimir haría lenta
 * cada consulta que la lea.
 */
export async function elegirFoto(): Promise<ResultadoMedia> {
  if (!ImagePicker) return { ok: false, error: FALTA_MODULO };

  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    return { ok: false, error: 'Necesitamos permiso para abrir tus fotos.' };
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:    ImagePicker.MediaTypeOptions?.Images ?? 'images',
    allowsEditing: true,
    aspect:        [1, 1],
    quality:       0.55,
    base64:        true,
  });

  if (res.canceled) return { ok: false, error: null };

  const activo = res.assets?.[0];
  if (!activo?.base64) return { ok: false, error: 'No se pudo leer la imagen.' };

  const tipo = activo.mimeType || 'image/jpeg';
  const dataUrl = `data:${tipo};base64,${activo.base64}`;

  // El backend rechaza por encima de ~2 MB; se avisa aquí para no gastar una
  // subida que se sabe que va a fallar.
  if (dataUrl.length > 2_800_000) {
    return { ok: false, error: 'La imagen es muy pesada. Elige una más pequeña o recórtala.' };
  }

  return { ok: true, dataUrl };
}

/**
 * Abre el selector de archivos para adjuntar un certificado.
 * Acepta PDF e imágenes, que es lo que se emite habitualmente.
 */
export async function elegirDocumento(): Promise<ResultadoMedia> {
  if (!DocumentPicker) return { ok: false, error: FALTA_MODULO };
  if (!FS)             return { ok: false, error: 'No se puede leer el archivo en este dispositivo.' };

  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (res.canceled) return { ok: false, error: null };

  const activo = res.assets?.[0];
  if (!activo?.uri) return { ok: false, error: 'No se pudo leer el archivo.' };

  try {
    const base64 = await FS.readAsStringAsync(activo.uri, {
      encoding: FS.EncodingType?.Base64 ?? 'base64',
    });
    const tipo = activo.mimeType || 'application/pdf';
    const dataUrl = `data:${tipo};base64,${base64}`;

    if (dataUrl.length > 4_000_000) {
      return { ok: false, error: 'El archivo supera los 3 MB. Sube una versión más ligera.' };
    }

    return { ok: true, dataUrl, nombre: activo.name };
  } catch {
    return { ok: false, error: 'No se pudo leer el archivo.' };
  }
}

/** True si el adjunto es un PDF (para decidir cómo previsualizarlo). */
export function esPdf(dataUrl?: string | null): boolean {
  return !!dataUrl && dataUrl.startsWith('data:application/pdf');
}
