import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Chạy http để điện thoại mở thẳng, không bị báo "kết nối không riêng tư" (camera trong trang và GPS cần https).
// /api được chuyển tiếp sang API Node (apps/api) để điện thoại chỉ cần mở một địa chỉ.
const api = { '/api': process.env.API_URL ?? 'http://localhost:3001' };

export default defineConfig({
  // Đường dẫn tương đối để chạy được cả ở gốc lẫn trong thư mục con trên GitHub Pages.
  base: './',
  plugins: [react()],
  server: { port: 5174, proxy: api },
  preview: { port: 5174, proxy: api },
});
