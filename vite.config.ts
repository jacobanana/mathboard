import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from https://jacobanana.github.io/mathboard/ on GitHub Pages.
  // Use a relative base so built asset URLs work under the repo subpath.
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      // Resolved relative to this config file's URL; avoids needing Node type
      // declarations (@types/node) just for `fileURLToPath`.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

/** Minimal local shim for node:url's fileURLToPath (no @types/node needed). */
function fileURLToPath(url: URL): string {
  let p = decodeURIComponent(url.pathname);
  // On Windows the pathname is "/C:/...": strip the leading slash.
  if (/^\/[A-Za-z]:\//.test(p)) p = p.slice(1);
  return p;
}
