import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
});

// Gắn JWT (nếu có) vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthAPI = {
  // Frontend và backend đều dùng username/password
  login: ({ username, password }) =>
    api.post('/api/auth/login', {
      username,
      password,
    }),
  register: ({ username, password }) =>
    api.post('/api/auth/register', {
      username,
      password,
    }),
};

export const ScheduleAPI = {
  list: () => api.get('/api/schedules/get'),
  create: (payload) => api.post('/api/schedules/create', payload),
  update: (id, payload) => api.put(`/api/schedules/${id}`, payload),
  remove: (id) => api.delete(`/api/schedules/${id}`),
};

export const FeedAPI = {
  manual: () => api.post('/api/feed/manual'),
  voice: (voiceCommand) => api.post('/api/feed/voice', { text: voiceCommand }),
  weeklyStats: () => api.get('/api/feed/stats/weekly'),
};

export default api;

