import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Library mode: one UMD bundle plus one CSS file, loaded by Entando as widget resources.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // React reads process.env.NODE_ENV, which does not exist in the browser.
  define: command === 'build' ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'announcementBoard',
      formats: ['umd'],
      fileName: () => 'announcement-board.js',
      cssFileName: 'announcement-board',
    },
  },
}));
