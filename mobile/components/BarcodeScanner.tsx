/**
 * BarcodeScanner — escáner de código de barras de producto (EAN/UPC) para
 * precargar macros desde Open Food Facts al crear una receta/alimento.
 *
 * Reutiliza el mismo componente de cámara que ya usa el check-in por QR
 * (ver app/(member)/checkin-qr.tsx): expo-camera ya estaba integrado en la
 * app, así que esto no agrega ninguna dependencia ni permiso nuevo — solo
 * cambia los tipos de código que la cámara reconoce (de 'qr' a los de
 * producto).
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (code: string) => void;
};

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'];

export default function BarcodeScanner({ visible, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [escaneadoEn, setEscaneadoEn] = useState(0);

  const handleScanned = useCallback(({ data }: BarcodeScanningResult) => {
    const ahora = Date.now();
    // CameraView sigue emitiendo detecciones mientras el código esté en
    // cuadro; este debounce corto evita mandar el mismo escaneo varias veces.
    if (ahora - escaneadoEn < 1200) return;
    setEscaneadoEn(ahora);
    onScanned(data);
  }, [escaneadoEn, onScanned]);

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
              <View style={styles.frame} />
              <Text style={styles.hint}>Apunta al código de barras del producto</Text>
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
  frame:    { width: 270, height: 150, borderRadius: 12, borderWidth: 3, borderColor: '#fff', opacity: 0.85 },
  hint:     { marginTop: 16, color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },
  closeBtn: { position: 'absolute', top: 54, right: 20, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20 },
  btn:      { marginTop: 8, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#fff', borderRadius: 8 },
  btnText:  { color: '#000', fontWeight: '700' },
});
