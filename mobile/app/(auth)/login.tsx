import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useColors, useFontScale } from '../../hooks/useColors';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const colors = useColors();
  const fs = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  const insets          = useSafeAreaInsets();
  const { login, loading, error, clearError } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    clearError();
    await login(email.trim().toLowerCase(), password);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[colors.background, colors.gradientDark[1]]}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Hero */}
          <View style={styles.hero} accessible accessibilityRole="header">
            <LinearGradient
              colors={colors.gradientAccent}
              style={styles.logoBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="barbell" size={40} color={colors.onAccent} />
            </LinearGradient>
            <Text style={styles.appName}>GymPro</Text>
            <Text style={styles.tagline}>Tu gimnasio en tu bolsillo</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar sesión</Text>
            <Text style={styles.cardSub}>Ingresa con tu cuenta del gimnasio</Text>

            {error && (
              <View
                style={styles.errorBox}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="Correo electrónico"
              placeholder="usuario@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              accessibilityLabel="Correo electrónico"
              leftIcon={
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              }
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secure
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Contraseña"
              leftIcon={
                <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              }
            />

            <Button
              label="Entrar"
              onPress={handleLogin}
              loading={loading}
              disabled={!email || !password}
              size="lg"
              style={styles.loginBtn}
              accessibilityLabel="Iniciar sesión"
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotBtn}
              accessibilityRole="button"
              accessibilityLabel="Olvidé mi contraseña"
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Utiliza las mismas credenciales del portal web.{'\n'}
              Contacta al administrador de tu gimnasio si no tienes cuenta.
            </Text>
          </View>

          {/* Footer info */}
          <View style={styles.footer}>
            <View style={styles.featureRow}>
              {FEATURES.map((f) => (
                <View key={f.label} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={f.icon as any} size={18} color={colors.accent} />
                  </View>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const FEATURES = [
  { icon: 'barbell-outline',     label: 'Rutinas' },
  { icon: 'nutrition-outline',   label: 'Nutrición' },
  { icon: 'trending-up-outline', label: 'Progreso' },
  { icon: 'card-outline',        label: 'Membresía' },
];

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
  scroll: {
    flexGrow:       1,
    paddingHorizontal: 24,
    alignItems:     'center',
    gap:            28,
  },
  hero: {
    alignItems: 'center',
    gap:        10,
  },
  logoBox: {
    width:          90,
    height:         90,
    borderRadius:   28,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    colors.accent,
    shadowOffset:   { width: 0, height: 8 },
    shadowOpacity:  0.4,
    shadowRadius:   16,
    elevation:      12,
  },
  appName: {
    color:      colors.text,
    fontSize: 34 * fs,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    color:    colors.textSecondary,
    fontSize: 14 * fs,
  },
  card: {
    width:           '100%',
    backgroundColor: colors.card,
    borderRadius:    24,
    padding:         24,
    borderWidth:     1,
    borderColor:     colors.border,
    gap:             4,
  },
  cardTitle: {
    color:      colors.text,
    fontSize: 22 * fs,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSub: {
    color:        colors.textSecondary,
    fontSize: 13 * fs,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    backgroundColor: colors.errorBg,
    borderRadius:    10,
    padding:         12,
    marginBottom:    12,
    borderWidth:     1,
    borderColor:     colors.error,
  },
  errorText: { color: colors.error, fontSize: 13 * fs, flex: 1 },
  loginBtn:  { marginTop: 8, width: '100%' },
  forgotBtn:  { alignSelf: 'center', paddingVertical: 10 },
  forgotText: { color: colors.accent, fontSize: 13 * fs, fontWeight: '600' },
  hint: {
    color:     colors.textMuted,
    fontSize: 12 * fs,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  footer:     { width: '100%' },
  featureRow: {
    flexDirection:  'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
    gap:        6,
  },
  featureIcon: {
    width:           44,
    height:          44,
    borderRadius:    14,
    backgroundColor: colors.accentBg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  featureLabel: {
    color:    colors.textSecondary,
    fontSize: 11 * fs,
  },
});
}
