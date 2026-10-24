import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, ENDPOINTS } from '../constants/Api';
import type { AuthUser } from '../types';

export interface LoginResponse {
  access_token: string;
  user:         AuthUser;
}

export async function loginRequest(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>(
    `${API_BASE_URL}${ENDPOINTS.LOGIN}`,
    { email, password },
    { timeout: 15_000 }
  );
  return res.data;
}

export async function persistSession(token: string, user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync('access_token', token);
  await SecureStore.setItemAsync('user_data', JSON.stringify(user));
}

export async function loadSession(): Promise<{ token: string; user: AuthUser } | null> {
  const token    = await SecureStore.getItemAsync('access_token');
  const userStr  = await SecureStore.getItemAsync('user_data');
  if (!token || !userStr) return null;
  try {
    return { token, user: JSON.parse(userStr) as AuthUser };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('user_data');
}
