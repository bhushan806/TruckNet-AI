import axios from 'axios';

// ── Startup Guards ──
// NEXT_PUBLIC_ variables are baked at build time. If missing, ALL AI requests
// will silently route to the frontend domain and return 404.
// We warn (not throw) so local builds without .env.local don't fail during prerendering.
// In Vercel production, these are always set via environment variables.
if (typeof window === 'undefined') {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.warn(
      '[TruckNet] NEXT_PUBLIC_API_URL is not defined. ' +
      'Add it to Vercel environment variables and redeploy.'
    );
  }
  if (!process.env.NEXT_PUBLIC_AI_ENGINE_URL) {
    console.warn(
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
  withCredentials: true, // Send HTTP-only cookies on all requests
  timeout: 60_000,
});

// ── Response Interceptors ──

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, { withCredentials: true });
        isRefreshing = false;
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        
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
            import('./toast').then(({ notify }) => {
              notify.error('Your session has expired. Please log in again. 🔐');
            });
            setTimeout(() => { window.location.href = '/'; }, 1200);
          }
        }
        return Promise.reject(refreshError);
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
