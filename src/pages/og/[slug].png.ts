import { getCollection } from "astro:content";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import type { APIRoute, GetStaticPaths } from "astro";
import satori from "satori";
import { ogCard } from "../../lib/og-card";
import { baseUrl } from "../../lib/site";

// TeX Gyre Heros, an open clone of Helvetica (same metrics, near-identical
// letterforms), under the GUST Font License. The files and their notices live
// in src/assets/fonts.
const font = await readFile(
  join(process.cwd(), "src/assets/fonts/texgyreheros-regular.otf"),
);

// One card per post, unless the post brings its own `image`.
export const getStaticPaths = (async () => {
  const posts = await getCollection("blog");
  return posts
    .filter((post) => !post.data.image)
    .map((post) => ({
      params: { slug: post.id },
      props: { title: post.data.title },
    }));
}) satisfies GetStaticPaths;

const host = new URL(baseUrl).host;

export const GET: APIRoute = async ({ props }) => {
  const svg = await satori(ogCard(props.title, host), {
    width: 1200,
    height: 630,
    fonts: [
      { name: "TeX Gyre Heros", data: font, weight: 400, style: "normal" },
    ],
  });
  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
