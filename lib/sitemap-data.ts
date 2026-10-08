import { labTestKeys, medicationIds } from "@/lib/pediatric-reference-data";

export const siteUrl = "https://www.pedimath.com";
export const locales = ["en", "es"] as const;

export const staticRoutes = [
  "/",
  "/about",
  "/contact",
  "/disclaimer",
  "/faq",
  "/calculators",
  "/charts",
  "/reference/labs",
  "/calculators/corrected-age-calculator/results",
] as const;

export const calculators = [
  "bilirubin-calculator",
  "blood-pressure-calculator",
  "bmi-calculator",
  "dose-calculator",
  "growth-calculator",
  "target-height-calculator",
  "corrected-age-calculator",
  "lab-calculator",
] as const;

export const charts = [
  "cdc-growth-chart",
  "infant-cdc-growth-chart",
  "intergrowth-growth-chart",
  "who-growth-chart",
] as const;

export const medicationRoutes = medicationIds.map(
  (id) => `/calculators/dose-calculator/${id}`,
);

export const labReferenceRoutes = labTestKeys.map(
  (testKey) => `/reference/labs/${testKey}`,
);

export const routes = [
  ...staticRoutes,
  ...calculators.map((slug) => `/calculators/${slug}` as const),
  ...charts.map((slug) => `/charts/${slug}` as const),
  ...medicationRoutes,
  ...labReferenceRoutes,
];

export function localizedUrl(locale: string, route: string) {
  return `${siteUrl}/${locale}${route === "/" ? "" : route}`;
}

export function alternates(route: string) {
  return {
    languages: {
      en: localizedUrl("en", route),
      es: localizedUrl("es", route),
      "x-default": route === "/" ? `${siteUrl}/` : localizedUrl("en", route),
    },
  };
}
