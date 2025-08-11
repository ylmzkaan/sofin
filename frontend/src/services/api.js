import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh the token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, null, {
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          });
          
          const { access_token } = response.data;
          localStorage.setItem('token', access_token);
          
          // Retry the original request with the new token
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, remove tokens and notify
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      } else {
        // No refresh token, just remove access token and notify
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    return api.post('/auth/token', formData);
  },
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  getMyProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  getMyAnalyses: () => api.get('/users/me/analyses'),
  getMySubscriptions: () => api.get('/users/me/subscriptions'),
  getMySubscribers: () => api.get('/users/me/subscribers'),
};

// Analyses API
export const analysesAPI = {
  getAllAnalyses: () => api.get('/analyses'),
  getAnalysis: (id) => api.get(`/analyses/${id}`),
  getAnalysesByUser: (userId) => api.get(`/analyses?author_id=${userId}`),
  createAnalysis: (formData) => api.post('/analyses', formData),
  updateAnalysis: (id, data) => api.put(`/analyses/${id}`, data),
  deleteAnalysis: (id) => api.delete(`/analyses/${id}`),
  getAnalysisImages: (id) => api.get(`/analyses/${id}/images`),
  addAnalysisImage: (id, formData) => api.post(`/analyses/${id}/images`, formData),
};

// Subscriptions API
export const subscriptionsAPI = {
  createSubscription: (data) => api.post('/subscriptions', data),
  getSubscriptions: () => api.get('/subscriptions'),
  cancelSubscription: (id) => api.delete(`/subscriptions/${id}`),
  checkSubscription: (creatorId) => api.get(`/subscriptions/check/${creatorId}`),
}; 