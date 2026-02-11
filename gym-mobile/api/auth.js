// api/auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔧 CAMBIAR ESTA URL SEGÚN TU ENTORNO
// Para desarrollo con Expo en físico: usa tu IP local (ej: http://192.168.1.100:5000/api)
// Para emulador Android: http://10.0.2.2:5000/api
// Para emulador iOS: http://localhost:5000/api
// Para producción: tu dominio real
const API_URL = 'http://192.168.1.20:5000/api'; // <-- AJUSTAR AQUÍ

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al registrarse');
    }

    return data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const verifyToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Token inválido');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Verify token error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};