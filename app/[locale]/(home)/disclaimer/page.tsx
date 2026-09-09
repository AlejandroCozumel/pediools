import React from "react";
import AppDisclaimer from "@/components/AppDisclaimer";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  return getSeoMetadata({
    title: locale === "es" ? "Aviso legal medico" : "Medical Calculator Disclaimer",
    description:
      locale === "es"
        ? "Lee los limites de uso de PediMath para calculadoras medicas, referencias pediatricas y decisiones que requieren juicio profesional."
        : "Read PediMath use limits for medical calculators, pediatric references, emergency situations, and decisions that require professional judgment.",
    url: `https://www.pedimath.com/${locale}/disclaimer`,
    image: "/og-image.jpg",
    locale,
    keywords: ["medical calculator disclaimer", "pediatric calculator safety", "clinical decision support"],
  });
};

const Disclaimer = ({ params: { locale = "en" } }: { params: { locale?: string } }) => {
  return (
    <main className="mx-auto my-8 max-w-4xl px-4">
      <h1 className="mb-4 text-3xl font-bold text-medical-900 font-heading">
        {locale === "es" ? "Aviso legal de calculadoras medicas" : "Medical Calculator Disclaimer"}
      </h1>
      <AppDisclaimer />
    </main>
  );
};

export default Disclaimer;
