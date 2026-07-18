/**
 * Recuperar contraseña (móvil) — código de 6 dígitos por correo.
 * Paso 1: pedir correo → /auth/forgot-password.
 * Paso 2: código + nueva contraseña → /auth/reset-password.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useColors, useFontScale } from '../../hooks/useColors';
import { ENDPOINTS } from '../../constants/Api';
import api from '../../services/api';

function errMsg(e: any, fallback: string): string {
  return e?.response?.data?.msg || fallback;
}

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();

  const [step, setStep]       = useState<1 | 2>(1);
  const [email, setEmail]     = useState('');
  const [code, setCode]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');

  const enviarCodigo = async () => {
    if (!email.trim()) return;
    setError(''); setInfo(''); setLoading(true);
    try {
      const res = await api.post(ENDPOINTS.FORGOT_PASSWORD, { email: email.trim().toLowerCase() });
      setInfo(res.data?.msg || 'Si el correo está registrado, te enviamos un código.');
      setStep(2);
    } catch (e) {
      setError(errMsg(e, 'No se pudo solicitar el código.'));
    } finally {
      setLoading(false);
    }
  };

  const restablecer = async () => {
    setError('');
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    try {
      await api.post(ENDPOINTS.RESET_PASSWORD, {
        email: email.trim().toLowerCase(), code: code.trim(), new_password: password,
      });
      router.replace('/(auth)/login');
    } catch (e) {
      setError(errMsg(e, 'No se pudo restablecer la contraseña.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={[colors.background, colors.gradientDark[1]]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={styles.backText}>Volver a iniciar sesión</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.title}>Recuperar contraseña</Text>
            <Text style={styles.sub}>
              {step === 1
                ? 'Ingresa tu correo y te enviaremos un código de 6 dígitos.'
                : 'Revisa tu correo, escribe el código y define tu nueva contraseña.'}
            </Text>

            {!!info && (
              <View style={[styles.msgBox, { backgroundColor: colors.successBg }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                <Text style={[styles.msgText, { color: colors.success }]}>{info}</Text>
              </View>
            )}
            {!!error && (
              <View style={[styles.msgBox, { backgroundColor: colors.errorBg }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={[styles.msgText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            {step === 1 ? (
              <>
                <Input
                  label="Correo electrónico"
                  placeholder="usuario@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
                />
                <Button label="Enviar código" onPress={enviarCodigo} loading={loading}
                  disabled={!email.trim()} size="lg" style={styles.btn} />
              </>
            ) : (
              <>
                <Input
                  label="Código de 6 dígitos"
                  placeholder="______"
                  value={code}
                  onChangeText={(v: string) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  leftIcon={<Ionicons name="keypad-outline" size={18} color={colors.textSecondary} />}
                />
                <Input
                  label="Nueva contraseña"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  secure
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
                />
                <Input
                  label="Confirmar contraseña"
                  placeholder="Repite la contraseña"
                  value={confirm}
                  onChangeText={setConfirm}
                  secure
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
                />
                <Button label="Restablecer contraseña" onPress={restablecer} loading={loading}
                  size="lg" style={styles.btn} />
                <TouchableOpacity onPress={enviarCodigo} disabled={loading} style={styles.resend}>
                  <Text style={styles.resendText}>Reenviar código</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 16, justifyContent: 'center' },
    back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
    backText: { color: colors.textSecondary, fontSize: 13 * fs },
    card: {
      width: '100%', backgroundColor: colors.card, borderRadius: 24, padding: 24,
      borderWidth: 1, borderColor: colors.border, gap: 6,
    },
    title: { color: colors.text, fontSize: 22 * fs, fontWeight: '700' },
    sub:   { color: colors.textSecondary, fontSize: 13 * fs, marginBottom: 10 },
    msgBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12, marginBottom: 6,
    },
    msgText: { fontSize: 13 * fs, flex: 1 },
    btn: { marginTop: 8, width: '100%' },
    resend: { alignSelf: 'center', paddingVertical: 12 },
    resendText: { color: colors.accent, fontSize: 13 * fs, fontWeight: '600' },
  });
}
