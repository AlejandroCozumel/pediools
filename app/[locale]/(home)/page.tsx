import CalculatorsList from "./CalculatorsList";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "CalculatorsList" });
  return getSeoMetadata({
    title: t("dashboardTitle", { defaultValue: "Pediatric Calculators" }),
    description: t("dashboardSubtitle", { defaultValue: "Professional tools for pediatric assessment and monitoring" }),
    url: `https://www.pedimath.com/${locale}`,
    image: "/og-image.jpg",
    locale,
    keywords: ["pediatric calculators", "growth chart", "BMI calculator", "dose calculator"]
  });
};

export default function Home() {
  return <CalculatorsList />;
}