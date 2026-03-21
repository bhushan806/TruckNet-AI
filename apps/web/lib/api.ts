import axios from 'axios';

// SECURITY: API base URL from environment variable, never hardcoded
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // 15s request timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

const aiApi = axios.create({
    baseURL: AI_ENGINE_URL,
    timeout: 30000, // 30s timeout for LLMs
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach JWT token to every outgoing request
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Centralized response error interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401: auto-redirect to login
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth/login';
            }
        }

        // Handle 429: rate limit — no console.log in production
        if (error.response && error.response.status === 429) {
            // Rate limited — error will propagate to caller's catch block
        }

        // Handle timeout — error will propagate to caller's catch block
        // Handle network errors — error will propagate to caller's catch block

        return Promise.reject(error);
    }
);

// Add auth token to aiApi requests
aiApi.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export { api, aiApi };
