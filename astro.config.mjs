import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://modern-swift-dev.github.io",
  base: "/docs",
  outDir: "./.build/guides",
  trailingSlash: "always",
  vite: { plugins: [tailwindcss()] },
});
