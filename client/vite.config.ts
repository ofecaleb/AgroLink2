import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // ensures "@/..." works
    }
  },
  build: {
    outDir: 'dist', // production build output
    chunkSizeWarningLimit: 1000 // avoid large chunk warnings
  }
});
