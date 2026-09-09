import React from 'react'
import { BloodPressureForm } from './BloodPressureForm'
import { JsonLd } from "@/components/JsonLd";
import { SeoToolContent } from "@/components/SeoToolContent";
import { getCalculatorSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "BloodPressureCalculator" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "Blood Pressure Calculator - PediMath" }),
    description:
      locale === "es"
        ? "Calcula percentiles de presion arterial pediatrica con referencias AAP 2017 para clasificar lecturas por edad, sexo y talla."
        : "Calculate pediatric blood pressure percentiles with 2017 AAP references to classify readings by age, sex, height, and clinical context.",
    url: `https://www.pedimath.com/${locale}/calculators/blood-pressure-calculator`,
    image: "/og-image.jpg",
    locale,
    keywords: ["blood pressure calculator", "pediatric blood pressure", "AAP guidelines", "hypertension", "percentile"]
  });
};

const BloodPressureCalculator = ({ params: { locale = "en" } }: { params: { locale?: string } }) => {
  const url = `https://www.pedimath.com/${locale}/calculators/blood-pressure-calculator`;
  const title = locale === "es" ? "Calculadora de presion arterial pediatrica" : "Pediatric Blood Pressure Calculator";
  return (
    <>
      <JsonLd data={getCalculatorSchema({ name: "Pediatric Blood Pressure Calculator", description: "Calculate pediatric blood pressure percentiles and classify hypertension using 2017 AAP Clinical Practice Guidelines for ages 1–17 years.", url, locale })} />
      <JsonLd data={getBreadcrumbSchema([{ name: "Home", url: `https://www.pedimath.com/${locale}` }, { name: "Calculators", url: `https://www.pedimath.com/${locale}/calculators` }, { name: "Blood Pressure Calculator", url }])} />
      <div className="container mx-auto">
        <h1 className="mb-4 text-3xl font-bold text-medical-900 font-heading">{title}</h1>
        <BloodPressureForm/>
        <SeoToolContent
          locale={locale}
          title={title}
          summary={locale === "es" ? "Esta herramienta clasifica lecturas de presion arterial pediatrica usando edad, sexo y talla. Puede mostrar percentiles, categorias clinicas y referencias utiles para documentar controles de presion arterial." : "This tool classifies pediatric blood pressure readings using age, sex, and height. It can show percentiles, clinical categories, and reference values useful for documenting blood pressure checks."}
          inputs={locale === "es" ? ["Edad o fechas para calcular la edad.", "Sexo del paciente.", "Talla o percentil de talla.", "Presion sistolica y diastolica."] : ["Age or dates used to calculate age.", "Patient sex.", "Height or height percentile.", "Systolic and diastolic blood pressure."]}
          references={locale === "es" ? "La clasificacion se basa en referencias pediatricas publicadas, incluidas guias AAP 2017 para edades aplicables. La tecnica de medicion y el tamano del brazalete afectan la interpretacion." : "Classification is based on published pediatric references, including 2017 AAP guidance for applicable ages. Measurement technique and cuff size affect interpretation."}
          safety={locale === "es" ? "Repite mediciones anormales y evalua sintomas, comorbilidades y contexto. Lecturas severas o sintomas requieren atencion clinica inmediata." : "Repeat abnormal measurements and assess symptoms, comorbidities, and context. Severe readings or symptoms require immediate clinical attention."}
          related={[{ href: `/${locale}/calculators/growth-calculator`, label: locale === "es" ? "Percentiles de talla" : "Height percentiles" }, { href: `/${locale}/disclaimer`, label: locale === "es" ? "Aviso legal" : "Disclaimer" }]}
        />
      </div>
    </>
  )
}

export default BloodPressureCalculator
