import { Suspense } from "react";
import ChartClient from "./ChartClient";
import { JsonLd } from "@/components/JsonLd";
import GrowthChartGuide from "@/components/GrowthChartGuide";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "WHOChartPage" });
  return getSeoMetadata({
    title: t('whoGrowthStandardsTitle', { defaultValue: 'WHO Growth Standards - PediMath' }),
    description:
      locale === "es"
        ? "Explora curvas OMS de peso y longitud desde el nacimiento hasta los 24 meses. Añade medidas para visualizar percentiles de crecimiento."
        : "Explore WHO weight and length curves from birth to 24 months. Add measurements to visualize growth percentiles on the same page.",
    url: `https://www.pedimath.com/${locale}/charts/who-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["WHO growth chart", "infant growth standards", "0-24 months growth", "length percentile", "weight percentile"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/who-growth-chart`;
  const title = locale === "es" ? "Estándares OMS de crecimiento" : "WHO Growth Standards Charts";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: locale === "es" ? "Gráficas de estándares OMS (0–24 meses)" : "WHO Growth Standards Charts (0–24 Months)", description: locale === "es" ? "Explora curvas OMS de peso y longitud desde el nacimiento hasta los 24 meses. Añade medidas para visualizar percentiles de crecimiento." : "Explore WHO weight and length curves from birth to 24 months. Add measurements to visualize growth percentiles on the same page.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: locale === "es" ? "Inicio" : "Home", url: `https://www.pedimath.com/${locale}` }, { name: locale === "es" ? "Gráficas" : "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: locale === "es" ? "Estándares OMS" : "WHO Growth Standards", url }])} />
      <h1 className="container mx-auto mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
      <Suspense fallback={
        <div className="flex min-h-48 items-center justify-center text-muted-foreground">
          {locale === "es" ? "Cargando gráfica…" : "Loading chart…"}
        </div>
      }>
        <ChartClient />
      </Suspense>
      <GrowthChartGuide standard="who" locale={locale} />
    </>
  );
}
