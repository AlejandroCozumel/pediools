import { Suspense } from "react";
import ChartClient from "./ChartClient";
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
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
        ? "Visualiza graficas CDC de crecimiento para edades de 2 a 20 anos y revisa percentiles de talla, peso e IMC con contexto clinico."
        : "Visualize CDC growth charts for ages 2 to 20 years and review height, weight, and BMI percentiles with clinical context and safety notes.",
    url: `https://www.pedimath.com/${locale}/charts/cdc-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["CDC growth chart", "pediatric growth", "child height percentile", "child weight percentile", "growth visualization"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/cdc-growth-chart`;
  const title = locale === "es" ? "Graficas CDC de crecimiento pediatrico" : "CDC Pediatric Growth Charts";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: locale === "es" ? "Gráficas CDC de crecimiento pediátrico (2–20 años)" : "CDC Pediatric Growth Charts (Ages 2–20)", description: locale === "es" ? "Gráficas CDC interactivas para niños y adolescentes de 2 a 20 años. Visualiza percentiles de talla, peso e IMC." : "Interactive CDC growth charts for children and adolescents ages 2 to 20 years. Visualize and track height, weight, and BMI percentiles.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: locale === "es" ? "Inicio" : "Home", url: `https://www.pedimath.com/${locale}` }, { name: locale === "es" ? "Gráficas" : "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: locale === "es" ? "Gráficas CDC" : "CDC Growth Charts", url }])} />
      <h1 className="container mx-auto mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
      <Suspense fallback={
        <div className="flex min-h-48 items-center justify-center text-muted-foreground">
          {locale === "es" ? "Cargando gráfica…" : "Loading chart…"}
        </div>
      }>
        <ChartClient />
      </Suspense>
      <div className="container mx-auto">
        <SeoToolContent
          locale={locale}
          title={title}
          summary={locale === "es" ? "Estas graficas CDC permiten visualizar percentiles de crecimiento para ninos y adolescentes de 2 a 20 anos. Son utiles para revisar tendencias de talla, peso e IMC durante controles longitudinales." : "These CDC charts visualize growth percentiles for children and adolescents from 2 to 20 years. They are useful for reviewing height, weight, and BMI trends during longitudinal follow-up."}
          inputs={locale === "es" ? ["Edad exacta o fecha de medicion.", "Sexo del paciente.", "Talla, peso o IMC segun la grafica.", "Mediciones previas para evaluar tendencia."] : ["Exact age or measurement date.", "Patient sex.", "Height, weight, or BMI for the selected chart.", "Prior measurements for trend review."]}
          references={locale === "es" ? "Las graficas CDC son referencias poblacionales, no metas individuales de crecimiento. Interpreta cambios con historia clinica y mediciones confiables." : "CDC charts are population references, not individual growth goals. Interpret changes with clinical history and reliable measurements."}
          referenceLinks={[{ href: "https://www.cdc.gov/growthcharts/clinical_charts.htm", label: locale === "es" ? "Gráficas clínicas CDC" : "CDC clinical growth charts" }]}
          safety={locale === "es" ? "Cruces de percentiles, valores extremos o discordancia clinica justifican revision profesional y posible confirmacion de medidas." : "Crossing percentiles, extreme values, or clinical mismatch should prompt professional review and possible measurement confirmation."}
          related={[{ href: `/${locale}/calculators/growth-calculator`, label: locale === "es" ? "Calculadora de crecimiento" : "Growth calculator" }]}
        />
      </div>
    </>
  );
}
