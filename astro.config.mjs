import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Automark's Astro + Tailwind foundation, adapted for a static research brand site.
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || "/",
  output: "static",
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
});
