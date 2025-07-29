import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/ask': {
        target: 'https://a7a1bbaf0574.ngrok-free.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ask/, '/ask'),
      }
    }
  }
});