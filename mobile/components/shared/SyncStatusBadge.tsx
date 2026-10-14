/**
 * components/shared/SyncStatusBadge.tsx — indicador de conectividad y
 * sincronización pendiente (SCRUM-168 / HU-30).
 *
 * Vive en el headerRight de app/(member)/_layout.tsx, junto a
 * PerfilCompletoBadge — así aparece en TODAS las pantallas de miembro sin
 * tener que agregarlo pantalla por pantalla ("un solo punto", igual que ese
 * badge).
 *
 * Estados:
 *   - Conectado y sin pendientes: no se muestra nada (el caso normal no debe
 *     ocupar espacio permanente en el header).
 *   - Conectado con pendientes: ícono de sincronización + contador mientras
 *     sincronizarCola() los va drenando.
 *   - Sin conexión: ícono de nube sin señal, con contador si hay algo
 *     esperando a sincronizarse.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useFontScale } from '../../hooks/useColors';
import { useConnectivityStore } from '../../services/offline/connectivity';
import { suscribirseACola, type AccionEncolada } from '../../services/offline/queue';

export default function SyncStatusBadge() {
  const colors = useColors();
  const fs = useFontScale();
  const conectado = useConnectivityStore((s) => s.conectado);
  const [pendientes, setPendientes] = useState<AccionEncolada[]>([]);

  useEffect(() => suscribirseACola(setPendientes), []);

  if (conectado && pendientes.length === 0) return null;

  const styles = make_styles(colors, fs);
  const label = !conectado
    ? (pendientes.length > 0 ? `Sin conexión, ${pendientes.length} por sincronizar` : 'Sin conexión')
    : `Sincronizando ${pendientes.length} elemento${pendientes.length === 1 ? '' : 's'}`;

  return (
    <View style={styles.badge} accessibilityLabel={label}>
      <Ionicons
        name={!conectado ? 'cloud-offline-outline' : 'sync-outline'}
        size={14}
        color={!conectado ? colors.warning : colors.accent}
      />
      {pendientes.length > 0 && (
        <Text style={styles.text}>{pendientes.length}</Text>
      )}
    </View>
  );
}

function make_styles(colors: any, fs: number) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
      backgroundColor: colors.card, marginRight: 8,
    },
    text: { fontSize: 11 * fs, fontWeight: '700', color: colors.textSecondary },
  });
}
