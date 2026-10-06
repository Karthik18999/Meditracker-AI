const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Format API responses and errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Cannot connect to backend server. Make sure the backend server (port 5000) is running.';
    
    if (error.response) {
      if (typeof error.response.data === 'string' && error.response.data.trim()) {
        message = error.response.data;
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      } else {
        message = `Server error (${error.response.status}). Please try again.`;
      }
    } else if (error.message && error.message !== 'Network Error') {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
