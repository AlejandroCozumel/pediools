import { DoseMethodSelector } from "./DoseMethodSelector";
import { TooltipProvider } from '@/components/ui/tooltip';
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MedicationReferenceLinks } from "@/components/MedicationReferenceLinks";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "DoseCalculator" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "Dose Calculator - PediMath" }),
    description:
      locale === "es"
        ? "Calcula dosis pediatricas por peso, superficie corporal o medicamento y verifica siempre los resultados con guias clinicas vigentes."
        : "Calculate pediatric doses by weight, body surface area, or medication and verify results against current clinical guidance before prescribing.",
    url: `https://www.pedimath.com/${locale}/calculators/dose-calculator`,
    image: "/og-image.jpg",
    locale,
    keywords: ["dose calculator", "pediatric dosing", "medication calculator", "child dosage"]
  });
};

export default function DoseCalculatorPage({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const url = `https://www.pedimath.com/${locale}/calculators/dose-calculator`;
  const title = locale === "es" ? "Calculadora de dosis pediatrica" : "Pediatric Dose Calculator";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: locale === "es" ? "Calculadora de dosis pediátrica" : "Pediatric Dose Calculator", description: locale === "es" ? "Calcula dosis pediátricas por peso, edad o superficie corporal como ayuda para revisar cálculos clínicos." : "Calculate pediatric medication doses by weight, age, or body surface area as an aid to clinical calculation review.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: locale === "es" ? "Inicio" : "Home", url: `https://www.pedimath.com/${locale}` }, { name: locale === "es" ? "Calculadoras" : "Calculators", url: `https://www.pedimath.com/${locale}/calculators` }, { name: locale === "es" ? "Calculadora de dosis" : "Dose Calculator", url }])} />
      <TooltipProvider>
        <div className="container mx-auto">
          <h1 className="mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
          <DoseMethodSelector />
          <MedicationReferenceLinks locale={locale === "es" ? "es" : "en"} />
          <SeoToolContent
            locale={locale}
            title={title}
            summary={locale === "es" ? "La calculadora de dosis pediatrica apoya calculos por peso, superficie corporal o seleccion de medicamento. Esta disenada para reducir errores aritmeticos, pero cada dosis debe confirmarse antes de prescribir o administrar." : "The pediatric dose calculator supports weight-based, body-surface-area-based, and medication-guided calculations. It is designed to reduce arithmetic errors, but every dose must be confirmed before prescribing or administration."}
            inputs={locale === "es" ? ["Peso actual y unidad correcta.", "Edad o parametros clinicos requeridos.", "Medicamento, concentracion o metodo de calculo.", "Limites maximos o protocolos locales cuando correspondan."] : ["Current weight and correct unit.", "Age or required clinical parameters.", "Medication, concentration, or calculation method.", "Maximum limits or local protocols when applicable."]}
            references={locale === "es" ? "Los rangos de dosis pueden variar por indicacion, funcion renal, formulacion y politica institucional. Consulta siempre fuentes farmaceuticas actualizadas." : "Dose ranges can vary by indication, renal function, formulation, and institutional policy. Always consult current pharmaceutical references."}
            referenceLinks={[{ href: "https://www.healthychildren.org/English/safety-prevention/at-home/medication-safety/Pages/Acetaminophen-for-Fever-and-Pain.aspx", label: locale === "es" ? "AAP: seguridad del acetaminofén" : "AAP: acetaminophen medication safety" }, { href: "https://www.healthychildren.org/English/safety-prevention/at-home/medication-safety/Pages/Ibuprofen-for-Fever-and-Pain.aspx", label: locale === "es" ? "AAP: seguridad del ibuprofeno" : "AAP: ibuprofen medication safety" }]}
            safety={locale === "es" ? "Verifica decimales, unidades, concentraciones y dosis maxima. Para medicamentos de alto riesgo, confirma el calculo con otro profesional o sistema validado." : "Verify decimals, units, concentrations, and maximum dose. For high-risk medications, confirm the calculation with another professional or validated system."}
            related={[{ href: `/${locale}/calculators/bmi-calculator`, label: locale === "es" ? "IMC pediatrico" : "Pediatric BMI" }, { href: `/${locale}/contact`, label: locale === "es" ? "Reportar error" : "Report an error" }]}
          />
        </div>
      </TooltipProvider>
    </>
  );
}
