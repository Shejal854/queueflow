import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-server proxy so the client can call /api/* without CORS issues
// during local development (production instead uses VITE_API_URL, see
// client/src/api/axiosClient.ts).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },
});
