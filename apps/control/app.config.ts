import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["lucide-solid"],
    },
  },
  middleware: "./src/middleware.ts",
  ssr: true,
});
