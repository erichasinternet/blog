import { getCollection } from "astro:content";

// Newest first.
export async function getPosts() {
  const posts = await getCollection("blog");
  return posts.sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );
}

// Dates are plain days, parsed as UTC midnight, so format them as UTC too.
export function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
