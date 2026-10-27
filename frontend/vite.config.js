import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Биндим на все интерфейсы IPv4 (127.0.0.1) и IPv6 для надежного открытия в браузере
    port: 5173,
    strictPort: false
  }
});
