import { useAuthStore } from '../store/authStore';

/** Hook de conveniencia que expone los valores del store de auth. */
export function useAuth() {
  const user      = useAuthStore((s) => s.user);
  const token     = useAuthStore((s) => s.token);
  const loading   = useAuthStore((s) => s.loading);
  const error     = useAuthStore((s) => s.error);
  const login     = useAuthStore((s) => s.login);
  const logout    = useAuthStore((s) => s.logout);
  const hydrate   = useAuthStore((s) => s.hydrate);
  const clearError = useAuthStore((s) => s.clearError);

  const isLoggedIn = !!token && !!user;
  const isMember   = user?.role === 'Miembro' || user?.role === 'user';
  const isTrainer  = user?.role === 'Entrenador';
  const isAdmin    = user?.role === 'owner_gym' || user?.role === 'Admin' || user?.role === 'superadmin';

  return { user, token, loading, error, isLoggedIn, isMember, isTrainer, isAdmin,
           login, logout, hydrate, clearError };
}
