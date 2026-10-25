/**
 * ScanningOverlay — sustituye la vista previa en vivo de la cámara por una
 * animación de escaneo (ícono + línea que se mueve).
 *
 * Por qué existe: en varios Android (confirmado en más de un teléfono, no
 * solo el Huawei/EMUI ya cubierto por patches/expo-camera+*.patch) el
 * PreviewView de CameraX sale completamente negro bajo la Nueva
 * Arquitectura de React Native (Fabric) — es un bug de compositing de la
 * vista nativa, no de la cámara: el escaneo (onBarcodeScanned) sigue
 * funcionando perfecto detrás de esa pantalla negra (confirmado: el
 * check-in/la búsqueda se completan bien aunque no se vea nada).
 *
 * Ya se probó forzar TextureView (patch existente) y se investigó
 * desactivar la Nueva Arquitectura, pero eso rompería
 * react-native-reanimated 4.x (ya no soporta la arquitectura vieja); migrar
 * a react-native-vision-camera tampoco es una salida segura -- su propio
 * mantenedor confirma que aún no es 100% compatible con Fabric, así que la
 * reescritura podría toparse con el mismo bug. En vez de perseguir un
 * problema de render ajeno y sin fecha de arreglo, se deja el CameraView
 * montado (sigue entregando frames con normalidad) y se oculta su salida
 * visual rota detrás de esta animación -- el usuario ve una pantalla de
 * "escaneando" intencional, no un cuadro negro que parece roto.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  hint: string;
  /** Pausa la animación cuando no se está escaneando activamente (p.ej. mientras se envía el resultado). */
  active?: boolean;
};

export default function ScanningOverlay({ icon, hint, active = true }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-95, 95] });

  return (
    <View style={styles.wrap}>
      <View style={styles.frame}>
        <Ionicons name={icon} size={36} color="rgba(255,255,255,0.3)" />
        <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
      </View>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: 240, height: 240, borderRadius: 16, borderWidth: 3, borderColor: '#fff', opacity: 0.9,
    backgroundColor: '#000', overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute', width: '82%', height: 2, backgroundColor: '#4ade80', borderRadius: 2,
    shadowColor: '#4ade80', shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
  },
  hint: {
    marginTop: 20, color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32,
  },
});
