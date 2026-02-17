/**
 * Servicio de API para el Dashboard del Entrenador
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Obtiene el token de autenticación del localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Headers por defecto para las peticiones
 */
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Manejo de errores de la API
 */
const handleApiError = (error) => {
  if (error.response) {
    // El servidor respondió con un código de estado fuera del rango 2xx
    throw new Error(error.response.data.message || 'Error en la petición');
  } else if (error.request) {
    // La petición fue hecha pero no se recibió respuesta
    throw new Error('No se pudo conectar con el servidor');
  } else {
    // Algo pasó al configurar la petición
    throw new Error('Error al procesar la petición');
  }
};

/**
 * Servicio del Entrenador
 */
export const trainerService = {
  
  /**
   * Obtiene todos los clientes del entrenador con sus estadísticas
   * @returns {Promise} Lista de clientes
   */
  getClients: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trainer/clients`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener clientes');
      }

      const data = await response.json();
      return data.clients;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  /**
   * Obtiene el perfil del entrenador
   * @returns {Promise} Datos del perfil
   */
  getProfile: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trainer/profile`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener perfil');
      }

      const data = await response.json();
      return data.profile;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  /**
   * Actualiza el perfil del entrenador
   * @param {Object} profileData - Datos del perfil a actualizar
   * @returns {Promise} Respuesta de la actualización
   */
  updateProfile: async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trainer/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar perfil');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de un cliente específico
   * @param {number} clientId - ID del cliente
   * @returns {Promise} Historial del cliente
   */
  getClientHistory: async (clientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trainer/clients/${clientId}/history`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener historial');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  /**
   * Actualiza el objetivo de un cliente
   * @param {number} clientId - ID del cliente
   * @param {Object} goalData - Datos del objetivo
   * @returns {Promise} Respuesta de la actualización
   */
  updateClientGoal: async (clientId, goalData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trainer/clients/${clientId}/goal`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(goalData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar objetivo');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas del dashboard del entrenador
   * @returns {Promise} Estadísticas generales
   */
  getDashboardStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trainer/stats`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener estadísticas');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};

export default trainerService;