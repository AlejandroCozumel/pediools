import ChartClient from "./ChartClient";
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
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
        ? "Visualiza estandares OMS de crecimiento para lactantes de 0 a 24 meses y revisa percentiles de longitud, peso y perimetro cefalico."
        : "Visualize WHO growth standards for infants 0 to 24 months and review length, weight, and head circumference percentiles with clinical context.",
    url: `https://www.pedimath.com/${locale}/charts/who-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["WHO growth chart", "infant growth standards", "0-24 months growth", "length percentile", "weight percentile"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/who-growth-chart`;
  const title = locale === "es" ? "Estandares OMS de crecimiento" : "WHO Growth Standards Charts";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "WHO Growth Standards Charts (0–24 Months)", description: "Interactive WHO international growth standard charts for infants 0 to 24 months. Visualize length, weight, and head circumference percentiles.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: "WHO Growth Standards", url }])} />
      <h1 className="container mx-auto mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
      <ChartClient />
      <div className="container mx-auto">
        <SeoToolContent
          locale={locale}
          title={title}
          summary={locale === "es" ? "Las graficas OMS muestran estandares internacionales de crecimiento para lactantes y ninos pequenos. Son utiles para revisar longitud, peso y perimetro cefalico durante los primeros meses de vida." : "WHO charts show international growth standards for infants and young children. They are useful for reviewing length, weight, and head circumference during early life."}
          inputs={locale === "es" ? ["Edad exacta o fecha de medicion.", "Sexo del paciente.", "Longitud, peso o perimetro cefalico.", "Referencia seleccionada para el rango de edad."] : ["Exact age or measurement date.", "Patient sex.", "Length, weight, or head circumference.", "Selected reference for the age range."]}
          references={locale === "es" ? "Los estandares OMS describen crecimiento esperado bajo condiciones saludables. La interpretacion debe considerar prematuridad, alimentacion, enfermedad y contexto local." : "WHO standards describe expected growth under healthy conditions. Interpretation should consider prematurity, feeding, illness, and local context."}
          safety={locale === "es" ? "Confirma datos atipicos y revisa tendencias. Una grafica no reemplaza valoracion nutricional, examen fisico ni seguimiento clinico." : "Confirm atypical data and review trends. A chart does not replace nutrition assessment, physical exam, or clinical follow-up."}
          related={[{ href: `/${locale}/charts/infant-cdc-growth-chart`, label: locale === "es" ? "Graficas CDC infantil" : "CDC infant charts" }, { href: `/${locale}/calculators/growth-calculator`, label: locale === "es" ? "Calculadora de crecimiento" : "Growth calculator" }]}
        />
      </div>
    </>
  );
}
