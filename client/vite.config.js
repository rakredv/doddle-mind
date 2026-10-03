import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // BACKEND_URL (no VITE_ prefix) is only read here, for the dev proxy; it is not sent to the browser.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: { '/api': env.BACKEND_URL || 'http://localhost:8787' },
    },
  };
});
