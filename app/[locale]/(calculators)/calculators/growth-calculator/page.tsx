// app/[locale]/(calculators)/calculators/growth-calculator/page.tsx
import { GrowthForm } from "./GrowthForm";
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
    description: t("description"),
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

export default function GrowthPage() {
  return (
    <div className="container mx-auto">
      <GrowthForm />
    </div>
  );
}
