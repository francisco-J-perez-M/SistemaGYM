// api/dashboard.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.20:5000/api'; // AJUSTAR TU IP

// Interceptor para incluir token
const fetchWithAuth = async (url, options = {}) => {
  const token = await AsyncStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la petición');
  }

  return response.json();
};

// ================= DASHBOARD KPIs =================
export const getDashboardKPIs = async () => {
  try {
    const data = await fetchWithAuth(`${API_URL}/dashboard/kpis`);
    return data;
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    throw error;
  }
};

// ================= USER DASHBOARD =================
export const getUserDashboard = async () => {
  try {
    const data = await fetchWithAuth(`${API_URL}/user/dashboard`);
    return data;
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    throw error;
  }
};

// ================= CHECKIN =================
export const userCheckin = async () => {
  try {
    const data = await fetchWithAuth(`${API_URL}/user/checkin`, {
      method: 'POST',
    });
    return data;
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
};

// ================= WORKOUT =================
export const completeExercise = async (exerciseName, completed) => {
  try {
    const data = await fetchWithAuth(`${API_URL}/user/workout/complete`, {
      method: 'POST',
      body: JSON.stringify({ exercise_name: exerciseName, completed }),
    });
    return data;
  } catch (error) {
    console.error('Error completing exercise:', error);
    throw error;
  }
};