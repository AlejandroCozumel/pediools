import ChartClient from "./ChartClient";
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "CDCChartPage" });
  return getSeoMetadata({
    title: t('growthChartsTitle', { defaultValue: 'CDC Growth Charts - PediMath' }),
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
      <JsonLd data={getCalculatorSchema({ name: "CDC Pediatric Growth Charts (Ages 2–20)", description: "Interactive CDC growth charts for children and adolescents ages 2 to 20 years. Visualize and track height, weight, and BMI percentiles.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: "CDC Growth Charts", url }])} />
      <h1 className="container mx-auto mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
      <ChartClient />
      <div className="container mx-auto">
        <SeoToolContent
          locale={locale}
          title={title}
          summary={locale === "es" ? "Estas graficas CDC permiten visualizar percentiles de crecimiento para ninos y adolescentes de 2 a 20 anos. Son utiles para revisar tendencias de talla, peso e IMC durante controles longitudinales." : "These CDC charts visualize growth percentiles for children and adolescents from 2 to 20 years. They are useful for reviewing height, weight, and BMI trends during longitudinal follow-up."}
          inputs={locale === "es" ? ["Edad exacta o fecha de medicion.", "Sexo del paciente.", "Talla, peso o IMC segun la grafica.", "Mediciones previas para evaluar tendencia."] : ["Exact age or measurement date.", "Patient sex.", "Height, weight, or BMI for the selected chart.", "Prior measurements for trend review."]}
          references={locale === "es" ? "Las graficas CDC son referencias poblacionales, no metas individuales de crecimiento. Interpreta cambios con historia clinica y mediciones confiables." : "CDC charts are population references, not individual growth goals. Interpret changes with clinical history and reliable measurements."}
          safety={locale === "es" ? "Cruces de percentiles, valores extremos o discordancia clinica justifican revision profesional y posible confirmacion de medidas." : "Crossing percentiles, extreme values, or clinical mismatch should prompt professional review and possible measurement confirmation."}
          related={[{ href: `/${locale}/calculators/growth-calculator`, label: locale === "es" ? "Calculadora de crecimiento" : "Growth calculator" }]}
        />
      </div>
    </>
  );
}
