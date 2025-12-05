import axios from 'axios';
import type {
  Admin,
  Whitelist,
  Template,
  DashboardStats,
  AdvancedAnalytics,
  Comment
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword })
};

// Admins
export const adminApi = {
  getAll: () => api.get<Admin[]>('/admins'),
  create: (data: Partial<Admin>) => api.post('/admins', data),
  update: (id: string, data: Partial<Admin>) => api.put(`/admins/${id}`, data),
  delete: (id: string) => api.delete(`/admins/${id}`)
};

// Whitelists
export const whitelistApi = {
  getAll: (params?: any) => api.get<{ whitelists: Whitelist[]; pagination: any }>('/whitelists', { params }),
  getById: (id: string) => api.get<Whitelist>(`/whitelists/${id}`),
  create: (data: Partial<Whitelist>) => api.post('/whitelists', data),
  updateAnswer: (whitelistId: string, answerId: string, data: any) =>
    api.put(`/whitelists/${whitelistId}/answers/${answerId}`, data),
  finalize: (id: string, data: any) => api.post(`/whitelists/${id}/finalize`, data),
  addComment: (id: string, content: string, mentions?: string[]) =>
    api.post(`/whitelists/${id}/comments`, { content, mentions })
};

// Templates
export const templateApi = {
  getAll: (params?: any) => api.get<Template[]>('/templates', { params }),
  create: (data: Partial<Template>) => api.post('/templates', data),
  update: (id: string, data: Partial<Template>) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  duplicate: (id: string) => api.post(`/templates/${id}/duplicate`)
};

// Analytics
export const analyticsApi = {
  getDashboard: () => api.get<DashboardStats>('/analytics/dashboard'),
  getAdvanced: () => api.get<AdvancedAnalytics>('/analytics/advanced'),
  exportCSV: () => api.get('/analytics/export', { responseType: 'blob' })
};

export default api;
