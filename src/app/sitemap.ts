import type { MetadataRoute } from "next";
import { SITE_URL, PUBLIC_PAGES } from "@/lib/site";

// Deliberately minimal. Google ignores <changefreq> and <priority> outright,
// and treats <lastmod> as a hint it will discount if it looks unreliable —
// so emitting a fresh millisecond timestamp on every request (which is what
// `new Date()` did here) actively devalues the signal and can trip the
// "Sitemap could not be read" parser error.
//
// Date-only is unambiguously valid W3C Datetime and stays stable across
// requests within a day.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString().slice(0, 10);

  return PUBLIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified,
  }));
}
