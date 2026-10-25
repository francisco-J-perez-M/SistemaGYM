/**
 * checkin-qr.tsx — Check-in del miembro escaneando el QR general del
 * gimnasio (reemplaza el botón de auto-registro sin verificación que
 * antes vivía en el dashboard: ver (member)/index.tsx).
 *
 * El recepcionista muestra en su pantalla un código que cambia solo cada
 * ~50-60s (ver web/.../ReceptionistCheckin.jsx y
 * api/app/utils/checkin_qr.py). Esta pantalla solo lee ese código con la
 * cámara y lo manda al backend junto con el JWT del miembro — la
 * identidad del check-in la pone el JWT, el QR solo certifica que el
 * escaneo ocurrió frente a esa pantalla hace pocos segundos.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ScanningOverlay from '../../components/ScanningOverlay';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/Api';

type Estado = 'escaneando' | 'enviando' | 'exito' | 'ya_registrado' | 'expirado' | 'error';

export default function CheckinQr() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemoStyles(colors, fs);
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [estado, setEstado] = useState<Estado>('escaneando');
  const [mensaje, setMensaje] = useState<string>('');
  const [escaneadoEn, setEscaneadoEn] = useState(0); // evita procesar el mismo frame varias veces

  const reintentar = () => {
    setEstado('escaneando');
    setMensaje('');
  };

  const handleBarcodeScanned = useCallback(async ({ data }: BarcodeScanningResult) => {
    const ahora = Date.now();
    // CameraView sigue emitiendo detecciones mientras el código esté en
    // cuadro; con `estado` ya cambiado a 'enviando' se ignoran, pero por si
    // acaso se agrega un debounce corto extra.
    if (ahora - escaneadoEn < 1500) return;
    setEscaneadoEn(ahora);
    setEstado('enviando');

    try {
      const { data: res } = await api.post(ENDPOINTS.USER_CHECKIN_QR, { token: data });
      if (res?.message === 'Ya registraste tu asistencia hoy') {
        setEstado('ya_registrado');
      } else {
        setEstado('exito');
      }
      setMensaje(res?.message ?? 'Asistencia registrada');
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.error;
      if (status === 410) {
        setEstado('expirado');
        setMensaje(msg ?? 'El código expiró. Pide uno nuevo en recepción.');
      } else {
        setEstado('error');
        setMensaje(msg ?? 'No se pudo registrar tu entrada. Intenta de nuevo.');
      }
    }
  }, [escaneadoEn]);

  // ── Permiso de cámara aún no resuelto ───────────────────────────────────
  if (!permission) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // ── Permiso denegado ─────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 16 }]}>
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
          <Text style={styles.title}>Se necesita la cámara</Text>
          <Text style={styles.subtitle}>
            Para registrar tu entrada escaneando el código del gimnasio, la app necesita
            permiso para usar la cámara.
          </Text>
          <Button label="Permitir cámara" onPress={requestPermission} style={{ marginTop: 8, width: '100%' }} />
        </Card>
      </View>
    );
  }

  // ── Resultado (éxito / ya registrado / expirado / error) ────────────────
  if (estado !== 'escaneando' && estado !== 'enviando') {
    const info: Record<Exclude<Estado, 'escaneando' | 'enviando'>, { icon: any; color: string; titulo: string }> = {
      exito:         { icon: 'checkmark-circle', color: colors.success, titulo: '¡Entrada registrada!' },
      ya_registrado: { icon: 'checkmark-circle', color: colors.success, titulo: 'Ya habías registrado tu entrada hoy' },
      expirado:      { icon: 'time-outline',     color: colors.warning, titulo: 'Código expirado' },
      error:         { icon: 'alert-circle',     color: colors.error,   titulo: 'No se pudo registrar' },
    };
    const { icon, color, titulo } = info[estado];
    return (
      <View style={[styles.center, { paddingTop: insets.top + 16 }]}>
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <Ionicons name={icon} size={48} color={color} />
          <Text style={styles.title}>{titulo}</Text>
          {!!mensaje && <Text style={styles.subtitle}>{mensaje}</Text>}
          {(estado === 'expirado' || estado === 'error') ? (
            <Button label="Escanear de nuevo" onPress={reintentar} style={{ marginTop: 8, width: '100%' }} />
          ) : (
            <Button label="Volver al inicio" onPress={() => router.back()} style={{ marginTop: 8, width: '100%' }} />
          )}
        </Card>
      </View>
    );
  }

  // ── Escaneando ───────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={estado === 'escaneando' ? handleBarcodeScanned : undefined}
      />
      <View style={[styles.overlay, { paddingTop: insets.top + 24 }]}>
        <ScanningOverlay
          icon="qr-code-outline"
          hint={estado === 'enviando' ? 'Registrando...' : 'Apunta al código que muestra recepción'}
          active={estado === 'escaneando'}
        />
        {estado === 'enviando' && <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />}
      </View>
    </View>
  );
}

function useMemoStyles(colors: ReturnType<typeof useColors>, fs: number) {
  return React.useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#000' },
    center: {
      flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.background,
    },
    overlay: {
      flex: 1, alignItems: 'center',
    },
    title: { color: colors.text, fontSize: 18 * fs, fontWeight: '700', textAlign: 'center' },
    subtitle: { color: colors.textSecondary, fontSize: 13 * fs, textAlign: 'center' },
  }), [colors, fs]);
}
