import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Keep all fonts as real files, not base64 data: URIs — CSP's
    // font-src 'self' blocks data: URIs, and Vite's default 4KB inline
    // threshold silently sweeps up small woff2 subsets (e.g. JetBrains
    // Mono's cyrillic-ext) otherwise.
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'gsap';
        },
      },
    },
  },
});
