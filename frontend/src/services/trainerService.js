const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthToken = () => localStorage.getItem('token');

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

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

  // ─── ESTADÍSTICAS GENERALES ────────────────────────────────────────────────

  getDashboardStats: async () => {
    return await apiFetch(`${API_BASE_URL}/trainer/stats`);
  },

  // ─── AGENDA (SCHEDULE) ─────────────────────────────────────────────────────

  getSchedule: async (weekOffset = 0) => {
    return await apiFetch(
      `${API_BASE_URL}/trainer/schedule?week_offset=${weekOffset}`
    );
  },

  getMembers: async () => {
    const data = await apiFetch(`${API_BASE_URL}/trainer/members`);
    return data.members;
  },

  // ─── SESIONES ──────────────────────────────────────────────────────────────

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

  // ─── BIBLIOTECA DE RUTINAS ─────────────────────────────────────────────────

  /**
   * Lista todas las rutinas del entrenador.
   * @param {Object} params  { category, search }
   */
  getRoutines: async ({ category = 'all', search = '' } = {}) => {
    const params = new URLSearchParams({ category, search });
    const data = await apiFetch(`${API_BASE_URL}/trainer/routines?${params}`);
    return data;
  },

  getRoutineDetail: async (routineId) => {
    const data = await apiFetch(`${API_BASE_URL}/trainer/routines/${routineId}`);
    return data.routine;
  },

  /**
   * Crea una rutina completa.
   * @param {Object} routineData
   * {
   *   name, category, difficulty, duration_minutes, description,
   *   days: [{ day, muscleGroup, exercises: [{ name, sets, reps, peso, notes }] }]
   * }
   */
  createRoutine: async (routineData) => {
    return await apiFetch(`${API_BASE_URL}/trainer/routines`, {
      method: 'POST',
      body: JSON.stringify(routineData),
    });
  },

  updateRoutine: async (routineId, routineData) => {
    return await apiFetch(`${API_BASE_URL}/trainer/routines/${routineId}`, {
      method: 'PUT',
      body: JSON.stringify(routineData),
    });
  },

  deleteRoutine: async (routineId) => {
    return await apiFetch(`${API_BASE_URL}/trainer/routines/${routineId}`, {
      method: 'DELETE',
    });
  },

  duplicateRoutine: async (routineId) => {
    return await apiFetch(`${API_BASE_URL}/trainer/routines/${routineId}/duplicate`, {
      method: 'POST',
    });
  },

  // ─── REPORTES Y ESTADÍSTICAS ───────────────────────────────────────────────

  /**
   * Obtiene todos los datos de reportes para el rango indicado.
   * @param {string} range  week | month | quarter | year
   */
  getReports: async (range = 'month') => {
    const data = await apiFetch(`${API_BASE_URL}/trainer/reports?range=${range}`);
    return data;
  },
};

export default trainerService;