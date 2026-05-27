import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { Exercise } from '../../types';

interface Props {
  exercise:   Exercise;
  index:      number;
  onToggle?:  (index: number) => void;
}

export default function WorkoutRow({ exercise, index, onToggle }: Props) {
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
          <Ionicons name="checkmark" size={14} color="#fff" />
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
        color={exercise.completed ? Colors.success : Colors.textMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  rowDone: { opacity: 0.65 },
  check: {
    width:           24,
    height:          24,
    borderRadius:    8,
    borderWidth:     2,
    borderColor:     Colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  checkDone: {
    backgroundColor: Colors.success,
    borderColor:     Colors.success,
  },
  info: { flex: 1 },
  name: {
    color:      Colors.text,
    fontSize:   14,
    fontWeight: '600',
  },
  nameDone: {
    textDecorationLine: 'line-through',
    color:              Colors.textSecondary,
  },
  sets: {
    color:    Colors.accent,
    fontSize: 12,
    marginTop: 2,
  },
});
