import axios from 'axios';

// ── Startup Guards ──
// NEXT_PUBLIC_ variables are baked at build time. If missing, ALL AI requests
// will silently route to the frontend domain and return 404.
if (typeof window === 'undefined') {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error(
      '[TruckNet] NEXT_PUBLIC_API_URL is not defined. ' +
      'Add it to Vercel environment variables and redeploy.'
    );
  }
  if (!process.env.NEXT_PUBLIC_AI_ENGINE_URL) {
    throw new Error(
      '[TruckNet] NEXT_PUBLIC_AI_ENGINE_URL is not defined. ' +
      'Add it to Vercel environment variables (Production + Preview + Development) and redeploy.'
    );
  }
}

// ── Axios Instances ──
// Timeout: 60s to handle Render free-tier cold starts (~50s)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send HTTP-only cookies on all requests
  timeout: 60_000,
});

const aiApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AI_ENGINE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false, // Python AI engine uses Bearer token, not cookies
  timeout: 60_000,
});

// ── Request Interceptors ──
// Attach Bearer token from localStorage as fallback (will be removed after cookie migration)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

aiApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response Interceptors ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      if (typeof window !== 'undefined') {
        // Clear local auth state
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        // Only redirect if not already on the landing or auth pages
        const isOnAuthOrLanding =
          window.location.pathname === '/' ||
          window.location.pathname.startsWith('/auth');
        if (!isOnAuthOrLanding) {
          // Show toast before redirect to landing page
          import('./toast').then(({ notify }) => {
            notify.error('Your session has expired. Please log in again. 🔐');
          });
          // Redirect to landing page, not login page
          setTimeout(() => { window.location.href = '/'; }, 1200);
        }
      }
    }
    return Promise.reject(error);
  }
);

aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Let the calling component handle AI errors — don't auto-redirect
    return Promise.reject(error);
  }
);

export { aiApi };
export default api;
