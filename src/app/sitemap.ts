import type { MetadataRoute } from "next";
import { SITE_URL, PUBLIC_PAGES } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.path.startsWith("/legal") ? "yearly" : "monthly",
    priority: p.path === "/" ? 1 : p.path.startsWith("/legal") ? 0.3 : 0.7,
  }));
}
