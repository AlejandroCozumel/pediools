import { GrowthForm } from "./GrowthForm";
import { JsonLd } from "@/components/JsonLd";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({
  params,
}: {
  params: { locale?: string };
}): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "GrowthForm" });

  return getSeoMetadata({
    title: t("title"),
    description: t("description"),
    url: `https://www.pedimath.com/${locale}/calculators/growth-calculator`,
    image: "/og-image.jpg",
    locale,
    calculator: "growth-calculator",
    keywords: [
      "growth percentile calculator",
      "pediatric growth chart",
      "WHO growth standards",
      "CDC growth charts",
      "INTERGROWTH-21st",
      "child development",
      "height percentile",
      "weight percentile",
    ],
  });
};

export default function GrowthPage({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/calculators/growth-calculator`;
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "Pediatric Growth Percentile Calculator", description: "Calculate and track growth percentiles using WHO, CDC, and INTERGROWTH-21st standards for children from birth to 20 years.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Calculators", url: `https://www.pedimath.com/${locale}/calculators` }, { name: "Growth Percentile Calculator", url }])} />
      <div className="container mx-auto">
        <GrowthForm />
      </div>
    </>
  );
}
