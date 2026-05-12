import ChartClient from "./ChartClient";
import { JsonLd } from "@/components/JsonLd";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "IntergrowthChartPage" });
  return getSeoMetadata({
    title: t('growthStandardsTitle', { defaultValue: 'INTERGROWTH-21st Growth Standards - PediMath' }),
    description: t('pretermInfantGrowthVisualizationSubtitle', { defaultValue: 'Interactive INTERGROWTH-21st charts for newborn growth assessment (0–7 days). Track weight, length, and head circumference at birth.' }),
    url: `https://www.pedimath.com/${locale}/charts/intergrowth-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["INTERGROWTH-21st chart", "newborn growth", "birth weight percentile", "neonatal growth standards"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/intergrowth-growth-chart`;
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "INTERGROWTH-21st Newborn Growth Charts", description: "Interactive INTERGROWTH-21st standard charts for newborn growth assessment at birth (0–7 days). Assess weight, length, and head circumference.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: "INTERGROWTH-21st", url }])} />
      <ChartClient />
    </>
  );
}