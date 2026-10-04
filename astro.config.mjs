// @ts-check
import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { markdownPlugins } from "./src/lib/markdown";
import { baseUrl } from "./src/lib/site";

export default defineConfig({
  site: baseUrl,
  // URLs stay /blog, not /blog/, as they were on Next.
  trailingSlash: "never",
  integrations: [mdx()],
  markdown: {
    // Posts render exactly the quotes and dashes they were typed with.
    processor: satteri({
      hastPlugins: markdownPlugins,
      features: { smartPunctuation: false },
    }),
    // Code is highlighted by sugar-high instead (see src/lib/markdown.ts).
    syntaxHighlight: false,
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "PT Serif",
      cssVariable: "--font-serif",
      weights: [400, 700],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      // Astro's default fallback is sans-serif.
      fallbacks: ["serif"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
