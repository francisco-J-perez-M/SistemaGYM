/**
 * download.ts — Descarga un archivo autenticado del backend y lo guarda/comparte.
 *
 * Usa SOLO dependencias ya incluidas (expo-file-system), sin requerir expo-sharing,
 * para no romper el bundle:
 *   - Android: StorageAccessFramework → el usuario elige carpeta y se guarda el PDF
 *              en una ubicación pública/accesible.
 *   - iOS:     se escribe en el sandbox y se abre la hoja de compartir nativa.
 */
import { Platform, Share } from 'react-native';
import { Buffer } from 'buffer';
import api from './api';

// expo-file-system: en SDK 54+ las funciones clásicas viven en /legacy.
let FS: any = null;
try { FS = require('expo-file-system/legacy'); }
catch { try { FS = require('expo-file-system'); } catch { FS = null; } }

export interface DownloadResult { ok: boolean; reason?: string }

export async function downloadAndShare(
  endpoint: string,
  filename: string,
  mime = 'application/pdf',
): Promise<DownloadResult> {
  if (!FS) return { ok: false, reason: 'Sistema de archivos no disponible.' };

  // 1. Descargar binario con el cliente autenticado.
  const res = await api.get(endpoint, { responseType: 'arraybuffer' });
  const base64 = Buffer.from(res.data, 'binary').toString('base64');
  const b64opt = { encoding: FS.EncodingType?.Base64 ?? 'base64' };

  // 2a. Android: dejar que el usuario elija una carpeta y guardar ahí.
  if (Platform.OS === 'android' && FS.StorageAccessFramework) {
    const perm = await FS.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'Permiso de carpeta cancelado.' };
    const uri = await FS.StorageAccessFramework.createFileAsync(perm.directoryUri, filename, mime);
    await FS.writeAsStringAsync(uri, base64, b64opt);
    return { ok: true };
  }

  // 2b. iOS / otros: escribir en el sandbox y abrir la hoja de compartir.
  const dir  = FS.documentDirectory ?? FS.cacheDirectory;
  const path = `${dir}${filename}`;
  await FS.writeAsStringAsync(path, base64, b64opt);
  try {
    await Share.share({ url: path, title: filename });
  } catch {
    return { ok: true, reason: `Guardado en: ${path}` };
  }
  return { ok: true };
}
