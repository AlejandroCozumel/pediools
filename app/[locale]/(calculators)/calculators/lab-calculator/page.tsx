import LabCalculatorForm from './LabCalculatorForm';
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "LabCalculator" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "Lab Reference Calculator - PediMath" }),
    description:
      locale === "es"
        ? "Interpreta valores de laboratorio pediatricos con rangos de referencia por edad y sexo para apoyar la revision clinica."
        : "Interpret pediatric laboratory values with age- and sex-based reference ranges to support clinical review, safety checks, and follow-up.",
    url: `https://www.pedimath.com/${locale}/calculators/lab-calculator`,
    image: "/og-image.jpg",
    locale,
    keywords: ["lab calculator", "pediatric lab values", "reference ranges", "child lab interpretation"]
  });
};

export default function PremiumLabCalculatorPage({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/calculators/lab-calculator`;
  const title = locale === "es" ? "Calculadora de referencia de laboratorio pediatrico" : "Pediatric Lab Reference Calculator";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "Pediatric Lab Reference Calculator", description: "Interpret pediatric laboratory values with age-based reference ranges for accurate clinical decision-making.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Calculators", url: `https://www.pedimath.com/${locale}/calculators` }, { name: "Lab Reference Calculator", url }])} />
      <div className="container mx-auto">
        <h1 className="mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
        <LabCalculatorForm />
        <SeoToolContent
          locale={locale}
          title={title}
          summary={locale === "es" ? "Esta calculadora organiza valores de laboratorio pediatricos y los compara con rangos de referencia dependientes de edad y sexo cuando estan disponibles. Puede ayudar a detectar valores fuera de rango y priorizar revision clinica." : "This calculator organizes pediatric laboratory values and compares them with age- and sex-dependent reference ranges when available. It can help flag out-of-range values and prioritize clinical review."}
          inputs={locale === "es" ? ["Fecha de nacimiento o edad.", "Sexo del paciente cuando el rango lo requiere.", "Valor del laboratorio y unidad correcta.", "Fecha de medicion si se necesita edad exacta."] : ["Birth date or age.", "Patient sex when the range requires it.", "Laboratory value and correct unit.", "Measurement date when exact age is needed."]}
          references={locale === "es" ? "Los rangos de laboratorio varian por metodo, poblacion, laboratorio y unidad. Confirma siempre con el rango del laboratorio local y el contexto clinico." : "Laboratory ranges vary by method, population, laboratory, and unit. Always confirm with the local lab reference range and clinical context."}
          safety={locale === "es" ? "Valores criticos o discordantes requieren evaluacion inmediata y confirmacion. No uses rangos generales para reemplazar protocolos institucionales." : "Critical or discordant values require immediate evaluation and confirmation. Do not use general ranges to replace institutional protocols."}
          related={[{ href: `/${locale}/calculators/blood-pressure-calculator`, label: locale === "es" ? "Presion arterial" : "Blood pressure" }, { href: `/${locale}/disclaimer`, label: locale === "es" ? "Aviso legal" : "Disclaimer" }]}
        />
      </div>
    </>
  );
}
