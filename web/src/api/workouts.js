import axios from "axios";

const API = axios.create({ baseURL: "/api" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getUserDashboard = () => API.get("/user/dashboard");
export const getUserRoutines   = () => API.get("/user/routines");
// Rutinas que el entrenador asignó al miembro. Viven en otra colección y las
// sirve otro blueprint (prefijo /api/user/training), así que la bitácora tiene
// que pedir las dos listas por separado.
export const getAssignedRoutines = () => API.get("/user/training/assigned-routines");
export const completeWorkout   = (data) => API.post("/user/workout/complete", data);
export const getWorkouts       = (params = {}) => API.get("/user/workouts", { params });
// Trabajo acumulado por grupo muscular, derivado de la bitácora. Es lo que sí
// se deduce de un entrenamiento registrado; las circunferencias corporales no.
export const getMuscleGroupWork = (params = {}) =>
  API.get("/user/workouts/muscle-groups", { params });
