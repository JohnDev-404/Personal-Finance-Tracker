import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL is not defined. Check client/.env');
}

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every outgoing request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response handling: on 401, clear token and bounce to login with a reason.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const onAuthPage =
      window.location.pathname.startsWith('/login') ||
      window.location.pathname.startsWith('/register');

    if (status === 401 && !onAuthPage) {
      localStorage.removeItem('token');
      window.location.href = '/login?expired=1';
    }

    return Promise.reject(error);
  }
);

export default client;