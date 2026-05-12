const BASE_URL = "https://www.pedimath.com";
const ORG = {
  "@type": "Organization",
  name: "PediMath",
  url: BASE_URL,
  logo: `${BASE_URL}/pedimathLogo.svg`,
};

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PediMath",
    url: BASE_URL,
    description:
      "Professional pediatric calculation tools for healthcare providers. Growth charts, blood pressure, BMI, bilirubin, and more.",
    publisher: ORG,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/en/calculators?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    ...ORG,
    founder: { "@type": "Person", name: "Alejandro Zamora" },
    sameAs: [],
  };
}

export function getCalculatorSchema({
  name,
  description,
  url,
  locale = "en",
}: {
  name: string;
  description: string;
  url: string;
  locale?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url,
    applicationCategory: "MedicalApplication",
    operatingSystem: "Web Browser",
    inLanguage: locale,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: ORG,
    provider: ORG,
  };
}

export function getBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
