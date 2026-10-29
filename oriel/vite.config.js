import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  // The project lives in a OneDrive folder, where native file events are unreliable.
  server: { watch: { usePolling: true, interval: 300 } },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        product: resolve(import.meta.dirname, 'product.html'),
      },
    },
  },
});
