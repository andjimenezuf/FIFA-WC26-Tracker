import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Pinned (not Vite's default auto-bump to 5174+) because the backend's CORS
  // allowlist is for this exact origin — a silent port change here breaks chat
  // with a confusing "Couldn't reach the agent" instead of a clear error.
  server: {
    port: 5173,
    strictPort: true,
  },
});
