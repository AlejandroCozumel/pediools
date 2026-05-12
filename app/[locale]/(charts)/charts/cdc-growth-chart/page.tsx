import ChartClient from "./ChartClient";
import { JsonLd } from "@/components/JsonLd";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "CDCChartPage" });
  return getSeoMetadata({
    title: t('growthChartsTitle', { defaultValue: 'CDC Growth Charts - PediMath' }),
    description: t('growthChartsSubtitle', { defaultValue: 'Interactive CDC growth charts for children ages 2–20 years. Track height, weight, and BMI percentiles.' }),
    url: `https://www.pedimath.com/${locale}/charts/cdc-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["CDC growth chart", "pediatric growth", "child height percentile", "child weight percentile", "growth visualization"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/cdc-growth-chart`;
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "CDC Pediatric Growth Charts (Ages 2–20)", description: "Interactive CDC growth charts for children and adolescents ages 2 to 20 years. Visualize and track height, weight, and BMI percentiles.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: "CDC Growth Charts", url }])} />
      <ChartClient />
    </>
  );
}
