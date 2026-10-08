import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://arnauribaltamarot.com",
  i18n: {
    defaultLocale: "es",
    locales: ["es", "ca", "en"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: "es", locales: { es: "es-ES", ca: "ca-ES", en: "en" } },
    }),
  ],
  server: { port: 3001 },
  devToolbar: { enabled: false },
});
