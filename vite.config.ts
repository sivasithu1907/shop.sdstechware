import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The app is served from the site root ("/"). The staff workspace uses the
// "/admin" path, so static hosting must rewrite unknown paths to index.html.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    // DISABLE_HMR=true turns off hot reload/file watching (kept from the
    // original AI Studio template; harmless elsewhere).
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
