import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    hmr: {
      protocol: "wss",
      host: process.env.REPLIT_DEV_DOMAIN,
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://demokonveksi.astintech.id',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
