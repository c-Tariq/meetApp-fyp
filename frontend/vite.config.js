import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Assuming your backend runs on http://localhost:5000
const backendPort = 5000; // Or whatever port your backend uses

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Your frontend port
    proxy: {
      // Proxy requests starting with /api to your backend
      "/api": {
        target: `http://localhost:${backendPort}`, // Target backend server
        changeOrigin: true, // Recommended for virtual hosted sites
        secure: false, // Set to true if backend uses https
      },
    },
  },
});
