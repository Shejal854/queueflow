/**
 * PURPOSE: One configured Axios instance used everywhere in the app,
 * with an interceptor that transparently refreshes an expired access
 * token and retries the original request.
 *
 * WHY withCredentials: true
 * Access/refresh tokens live in httpOnly cookies (set by the API), not
 * in JS-readable storage (see server auth.middleware.ts comment on why).
 * `withCredentials` tells the browser to actually send those cookies on
 * cross-origin requests to the API.
 *
 * WHY A RESPONSE INTERCEPTOR FOR 401s (instead of the user hitting
 * "please log in again" on every access-token expiry)
 * Access tokens expire every 15 minutes by design (short blast radius,
 * see server-side comment). Without silent refresh, users would be
 * logged out mid-session every 15 minutes, which is a bad UX -- the
 * refresh token exists specifically so this can happen invisibly.
 */
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // A refresh is already in flight -- queue this request to retry
        // once it resolves, instead of firing N parallel refresh calls.
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve(api(originalRequest)));
        });
      }

      isRefreshing = true;
      try {
        await api.post('/auth/refresh');
        pendingQueue.forEach((cb) => cb());
        pendingQueue = [];
        return api(originalRequest);
      } catch (refreshError) {
        pendingQueue = [];
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
