import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://healthcare-appointment-manager-6f7c.onrender.com',
        changeOrigin: true,
      },
    },
  },
});
