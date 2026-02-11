// navigation/AppNavigator.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import UserDashboardScreen from '../screens/UserDashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import TrainerDashboardScreen from '../screens/TrainerDashboardScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        
        // Verificar si falta peso inicial
        if ((user.role === 'Miembro' || user.role === 'user') && !user.peso_inicial) {
          setInitialRoute('CompleteProfile');
        } else {
          // Determinar ruta según rol
          if (user.role === 'Administrador' || user.role === 'admin') {
            setInitialRoute('AdminDashboard');
          } else if (user.role === 'Entrenador' || user.role === 'trainer') {
            setInitialRoute('TrainerDashboard');
          } else if (user.role === 'Recepcionista' || user.role === 'receptionist') {
            setInitialRoute('ReceptionistDashboard');
          } else {
            setInitialRoute('UserDashboard');
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#fbe379" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Pantallas públicas */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Pantallas de usuario */}
        <Stack.Screen name="UserDashboard" component={UserDashboardScreen} />
        <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        
        {/* Pantallas de admin */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        
        {/* Pantallas de entrenador */}
        <Stack.Screen name="TrainerDashboard" component={TrainerDashboardScreen} />
        
        {/* Agregar más pantallas según necesites */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}