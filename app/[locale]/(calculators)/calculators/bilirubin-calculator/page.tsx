import React from 'react'
import { BilirubinThresholdsForm } from './BilirubinThresholdsForm'
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "BilirubinCalculator" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "Bilirubin Calculator - PediMath" }),
    description:
      locale === "es"
        ? "Evalua bilirrubina neonatal y umbrales AAP 2022 para fototerapia o exanguinotransfusion en recien nacidos de 35 semanas o mas."
        : "Assess neonatal bilirubin and 2022 AAP thresholds for phototherapy or exchange transfusion in newborns 35 weeks or older.",
    url: `https://www.pedimath.com/${locale}/calculators/bilirubin-calculator`,
    image: "/og-image.jpg",
    locale,
    keywords: ["bilirubin calculator", "neonatal jaundice", "bilirubin thresholds", "treatment"]
  });
};

const BilirubinCalculator = ({ params: { locale = "en" } }: { params: { locale?: string } }) => {
  const url = `https://www.pedimath.com/${locale}/calculators/bilirubin-calculator`;
  const title = locale === "es" ? "Calculadora de umbrales de bilirrubina neonatal" : "Neonatal Bilirubin Threshold Calculator";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: locale === "es" ? "Calculadora de umbrales de bilirrubina neonatal" : "Neonatal Bilirubin Threshold Calculator", description: locale === "es" ? "Evalúa la bilirrubina neonatal y revisa umbrales AAP 2022 para fototerapia y exanguinotransfusión." : "Assess neonatal bilirubin and review AAP 2022 thresholds for phototherapy and exchange transfusion.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: locale === "es" ? "Inicio" : "Home", url: `https://www.pedimath.com/${locale}` }, { name: locale === "es" ? "Calculadoras" : "Calculators", url: `https://www.pedimath.com/${locale}/calculators` }, { name: locale === "es" ? "Bilirrubina neonatal" : "Bilirubin Calculator", url }])} />
      <div className="container mx-auto">
        <h1 className="mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
        <BilirubinThresholdsForm/>
        <SeoToolContent
          locale={locale}
          title={title}
          summary={locale === "es" ? "La calculadora de bilirrubina neonatal compara niveles de bilirrubina con umbrales de manejo segun edad en horas, edad gestacional y factores de riesgo. Es una ayuda para revisar ictericia neonatal en recien nacidos elegibles." : "The neonatal bilirubin calculator compares bilirubin levels with management thresholds using age in hours, gestational age, and risk factors. It supports jaundice review in eligible newborns."}
          inputs={locale === "es" ? ["Edad del recien nacido en horas.", "Edad gestacional.", "Nivel de bilirrubina y unidad.", "Factores de riesgo neurotoxico si estan presentes."] : ["Newborn age in hours.", "Gestational age.", "Bilirubin level and unit.", "Neurotoxicity risk factors when present."]}
          references={locale === "es" ? "La interpretacion se basa en guias AAP 2022 para recien nacidos de 35 semanas o mas. Verifica que el paciente este dentro del rango de aplicacion." : "Interpretation is based on 2022 AAP guidance for newborns 35 weeks or older. Verify that the patient is within the applicable range."}
          referenceLinks={[{ href: "https://publications.aap.org/pediatrics/article/150/3/e2022058859/188726/Management-of-Hyperbilirubinemia-in-the-Newborn", label: locale === "es" ? "Guía AAP 2022 sobre hiperbilirrubinemia" : "AAP 2022 hyperbilirubinemia guideline" }]}
          safety={locale === "es" ? "La ictericia significativa, signos neurologicos o valores cercanos a exanguinotransfusion requieren evaluacion urgente y manejo especializado." : "Significant jaundice, neurologic signs, or values near exchange thresholds require urgent evaluation and specialist management."}
          related={[{ href: `/${locale}/disclaimer`, label: locale === "es" ? "Aviso legal" : "Disclaimer" }, { href: `/${locale}/contact`, label: locale === "es" ? "Reportar error" : "Report an error" }]}
        />
      </div>
    </>
  )
}

export default BilirubinCalculator
