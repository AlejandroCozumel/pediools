import ChartClient from "./ChartClient";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "IntergrowthChartPage" });
  return getSeoMetadata({
    title: t('growthStandardsTitle', { defaultValue: 'Intergrowth-21st Growth Standards - PediMath' }),
    description: t('pretermInfantGrowthVisualizationSubtitle', { defaultValue: 'Preterm Infant Growth Visualization (24-42 weeks)' }),
    url: `https://www.pedimath.com/${locale}/charts/intergrowth-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["intergrowth chart", "preterm infant growth", "growth standards", "pediatrics"]
  });
};

export default function Page() {
  return <ChartClient />;
}