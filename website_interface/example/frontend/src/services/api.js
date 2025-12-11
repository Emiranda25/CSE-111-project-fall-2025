import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// PostBoard API
export const postboardAPI = {
  getAll: () => api.get('/postboards'),
  getById: (id) => api.get(`/postboards/${id}`),
  create: (data) => api.post('/postboards', data),
};

// Post API
export const postAPI = {
  getAll: () => api.get('/posts'),
  getById: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  delete: (id) => api.delete(`/posts/${id}`),
};

// Comment API
export const commentAPI = {
  create: (data) => api.post('/comments', data),
  delete: (id) => api.delete(`/comments/${id}`),
};

// Event API
export const eventAPI = {
  getAll: () => api.get('/events'),
  markAttendance: (id) => api.patch(`/events/${id}/attend`),
};

// User API
export const userAPI = {
  getAll: () => api.get('/users'),
};

export default api;