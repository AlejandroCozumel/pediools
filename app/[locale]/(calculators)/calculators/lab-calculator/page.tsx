import LabCalculatorForm from './LabCalculatorForm';
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "LabCalculator" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "Lab Reference Calculator - PediMath" }),
    description: t("description", { defaultValue: "Interpret pediatric lab values with age-based reference ranges." }),
    url: `https://www.pedimath.com/${locale}/calculators/lab-calculator`,
    image: "/og-image.jpg",
    locale,
    keywords: ["lab calculator", "pediatric lab values", "reference ranges", "child lab interpretation"]
  });
};

export default function PremiumLabCalculatorPage() {
  return (
    <div className="container mx-auto">
      <LabCalculatorForm />
    </div>
  );
}