import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
});

// Request Interceptor:
// This runs BEFORE every request is sent.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor:
// This runs AFTER a response is received.
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log("Token expired or invalid. Logging out.");
      localStorage.removeItem('jwt_token');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;