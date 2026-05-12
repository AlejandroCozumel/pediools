import type { MetadataRoute } from "next";

const siteUrl = "https://www.pedimath.com";
const locales = ["en", "es"] as const;

const staticRoutes = ["/", "/about", "/contact", "/disclaimer", "/faq", "/calculators", "/charts"];

const calculators = [
  "bilirubin-calculator",
  "blood-pressure-calculator",
  "bmi-calculator",
  "dose-calculator",
  "growth-calculator",
  "lab-calculator",
];

const charts = [
  "cdc-growth-chart",
  "infant-cdc-growth-chart",
  "intergrowth-growth-chart",
  "who-growth-chart",
];

function routePriority(route: string): number {
  if (route === "/") return 1;
  if (route.includes("/calculators/") || route.includes("/charts/")) return 0.8;
  if (route === "/calculators" || route === "/charts") return 0.7;
  return 0.6;
}

function routeFrequency(route: string): MetadataRoute.Sitemap[number]["changeFrequency"] {
  return route === "/" ? "weekly" : "monthly";
}

function localizedUrl(locale: string, route: string) {
  return `${siteUrl}/${locale}${route === "/" ? "" : route}`;
}

function alternates(route: string) {
  return {
    languages: {
      en: localizedUrl("en", route),
      es: localizedUrl("es", route),
      "x-default": route === "/" ? `${siteUrl}/` : localizedUrl("en", route),
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ...staticRoutes,
    ...calculators.map((slug) => `/calculators/${slug}`),
    ...charts.map((slug) => `/charts/${slug}`),
  ];
  const lastModified = new Date();

  return locales.flatMap((locale) =>
    routes.map((route) => ({
      url: localizedUrl(locale, route),
      lastModified,
      changeFrequency: routeFrequency(route),
      priority: routePriority(route),
      alternates: alternates(route),
    })),
  );
}

