import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const api = { '/api': process.env.API_URL ?? 'http://localhost:3001' };

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5174, proxy: api, allowedHosts: ['.trycloudflare.com'] },
  preview: { port: 5174, proxy: api, allowedHosts: ['.trycloudflare.com'] },
});
