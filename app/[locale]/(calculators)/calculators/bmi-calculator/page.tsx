import SeoMeta from "@/components/SeoMeta";
import { useTranslations, useLocale } from "next-intl";
import { BMIForm } from "./BMIForm";

export default function BMIPage() {
  const t = useTranslations("BMICalculator");
  const locale = useLocale();
  return (
    <>
      <SeoMeta
        title={t("title", { defaultValue: "BMI Calculator - PediMath" })}
        description={t("description", { defaultValue: "Calculate Body Mass Index and track BMI percentiles for pediatric patients." })}
        image="/og-image.jpg"
        url={`https://www.pedimath.com/${locale}/calculators/bmi-calculator`}
      />
      <div className="container mx-auto">
        <BMIForm />
      </div>
    </>
  );
}