import { baseUrl } from "app/sitemap";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/cdn-cgi/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
