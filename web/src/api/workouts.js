import axios from "axios";

const API = axios.create({ baseURL: "/api" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getUserDashboard = () => API.get("/user/dashboard");
export const completeWorkout   = (data) => API.post("/user/workout/complete", data);
export const getWorkouts       = (params = {}) => API.get("/user/workouts", { params });
