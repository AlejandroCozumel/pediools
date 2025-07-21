import { BMIForm } from "./BMIForm";
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

export default function BMIPage() {
  return (
    <div className="container mx-auto">
      <BMIForm />
    </div>
  );
}