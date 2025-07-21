import React from 'react'
import { BloodPressureForm } from './BloodPressureForm'
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "BloodPressureForm" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "Blood Pressure Calculator - PediMath" }),
    description: t("description", { defaultValue: "Calculate pediatric blood pressure percentiles and thresholds." }),
    url: `https://www.pedimath.com/${locale}/calculators/blood-pressure-calculator`,
    image: "/og-image.jpg",
    locale,
    keywords: ["blood pressure calculator", "pediatric blood pressure", "percentile", "thresholds"]
  });
};

const BloodPressureCalculator = () => {
  return (
    <div><BloodPressureForm/></div>
  )
}

export default BloodPressureCalculator