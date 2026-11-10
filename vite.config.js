import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // rutas relativas: el build funciona en cualquier subcarpeta o servicio de alojamiento estático
  plugins: [react()],
  server: { port: 5180, strictPort: true },
});
