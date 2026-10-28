/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// /api được chuyển sang API Node (apps/api) để web đọc ghi SQL Server.
const api = { '/api': process.env.API_URL ?? 'http://localhost:3001' };

// BASE_PATH được đặt trong CI khi deploy lên GitHub Pages (vd. /ten-repo/).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: { proxy: api },
  preview: { proxy: api },
  test: {
    environment: 'jsdom',
  },
});
