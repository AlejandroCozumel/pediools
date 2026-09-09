import { BMIForm } from "./BMIForm";
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "BMICalculator" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "BMI Calculator - PediMath" }),
    description:
      locale === "es"
        ? "Calcula el IMC pediatrico y revisa percentiles por edad y sexo para apoyar el seguimiento de crecimiento con contexto clinico."
        : "Calculate pediatric BMI and review age- and sex-based percentiles to support growth monitoring with clinical context and safety notes.",
    url: `https://www.pedimath.com/${locale}/calculators/bmi-calculator`,
    image: "/og-image.jpg",
    locale,
    keywords: ["BMI calculator", "pediatric BMI", "body mass index", "child growth"]
  });
};

export default function BMIPage({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/calculators/bmi-calculator`;
  const title = locale === "es" ? "Calculadora de IMC pediatrico" : "Pediatric BMI Calculator";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "Pediatric BMI Calculator", description: "Calculate Body Mass Index and track BMI percentiles for children and adolescents using CDC standards.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Calculators", url: `https://www.pedimath.com/${locale}/calculators` }, { name: "BMI Calculator", url }])} />
      <div className="container mx-auto">
        <h1 className="mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
        <BMIForm />
        <SeoToolContent
          locale={locale}
          title={title}
          summary={locale === "es" ? "La calculadora de IMC pediatrico estima el indice de masa corporal y lo interpreta con percentiles apropiados para edad y sexo. Es util para seguimiento nutricional, consejeria preventiva y revision longitudinal del crecimiento." : "The pediatric BMI calculator estimates body mass index and interprets it with age- and sex-appropriate percentiles. It is useful for nutrition follow-up, preventive counseling, and longitudinal growth review."}
          inputs={locale === "es" ? ["Fecha de nacimiento y fecha de medicion.", "Sexo del paciente.", "Peso actual.", "Talla o longitud actual."] : ["Birth date and measurement date.", "Patient sex.", "Current weight.", "Current height or length."]}
          references={locale === "es" ? "Los percentiles de IMC dependen del rango de edad y del estandar seleccionado. Usa datos medidos recientemente y verifica unidades antes de interpretar el resultado." : "BMI percentiles depend on age range and selected standard. Use recently measured data and verify units before interpreting the result."}
          safety={locale === "es" ? "El IMC es una senal de tamizaje, no un diagnostico. Considera historia clinica, pubertad, composicion corporal, actividad fisica y tendencias previas." : "BMI is a screening signal, not a diagnosis. Consider history, puberty, body composition, physical activity, and prior trends."}
          related={[{ href: `/${locale}/calculators/growth-calculator`, label: locale === "es" ? "Percentiles de crecimiento" : "Growth percentiles" }, { href: `/${locale}/charts/cdc-growth-chart`, label: locale === "es" ? "Graficas CDC" : "CDC charts" }]}
        />
      </div>
    </>
  );
}
