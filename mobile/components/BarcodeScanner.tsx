/**
 * BarcodeScanner — escáner de código de barras de producto (EAN/UPC) para
 * precargar macros desde Open Food Facts al crear una receta/alimento.
 *
 * Se prefiere el escáner NATIVO de expo-camera (`CameraView.launchScanner`
 * -- Google code scanner en Android, `DataScannerViewController` en
 * iOS 16+): presenta su propia cámara en una hoja nativa, fuera del árbol
 * de vistas de React Native, así que no le afecta el bug de `PreviewView`
 * en negro bajo la Nueva Arquitectura (Fabric) que sí le pega al
 * `<CameraView>` embebido (ver ScanningOverlay.tsx para el detalle
 * completo). El `<CameraView>` embebido + Modal de abajo solo se usa de
 * respaldo cuando ese escáner nativo no está disponible (sin Google Play
 * Services, Meta Quest, iOS < 16).
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult, type ScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import ScanningOverlay from './ScanningOverlay';

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (code: string) => void;
};

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'];

export default function BarcodeScanner({ visible, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [escaneadoEn, setEscaneadoEn] = useState(0);
  // Si el escáner nativo falla al abrir en tiempo real (p.ej. Play Services
  // recién deshabilitado) se cae al <CameraView> embebido para esta sesión.
  const [usarEmbebido, setUsarEmbebido] = useState(!CameraView.isModernBarcodeScannerAvailable);

  const procesarCodigo = useCallback((code: string) => {
    const ahora = Date.now();
    // CameraView sigue emitiendo detecciones mientras el código esté en
    // cuadro; este debounce corto evita procesarlo dos veces.
    if (ahora - escaneadoEn < 1200) return;
    setEscaneadoEn(ahora);
    onScanned(code);
  }, [escaneadoEn, onScanned]);

  const handleScanned = useCallback(({ data }: BarcodeScanningResult) => {
    procesarCodigo(data);
  }, [procesarCodigo]);

  // ── Escáner nativo (Google code scanner / DataScannerViewController) ────
  useEffect(() => {
    if (!visible || usarEmbebido) return undefined;

    const sub = CameraView.onModernBarcodeScanned(({ data }: ScanningResult) => {
      procesarCodigo(data);
      CameraView.dismissScanner().catch(() => {}); // no-op en Android; cierra la hoja en iOS
      onClose();
    });

    CameraView.launchScanner({ barcodeTypes: BARCODE_TYPES as any }).catch((e: any) => {
      const msg = String(e?.message || '');
      if (/cancel/i.test(msg)) {
        onClose(); // el usuario cerró el escáner nativo
      } else if (/play services|mlkit/i.test(msg)) {
        setUsarEmbebido(true); // no disponible ahora mismo: usar el <CameraView> de respaldo
      } else {
        onClose();
      }
    });

    return () => sub.remove();
  }, [visible, usarEmbebido, procesarCodigo, onClose]);

  if (!visible || !usarEmbebido) return null; // el escáner nativo no necesita UI propia: su hoja lo cubre todo

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Ionicons name="camera-outline" size={40} color="#fff" />
            <Text style={styles.hint}>
              Se necesita la cámara para escanear el código de barras del producto.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={requestPermission}>
              <Text style={styles.btnText}>Permitir cámara</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES as any }}
              onBarcodeScanned={handleScanned}
            />
            <View style={styles.overlay} pointerEvents="none">
              <ScanningOverlay icon="barcode-outline" hint="Apunta al código de barras del producto" />
            </View>
          </>
        )}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Cerrar escáner">
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#000' },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  overlay:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint:     { marginTop: 16, color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },
  closeBtn: { position: 'absolute', top: 54, right: 20, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20 },
  btn:      { marginTop: 8, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#fff', borderRadius: 8 },
  btnText:  { color: '#000', fontWeight: '700' },
});
