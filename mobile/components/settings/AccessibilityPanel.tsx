/**
 * AccessibilityPanel — panel de ajustes de accesibilidad.
 * Se muestra como modal bottom-sheet desde el drawer o perfil.
 *
 * Opciones:
 *   • Tema:           Oscuro / Claro / Sistema
 *   • Tamaño texto:   Normal / Grande / Muy grande
 *   • Alto contraste: on/off
 *   • Reducir movimiento: on/off
 */
import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Switch, ScrollView, AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibilityStore } from '../../store/accessibilityStore';
import { useColors, useFontScale } from '../../hooks/useColors';
import type { ThemeMode, FontScale } from '../../constants/themes';

interface Props {
  visible:  boolean;
  onClose:  () => void;
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
      {label.toUpperCase()}
    </Text>
  );
}

function OptionRow({
  icon, label, sublabel, onPress, selected, colors, fs,
}: {
  icon: string; label: string; sublabel?: string;
  onPress: () => void; selected: boolean; colors: any; fs: number;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.optionRow,
        { borderColor: colors.border },
        selected && { backgroundColor: colors.accent + '18', borderColor: colors.accent },
      ]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      activeOpacity={0.7}
    >
      <View style={[styles.optionIcon, { backgroundColor: selected ? colors.accent + '22' : colors.card }]}>
        <Ionicons name={icon as any} size={18} color={selected ? colors.accent : colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, { color: colors.text, fontSize: 14 * fs }]}>{label}</Text>
        {sublabel ? (
          <Text style={[styles.optionSub, { color: colors.textSecondary, fontSize: 11 * fs }]}>{sublabel}</Text>
        ) : null}
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
      )}
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon, label, sublabel, value, onValueChange, colors, fs,
}: {
  icon: string; label: string; sublabel?: string;
  value: boolean; onValueChange: (v: boolean) => void; colors: any; fs: number;
}) {
  return (
    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}
          accessibilityRole="switch"
          accessibilityState={{ checked: value }}
          accessibilityLabel={label}>
      <View style={[styles.optionIcon, { backgroundColor: colors.card }]}>
        <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, { color: colors.text, fontSize: 14 * fs }]}>{label}</Text>
        {sublabel ? (
          <Text style={[styles.optionSub, { color: colors.textSecondary, fontSize: 11 * fs }]}>{sublabel}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent + '88' }}
        thumbColor={value ? colors.accent : colors.textMuted}
        accessibilityLabel={label}
      />
    </View>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AccessibilityPanel({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const fs     = useFontScale();

  const theme        = useAccessibilityStore((s) => s.theme);
  const fontScale    = useAccessibilityStore((s) => s.fontScale);
  const highContrast = useAccessibilityStore((s) => s.highContrast);
  const reduceMotion = useAccessibilityStore((s) => s.reduceMotion);

  const setTheme        = useAccessibilityStore((s) => s.setTheme);
  const setFontScale    = useAccessibilityStore((s) => s.setFontScale);
  const setHighContrast = useAccessibilityStore((s) => s.setHighContrast);
  const setReduceMotion = useAccessibilityStore((s) => s.setReduceMotion);

  const themes: { key: ThemeMode; label: string; sub: string; icon: string }[] = [
    { key: 'dark',   label: 'Oscuro',  sub: 'Fondo negro, menos fatiga nocturna', icon: 'moon-outline'     },
    { key: 'light',  label: 'Claro',   sub: 'Fondo blanco, mejor legibilidad',    icon: 'sunny-outline'    },
    { key: 'system', label: 'Sistema', sub: 'Sigue el tema de tu teléfono',       icon: 'phone-portrait-outline' },
  ];

  const fontScales: { key: FontScale; label: string; sub: string }[] = [
    { key: 1,    label: 'Normal',      sub: 'Tamaño predeterminado' },
    { key: 1.15, label: 'Grande',      sub: '+15% — mejor lectura'  },
    { key: 1.3,  label: 'Muy grande',  sub: '+30% — máxima legibilidad' },
  ];

  const handleReduceMotion = (v: boolean) => {
    setReduceMotion(v);
    // Notificar a los lectores de pantalla
    AccessibilityInfo.announceForAccessibility(
      v ? 'Animaciones reducidas activadas' : 'Animaciones reducidas desactivadas'
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Cerrar ajustes"
          accessibilityRole="button"
        />

        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="accessibility-outline" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.title, { color: colors.text, fontSize: 18 * fs }]}>
              Accesibilidad
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.card }]}
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

            {/* ── Tema ───────────────────────────────────────────────────── */}
            <SectionLabel label="Tema de color" colors={colors} />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {themes.map((t) => (
                <OptionRow
                  key={t.key}
                  icon={t.icon}
                  label={t.label}
                  sublabel={t.sub}
                  selected={theme === t.key}
                  onPress={() => setTheme(t.key)}
                  colors={colors}
                  fs={fs}
                />
              ))}
            </View>

            {/* ── Tamaño de texto ─────────────────────────────────────────── */}
            <SectionLabel label="Tamaño de texto" colors={colors} />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {fontScales.map((f) => (
                <OptionRow
                  key={String(f.key)}
                  icon="text-outline"
                  label={f.label}
                  sublabel={f.sub}
                  selected={fontScale === f.key}
                  onPress={() => setFontScale(f.key)}
                  colors={colors}
                  fs={fs}
                />
              ))}
            </View>

            {/* ── Opciones de visibilidad ─────────────────────────────────── */}
            <SectionLabel label="Visibilidad y movimiento" colors={colors} />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ToggleRow
                icon="contrast-outline"
                label="Alto contraste"
                sublabel="Aumenta el contraste entre texto y fondo"
                value={highContrast}
                onValueChange={setHighContrast}
                colors={colors}
                fs={fs}
              />
              <ToggleRow
                icon="pulse-outline"
                label="Reducir animaciones"
                sublabel="Minimiza transiciones y efectos de movimiento"
                value={reduceMotion}
                onValueChange={handleReduceMotion}
                colors={colors}
                fs={fs}
              />
            </View>

            {/* ── Vista previa ────────────────────────────────────────────── */}
            <SectionLabel label="Vista previa" colors={colors} />
            <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.previewTitle, { color: colors.text, fontSize: 16 * fs }]}>
                GymPro
              </Text>
              <Text style={[styles.previewBody, { color: colors.textSecondary, fontSize: 13 * fs }]}>
                Así se verá el texto con tu configuración actual.
              </Text>
              <View style={[styles.previewBadge, { backgroundColor: colors.accent }]}>
                <Text style={[styles.previewBadgeText, { fontSize: 12 * fs }]}>Activo</Text>
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet:    { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  handle:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  headerIcon:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:    { flex: 1, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  content:  { paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginTop: 16, marginBottom: 6 },
  card:     { borderRadius: 16, borderWidth: 1, overflow: 'hidden', gap: 2, padding: 6 },
  optionRow:{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, borderWidth: 1 },
  optionIcon:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionLabel:{ fontWeight: '600' },
  optionSub:  { marginTop: 1 },
  toggleRow:{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1 },
  preview:  { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8, marginBottom: 8 },
  previewTitle: { fontWeight: '700' },
  previewBody:  {},
  previewBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  previewBadgeText: { color: '#fff', fontWeight: '700' },
});
