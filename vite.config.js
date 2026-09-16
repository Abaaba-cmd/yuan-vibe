import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    assetsDir: '',
    assetsInlineLimit: 2 * 1024 * 1024
  }
});
