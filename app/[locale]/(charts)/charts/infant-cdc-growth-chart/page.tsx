import ChartClient from "./ChartClient";
import { JsonLd } from "@/components/JsonLd";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "InfantCDCChartPage" });
  return getSeoMetadata({
    title: t('growthChartsTitle', { defaultValue: 'CDC Infant Growth Charts (0–36 months) - PediMath' }),
    description: t('growthVisualizationSubtitle', { defaultValue: 'Interactive CDC infant growth charts for 0–36 months. Track length, weight, and head circumference percentiles.' }),
    url: `https://www.pedimath.com/${locale}/charts/infant-cdc-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["CDC infant growth chart", "0-36 months growth", "infant length percentile", "infant weight percentile"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/infant-cdc-growth-chart`;
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "CDC Infant Growth Charts (0–36 Months)", description: "Interactive CDC growth charts for infants 0 to 36 months. Track and visualize length, weight, and head circumference percentiles.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: "CDC Infant Growth Charts", url }])} />
      <ChartClient />
    </>
  );
}
