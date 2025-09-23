// vite.config.ts
import { defineConfig } from "file:///C:/Users/AGL/Documents/SPINALZ/PROJET/locafrique/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/AGL/Documents/SPINALZ/PROJET/locafrique/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/AGL/Documents/SPINALZ/PROJET/locafrique/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\AGL\\Documents\\SPINALZ\\PROJET\\locafrique";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Plugin personnalisé pour bloquer ws
    {
      name: "block-ws-module",
      resolveId(id) {
        if (id === "ws" || id.includes("/ws/") || id.endsWith("/ws")) {
          return id;
        }
      },
      load(id) {
        if (id === "ws" || id.includes("/ws/") || id.endsWith("/ws")) {
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
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  define: {
    global: "globalThis",
    "process.env": {}
  },
  optimizeDeps: {
    exclude: ["ws", "@supabase/realtime-js"]
  },
  build: {
    rollupOptions: {
      external: (id) => {
        return id === "ws" || id.includes("/ws/") || id.includes("node_modules/ws");
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBR0xcXFxcRG9jdW1lbnRzXFxcXFNQSU5BTFpcXFxcUFJPSkVUXFxcXGxvY2FmcmlxdWVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEFHTFxcXFxEb2N1bWVudHNcXFxcU1BJTkFMWlxcXFxQUk9KRVRcXFxcbG9jYWZyaXF1ZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQUdML0RvY3VtZW50cy9TUElOQUxaL1BST0pFVC9sb2NhZnJpcXVlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXHJcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcclxuICAgIC8vIFBsdWdpbiBwZXJzb25uYWxpc1x1MDBFOSBwb3VyIGJsb3F1ZXIgd3NcclxuICAgIHtcclxuICAgICAgbmFtZTogJ2Jsb2NrLXdzLW1vZHVsZScsXHJcbiAgICAgIHJlc29sdmVJZChpZCkge1xyXG4gICAgICAgIGlmIChpZCA9PT0gJ3dzJyB8fCBpZC5pbmNsdWRlcygnL3dzLycpIHx8IGlkLmVuZHNXaXRoKCcvd3MnKSkge1xyXG4gICAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgbG9hZChpZCkge1xyXG4gICAgICAgIGlmIChpZCA9PT0gJ3dzJyB8fCBpZC5pbmNsdWRlcygnL3dzLycpIHx8IGlkLmVuZHNXaXRoKCcvd3MnKSkge1xyXG4gICAgICAgICAgcmV0dXJuIGBcclxuICAgICAgICAgICAgZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9ja1dlYlNvY2tldCB7XHJcbiAgICAgICAgICAgICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1dlYlNvY2tldCBtb2R1bGUgYmxvY2tlZCAtIHVzaW5nIG5hdGl2ZSBicm93c2VyIFdlYlNvY2tldCcpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgZXhwb3J0IGNvbnN0IFdlYlNvY2tldCA9IGdsb2JhbFRoaXMuV2ViU29ja2V0IHx8IE1vY2tXZWJTb2NrZXQ7XHJcbiAgICAgICAgICAgIGV4cG9ydCBjb25zdCBDT05ORUNUSU5HID0gMDtcclxuICAgICAgICAgICAgZXhwb3J0IGNvbnN0IE9QRU4gPSAxO1xyXG4gICAgICAgICAgICBleHBvcnQgY29uc3QgQ0xPU0lORyA9IDI7XHJcbiAgICAgICAgICAgIGV4cG9ydCBjb25zdCBDTE9TRUQgPSAzO1xyXG4gICAgICAgICAgYDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZpbmU6IHtcclxuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxyXG4gICAgJ3Byb2Nlc3MuZW52Jzoge30sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGV4Y2x1ZGU6IFsnd3MnLCAnQHN1cGFiYXNlL3JlYWx0aW1lLWpzJ10sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBleHRlcm5hbDogKGlkKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGlkID09PSAnd3MnIHx8IGlkLmluY2x1ZGVzKCcvd3MvJykgfHwgaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy93cycpO1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG59KSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFnVixTQUFTLG9CQUFvQjtBQUM3VyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQ1QsZ0JBQWdCO0FBQUE7QUFBQSxJQUVoQjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sVUFBVSxJQUFJO0FBQ1osWUFBSSxPQUFPLFFBQVEsR0FBRyxTQUFTLE1BQU0sS0FBSyxHQUFHLFNBQVMsS0FBSyxHQUFHO0FBQzVELGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLEtBQUssSUFBSTtBQUNQLFlBQUksT0FBTyxRQUFRLEdBQUcsU0FBUyxNQUFNLEtBQUssR0FBRyxTQUFTLEtBQUssR0FBRztBQUM1RCxpQkFBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQVlUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sUUFBUTtBQUFBLElBQ1IsZUFBZSxDQUFDO0FBQUEsRUFDbEI7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxNQUFNLHVCQUF1QjtBQUFBLEVBQ3pDO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixVQUFVLENBQUMsT0FBTztBQUNoQixlQUFPLE9BQU8sUUFBUSxHQUFHLFNBQVMsTUFBTSxLQUFLLEdBQUcsU0FBUyxpQkFBaUI7QUFBQSxNQUM1RTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
