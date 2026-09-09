import ChartClient from "./ChartClient";
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
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
        ? "Visualiza estandares INTERGROWTH-21st para evaluacion neonatal al nacimiento y revisa percentiles de peso, longitud y perimetro cefalico."
        : "Visualize INTERGROWTH-21st newborn standards for birth assessment and review weight, length, and head circumference percentiles.",
    url: `https://www.pedimath.com/${locale}/charts/intergrowth-growth-chart`,
    image: "/og-image.jpg",
    locale,
    keywords: ["INTERGROWTH-21st chart", "newborn growth", "birth weight percentile", "neonatal growth standards"]
  });
};

export default function Page({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/charts/intergrowth-growth-chart`;
  const title = locale === "es" ? "Graficas INTERGROWTH-21st para recien nacidos" : "INTERGROWTH-21st Newborn Growth Charts";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "INTERGROWTH-21st Newborn Growth Charts", description: "Interactive INTERGROWTH-21st standard charts for newborn growth assessment at birth (0–7 days). Assess weight, length, and head circumference.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Charts", url: `https://www.pedimath.com/${locale}/charts` }, { name: "INTERGROWTH-21st", url }])} />
      <h1 className="container mx-auto mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
      <ChartClient />
      <div className="container mx-auto">
        <SeoToolContent
          locale={locale}
          title={title}
          summary={locale === "es" ? "Las graficas INTERGROWTH-21st apoyan la evaluacion de crecimiento neonatal al nacimiento. Permiten revisar peso, longitud y perimetro cefalico frente a estandares internacionales para recien nacidos." : "INTERGROWTH-21st charts support newborn growth assessment at birth. They review weight, length, and head circumference against international newborn standards."}
          inputs={locale === "es" ? ["Edad gestacional o rango aplicable.", "Sexo del recien nacido.", "Peso, longitud o perimetro cefalico al nacimiento.", "Contexto perinatal relevante."] : ["Gestational age or applicable range.", "Newborn sex.", "Birth weight, length, or head circumference.", "Relevant perinatal context."]}
          references={locale === "es" ? "INTERGROWTH-21st debe aplicarse dentro de sus rangos y definiciones. Revisa prematuridad, restriccion de crecimiento, datos obstetricos y medicion al nacimiento." : "INTERGROWTH-21st should be applied within its ranges and definitions. Review prematurity, growth restriction, obstetric data, and birth measurement quality."}
          safety={locale === "es" ? "Hallazgos extremos o discordantes requieren correlacion clinica neonatal y seguimiento. No uses la grafica como unica base de decision." : "Extreme or discordant findings require neonatal clinical correlation and follow-up. Do not use the chart as the only basis for decisions."}
          related={[{ href: `/${locale}/calculators/bilirubin-calculator`, label: locale === "es" ? "Bilirrubina neonatal" : "Neonatal bilirubin" }, { href: `/${locale}/calculators/growth-calculator`, label: locale === "es" ? "Calculadora de crecimiento" : "Growth calculator" }]}
        />
      </div>
    </>
  );
}
