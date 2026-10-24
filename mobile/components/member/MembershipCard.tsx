// LinearGradient eliminado: requireNativeViewManager falla en RN 0.85 new arch (Fabric).
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useFontScale } from '../../hooks/useColors';
import { toDateStr, toStr } from '../../utils/format';
import type { Membership } from '../../types';

interface Props { membership: Membership | null }

export default function MembershipCard({ membership }: Props) {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  if (!membership) return null;

  // Los días restantes son un dato: si apremian, hablan en tono "atención";
  // si no, en tono "progreso". El HEX lo pone la paleta activa.
  const isUrgent = membership.dias_restantes <= 7;
  const color    = isUrgent ? colors.dataAtencion   : colors.dataProgreso;
  const colorBg  = isUrgent ? colors.dataAtencionBg : colors.dataProgresoBg;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="card-outline" size={20} color={colors.accent} />
        </View>
        <View
          style={[styles.statusPill, { backgroundColor: colorBg }]}
          accessibilityRole="text"
          accessibilityLabel={`Estado: ${membership.estado}`}
        >
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.statusText, { color }]}>
            {isUrgent ? 'Por vencer' : 'Activa'}
          </Text>
        </View>
      </View>

      <Text style={styles.plan}>{toStr(membership.plan, 'Plan')}</Text>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.miniLabel}>Vence</Text>
          <Text style={styles.miniVal}>{toDateStr(membership.fecha_fin) || toStr(membership.fecha_fin)}</Text>
        </View>
        <View style={styles.daysBox}>
          <Text style={[styles.daysNum, { color }]}>{membership.dias_restantes}</Text>
          <Text style={styles.daysLabel}>días restantes</Text>
        </View>
      </View>
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  card: {
    borderRadius:    20,
    padding:         20,
    gap:             10,
    backgroundColor: colors.card,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, gap: 5,
  },
  dot:        { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12 * fs, fontWeight: '600' },
  plan:       { color: colors.text, fontSize: 20 * fs, fontWeight: '700' },
  bottomRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    marginTop:      4,
  },
  miniLabel: { color: colors.textMuted,     fontSize: 11 * fs },
  miniVal:   { color: colors.text,          fontSize: 14 * fs, fontWeight: '600' },
  daysBox:   { alignItems: 'flex-end' },
  daysNum:   { fontSize: 30 * fs, fontWeight: '800', lineHeight: 33 * fs, letterSpacing: -0.5 },
  daysLabel: { color: colors.textMuted,     fontSize: 11 * fs },
});
}
