import SeoMeta from "@/components/SeoMeta";
import { useTranslations, useLocale } from "next-intl";
import { GrowthForm } from "@/app/[locale]/(calculators)/calculators/growth-calculator/GrowthForm";

export default function GrowthPage() {
  const t = useTranslations("GrowthForm");
  const locale = useLocale();
  return (
    <>
      <SeoMeta
        title={t("title", { defaultValue: "Growth Percentile Calculator - PediMath" })}
        description={t("description", { defaultValue: "Calculate and track growth measurements using WHO, CDC, and INTERGROWTH-21st standards." })}
        image="/og-image.jpg"
        url={`https://www.pedimath.com/${locale}/calculators/growth-calculator`}
      />
      <div className="container mx-auto">
        <GrowthForm />
      </div>
    </>
  );
}