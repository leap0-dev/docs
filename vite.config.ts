import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import mdx from "fumadocs-mdx/vite";

export default defineConfig({
  envPrefix: ["VITE_", "LEAP0_"],
  server: {
    port: 3000,
  },
  ssr: {
    noExternal: ["fumadocs-core", "fumadocs-ui", "fumadocs-openapi", "@fumadocs/base-ui"],
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    mdx(await import("./source.config")),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
      },
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "fumadocs-core/dist/highlight/shiki/full.js":
        "/Users/stevenpassynkov/myProjects/leap0-docs/src/shims/fumadocs-shiki-full.ts",
      tslib: "tslib/tslib.es6.js",
    },
  },
});
