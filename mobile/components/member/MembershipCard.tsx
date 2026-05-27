import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { Membership } from '../../types';

interface Props { membership: Membership | null }

export default function MembershipCard({ membership }: Props) {
  if (!membership) return null;

  const isUrgent = membership.dias_restantes <= 7;
  const color    = isUrgent ? Colors.warning : Colors.success;

  return (
    <LinearGradient
      colors={['#1e1b4b', '#312e81']}
      style={styles.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="card-outline" size={20} color={Colors.accent} />
        </View>
        <View
          style={[styles.statusPill, { backgroundColor: isUrgent ? Colors.warningBg : Colors.successBg }]}
          accessibilityRole="text"
          accessibilityLabel={`Estado: ${membership.estado}`}
        >
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.statusText, { color }]}>
            {isUrgent ? 'Por vencer' : 'Activa'}
          </Text>
        </View>
      </View>

      <Text style={styles.plan}>{membership.plan}</Text>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.miniLabel}>Vence</Text>
          <Text style={styles.miniVal}>{membership.fecha_fin}</Text>
        </View>
        <View style={styles.daysBox}>
          <Text style={[styles.daysNum, { color }]}>{membership.dias_restantes}</Text>
          <Text style={styles.daysLabel}>días restantes</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding:      20,
    gap:          10,
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  iconWrap: {
    width:  36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(108,99,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:  20,
    gap:           5,
  },
  dot:        { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  plan: {
    color:      '#fff',
    fontSize:   20,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    marginTop:      4,
  },
  miniLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  miniVal:   { color: 'rgba(255,255,255,0.9)',  fontSize: 14, fontWeight: '600' },
  daysBox:   { alignItems: 'flex-end' },
  daysNum:   { fontSize: 28, fontWeight: '800', lineHeight: 30 },
  daysLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
});
