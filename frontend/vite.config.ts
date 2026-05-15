import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Dev proxy keeps the browser on :5173 while API calls hit the Express backend.
 * Production builds use VITE_API_BASE_URL (same-origin or deployed API host).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:2026",
        changeOrigin: true,
      },
    },
  },
});
