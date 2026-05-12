import React from 'react'
import { BloodPressureForm } from './BloodPressureForm'
import { JsonLd } from "@/components/JsonLd";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "BloodPressureCalculator" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "Blood Pressure Calculator - PediMath" }),
    description: t("description", { defaultValue: "Calculate pediatric blood pressure percentiles using 2017 AAP guidelines." }),
    url: `https://www.pedimath.com/${locale}/calculators/blood-pressure-calculator`,
    image: "/og-image.jpg",
    locale,
    keywords: ["blood pressure calculator", "pediatric blood pressure", "AAP guidelines", "hypertension", "percentile"]
  });
};

const BloodPressureCalculator = ({ params: { locale = "en" } }: { params: { locale?: string } }) => {
  const url = `https://www.pedimath.com/${locale}/calculators/blood-pressure-calculator`;
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "Pediatric Blood Pressure Calculator", description: "Calculate pediatric blood pressure percentiles and classify hypertension using 2017 AAP Clinical Practice Guidelines for ages 1–17 years.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Calculators", url: `https://www.pedimath.com/${locale}/calculators` }, { name: "Blood Pressure Calculator", url }])} />
      <div><BloodPressureForm/></div>
    </>
  )
}

export default BloodPressureCalculator