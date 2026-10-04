import type { APIRoute } from "astro";
import { baseUrl } from "../lib/site";

export const GET: APIRoute = () =>
  new Response(
    [
      "User-Agent: *",
      "Allow: /",
      "Disallow: /cdn-cgi/",
      "",
      `Sitemap: ${baseUrl}/sitemap.xml`,
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
