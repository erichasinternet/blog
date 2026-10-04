import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { baseUrl } from "../lib/site";

const day = (date: Date) => date.toISOString().split("T")[0];

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");

  // The blog index changes when a post is added, so it takes the newest date.
  // The home page has nothing to date.
  const newest = Math.max(
    ...posts.map((post) => post.data.publishedAt.valueOf()),
  );

  const urls: { loc: string; lastmod?: string }[] = [
    { loc: baseUrl },
    {
      loc: `${baseUrl}/blog`,
      lastmod: posts.length ? day(new Date(newest)) : undefined,
    },
    ...posts.map((post) => ({
      loc: `${baseUrl}/blog/${post.id}`,
      lastmod: day(post.data.publishedAt),
    })),
  ];

  const entries = urls
    .map(
      ({ loc, lastmod }) =>
        `<url>\n<loc>${loc}</loc>\n${lastmod ? `<lastmod>${lastmod}</lastmod>\n` : ""}</url>`,
    )
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
