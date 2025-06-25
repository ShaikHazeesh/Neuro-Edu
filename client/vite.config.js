import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ignore-sourcemap-warnings',
      enforce: 'pre',
      handleHotUpdate({ server }) {
        server.ws.send({
          type: 'custom',
          event: 'suppress-warnings',
        });
        return [];
      },
      configureServer(server) {
        // Suppress sourcemap warnings
        const originalPrintUrls = server.printUrls;
        server.printUrls = () => {
          originalPrintUrls.call(server);
          console.log('\n🔧 Sourcemap warnings for face-api.js are suppressed');
        };
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
      '@assets': path.resolve(__dirname, '../attached_assets'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Exclude model files from being processed by Vite
  assetsInclude: ['**/*.json', '**/*.weights', '**/models/*-shard*'],
  optimizeDeps: {
    exclude: ['face-api.js']
  },
  // Suppress sourcemap warnings
  logLevel: 'error'
});
