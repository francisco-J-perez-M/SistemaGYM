import { useEffect, Component, type ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';
import { useAccessibilityStore } from '../store/accessibilityStore';
import { useColors } from '../hooks/useColors';
import { darkPalette } from '../constants/themes';
import {
  configureNotificationHandler,
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from '../services/push';

// ── Error boundary para mostrar crash en pantalla en builds de release ────────
interface EBState { error: Error | null }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>Error al iniciar GymPro</Text>
          <ScrollView>
            <Text style={eb.msg}>{this.state.error?.message}</Text>
            <Text style={eb.stack}>{this.state.error?.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
// Esta pantalla se dibuja cuando la app falló al arrancar, momento en el que
// los hooks de tema pueden no estar disponibles. Por eso lee darkPalette
// directamente en vez de useColors(): sigue siendo la misma fuente de color.
const eb = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: darkPalette.background },
  title:     { color: darkPalette.dataRiesgo, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  msg:       { color: darkPalette.text, fontSize: 14, marginBottom: 12 },
  stack:     { color: darkPalette.textMuted, fontSize: 11 },
});

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const colors      = useColors();
  const resolvedTheme = useAccessibilityStore((s) => s.resolvedTheme());
  const reduceMotion  = useAccessibilityStore((s) => s.reduceMotion);
  const token         = useAuthStore((s) => s.token);

  // Push: configurar handler una vez y registrar el token al iniciar sesión.
  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!token) return;
    registerForPushNotificationsAsync();
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, [token]);

  return (
    <>
      {/* backgroundColor se retiró: expo-status-bar dejó de aceptarlo y en
          Android 15 el sistema lo ignora (la barra siempre es transparente).
          El color de los iconos sigue saliendo de la paleta vía `style`. */}
      <StatusBar style={resolvedTheme === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation:   reduceMotion ? 'none' : 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)"    options={{ headerShown: false }} />
        <Stack.Screen name="(member)"  options={{ headerShown: false }} />
        <Stack.Screen name="(trainer)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)"   options={{ headerShown: false }} />
        <Stack.Screen name="(receptionist)" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const hydrate    = useAuthStore((s) => s.hydrate);
  const hydrateA11y = useAccessibilityStore((s) => s.hydrate);

  useEffect(() => {
    // Cargar prefs de accesibilidad y auth en paralelo
    Promise.all([hydrate(), hydrateA11y()]).finally(() => {
      if (typeof (SplashScreen as any).hide === 'function') {
        (SplashScreen as any).hide();
      } else {
        SplashScreen.hideAsync();
      }
    });
  }, [hydrate, hydrateA11y]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
