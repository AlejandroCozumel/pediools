import CalculatorsList from "./CalculatorsList";
import { JsonLd } from "@/components/JsonLd";
import { getWebSiteSchema, getOrganizationSchema } from "@/lib/structured-data";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "CalculatorsList" });
  return getSeoMetadata({
    title: t("dashboardTitle", { defaultValue: "Pediatric Calculators" }),
    description:
      locale === "es"
        ? "Accede a calculadoras pediatricas de crecimiento, IMC, dosis, laboratorio, presion arterial y bilirrubina con contexto clinico y avisos de seguridad."
        : "Access pediatric calculators for growth, BMI, dosing, labs, blood pressure, and bilirubin with clinical reference context and safety reminders.",
    url: `https://www.pedimath.com/${locale}`,
    image: "/og-image.jpg",
    locale,
    keywords: ["pediatric calculators", "growth chart", "BMI calculator", "dose calculator"]
  });
};

export default function Home() {
  return (
    <>
      <JsonLd data={getWebSiteSchema()} />
      <JsonLd data={getOrganizationSchema()} />
      <CalculatorsList />
    </>
  );
}
