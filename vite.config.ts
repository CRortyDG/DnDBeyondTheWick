import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Two pages: the main app (index.html) and the Arrival intro (arrive.html),
// which loads none of the main app's code. The Worker (worker/index.ts) runs
// alongside in development and in production.
export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: {
            main: path.resolve(import.meta.dirname, "index.html"),
            arrive: path.resolve(import.meta.dirname, "arrive.html"),
          },
        },
      },
    },
  },
});
