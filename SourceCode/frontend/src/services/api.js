import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
});

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof unauthorizedHandler === 'function') {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

export const AuthAPI = {
  login: (payload) => api.post('/api/auth/login', payload),
  register: (payload) => api.post('/api/auth/register', payload),
};

export const ScheduleAPI = {
  list: () => api.get('/api/schedules'),
  create: (payload) => api.post('/api/schedules', payload),
  update: (id, payload) => api.put(`/api/schedules/${id}`, payload),
  remove: (id) => api.delete(`/api/schedules/${id}`),
};

export const FeedLogAPI = {
  list: () => api.get('/api/feed-logs'),
};

export default api;


