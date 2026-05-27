/**
 * Cliente HTTP centralizado.
 * - Inyecta Authorization: Bearer <token> en cada request.
 * - Inyecta X-Gym-ID para el tenant multi-gym.
 * - Redirige a login en 401.
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';

let _gymId: number | null = null;
let _onUnauthorized: (() => void) | null = null;

export function configureApi(gymId: number | null, onUnauthorized: () => void) {
  _gymId           = gymId;
  _onUnauthorized  = onUnauthorized;
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — adjuntar JWT y gym tenant
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (_gymId) {
    config.headers['X-Gym-ID'] = String(_gymId);
  }
  return config;
});

// Response interceptor — manejar 401 globalmente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('user_data');
      _onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default api;
