import ChartClient from "./ChartClient";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "CDCChartPage" });
  return getSeoMetadata({
    title: t('growthChartsTitle', { defaultValue: 'CDC Growth Charts - PediMath' }),
    description: t('growthChartsSubtitle', { defaultValue: 'Child Growth Visualization (2-20 years)' }),
    url: `https://www.pedimath.com/${locale}/charts/cdc-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["CDC growth chart", "pediatric growth", "child height", "child weight"]
  });
};

export default function Page() {
  return <ChartClient />;
}
