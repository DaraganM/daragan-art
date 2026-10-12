import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://daragan.art",
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap({ filter: (page) => !page.includes("/thanks/") })],
});
