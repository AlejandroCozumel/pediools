import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { JsonLd } from "@/components/JsonLd";
import { getSeoMetadata } from "@/lib/seo";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { CorrectedAgeResults } from "./CorrectedAgeResults";
const route = "/calculators/corrected-age-calculator/results";
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: "CorrectedAgeCalculator",
  });
  const metadata = getSeoMetadata({
    title: t("publicResultsTitle"),
    description: t("publicResultsDescription"),
    url: `https://www.pedimath.com/${locale}${route}`,
    locale,
    keywords:
      locale === "es"
        ? [
            "calendario edad corregida",
            "tabla edad prematuros",
            "línea de tiempo edad corregida",
          ]
        : [
            "corrected age calendar",
            "preemie age chart",
            "corrected age timeline",
          ],
  });
  const other = { ...metadata.other };
  delete other.referrer;
  return { ...metadata, other, referrer: "no-referrer" };
}
export default async function CorrectedAgeResultsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({
    locale,
    namespace: "CorrectedAgeCalculator",
  });
  const age = (weeks: number) => t("weekDay", { weeks, days: 0 });
  const source =
    locale === "es"
      ? "https://www.healthychildren.org/Spanish/ages-stages/baby/preemie/Paginas/Corrected-Age-For-Preemies.aspx"
      : "https://www.healthychildren.org/English/ages-stages/baby/preemie/Pages/Corrected-Age-For-Preemies.aspx";
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          {
            name: locale === "es" ? "Inicio" : "Home",
            url: `https://www.pedimath.com/${locale}`,
          },
          {
            name: t("title"),
            url: `https://www.pedimath.com/${locale}/calculators/corrected-age-calculator`,
          },
          {
            name: t("publicResultsTitle"),
            url: `https://www.pedimath.com/${locale}${route}`,
          },
        ])}
      />
      <CorrectedAgeResults />
      <article
        aria-labelledby="age-result-guide"
        className="mt-6 space-y-5 rounded-xl border bg-white p-5 text-sm leading-7 text-muted-foreground sm:p-6 print:hidden"
      >
        <h2
          id="age-result-guide"
          className="text-xl font-semibold text-medical-900"
        >
          {t("resultsGuideTitle")}
        </h2>
        <p>{t("resultsGuideIntro")}</p>
        <p>{t("resultsGuideCalendar")}</p>
        <p>{t("resultsGuideShare")}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] text-left text-sm tabular-nums">
            <caption className="pb-3 text-left font-semibold text-medical-900">
              {t("resultsTableTitle")}
            </caption>
            <thead>
              <tr className="border-b">
                {[
                  "gestationColumn",
                  "chronological",
                  "corrected",
                  "postmenstrual",
                ].map((key) => (
                  <th key={key} scope="col" className="py-3 pr-3 font-medium">
                    {t(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[28, 30, 32, 34, 36].map((weeks) => (
                <tr
                  key={weeks}
                  className="border-b transition-colors last:border-0 hover:bg-medical-50"
                >
                  <th scope="row" className="py-3 pr-3 font-medium">
                    {age(weeks)}
                  </th>
                  <td className="py-3 pr-3">{age(16)}</td>
                  <td className="py-3 pr-3">{age(16 - (40 - weeks))}</td>
                  <td className="py-3">{age(weeks + 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs">{t("resultsTableHint")}</p>
        <p>{t("resultsLimits")}</p>
        <p>{t("useText")}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link
            href="/calculators/corrected-age-calculator"
            className="text-medical-700 underline"
          >
            {t("start")}
          </Link>
          <a href={source} className="text-medical-700 underline">
            {t("developmentLink")}
          </a>
        </div>
      </article>
    </>
  );
}
