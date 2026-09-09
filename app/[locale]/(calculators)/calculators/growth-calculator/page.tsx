import { GrowthForm } from "./GrowthForm";
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({
  params,
}: {
  params: { locale?: string };
}): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "GrowthForm" });

  return getSeoMetadata({
    title: t("title"),
    description:
      locale === "es"
        ? "Calcula percentiles pediatricos de crecimiento con estandares OMS, CDC e INTERGROWTH-21st para peso, talla, IMC y perimetro cefalico."
        : "Calculate pediatric growth percentiles with WHO, CDC, and INTERGROWTH-21st standards for weight, height, BMI, and head circumference.",
    url: `https://www.pedimath.com/${locale}/calculators/growth-calculator`,
    image: "/og-image.jpg",
    locale,
    calculator: "growth-calculator",
    keywords: [
      "growth percentile calculator",
      "pediatric growth chart",
      "WHO growth standards",
      "CDC growth charts",
      "INTERGROWTH-21st",
      "child development",
      "height percentile",
      "weight percentile",
    ],
  });
};

export default function GrowthPage({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/calculators/growth-calculator`;
  const title = locale === "es" ? "Calculadora de percentiles de crecimiento" : "Growth Percentile Calculator";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "Pediatric Growth Percentile Calculator", description: "Calculate and track growth percentiles using WHO, CDC, and INTERGROWTH-21st standards for children from birth to 20 years.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Calculators", url: `https://www.pedimath.com/${locale}/calculators` }, { name: "Growth Percentile Calculator", url }])} />
      <div className="container mx-auto">
        <h1 className="mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
        <GrowthForm />
        <SeoToolContent
          locale={locale}
          title={title}
          summary={locale === "es" ? "Esta calculadora ayuda a ubicar mediciones pediatricas en curvas de referencia para edad y sexo. Puede usarse para revisar peso, talla, IMC y perimetro cefalico, comparar estandares y documentar tendencias durante controles de salud." : "This calculator helps place pediatric measurements on age- and sex-based reference curves. It supports weight, height, BMI, and head circumference review, standard comparison, and trend documentation during routine care."}
          inputs={locale === "es" ? ["Fecha de nacimiento y fecha de medicion.", "Sexo del paciente.", "Peso, talla, longitud o perimetro cefalico segun el estandar seleccionado.", "Seleccion del estandar WHO, CDC, CDC infantil o INTERGROWTH-21st."] : ["Birth date and measurement date.", "Patient sex.", "Weight, height, length, or head circumference for the selected standard.", "Selected WHO, CDC, CDC infant, or INTERGROWTH-21st standard."]}
          references={locale === "es" ? "Las curvas se basan en referencias reconocidas para crecimiento infantil y pediatrico. La seleccion del estandar debe corresponder a edad, tipo de medida y contexto clinico." : "Curves are based on recognized infant and pediatric growth references. The selected standard should match the child age, measurement type, and clinical context."}
          safety={locale === "es" ? "Un percentil aislado no diagnostica enfermedad. Confirma mediciones, revisa velocidad de crecimiento y compara los hallazgos con guias actuales y juicio clinico." : "A single percentile does not diagnose disease. Confirm measurements, review growth velocity, and compare findings with current guidance and clinical judgment."}
          related={[{ href: `/${locale}/charts`, label: locale === "es" ? "Graficas de crecimiento" : "Growth charts" }, { href: `/${locale}/calculators/bmi-calculator`, label: locale === "es" ? "Calculadora de IMC" : "BMI calculator" }]}
        />
      </div>
    </>
  );
}
