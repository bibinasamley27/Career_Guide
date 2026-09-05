import { create } from 'zustand';
import { ApiError, authApi, AuthUser } from '../lib/api';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  initialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  initialized: false,
  error: null,
  initialize: async () => {
    try {
      const { user } = await authApi.me();
      set({ user, error: null });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        set({ error: 'Unable to restore your session.' });
      }
      set({ user: null });
    } finally {
      set({ isLoading: false, initialized: true });
    }
  },
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authApi.login({ email, password });
      set({ user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authApi.register({ name, email, password });
      set({ user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create your account.';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },
  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.logout();
    } finally {
      set({ user: null, isLoading: false });
    }
  },
  clearError: () => set({ error: null }),
}));
