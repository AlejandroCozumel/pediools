import React from 'react'
import { BilirubinThresholdsForm } from './BilirubinThresholdsForm'
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

const BilirubinCalculator = () => {
  return (
    <BilirubinThresholdsForm/>
  )
}

export default BilirubinCalculator