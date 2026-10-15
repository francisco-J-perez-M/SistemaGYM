import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      {/* SCRUM-224: sin gesto de swipe-back -- no es una pantalla de la
          que se pueda "salir" hacia atrás, solo completándola o cerrando
          sesión (botón propio en la pantalla). */}
      <Stack.Screen name="cambiar-password" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
