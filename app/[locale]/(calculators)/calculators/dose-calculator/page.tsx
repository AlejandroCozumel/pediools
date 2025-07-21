import SeoMeta from "@/components/SeoMeta";
import { useTranslations, useLocale } from "next-intl";
import { DoseMethodSelector } from "./DoseMethodSelector";
import { TooltipProvider } from '@/components/ui/tooltip';

export default function DoseCalculatorPage() {
  const t = useTranslations("DoseCalculator");
  const locale = useLocale();
  return (
    <>
      <SeoMeta
        title={t("title", { defaultValue: "Dose Calculator - PediMath" })}
        description={t("description", { defaultValue: "Calculate medication dosages based on weight, age, and clinical parameters." })}
        image="/og-image.jpg"
        url={`https://www.pedimath.com/${locale}/calculators/dose-calculator`}
      />
      <TooltipProvider>
        <div className="container mx-auto">
          <DoseMethodSelector />
        </div>
      </TooltipProvider>
    </>
  );
}