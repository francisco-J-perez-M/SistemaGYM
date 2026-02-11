// api/miembros.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://192.168.1.20:5000'; // AJUSTAR TU IP
const API_URL = `${BASE_URL}/api`;

// Interceptor para incluir token
const fetchWithAuth = async (url, options = {}) => {
  const token = await AsyncStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };

  // No agregar Content-Type si es FormData (para uploads)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'Error en la petición');
  }

  return response.json();
};

// ================= MIEMBROS =================

// GET - Obtener miembros con paginación y búsqueda
export const getMiembros = async (page = 1, mostrarInactivos = false, search = '') => {
  try {
    const url = `${API_URL}/miembros?page=${page}&inactivos=${mostrarInactivos}&search=${encodeURIComponent(search)}`;
    const data = await fetchWithAuth(url);
    return { data };
  } catch (error) {
    console.error('Error fetching miembros:', error);
    throw error;
  }
};

// GET - Obtener un miembro específico
export const getMiembroById = async (id) => {
  try {
    const data = await fetchWithAuth(`${API_URL}/miembros/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching miembro:', error);
    throw error;
  }
};

// POST - Crear nuevo miembro (con foto)
export const createMiembro = async (formData) => {
  try {
    const data = await fetchWithAuth(`${API_URL}/miembros`, {
      method: 'POST',
      body: formData, // FormData
    });
    return data;
  } catch (error) {
    console.error('Error creating miembro:', error);
    throw error;
  }
};

// PUT - Actualizar miembro (con foto)
export const updateMiembro = async (id, formData) => {
  try {
    const data = await fetchWithAuth(`${API_URL}/miembros/${id}`, {
      method: 'PUT',
      body: formData, // FormData
    });
    return data;
  } catch (error) {
    console.error('Error updating miembro:', error);
    throw error;
  }
};

// DELETE - Desactivar miembro
export const deleteMiembro = async (id) => {
  try {
    const data = await fetchWithAuth(`${API_URL}/miembros/${id}`, {
      method: 'DELETE',
    });
    return data;
  } catch (error) {
    console.error('Error deleting miembro:', error);
    throw error;
  }
};

// PUT - Reactivar miembro
export const reactivateMiembro = async (id) => {
  try {
    const data = await fetchWithAuth(`${API_URL}/miembros/${id}/reactivar`, {
      method: 'PUT',
    });
    return data;
  } catch (error) {
    console.error('Error reactivating miembro:', error);
    throw error;
  }
};

// ================= MEMBRESÍAS =================

// GET - Membresías por expirar
export const getMembresiasPorExpirar = async (dias = 7) => {
  try {
    const data = await fetchWithAuth(`${API_URL}/miembros/membresias/por-expirar?dias=${dias}`);
    return data;
  } catch (error) {
    console.error('Error fetching expiring memberships:', error);
    throw error;
  }
};

// POST - Asignar membresía a miembro
export const asignarMembresia = async (miembroId, membresiaData) => {
  try {
    const data = await fetchWithAuth(`${API_URL}/miembros/${miembroId}/membresia`, {
      method: 'POST',
      body: JSON.stringify(membresiaData),
    });
    return data;
  } catch (error) {
    console.error('Error assigning membership:', error);
    throw error;
  }
};