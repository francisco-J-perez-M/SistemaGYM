// screens/RegisterScreen.js
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
import { Ionicons } from '@expo/vector-icons';
import { themes, spacing, fontSizes, borderRadius } from '../Theme';
import { register } from '../api/auth';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    sexo: 'M',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTheme] = useState('dark');
  
  const theme = themes[currentTheme];
  const styles = createStyles(theme);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.nombre || !formData.email || !formData.password) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      Alert.alert(
        'Éxito',
        '¡Cuenta creada! Ahora puedes iniciar sesión.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('Error', error.message || 'Error al registrarse');
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <ImageBackground
            source={{ uri: 'https://img.freepik.com/foto-gratis/entrenamiento-hombre-fuerte-gimnasio_1303-23478.jpg' }}
            style={styles.headerBackground}
            imageStyle={styles.headerImage}
          >
            <LinearGradient
              colors={['rgba(18,18,18,0.5)', 'rgba(18,18,18,0.9)']}
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
                <Ionicons name="fitness" size={40} color={theme.accentColor} />
                <Text style={styles.brandText}>GYM PRO</Text>
                <Text style={styles.brandSubtext}>Transforma tu cuerpo</Text>
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
            <Text style={styles.formTitle}>Crear Cuenta</Text>
            <Text style={styles.formSubtitle}>Únete al equipo GYM PRO</Text>

            {/* Nombre Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre Completo *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Juan Pérez"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.nombre}
                  onChangeText={(text) => handleChange('nombre', text)}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo Electrónico *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.email}
                  onChangeText={(text) => handleChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.password}
                  onChangeText={(text) => handleChange('password', text)}
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

            {/* Teléfono Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="1234-5678"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.telefono}
                  onChangeText={(text) => handleChange('telefono', text)}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Sexo Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sexo</Text>
              <View style={styles.sexoContainer}>
                <TouchableOpacity
                  style={[
                    styles.sexoButton,
                    formData.sexo === 'M' && styles.sexoButtonActive,
                  ]}
                  onPress={() => handleChange('sexo', 'M')}
                  disabled={loading}
                >
                  <Ionicons
                    name="male"
                    size={20}
                    color={formData.sexo === 'M' ? theme.textOnAccent : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.sexoButtonText,
                      formData.sexo === 'M' && styles.sexoButtonTextActive,
                    ]}
                  >
                    Masculino
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sexoButton,
                    formData.sexo === 'F' && styles.sexoButtonActive,
                  ]}
                  onPress={() => handleChange('sexo', 'F')}
                  disabled={loading}
                >
                  <Ionicons
                    name="female"
                    size={20}
                    color={formData.sexo === 'F' ? theme.textOnAccent : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.sexoButtonText,
                      formData.sexo === 'F' && styles.sexoButtonTextActive,
                    ]}
                  >
                    Femenino
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sexoButton,
                    formData.sexo === 'Otro' && styles.sexoButtonActive,
                  ]}
                  onPress={() => handleChange('sexo', 'Otro')}
                  disabled={loading}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color={formData.sexo === 'Otro' ? theme.textOnAccent : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.sexoButtonText,
                      formData.sexo === 'Otro' && styles.sexoButtonTextActive,
                    ]}
                  >
                    Otro
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.textOnAccent} />
              ) : (
                <Text style={styles.registerButtonText}>Completar Registro</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Inicia sesión aquí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
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
    height: 200,
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
    fontSize: 32,
    fontWeight: '900',
    color: theme.accentColor,
    letterSpacing: 2,
    marginTop: 8,
  },
  brandSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    marginTop: -20,
  },
  formCard: {
    backgroundColor: theme.bgCardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: theme.borderDark,
    marginBottom: spacing.xl,
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
  sexoContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sexoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.inputBgDark,
    borderWidth: 1,
    borderColor: theme.borderDark,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  sexoButtonActive: {
    backgroundColor: theme.accentColor,
    borderColor: theme.accentColor,
  },
  sexoButtonText: {
    fontSize: fontSizes.sm,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  sexoButtonTextActive: {
    color: theme.textOnAccent,
  },
  registerButton: {
    backgroundColor: theme.accentColor,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: theme.textOnAccent,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    fontSize: fontSizes.md,
    color: theme.textSecondary,
  },
  loginLink: {
    fontSize: fontSizes.md,
    color: theme.accentColor,
    fontWeight: '600',
  },
});