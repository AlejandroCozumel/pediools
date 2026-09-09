import ChartClient from "./ChartClient";
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "InfantCDCChartPage" });
  return getSeoMetadata({
    title: t('growthChartsTitle', { defaultValue: 'CDC Infant Growth Charts (0–36 months) - PediMath' }),
    description:
      locale === "es"
        ? "Visualiza graficas CDC para lactantes de 0 a 36 meses y revisa percentiles de longitud, peso y perimetro cefalico."
        : "Visualize CDC infant growth charts for 0 to 36 months and review length, weight, and head circumference percentiles with clinical context.",
    url: `https://www.pedimath.com/${locale}/charts/infant-cdc-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["CDC infant growth chart", "0-36 months growth", "infant length percentile", "infant weight percentile"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/infant-cdc-growth-chart`;
  const title = locale === "es" ? "Graficas CDC de crecimiento infantil" : "CDC Infant Growth Charts";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "CDC Infant Growth Charts (0–36 Months)", description: "Interactive CDC growth charts for infants 0 to 36 months. Track and visualize length, weight, and head circumference percentiles.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: "CDC Infant Growth Charts", url }])} />
      <h1 className="container mx-auto mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
      <ChartClient />
      <div className="container mx-auto">
        <SeoToolContent
          locale={locale}
          title={title}
          summary={locale === "es" ? "Estas graficas CDC para lactantes muestran referencias de longitud, peso y perimetro cefalico de 0 a 36 meses. Ayudan a revisar trayectoria de crecimiento y consistencia de mediciones." : "These CDC infant charts show length, weight, and head circumference references from 0 to 36 months. They help review growth trajectory and measurement consistency."}
          inputs={locale === "es" ? ["Edad exacta o fecha de medicion.", "Sexo del lactante.", "Longitud, peso o perimetro cefalico.", "Mediciones seriadas cuando esten disponibles."] : ["Exact age or measurement date.", "Infant sex.", "Length, weight, or head circumference.", "Serial measurements when available."]}
          references={locale === "es" ? "La seleccion entre referencias CDC y OMS depende de edad, contexto y practica clinica local. Usa siempre medidas tomadas con tecnica adecuada." : "Selection between CDC and WHO references depends on age, context, and local clinical practice. Always use measurements taken with appropriate technique."}
          safety={locale === "es" ? "Percentiles inesperados deben revisarse con alimentacion, antecedente perinatal, enfermedad actual y calidad de la medicion." : "Unexpected percentiles should be reviewed with feeding history, perinatal history, current illness, and measurement quality."}
          related={[{ href: `/${locale}/charts/who-growth-chart`, label: locale === "es" ? "Graficas OMS" : "WHO charts" }, { href: `/${locale}/calculators/growth-calculator`, label: locale === "es" ? "Calculadora de crecimiento" : "Growth calculator" }]}
        />
      </div>
    </>
  );
}
