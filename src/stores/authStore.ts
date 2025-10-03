import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, CreateUserInput } from '@/types';
import { createCookieStorage } from '@/lib/storage';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: CreateUserInput) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearLoading: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  updateAvatar: (avatarUrl: string) => void;
  fetchProfile: () => Promise<void>;
  debugTokens: () => AuthTokens | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            const error = new Error(data.error || 'Ошибка входа');
            (error as any).data = data.data; // Добавляем данные ошибки
            throw error;
          }

          const { user, tokens } = data.data;

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Ошибка входа',
          });
          
          // Если ошибка содержит данные о необходимости верификации, пробрасываем их
          if (error.data?.requiresVerification) {
            throw error;
          }
        }
      },

      register: async (userData: CreateUserInput) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Ошибка регистрации');
          }

          // Оставляем loading активным до перехода на ConfirmForm
          set({
            error: null,
            // isLoading остается true
          });

          return true; // Успешная регистрация
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Ошибка регистрации',
          });
          return false; // Ошибка регистрации
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Очищаем состояние sidebar при выходе
          try {
            localStorage.removeItem('gigross-sidebar-state');
          } catch (error) {
            console.error('Error clearing sidebar state:', error);
          }
          
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      refreshToken: async () => {
        try {
          const { tokens } = get();
          if (!tokens?.refreshToken) {
            throw new Error('No refresh token available');
          }

          console.log('Refreshing token with refreshToken:', tokens.refreshToken.substring(0, 20) + '...');

          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refreshToken: tokens.refreshToken,
            }),
          });

          console.log('Refresh response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Refresh failed:', errorData);
            throw new Error(errorData.error || 'Failed to refresh token');
          }

          const data = await response.json();
          console.log('Refresh successful, new access token:', data.data?.accessToken ? data.data.accessToken.substring(0, 20) + '...' : 'No token');
          
          const { accessToken } = data.data;

          set(state => ({
            tokens: state.tokens ? { ...state.tokens, accessToken } : null,
          }));
        } catch (error) {
          console.error('Token refresh error:', error);
          // Если не удалось обновить токен, выходим из системы
          get().logout();
        }
      },

      updateProfile: async (profileData: Partial<User>) => {
        const { tokens } = get();
        if (!tokens) {
          throw new Error('No access token');
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens.accessToken}`,
            },
            body: JSON.stringify(profileData),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Ошибка обновления профиля');
          }

          set({
            user: data.data,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Ошибка обновления профиля',
          });
          throw error;
        }
      },

      updateAvatar: (avatarUrl: string) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              profile: {
                ...user.profile,
                avatar: avatarUrl,
              },
            },
          });
        }
      },

      debugTokens: () => {
        const state = get();
        console.log('Auth Store Debug:', {
          hasTokens: !!state.tokens,
          accessToken: state.tokens?.accessToken ? state.tokens.accessToken.substring(0, 20) + '...' : 'No access token',
          refreshToken: state.tokens?.refreshToken ? state.tokens.refreshToken.substring(0, 20) + '...' : 'No refresh token',
          isAuthenticated: state.isAuthenticated,
          hasUser: !!state.user,
        });
        console.log('Full tokens object:', state.tokens);
        return state.tokens;
      },

      fetchProfile: async () => {
        const { tokens } = get();
        if (!tokens) {
          throw new Error('No access token');
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/users/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Ошибка получения профиля');
          }

          set({
            user: data.data,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Ошибка получения профиля',
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setUser: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true,
          error: null 
        });
      },

      setTokens: (tokens: AuthTokens) => {
        set({ tokens });
      },

      clearLoading: () => {
        set({ isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createCookieStorage<AuthState>(),
    }
  )
);
