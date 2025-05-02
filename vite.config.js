import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Désactivation du proxy pour éviter les prob  lèmes de CORS
    // Les requêtes seront faites directement vers http://localhost:8000
  },
});
