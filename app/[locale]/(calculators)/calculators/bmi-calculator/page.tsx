import { BMIForm } from "./BMIForm";
import { JsonLd } from "@/components/JsonLd";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "BMICalculator" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "BMI Calculator - PediMath" }),
    description: t("description", { defaultValue: "Calculate Body Mass Index and track BMI percentiles for pediatric patients." }),
    url: `https://www.pedimath.com/${locale}/calculators/bmi-calculator`,
    image: "/og-image.jpg",
    locale,
    keywords: ["BMI calculator", "pediatric BMI", "body mass index", "child growth"]
  });
};

export default function BMIPage({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/calculators/bmi-calculator`;
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "Pediatric BMI Calculator", description: "Calculate Body Mass Index and track BMI percentiles for children and adolescents using CDC standards.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Calculators", url: `https://www.pedimath.com/${locale}/calculators` }, { name: "BMI Calculator", url }])} />
      <div className="container mx-auto">
        <BMIForm />
      </div>
    </>
  );
}