/**
 * Cambio de contraseña obligatorio en el primer ingreso (SCRUM-224).
 *
 * A dónde se llega: store/authStore.ts manda aquí desde login() e hydrate()
 * -- en vez de al panel normal -- cuando `user.debe_cambiar_password` es
 * true: la contraseña actual la generó el sistema (cuenta nueva) o la
 * reseteó un administrador, nunca la elegió esta persona (ver
 * api/app/utils/credenciales_acceso.py y el mismo criterio ya aplicado en
 * el portal web, CambiarPasswordInicial.jsx).
 *
 * No hay forma de "saltarse" esta pantalla desde aquí: _layout.tsx la
 * registra sin gesto de swipe-back, y solo se sale completando el cambio o
 * cerrando sesión -- lo que de todas formas vuelve a traer aquí al volver
 * a entrar, porque la bandera sigue en el servidor hasta que se cambie.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useColors, useFontScale } from '../../hooks/useColors';
import { useAuth } from '../../hooks/useAuth';

export default function CambiarPasswordScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { cambiarPasswordInicial, loading, error, clearError, logout } = useAuth();

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async () => {
    setLocalError('');
    clearError();
    if (password.length < 8) { setLocalError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm) { setLocalError('Las contraseñas no coinciden.'); return; }
    await cambiarPasswordInicial(password);
  };

  const mensajeError = localError || error;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={[colors.background, colors.gradientDark[1]]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero} accessible accessibilityRole="header">
            <View style={styles.iconBadge}>
              <Ionicons name="shield-checkmark-outline" size={32} color={colors.accent} />
            </View>
            <Text style={styles.title}>Asegura tu cuenta</Text>
            <Text style={styles.sub}>
              Te dimos acceso con una contraseña temporal. Antes de continuar, define una
              propia -- es la única vez que te la pediremos así.
            </Text>
          </View>

          <View style={styles.card}>
            {!!mensajeError && (
              <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{mensajeError}</Text>
              </View>
            )}

            <Input
              label="Nueva contraseña"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={setPassword}
              secure
              returnKeyType="next"
              accessibilityLabel="Nueva contraseña"
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
            />
            <Input
              label="Confirmar contraseña"
              placeholder="Repite la contraseña"
              value={confirm}
              onChangeText={setConfirm}
              secure
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              accessibilityLabel="Confirmar contraseña"
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
            />

            <Button
              label="Guardar y continuar"
              onPress={handleSubmit}
              loading={loading}
              disabled={!password || !confirm}
              size="lg"
              style={styles.btn}
              accessibilityLabel="Guardar nueva contraseña"
            />

            <TouchableOpacity
              onPress={logout}
              style={styles.logoutBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
            >
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    scroll: { flexGrow: 1, paddingHorizontal: 24, alignItems: 'center', gap: 24 },
    hero: { alignItems: 'center', gap: 10 },
    iconBadge: {
      width: 64, height: 64, borderRadius: 20, backgroundColor: colors.accentBg,
      alignItems: 'center', justifyContent: 'center',
    },
    title: { color: colors.text, fontSize: 22 * fs, fontWeight: '700', textAlign: 'center' },
    sub: {
      color: colors.textSecondary, fontSize: 13 * fs, textAlign: 'center',
      lineHeight: 19, paddingHorizontal: 8,
    },
    card: {
      width: '100%', backgroundColor: colors.card, borderRadius: 24, padding: 24,
      borderWidth: 1, borderColor: colors.border, gap: 10,
    },
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.errorBg,
      borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.error,
    },
    errorText: { color: colors.error, fontSize: 13 * fs, flex: 1 },
    btn: { marginTop: 8, width: '100%' },
    logoutBtn: { alignSelf: 'center', paddingVertical: 10 },
    logoutText: { color: colors.textSecondary, fontSize: 13 * fs, fontWeight: '600' },
  });
}
