import React from "react";
import AppDisclaimer from "@/components/AppDisclaimer";
import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";

export const generateMetadata = async ({
  params,
}: {
  params: { locale?: string };
}): Promise<Metadata> => {
  const locale = params?.locale || "en";
  return getSeoMetadata({
    title:
      locale === "es" ? "Aviso legal médico" : "Medical Calculator Disclaimer",
    description:
      locale === "es"
        ? "Lee la finalidad educativa, las limitaciones, la verificación independiente y el aviso de responsabilidad de las calculadoras médicas gratuitas de PediMath."
        : "Read the educational purpose, limitations, independent verification requirements, and responsibility notice for PediMath’s free medical calculators.",
    url: `https://www.pedimath.com/${locale}/disclaimer`,
    image: "/og-image.jpg",
    locale,
    keywords: [
      "medical calculator disclaimer",
      "pediatric calculator safety",
      "clinical decision support",
    ],
  });
};

const Disclaimer = ({
  params: { locale = "en" },
}: {
  params: { locale?: string };
}) => {
  return (
    <article className="mx-auto my-8 max-w-4xl px-4">
      <h1 className="mb-4 text-3xl font-bold text-medical-900 font-heading">
        {locale === "es"
          ? "Aviso legal de calculadoras médicas"
          : "Medical Calculator Disclaimer"}
      </h1>
      <AppDisclaimer />
    </article>
  );
};

export default Disclaimer;
