import { fileURLToPath, URL } from "node:url";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL("./index.html", import.meta.url)),
        suitPreview: fileURLToPath(
          new URL("./suit-mark-preview.html", import.meta.url),
        ),
      },
    },
  },
});
