import ChartClient from "./ChartClient";
import { JsonLd } from "@/components/JsonLd";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "WHOChartPage" });
  return getSeoMetadata({
    title: t('whoGrowthStandardsTitle', { defaultValue: 'WHO Growth Standards - PediMath' }),
    description: t('infantGrowthVisualizationSubtitle', { defaultValue: 'Interactive WHO growth standards for infants 0–24 months. Track length, weight, and head circumference percentiles.' }),
    url: `https://www.pedimath.com/${locale}/charts/who-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["WHO growth chart", "infant growth standards", "0-24 months growth", "length percentile", "weight percentile"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/who-growth-chart`;
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "WHO Growth Standards Charts (0–24 Months)", description: "Interactive WHO international growth standard charts for infants 0 to 24 months. Visualize length, weight, and head circumference percentiles.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: "WHO Growth Standards", url }])} />
      <ChartClient />
    </>
  );
}