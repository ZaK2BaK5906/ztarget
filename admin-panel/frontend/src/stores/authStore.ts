import { create } from 'zustand';
import { authApi } from '@/lib/api';
import type { Admin } from '@/types';

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<void>;
  setAdmin: (admin: Admin) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem('token', data.token);
      set({
        admin: data.admin,
        token: data.token,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      admin: null,
      token: null,
      isAuthenticated: false
    });
  },

  verifyToken: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const { data } = await authApi.verify();
      set({
        admin: data.admin,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      localStorage.removeItem('token');
      set({
        admin: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  setAdmin: (admin: Admin) => {
    set({ admin });
  }
}));
