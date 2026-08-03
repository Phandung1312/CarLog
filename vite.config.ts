import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks: {
          "three-engine": ["three", "@react-three/fiber", "@react-three/drei"],
          "react-vendor": ["react", "react-dom", "zustand"],
        },
      },
    },
  },
});
