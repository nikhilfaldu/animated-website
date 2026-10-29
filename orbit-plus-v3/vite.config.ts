import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react-swc'
import glsl from 'vite-plugin-glsl'
import visualizer from 'vite-bundle-visualizer'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
    }),
    ...(mode === 'analyze' ? [visualizer({
      open: true,
    }) as PluginOption] : []),
  ] as PluginOption[],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@sections': path.resolve(__dirname, './src/sections'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@context': path.resolve(__dirname, './src/context'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@shaders': path.resolve(__dirname, './src/shaders'),
    },
  },
  
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },
  
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'animation-vendor': ['framer-motion'],
          'utils': ['clsx', 'tailwind-merge', 'uuid'],
        },
      },
    },
    sourcemap: mode === 'development',
    reportCompressedSize: true,
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber'],
  },
}))