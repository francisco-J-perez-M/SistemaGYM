/**
 * VisorCertificado — previsualización del documento de una certificación.
 *
 * Lo usan el perfil del entrenador (para revisar lo que subió) y la ficha que
 * ve el miembro antes de solicitarlo, que es donde de verdad importa: poder
 * comprobar el certificado es lo que da confianza al elegir entrenador.
 *
 * Las imágenes se muestran en pantalla. Los PDF no se pueden dibujar sin un
 * visor nativo, así que se ofrece abrirlos con la aplicación que el teléfono
 * ya tenga: se escribe el archivo en la caché y se comparte.
 *
 * SECCIONES QUE PINTA
 *   velo ........ colors.overlay
 *   hoja ........ colors.background
 *   lienzo ...... colors.surface (fondo de la imagen)
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity, Image,
  Alert, Platform, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { toStr } from '../../utils/format';
import { esPdf } from '../../services/media';

let FS: any = null;
try { FS = require('expo-file-system/legacy'); }
catch { try { FS = require('expo-file-system'); } catch { FS = null; } }

export interface CertificadoVisible {
  nombre?:  string;
  emisor?:  string;
  anio?:    string | number;
  archivo?: string;
  nombre_archivo?: string;
}

interface Props {
  certificado: CertificadoVisible | null;
  onClose:     () => void;
}

export default function VisorCertificado({ certificado, onClose }: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const [abriendo, setAbriendo] = useState(false);

  const archivo = certificado?.archivo || '';
  const pdf     = esPdf(archivo);

  /**
   * Guarda el PDF donde el usuario elija y lo abre desde ahí.
   *
   * Se usa el mismo camino que la descarga de reportes (services/download.ts):
   * en Android, el marco de acceso al almacenamiento deja escoger carpeta; en
   * iOS se escribe en el espacio de la aplicación y se abre la hoja de
   * compartir. Así no hace falta ningún módulo nativo adicional.
   */
  const abrirPdf = async () => {
    if (!FS || !archivo) {
      Alert.alert('No disponible', 'Este dispositivo no puede abrir el archivo.');
      return;
    }
    setAbriendo(true);
    try {
      const base64 = archivo.includes(',') ? archivo.split(',')[1] : archivo;
      let nombre = (certificado?.nombre_archivo || 'certificado').replace(/[^\w.\-]/g, '_');
      if (!nombre.toLowerCase().endsWith('.pdf')) nombre += '.pdf';
      const opciones = { encoding: FS.EncodingType?.Base64 ?? 'base64' };

      if (Platform.OS === 'android' && FS.StorageAccessFramework) {
        const permiso = await FS.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permiso.granted) return;      // el usuario canceló
        const uri = await FS.StorageAccessFramework.createFileAsync(
          permiso.directoryUri, nombre, 'application/pdf',
        );
        await FS.writeAsStringAsync(uri, base64, opciones);
        Alert.alert('Guardado', 'El certificado se guardó en la carpeta que elegiste.');
        return;
      }

      const ruta = `${FS.documentDirectory ?? FS.cacheDirectory}${nombre}`;
      await FS.writeAsStringAsync(ruta, base64, opciones);
      await Share.share({ url: ruta, title: toStr(certificado?.nombre, 'Certificado') });
    } catch {
      Alert.alert('No se pudo abrir', 'Intenta de nuevo o pide el documento por otro medio.');
    } finally {
      setAbriendo(false);
    }
  };

  return (
    <Modal
      visible={!!certificado}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.velo}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Cerrar"
          accessibilityRole="button"
        />

        <View style={[styles.hoja, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.asa} />

          <View style={styles.encabezado}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titulo} numberOfLines={2}>
                {toStr(certificado?.nombre, 'Certificación')}
              </Text>
              <Text style={styles.subtitulo}>
                {[toStr(certificado?.emisor), toStr(certificado?.anio)]
                  .filter(Boolean).join(' · ') || 'Sin datos del emisor'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.cerrar} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!archivo ? (
              <Text style={styles.vacio}>Esta certificación no tiene documento adjunto.</Text>
            ) : pdf ? (
              <View style={styles.pdfCaja}>
                <Ionicons name="document-text-outline" size={54} color={colors.accent} />
                <Text style={styles.pdfNombre} numberOfLines={2}>
                  {toStr(certificado?.nombre_archivo, 'Documento PDF')}
                </Text>
                <Text style={styles.pdfAyuda}>
                  {Platform.OS === 'android'
                    ? 'Elige una carpeta para guardarlo y ábrelo desde ahí.'
                    : 'Se abrirá con el lector de tu teléfono.'}
                </Text>
                <TouchableOpacity
                  style={styles.abrirBtn}
                  onPress={abrirPdf}
                  disabled={abriendo}
                  accessibilityRole="button"
                  accessibilityLabel="Guardar y abrir el documento"
                >
                  <Ionicons name={abriendo ? 'hourglass-outline' : 'download-outline'}
                            size={17} color={colors.onAccent} />
                  <Text style={styles.abrirText}>
                    {abriendo ? 'Guardando…' : (Platform.OS === 'android' ? 'Guardar y abrir' : 'Abrir documento')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Image
                source={{ uri: archivo }}
                style={styles.imagen}
                resizeMode="contain"
                accessibilityLabel={`Certificado de ${toStr(certificado?.nombre)}`}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    velo: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    hoja: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingTop: 10, maxHeight: '88%',
    },
    asa: {
      width: 40, height: 4, borderRadius: 2, alignSelf: 'center',
      backgroundColor: colors.border, marginBottom: 10,
    },
    encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
    titulo:     { color: colors.text, fontSize: 16 * fs, fontWeight: '800' },
    subtitulo:  { color: colors.textSecondary, fontSize: 12 * fs, marginTop: 2 },
    cerrar: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
    },
    vacio: { color: colors.textMuted, fontSize: 13 * fs,
             textAlign: 'center', paddingVertical: 40 },
    imagen: {
      width: '100%', height: 420, borderRadius: 14,
      backgroundColor: colors.surface,
    },
    pdfCaja: {
      alignItems: 'center', gap: 8, paddingVertical: 34,
      backgroundColor: colors.surface, borderRadius: 14,
    },
    pdfNombre: { color: colors.text, fontSize: 14 * fs, fontWeight: '700',
                 textAlign: 'center', paddingHorizontal: 20 },
    pdfAyuda:  { color: colors.textMuted, fontSize: 11.5 * fs, textAlign: 'center' },
    abrirBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10,
      backgroundColor: colors.accent, borderRadius: 12,
      paddingHorizontal: 18, paddingVertical: 12,
    },
    abrirText: { color: colors.onAccent, fontSize: 14 * fs, fontWeight: '700' },
  });
}
