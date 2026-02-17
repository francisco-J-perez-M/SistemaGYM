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
 * Fetch genérico con manejo de errores y detección de HTML
 */
const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: getHeaders(),
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `El servidor no devolvió JSON (HTTP ${response.status}). ` +
      `Verifica el proxy en package.json → "proxy": "http://localhost:5000". ` +
      `Respuesta: ${text.slice(0, 100)}`
    );
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Error en la petición');
  }
  return data;
};

/**
 * Servicio del Entrenador
 */
export const trainerService = {

  // ─── CLIENTES ──────────────────────────────────────────────────────────────

  getClients: async () => {
    const data = await apiFetch(`${API_BASE_URL}/trainer/clients`);
    return data.clients;
  },

  getClientHistory: async (clientId) => {
    return await apiFetch(`${API_BASE_URL}/trainer/clients/${clientId}/history`);
  },

  updateClientGoal: async (clientId, goalData) => {
    return await apiFetch(`${API_BASE_URL}/trainer/clients/${clientId}/goal`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    });
  },

  // ─── PERFIL ────────────────────────────────────────────────────────────────

  getProfile: async () => {
    const data = await apiFetch(`${API_BASE_URL}/trainer/profile`);
    return data.profile;
  },

  updateProfile: async (profileData) => {
    return await apiFetch(`${API_BASE_URL}/trainer/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // ─── ESTADÍSTICAS ──────────────────────────────────────────────────────────

  getDashboardStats: async () => {
    return await apiFetch(`${API_BASE_URL}/trainer/stats`);
  },

  // ─── AGENDA (SCHEDULE) ─────────────────────────────────────────────────────

  /**
   * Obtiene la agenda semanal agrupada por día
   * @param {number} weekOffset  0 = semana actual, -1 = anterior, 1 = siguiente
   */
  getSchedule: async (weekOffset = 0) => {
    return await apiFetch(
      `${API_BASE_URL}/trainer/schedule?week_offset=${weekOffset}`
    );
  },

  /**
   * Lista de miembros activos del entrenador (para selector en formularios)
   */
  getMembers: async () => {
    const data = await apiFetch(`${API_BASE_URL}/trainer/members`);
    return data.members;
  },

  // ─── SESIONES ──────────────────────────────────────────────────────────────

  /**
   * Historial de sesiones con filtros
   * @param {Object} params  { status, range, page, per_page }
   */
  getSessions: async ({ status = 'all', range = 'week', page = 1, per_page = 20 } = {}) => {
    return await apiFetch(
      `${API_BASE_URL}/trainer/sessions?status=${status}&range=${range}&page=${page}&per_page=${per_page}`
    );
  },

  getSessionDetail: async (sessionId) => {
    return await apiFetch(`${API_BASE_URL}/trainer/sessions/${sessionId}`);
  },

  createSession: async (sessionData) => {
    return await apiFetch(`${API_BASE_URL}/trainer/sessions`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  updateSession: async (sessionId, sessionData) => {
    return await apiFetch(`${API_BASE_URL}/trainer/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  },

  updateSessionStatus: async (sessionId, newStatus) => {
    return await apiFetch(`${API_BASE_URL}/trainer/sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  },

  deleteSession: async (sessionId) => {
    return await apiFetch(`${API_BASE_URL}/trainer/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },
};

export default trainerService;