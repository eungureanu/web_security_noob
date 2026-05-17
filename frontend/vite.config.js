import { defineConfig } from 'vite';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: ".",
  server: {
    port: 5173
  },
  plugins: [
    tailwindcss(),
  ],
});