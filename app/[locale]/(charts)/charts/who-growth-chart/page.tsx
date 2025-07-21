import ChartClient from "./ChartClient";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "WHOChartPage" });
  return getSeoMetadata({
    title: t('whoGrowthStandardsTitle', { defaultValue: 'WHO Growth Standards - PediMath' }),
    description: t('infantGrowthVisualizationSubtitle', { defaultValue: 'Infant Growth Visualization (0-24 months)' }),
    url: `https://www.pedimath.com/${locale}/charts/who-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["WHO growth chart", "infant growth", "child height", "child weight"]
  });
};

export default function Page() {
  return <ChartClient />;
}