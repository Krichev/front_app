// api.js - API service with interceptor
import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://your-backend-url/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// Request interceptor to add token
api.interceptors.request.use(
    async (config) => {
        const token = await authService.getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, redirect to login
            await authService.logout();
            // Navigate to login screen (you'll need to implement navigation)
        }
        return Promise.reject(error);
    }
);

export default api;