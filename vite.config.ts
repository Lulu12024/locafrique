import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Plugin personnalisé pour bloquer ws
    {
      name: 'block-ws-module',
      resolveId(id) {
        if (id === 'ws' || id.includes('/ws/') || id.endsWith('/ws')) {
          return id;
        }
      },
      load(id) {
        if (id === 'ws' || id.includes('/ws/') || id.endsWith('/ws')) {
          return `
            export default class MockWebSocket {
              constructor() {
                console.warn('WebSocket module blocked - using native browser WebSocket');
              }
            };
            export const WebSocket = globalThis.WebSocket || MockWebSocket;
            export const CONNECTING = 0;
            export const OPEN = 1;
            export const CLOSING = 2;
            export const CLOSED = 3;
          `;
        }
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    exclude: ['ws', '@supabase/realtime-js'],
  },
  build: {
    rollupOptions: {
      external: (id) => {
        return id === 'ws' || id.includes('/ws/') || id.includes('node_modules/ws');
      },
    },
  },
}));