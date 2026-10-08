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
        ? "Gráficas CDC de crecimiento (2–20 años) - PediMath"
        : "CDC Growth Charts (Ages 2–20) - PediMath",
    description:
      locale === "es"
        ? "Explora gráficas CDC de peso y talla de 2 a 20 años. Cambia entre niños y niñas y añade medidas para visualizar su percentil."
        : "Explore CDC weight and height charts for ages 2–20. Switch between boys and girls and add measurements to plot a growth percentile.",
    url: `https://www.pedimath.com/${locale}/charts/cdc-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["CDC growth chart", "pediatric growth", "child height percentile", "child weight percentile", "growth visualization"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/cdc-growth-chart`;
  const title = locale === "es" ? "Gráficas CDC de crecimiento pediátrico" : "CDC Pediatric Growth Charts";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: locale === "es" ? "Gráficas CDC de crecimiento pediátrico (2–20 años)" : "CDC Pediatric Growth Charts (Ages 2–20)", description: locale === "es" ? "Explora gráficas CDC de peso y talla de 2 a 20 años. Cambia entre niños y niñas y añade medidas para visualizar su percentil." : "Explore CDC weight and height charts for ages 2–20. Switch between boys and girls and add measurements to plot a growth percentile.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: locale === "es" ? "Inicio" : "Home", url: `https://www.pedimath.com/${locale}` }, { name: locale === "es" ? "Gráficas" : "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: locale === "es" ? "Gráficas CDC" : "CDC Growth Charts", url }])} />
      <h1 className="container mx-auto mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
      <Suspense fallback={
        <div className="flex min-h-48 items-center justify-center text-muted-foreground">
          {locale === "es" ? "Cargando gráfica…" : "Loading chart…"}
        </div>
      }>
        <ChartClient />
      </Suspense>
      <GrowthChartGuide standard="cdc_child" locale={locale} />
    </>
  );
}
