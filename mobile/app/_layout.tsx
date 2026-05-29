import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/Colors';

// Mantener splash visible hasta hidratar sesión
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    hydrate().then(() => {
      // expo-splash-screen v31+ usa hide() sync; v0.x usaba hideAsync().
      if (typeof (SplashScreen as any).hide === 'function') {
        (SplashScreen as any).hide();
      } else {
        SplashScreen.hideAsync();
      }
    });
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(auth)"    options={{ headerShown: false }} />
          <Stack.Screen name="(member)"  options={{ headerShown: false }} />
          <Stack.Screen name="(trainer)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)"   options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
