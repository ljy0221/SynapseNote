import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // 🔥 쿠키 기반이면 필요
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
