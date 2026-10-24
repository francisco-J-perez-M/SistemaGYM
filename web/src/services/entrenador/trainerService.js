const API_BASE_URL = '/api';

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
      `Verifica la configuración de nginx proxy. ` +
      `Respuesta: ${text.slice(0, 100)}`
    );
  }

  const data = await response.json();
  if (!response.ok) {
    // 401 — sesión expirada o token inválido (Flask-JWT devuelve {"msg": "..."})
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
    // Flask-JWT usa "msg", el resto del API usa "error" o "message"
    throw new Error(data.error || data.message || data.msg || 'Error en la petición');
  }
  return data;
};

export const trainerService = {

  // ─── CLIENTES ──────────────────────────────────────────────────────────────

  getClients: async (page = 1, searchTerm = '', filterStatus = 'all') => {
    const params = new URLSearchParams({
      page,
      search: searchTerm,
      status: filterStatus
    });
    const data = await apiFetch(`${API_BASE_URL}/trainer/clients?${params}`);
    return data; // Debe devolver { clients, pagination: { total_pages } }
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

  uploadCertFile: async (file) => {
    const token = localStorage.getItem('token');
    const form  = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE_URL}/trainer/profile/cert-upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al subir archivo');
    return data; // { success, url }
  },

  // ─── DIETAS ────────────────────────────────────────────────────────────────

  getDiets: async () => {
    const data = await apiFetch(`${API_BASE_URL}/trainer/diets`);
    return data.diets || [];
  },

  createDiet: async (dietData) => {
    return await apiFetch(`${API_BASE_URL}/trainer/diets`, {
      method: 'POST',
      body: JSON.stringify(dietData),
    });
  },

  updateDiet: async (id, dietData) => {
    return await apiFetch(`${API_BASE_URL}/trainer/diets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dietData),
    });
  },

  deleteDiet: async (id) => {
    return await apiFetch(`${API_BASE_URL}/trainer/diets/${id}`, { method: 'DELETE' });
  },

  bulkDeleteDiets: async (ids) => {
    return await apiFetch(`${API_BASE_URL}/trainer/diets/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  assignDiet: async (id, id_miembro_pg) => {
    return await apiFetch(`${API_BASE_URL}/trainer/diets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ id_miembro_pg }),
    });
  },

  // ─── RECETAS ───────────────────────────────────────────────────────────────

  getRecipes: async () => {
    const data = await apiFetch(`${API_BASE_URL}/trainer/recipes`);
    return data.recipes || [];
  },

  createRecipe: async (recipeData) => {
    return await apiFetch(`${API_BASE_URL}/trainer/recipes`, {
      method: 'POST',
      body: JSON.stringify(recipeData),
    });
  },

  updateRecipe: async (id, recipeData) => {
    return await apiFetch(`${API_BASE_URL}/trainer/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipeData),
    });
  },

  deleteRecipe: async (id) => {
    return await apiFetch(`${API_BASE_URL}/trainer/recipes/${id}`, { method: 'DELETE' });
  },

  bulkDeleteRecipes: async (ids) => {
    return await apiFetch(`${API_BASE_URL}/trainer/recipes/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  // ─── AI ETL — Importar plan alimenticio (LLM local vía Ollama) ───────────

  /**
   * Verifica que el servicio Ollama esté activo y el modelo descargado.
   * Devuelve { disponible, modelo_activo, modelo, modelos[] }
   */
  getAIStatus: async () => {
    return await apiFetch(`${API_BASE_URL}/trainer/diets/ai-status`);
  },

  importDietAI: async (file) => {
    const token = localStorage.getItem('token');
    const form  = new FormData();
    form.append('archivo', file);
    const res = await fetch(`${API_BASE_URL}/trainer/diets/import-ai`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      throw new Error(data.error || data.message || data.msg || 'Error en la importación');
    }
    return data;
  },

  /**
   * Persiste el plan + recetas extraídos por IA.
   * @param {Object} plan        Estructura de dieta v2
   * @param {Array}  recetas     Lista de recetas a crear en la biblioteca
   * @param {Object} [opts]      { id_miembro_pg, nombre_plan, archivo }
   */
  confirmDietImport: async (plan, recetas, opts = {}) => {
    return await apiFetch(`${API_BASE_URL}/trainer/diets/confirm-import`, {
      method: 'POST',
      body: JSON.stringify({
        plan,
        recetas,
        id_miembro_pg: opts.id_miembro_pg || null,
        nombre_plan:   opts.nombre_plan   || null,
        archivo:       opts.archivo       || null,
      }),
    });
  },

  // ─── DASHBOARD ─────────────────────────────────────────────────────────────

  getDashboard: async () => {
    return await apiFetch(`${API_BASE_URL}/trainer/dashboard`);
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
    return await apiFetch(`${API_BASE_URL}/trainer/routines/${routineId}`, { method: 'DELETE' });
  },

  duplicateRoutine: async (routineId) => {
    return await apiFetch(`${API_BASE_URL}/trainer/routines/${routineId}/duplicate`, {
      method: 'POST',
    });
  },

  // ─── REPORTES Y ESTADÍSTICAS ───────────────────────────────────────────────

  getReports: async (range = 'month') => {
    const data = await apiFetch(`${API_BASE_URL}/trainer/reports?range=${range}`);
    return data;
  },

  // ─── BIBLIOTECA DE EJERCICIOS ──────────────────────────────────────────────

  getExercises: async ({ search = '', grupo_muscular = '' } = {}) => {
    const params = new URLSearchParams({ search, grupo_muscular });
    return await apiFetch(`${API_BASE_URL}/trainer/exercises?${params}`);
  },

  createExercise: async (data) => {
    return await apiFetch(`${API_BASE_URL}/trainer/exercises`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateExercise: async (id, data) => {
    return await apiFetch(`${API_BASE_URL}/trainer/exercises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteExercise: async (id) => {
    return await apiFetch(`${API_BASE_URL}/trainer/exercises/${id}`, {
      method: 'DELETE',
    });
  },

  // Borrado masivo: no existe endpoint bulk en el backend, así que se
  // eliminan en paralelo. Devuelve { ok, fail } con los conteos.
  bulkDeleteExercises: async (ids = []) => {
    const results = await Promise.allSettled(
      ids.map((id) => trainerService.deleteExercise(id))
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    return { ok, fail: results.length - ok };
  },

  // ─── AI ETL — Importar rutinas/ejercicios (LLM local vía Ollama) ──────────

  /**
   * Verifica disponibilidad de Ollama para el módulo de rutinas.
   * Devuelve { disponible, modelo_activo, modelo, modelos[] }
   */
  getRoutineAIStatus: async () => {
    return await apiFetch(`${API_BASE_URL}/trainer/routines/ai-status`);
  },

  /**
   * Sube un PDF/Excel y extrae rutinas + ejercicios con Ollama.
   * Devuelve { success, rutinas[], ejercicios[], resumen }
   */
  importRoutinesAI: async (file) => {
    const token = localStorage.getItem('token');
    const form  = new FormData();
    form.append('archivo', file);
    const res = await fetch(`${API_BASE_URL}/trainer/routines/import-ai`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    form,
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      throw new Error(data.error || data.message || data.msg || 'Error en la importación');
    }
    return data;
  },
};

export default trainerService;