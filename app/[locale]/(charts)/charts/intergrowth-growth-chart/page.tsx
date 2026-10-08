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
  const t = await getTranslations({ locale, namespace: "IntergrowthChartPage" });
  return getSeoMetadata({
    title: t('growthStandardsTitle', { defaultValue: 'INTERGROWTH-21st Growth Standards - PediMath' }),
    description:
      locale === "es"
        ? "Explora curvas INTERGROWTH-21st de peso y longitud al nacer. Introduce la edad gestacional y las medidas para visualizar percentiles."
        : "Explore INTERGROWTH-21st birth weight and length curves. Enter gestational age and birth measurements to visualize percentiles.",
    url: `https://www.pedimath.com/${locale}/charts/intergrowth-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["INTERGROWTH-21st chart", "newborn growth", "birth weight percentile", "neonatal growth standards"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/intergrowth-growth-chart`;
  const title = locale === "es" ? "Gráficas INTERGROWTH-21st para recién nacidos" : "INTERGROWTH-21st Newborn Growth Charts";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: locale === "es" ? "Gráficas neonatales INTERGROWTH-21st" : "INTERGROWTH-21st Newborn Growth Charts", description: locale === "es" ? "Explora curvas INTERGROWTH-21st de peso y longitud al nacer. Introduce la edad gestacional y las medidas para visualizar percentiles." : "Explore INTERGROWTH-21st birth weight and length curves. Enter gestational age and birth measurements to visualize percentiles.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: locale === "es" ? "Inicio" : "Home", url: `https://www.pedimath.com/${locale}` }, { name: locale === "es" ? "Gráficas" : "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: "INTERGROWTH-21st", url }])} />
      <h1 className="container mx-auto mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
      <Suspense fallback={
        <div className="flex min-h-48 items-center justify-center text-muted-foreground">
          {locale === "es" ? "Cargando gráfica…" : "Loading chart…"}
        </div>
      }>
        <ChartClient />
      </Suspense>
      <GrowthChartGuide standard="intergrowth" locale={locale} />
    </>
  );
}
