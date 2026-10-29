/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Library mode: one UMD bundle plus one CSS file, loaded by Entando as widget resources.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Fixed port: the CORS origins and the course instructions rely on it.
  server: { port: 5175, strictPort: true },
  // React reads process.env.NODE_ENV, which does not exist in the browser.
  define: command === 'build' ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'announcementBoardConfig',
      formats: ['umd'],
      fileName: () => 'announcement-board-config.js',
      cssFileName: 'announcement-board-config',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
  },
}));
