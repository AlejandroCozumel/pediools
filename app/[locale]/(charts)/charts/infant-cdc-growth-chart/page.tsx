import { Suspense } from "react";
import ChartClient from "./ChartClient";
import { JsonLd } from "@/components/JsonLd";
import GrowthChartGuide from "@/components/GrowthChartGuide";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  return getSeoMetadata({
    title:
      locale === "es"
        ? "Gráficas CDC para lactantes (0–36 meses) - PediMath"
        : "CDC Infant Growth Charts (0–36 Months) - PediMath",
    description:
      locale === "es"
        ? "Explora curvas CDC de peso y longitud desde el nacimiento hasta los 36 meses. Añade medidas y compara percentiles en la misma página."
        : "Explore CDC infant weight and length curves from birth to 36 months. Add measurements and compare percentiles on the same page.",
    url: `https://www.pedimath.com/${locale}/charts/infant-cdc-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["CDC infant growth chart", "0-36 months growth", "infant length percentile", "infant weight percentile"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/infant-cdc-growth-chart`;
  const title = locale === "es" ? "Gráficas CDC de crecimiento infantil" : "CDC Infant Growth Charts";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: locale === "es" ? "Gráficas CDC de crecimiento infantil (0–36 meses)" : "CDC Infant Growth Charts (0–36 Months)", description: locale === "es" ? "Explora curvas CDC de peso y longitud desde el nacimiento hasta los 36 meses. Añade medidas y compara percentiles en la misma página." : "Explore CDC infant weight and length curves from birth to 36 months. Add measurements and compare percentiles on the same page.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: locale === "es" ? "Inicio" : "Home", url: `https://www.pedimath.com/${locale}` }, { name: locale === "es" ? "Gráficas" : "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: locale === "es" ? "Gráficas CDC infantil" : "CDC Infant Growth Charts", url }])} />
      <h1 className="container mx-auto mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
      <Suspense fallback={
        <div className="flex min-h-48 items-center justify-center text-muted-foreground">
          {locale === "es" ? "Cargando gráfica…" : "Loading chart…"}
        </div>
      }>
        <ChartClient />
      </Suspense>
      <GrowthChartGuide standard="cdc_infant" locale={locale} />
    </>
  );
}
