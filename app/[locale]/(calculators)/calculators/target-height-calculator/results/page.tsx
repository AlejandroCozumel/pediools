import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TargetHeightResults } from "./TargetHeightResults";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: "TargetHeightCalculator.steps",
  });
  return {
    title: t("resultPageTitle"),
    description: t("resultPageDescription"),
    robots: { index: false, follow: false },
    referrer: "no-referrer",
    alternates: {
      canonical: `https://www.pedimath.com/${locale}/calculators/target-height-calculator`,
    },
  };
}

export default function TargetHeightResultsPage() {
  return <TargetHeightResults />;
}
