import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getBreadcrumbSchema, getCalculatorSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { getMedicationById, medicationIds } from "@/lib/pediatric-reference-data";
import { locales } from "@/lib/sitemap-data";
import { DoseMethodSelector } from "../DoseMethodSelector";

type MedicationPageProps = {
  params: { locale: string; medication: string };
};

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    medicationIds.map((medication) => ({ locale, medication })),
  );
}

export async function generateMetadata({ params }: MedicationPageProps): Promise<Metadata> {
  const medication = getMedicationById(params.medication);
  if (!medication) return {};

  const locale = params.locale === "es" ? "es" : "en";
  const name = medication.names[locale];
  return getSeoMetadata({
    title:
      locale === "es"
        ? `Dosis pediátrica de ${name} por peso | PediMath`
        : `${name} Pediatric Dose Calculator by Weight | PediMath`,
    description:
      locale === "es"
        ? `Consulta una referencia de cálculo de dosis pediátrica para ${name} según peso, frecuencia y concentración. Verifica siempre la indicación y la pauta con una fuente clínica vigente.`
        : `Review a pediatric dose calculation reference for ${name} using weight, frequency, and concentration. Always verify the indication and regimen against current clinical guidance.`,
    url: `https://www.pedimath.com/${locale}/calculators/dose-calculator/${medication.id}`,
    image: "/og-image.jpg",
    locale,
    keywords: [
      `${name} pediatric dose`,
      `${name} dose by weight`,
      `${name} dosage calculator`,
      "pediatric medication dosing",
    ],
  });
}

export default async function MedicationDosePage({ params }: MedicationPageProps) {
  const medication = getMedicationById(params.medication);
  if (!medication) notFound();

  const locale = params.locale === "es" ? "es" : "en";
  const url = `https://www.pedimath.com/${locale}/calculators/dose-calculator/${medication.id}`;
  const name = medication.names[locale];
  const t = await getTranslations({ locale, namespace: "DoseCalculator" });
  const title =
    locale === "es"
      ? `Calculadora de dosis pediátrica de ${name}`
      : `${name} Pediatric Dose Calculator`;

  return (
    <>
      <JsonLd
        data={getCalculatorSchema({
          name: title,
          description:
            locale === "es"
              ? `Referencia interactiva para revisar cálculos de ${name} por peso, frecuencia y concentración.`
              : `Interactive reference for reviewing ${name} calculations by weight, frequency, and concentration.`,
          url,
          locale,
        })}
      />
      <JsonLd
        data={getBreadcrumbSchema([
          { name: locale === "es" ? "Inicio" : "Home", url: `https://www.pedimath.com/${locale}` },
          { name: locale === "es" ? "Calculadoras" : "Calculators", url: `https://www.pedimath.com/${locale}/calculators` },
          { name: locale === "es" ? "Calculadora de dosis" : "Dose Calculator", url: `https://www.pedimath.com/${locale}/calculators/dose-calculator` },
          { name, url },
        ])}
      />
      <TooltipProvider>
        <div className="container mx-auto">
          <h1 className="mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
          <DoseMethodSelector initialMedicationId={medication.id} />
          <SeoToolContent
            locale={locale}
            title={title}
            summary={
              locale === "es"
                ? `Esta página abre la calculadora con ${name} seleccionado. Introduce el peso y confirma la concentración, frecuencia, indicación y límites de dosis antes de usar cualquier resultado.`
                : `This page opens the calculator with ${name} selected. Enter the patient's weight and confirm the concentration, frequency, indication, and dose limits before using any result.`
            }
            inputs={
              locale === "es"
                ? ["Peso actual y unidad correcta.", "Concentración disponible.", "Frecuencia indicada.", "Duración cuando corresponda."]
                : ["Current weight and correct unit.", "Available concentration.", "Prescribed frequency.", "Duration when applicable."]
            }
            references={
              medication.notes?.[locale] ||
              (locale === "es"
                ? "Los rangos de dosis pueden variar por indicación, edad, función renal, formulación y protocolos locales."
                : "Dose ranges can vary by indication, age, renal function, formulation, and local protocols.")
            }
            referenceLinks={[
              ...(medication.referenceUrl
                ? [{ href: medication.referenceUrl, label: locale === "es" ? "Referencia farmacológica" : "Medication reference" }]
                : []),
              { href: `/${locale}/calculators/dose-calculator`, label: t("title", { defaultValue: locale === "es" ? "Calculadora de dosis" : "Dose calculator" }) },
            ]}
            safety={
              locale === "es"
                ? "Confirma la indicación, alergias, concentración, unidades, función renal, dosis máxima y protocolo local con un profesional de salud."
                : "Confirm the indication, allergies, concentration, units, renal function, maximum dose, and local protocol with a healthcare professional."
            }
            related={[
              { href: `/${locale}/calculators/dose-calculator`, label: locale === "es" ? "Todos los métodos de dosis" : "All dose methods" },
              { href: `/${locale}/calculators/lab-calculator`, label: locale === "es" ? "Referencias de laboratorio" : "Lab references" },
            ]}
          />
        </div>
      </TooltipProvider>
    </>
  );
}
