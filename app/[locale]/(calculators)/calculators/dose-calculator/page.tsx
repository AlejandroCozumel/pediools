import { DoseMethodSelector } from "./DoseMethodSelector";
import { TooltipProvider } from '@/components/ui/tooltip';
import { JsonLd } from "@/components/JsonLd";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "DoseCalculator" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "Dose Calculator - PediMath" }),
    description: t("description", { defaultValue: "Calculate medication dosages based on weight, age, and clinical parameters." }),
    url: `https://www.pedimath.com/${locale}/calculators/dose-calculator`,
    image: "/og-image.jpg",
    locale,
    keywords: ["dose calculator", "pediatric dosing", "medication calculator", "child dosage"]
  });
};

export default function DoseCalculatorPage({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/calculators/dose-calculator`;
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "Pediatric Dose Calculator", description: "Calculate safe and effective medication doses for children based on weight and age using evidence-based dosing protocols.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Calculators", url: `https://www.pedimath.com/${locale}/calculators` }, { name: "Dose Calculator", url }])} />
      <TooltipProvider>
        <div className="container mx-auto">
          <DoseMethodSelector />
        </div>
      </TooltipProvider>
    </>
  );
}