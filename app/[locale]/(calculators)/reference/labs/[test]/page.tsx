import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
import { getBreadcrumbSchema, getCalculatorSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { getLabReferenceTest, labTestKeys } from "@/lib/pediatric-reference-data";
import { locales } from "@/lib/sitemap-data";
import LabCalculatorForm from "../../../calculators/lab-calculator/LabCalculatorForm";

type LabReferencePageProps = {
  params: { locale: string; test: string };
};

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    labTestKeys.map((test) => ({ locale, test })),
  );
}

export async function generateMetadata({ params }: LabReferencePageProps): Promise<Metadata> {
  const test = getLabReferenceTest(params.test);
  if (!test) return {};

  const locale = params.locale === "es" ? "es" : "en";
  const name = locale === "es" && test.nombre ? test.nombre : test.name;
  return getSeoMetadata({
    title:
      locale === "es"
        ? `${name}: rango de referencia pediátrico | PediMath`
        : `${name} Pediatric Reference Range | PediMath`,
    description:
      locale === "es"
        ? `Consulta rangos de referencia pediátricos para ${name} por edad y sexo, con unidades ${test.unit}. Confirma siempre el rango del laboratorio local.`
        : `Review pediatric reference ranges for ${name} by age and sex, reported in ${test.unit}. Always confirm the local laboratory's reference range.`,
    url: `https://www.pedimath.com/${locale}/reference/labs/${test.testKey}`,
    image: "/og-image.jpg",
    locale,
    keywords: [
      `${name} normal range child`,
      `${name} pediatric reference range`,
      `${name} children laboratory values`,
      "pediatric lab values",
    ],
  });
}

export default function LabReferencePage({ params }: LabReferencePageProps) {
  const test = getLabReferenceTest(params.test);
  if (!test) notFound();

  const locale = params.locale === "es" ? "es" : "en";
  const url = `https://www.pedimath.com/${locale}/reference/labs/${test.testKey}`;
  const name = locale === "es" && test.nombre ? test.nombre : test.name;
  const title =
    locale === "es"
      ? `Rango pediátrico de ${name}`
      : `${name} Pediatric Reference Range`;

  return (
    <>
      <JsonLd
        data={getCalculatorSchema({
          name: title,
          description:
            locale === "es"
              ? `Referencia interactiva de ${name} por edad, sexo y unidad de laboratorio.`
              : `Interactive ${name} reference by age, sex, and laboratory unit.`,
          url,
          locale,
        })}
      />
      <JsonLd
        data={getBreadcrumbSchema([
          { name: locale === "es" ? "Inicio" : "Home", url: `https://www.pedimath.com/${locale}` },
          { name: locale === "es" ? "Calculadoras" : "Calculators", url: `https://www.pedimath.com/${locale}/calculators` },
          { name: locale === "es" ? "Referencias de laboratorio" : "Lab references", url: `https://www.pedimath.com/${locale}/calculators/lab-calculator` },
          { name, url },
        ])}
      />
      <div className="container mx-auto">
        <h1 className="mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
        <LabCalculatorForm initialTestKey={test.testKey} />
        <SeoToolContent
          locale={locale}
          title={title}
          summary={
            locale === "es"
              ? `Esta página abre la calculadora de laboratorio con ${name} resaltado. Los rangos mostrados son referencias dependientes de edad y sexo cuando están disponibles, no diagnósticos.`
              : `This page opens the laboratory calculator with ${name} highlighted. The displayed ranges are age- and sex-dependent references where available, not diagnoses.`
          }
          inputs={
            locale === "es"
              ? ["Fecha de nacimiento y medición.", "Sexo cuando el rango lo requiere.", `Resultado en ${test.unit}.`, "Método y rango del laboratorio local."]
              : ["Date of birth and measurement.", "Sex when the range requires it.", `Result in ${test.unit}.`, "Local laboratory method and range."]
          }
          references={
            locale === "es"
              ? "Los rangos dependen del método, población, edad, sexo, unidades y laboratorio. Compara siempre con el informe original."
              : "Reference ranges depend on method, population, age, sex, units, and laboratory. Always compare with the original report."
          }
          referenceLinks={[
            { href: "https://www.chop.edu/sites/default/files/2024-06/chop-labs-reference-ranges.pdf", label: locale === "es" ? "Rangos de referencia de laboratorio CHOP" : "CHOP laboratory reference ranges" },
            { href: `/${locale}/calculators/lab-calculator`, label: locale === "es" ? "Calculadora completa de laboratorio" : "Full laboratory calculator" },
          ]}
          safety={
            locale === "es"
              ? "Un resultado fuera de rango requiere interpretación clínica y puede necesitar confirmación. No uses una tabla general para sustituir el rango del laboratorio que realizó la prueba."
              : "An out-of-range result requires clinical interpretation and may need confirmation. Do not use a general table instead of the range from the laboratory that performed the test."
          }
          related={[
            { href: `/${locale}/calculators/blood-pressure-calculator`, label: locale === "es" ? "Presión arterial pediátrica" : "Pediatric blood pressure" },
            { href: `/${locale}/disclaimer`, label: locale === "es" ? "Aviso de seguridad" : "Safety disclaimer" },
          ]}
        />
      </div>
    </>
  );
}
