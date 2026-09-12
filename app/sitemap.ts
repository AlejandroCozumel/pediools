import type { MetadataRoute } from "next";
import { alternates, localizedUrl, locales, routes } from "@/lib/sitemap-data";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    routes.map((route) => ({
      url: localizedUrl(locale, route),
      alternates: alternates(route),
    })),
  );
}
