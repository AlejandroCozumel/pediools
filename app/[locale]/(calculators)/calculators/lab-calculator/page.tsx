import SeoMeta from "@/components/SeoMeta";
import { useTranslations, useLocale } from "next-intl";
import React from 'react'
import LabCalculatorForm from './LabCalculatorForm';

export default function PremiumLabCalculatorPage() {
  const t = useTranslations("LabCalculator");
  const locale = useLocale();
  return (
    <>
      <SeoMeta
        title={t("title", { defaultValue: "Lab Reference Calculator - PediMath" })}
        description={t("description", { defaultValue: "Interpret pediatric lab values with age-based reference ranges." })}
        image="/og-image.jpg"
        url={`https://www.pedimath.com/${locale}/calculators/lab-calculator`}
      />
      <div className="container mx-auto">
        <LabCalculatorForm />
      </div>
    </>
  );
}