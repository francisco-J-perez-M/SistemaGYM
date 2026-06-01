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

// ── Error boundary para mostrar crash en pantalla en builds de release ────────
interface EBState { error: Error | null }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>🚨 Error al iniciar GymPro</Text>
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
const eb = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#0f0f1a' },
  title:     { color: '#ff4444', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  msg:       { color: '#fff', fontSize: 14, marginBottom: 12 },
  stack:     { color: '#aaa', fontSize: 11 },
});

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const colors      = useColors();
  const resolvedTheme = useAccessibilityStore((s) => s.resolvedTheme());
  const reduceMotion  = useAccessibilityStore((s) => s.reduceMotion);

  return (
    <>
      <StatusBar
        style={resolvedTheme === 'light' ? 'dark' : 'light'}
        backgroundColor={colors.background}
      />
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
