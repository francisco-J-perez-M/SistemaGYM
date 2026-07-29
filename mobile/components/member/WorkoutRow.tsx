import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useFontScale } from '../../hooks/useColors';
import type { Exercise } from '../../types';

interface Props {
  exercise:   Exercise;
  index:      number;
  onToggle?:  (index: number) => void;
}

export default function WorkoutRow({ exercise, index, onToggle }: Props) {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  return (
    <TouchableOpacity
      style={[styles.row, exercise.completed && styles.rowDone]}
      onPress={() => onToggle?.(index)}
      accessibilityRole="checkbox"
      accessibilityLabel={`${exercise.name} — ${exercise.sets}`}
      accessibilityState={{ checked: exercise.completed }}
      activeOpacity={0.7}
    >
      <View style={[styles.check, exercise.completed && styles.checkDone]}>
        {exercise.completed && (
          <Ionicons name="checkmark" size={14} color={colors.onAccent} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, exercise.completed && styles.nameDone]}>
          {exercise.name}
        </Text>
        <Text style={styles.sets}>{exercise.sets}</Text>
      </View>
      <Ionicons
        name="barbell-outline"
        size={18}
        color={exercise.completed ? colors.success : colors.textMuted}
      />
    </TouchableOpacity>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  rowDone: { opacity: 0.65 },
  check: {
    width:           24,
    height:          24,
    borderRadius:    8,
    borderWidth:     2,
    borderColor:     colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  checkDone: {
    backgroundColor: colors.success,
    borderColor:     colors.success,
  },
  info: { flex: 1 },
  name: {
    color:      colors.text,
    fontSize: 14 * fs,
    fontWeight: '600',
  },
  nameDone: {
    textDecorationLine: 'line-through',
    color:              colors.textSecondary,
  },
  sets: {
    color:    colors.accent,
    fontSize: 12 * fs,
    marginTop: 2,
  },
});
}
