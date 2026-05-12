import React from 'react'
import { BilirubinThresholdsForm } from './BilirubinThresholdsForm'
import { JsonLd } from "@/components/JsonLd";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "BilirubinCalculator" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "Bilirubin Calculator - PediMath" }),
    description: t("description", { defaultValue: "Assess neonatal jaundice and bilirubin thresholds for treatment." }),
    url: `https://www.pedimath.com/${locale}/calculators/bilirubin-calculator`,
    image: "/og-image.jpg",
    locale,
    keywords: ["bilirubin calculator", "neonatal jaundice", "bilirubin thresholds", "treatment"]
  });
};

const BilirubinCalculator = ({ params: { locale = "en" } }: { params: { locale?: string } }) => {
  const url = `https://www.pedimath.com/${locale}/calculators/bilirubin-calculator`;
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "Neonatal Bilirubin Threshold Calculator", description: "Assess neonatal jaundice and calculate bilirubin thresholds for phototherapy and exchange transfusion decisions.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Calculators", url: `https://www.pedimath.com/${locale}/calculators` }, { name: "Bilirubin Calculator", url }])} />
      <BilirubinThresholdsForm/>
    </>
  )
}

export default BilirubinCalculator