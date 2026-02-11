// screens/LoginScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { themes, globalStyles, spacing, fontSizes, borderRadius } from '../Theme';
import { login } from '../api/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTheme, setCurrentTheme] = useState('dark');
  
  const theme = themes[currentTheme];
  const styles = createStyles(theme);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 [LOGIN] Intentando login...');
      const result = await login(email, password);
      
      console.log('✅ [LOGIN] Respuesta del servidor:', result);
      
      // Guardar token
      await AsyncStorage.setItem('token', result.access_token);

      // Preparar datos del usuario
      const userData = {
        id: result.user.id,
        nombre: result.user.nombre,
        email: result.user.email,
        role: result.user.role,
        access_level: result.user.access_level || 'basico',
        membership_plan: result.user.membership_plan || 'Sin Plan',
        peso_inicial: result.user.peso_inicial,
        perfil_completo: result.user.perfil_completo,
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('✅ [LOGIN] Usuario guardado:', userData);

      // Verificar perfil completo
      if ((userData.role === 'Miembro' || userData.role === 'user') && !userData.peso_inicial) {
        console.warn('⚠️ [LOGIN] Falta peso inicial');
        navigation.replace('CompleteProfile');
        return;
      }

      // Redirección según rol
      const userRole = userData.role;
      
      if (userRole === 'Administrador' || userRole === 'admin') {
        navigation.replace('AdminDashboard');
      } else if (userRole === 'Entrenador' || userRole === 'trainer') {
        navigation.replace('TrainerDashboard');
      } else if (userRole === 'Recepcionista' || userRole === 'receptionist') {
        navigation.replace('ReceptionistDashboard');
      } else {
        navigation.replace('UserDashboard');
      }

    } catch (err) {
      console.error('❌ [LOGIN] Error:', err);
      setError(err.message || 'Error al conectar con el servidor');
      Alert.alert('Error', err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header con imagen de fondo */}
        <View style={styles.headerSection}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48' }}
            style={styles.headerBackground}
            imageStyle={styles.headerImage}
          >
            <LinearGradient
              colors={['rgba(18,18,18,0.7)', 'rgba(18,18,18,0.95)']}
              style={styles.headerGradient}
            >
              <Animated.View
                style={[
                  styles.brandContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Ionicons name="fitness" size={50} color={theme.accentColor} />
                <Text style={styles.brandText}>GYM PRO</Text>
                <Text style={styles.brandSubtext}>Supera tus límites</Text>
              </Animated.View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Formulario */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Iniciar Sesión</Text>
            <Text style={styles.formSubtitle}>Bienvenido de nuevo</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <Animated.View
                style={styles.errorContainer}
                entering="fadeIn"
              >
                <Ionicons name="alert-circle" size={20} color={theme.dangerColor} />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.textOnAccent} />
              ) : (
                <Text style={styles.loginButtonText}>Ingresar al sistema</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Regístrate aquí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Theme Selector (Opcional) */}
        <View style={styles.themeSelector}>
          <TouchableOpacity
            style={styles.themeButton}
            onPress={() => {
              const themes = ['dark', 'light', 'forest', 'nebula'];
              const currentIndex = themes.indexOf(currentTheme);
              const nextIndex = (currentIndex + 1) % themes.length;
              setCurrentTheme(themes[nextIndex]);
            }}
          >
            <Ionicons name="color-palette-outline" size={20} color={theme.textSecondary} />
            <Text style={styles.themeButtonText}>Cambiar tema</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bgMainDark,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    height: 250,
  },
  headerBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    resizeMode: 'cover',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandText: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.accentColor,
    letterSpacing: 3,
    marginTop: 10,
  },
  brandSubtext: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    marginTop: -30,
  },
  formCard: {
    backgroundColor: theme.bgCardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: theme.borderDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: fontSizes.md,
    color: theme.textSecondary,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBgDark,
    borderWidth: 1,
    borderColor: theme.borderDark,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSizes.md,
    color: theme.textPrimary,
  },
  passwordInput: {
    paddingRight: spacing.xl,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.dangerColor}15`,
    borderWidth: 1,
    borderColor: theme.dangerColor,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSizes.sm,
    color: theme.dangerColor,
  },
  loginButton: {
    backgroundColor: theme.accentColor,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    shadowColor: theme.accentColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: theme.textOnAccent,
    letterSpacing: 0.5,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  registerText: {
    fontSize: fontSizes.md,
    color: theme.textSecondary,
  },
  registerLink: {
    fontSize: fontSizes.md,
    color: theme.accentColor,
    fontWeight: '600',
  },
  themeSelector: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: theme.bgCardDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.borderDark,
  },
  themeButtonText: {
    marginLeft: spacing.sm,
    fontSize: fontSizes.sm,
    color: theme.textSecondary,
    fontWeight: '600',
  },
});