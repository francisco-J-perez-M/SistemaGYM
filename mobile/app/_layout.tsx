import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';
import { useAccessibilityStore } from '../store/accessibilityStore';
import { useColors } from '../hooks/useColors';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
