import { create } from 'zustand';
import { router } from 'expo-router';
import {
  loginRequest, persistSession, loadSession, clearSession, refrescarSesion,
} from '../services/auth';
import { configureApi } from '../services/api';
import type { AuthUser } from '../types';

interface AuthStore {
  user:      AuthUser | null;
  token:     string | null;
  loading:   boolean;
  error:     string | null;

  // Actions
  login:     (email: string, password: string) => Promise<void>;
  logout:    () => Promise<void>;
  hydrate:   () => Promise<void>;
  clearError: () => void;
}

function resolveHomeRoute(role: string): string {
  switch (role) {
    case 'Miembro':
    case 'user':
      return '/(member)/';
    case 'Entrenador':
      return '/(trainer)/';
    case 'Recepcionista':
    case 'recepcionista':
      return '/(receptionist)/';
    case 'owner_gym':
    case 'Admin':
    case 'superadmin':
      return '/(admin)/';
    default:
      return '/(member)/';
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user:    null,
  token:   null,
  loading: false,
  error:   null,

  clearError: () => set({ error: null }),

  /**
   * Restaura la sesión al abrir la aplicación.
   *
   * Si hay sesión guardada se entra directo, sin pedir credenciales. Cuando el
   * access token ya caducó (más de 8 horas sin abrir la app), se renueva en
   * silencio con el token de refresco antes de continuar; solo si ese también
   * expiró —90 días— se manda a la pantalla de acceso.
   */
  hydrate: async () => {
    set({ loading: true });
    try {
      const session = await loadSession();
      if (session) {
        const { token, user } = session;
        configureApi(user.id_gimnasio, get().logout);
        set({ user, token, loading: false });
        router.replace(resolveHomeRoute(user.role) as any);

        // Renovación oportunista: no bloquea la entrada. Si el token seguía
        // vigente no cambia nada, y si estaba por caducar la primera petición
        // ya sale con uno fresco.
        refrescarSesion().then((r) => {
          if (r) set({ token: r.token, user: r.user ?? get().user });
        });
        return;
      }

      set({ loading: false });
      router.replace('/(auth)/login');
    } catch {
      set({ loading: false });
      router.replace('/(auth)/login');
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { access_token, refresh_token, user } = await loginRequest(email, password);
      await persistSession(access_token, user, refresh_token);
      configureApi(user.id_gimnasio, get().logout);
      set({ user, token: access_token, loading: false });
      router.replace(resolveHomeRoute(user.role) as any);
    } catch (err: any) {
      const msg =
        err?.response?.data?.msg ??
        err?.response?.data?.error ??
        'Error al iniciar sesión';
      set({ loading: false, error: msg });
    }
  },

  logout: async () => {
    await clearSession();
    set({ user: null, token: null });
    router.replace('/(auth)/login');
  },
}));
