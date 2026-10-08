import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { JsonLd } from "@/components/JsonLd";
import { getSeoMetadata } from "@/lib/seo";
import {
  getBreadcrumbSchema,
  getCalculatorSchema,
} from "@/lib/structured-data";
import { TargetHeightForm } from "./TargetHeightForm";
import { yearlyHeightReference } from "@/lib/calculations/height-growth";

const route = "/calculators/target-height-calculator";
export async function generateMetadata({
  params: { locale = "en" },
}: {
  params: { locale?: string };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: "TargetHeightCalculator",
  });
  return getSeoMetadata({
    title: t("seoTitle"),
    description: t("seoDescription"),
    url: `https://www.pedimath.com/${locale}${route}`,
    locale,
    calculator: "target-height-calculator",
    keywords:
      locale === "es"
        ? [
            "calculadora talla diana",
            "talla blanco familiar",
            "cuánto medirá mi hijo",
            "estatura adulta estimada",
            "tabla de estatura por edad",
          ]
        : [
            "child height predictor",
            "mid-parental height calculator",
            "target height calculator",
            "estimated adult height",
            "yearly child height table",
          ],
  });
}

export default async function TargetHeightPage({
  params: { locale = "en" },
}: {
  params: { locale?: string };
}) {
  const t = await getTranslations({
    locale,
    namespace: "TargetHeightCalculator",
  });
  const url = `https://www.pedimath.com/${locale}${route}`;
  const faqKeys = [
    "accuracy",
    "age",
    "missing",
    "boneAge",
    "units",
    "growth",
    "table",
  ] as const;
  const sourceFamily =
    locale === "es"
      ? "https://www.healthychildren.org/Spanish/health-issues/conditions/Glands-Growth-Disorders/paginas/predicting-a-childs-adult-height.aspx"
      : "https://www.healthychildren.org/English/health-issues/conditions/Glands-Growth-Disorders/Pages/Predicting-a-Childs-Adult-Height.aspx";
  const boys = yearlyHeightReference("male");
  const girls = yearlyHeightReference("female");
  const heightNumber = (value: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  return (
    <>
      <JsonLd
        data={getCalculatorSchema({
          name: t("title"),
          description: t("seoDescription"),
          url,
          locale,
        })}
      />
      <JsonLd
        data={getBreadcrumbSchema([
          {
            name: locale === "es" ? "Inicio" : "Home",
            url: `https://www.pedimath.com/${locale}`,
          },
          {
            name: locale === "es" ? "Calculadoras" : "Calculators",
            url: `https://www.pedimath.com/${locale}/calculators`,
          },
          { name: t("title"), url },
        ])}
      />
      <nav
        aria-label={locale === "es" ? "Ruta de navegación" : "Breadcrumb"}
        className="mb-5 flex flex-wrap gap-2 text-xs text-muted-foreground"
      >
        <Link href="/">{locale === "es" ? "Inicio" : "Home"}</Link>
        <span aria-hidden="true">/</span>
        <Link href="/calculators">
          {locale === "es" ? "Calculadoras" : "Calculators"}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t("title")}</span>
      </nav>
      <header className="mb-6 space-y-3">
        <h1 className="text-3xl font-bold text-medical-900 font-heading">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>
      <TargetHeightForm />
      <details className="mt-6 rounded-xl border bg-white p-4 sm:p-6">
        <summary className="cursor-pointer font-medium text-medical-900">
          {t("steps.guideToggle")}
        </summary>
        <article
          className="mt-5 space-y-7 text-sm leading-7 text-muted-foreground"
          aria-labelledby="target-guide-title"
        >
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-medical-900">
              {t("tableBenefitTitle")}
            </h2>
            <p>{t("tableBenefitText")}</p>
            <div className="overflow-x-auto rounded-lg border p-3">
              <table className="w-full text-left text-sm tabular-nums">
                <caption className="pb-3 text-left font-medium text-medical-900">
                  {t("publicTableCaption")}
                </caption>
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-3" scope="col">
                      {t("publicTableAge")}
                    </th>
                    <th className="py-2 pr-3" scope="col">
                      {t("publicTableBoys")}
                    </th>
                    <th className="py-2" scope="col">
                      {t("publicTableGirls")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {boys.map((row, index) => (
                    <tr
                      key={row.ageMonths}
                      className="border-b transition-colors hover:bg-medical-50"
                    >
                      <th scope="row" className="py-2 pr-3 font-normal">
                        {row.ageMonths / 12}
                      </th>
                      <td className="py-2 pr-3">{heightNumber(row.P50)}</td>
                      <td className="py-2">{heightNumber(girls[index].P50)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs leading-6">{t("publicTableHint")}</p>
          </section>
          <section className="space-y-3">
            <h2
              id="target-guide-title"
              className="text-2xl font-semibold text-medical-900 font-heading"
            >
              {t("guideTitle")}
            </h2>
            <p>{t("intro")}</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-medical-900">
              {t("howTitle")}
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              {(["step1", "step2", "step3"] as const).map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ol>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-medical-900">
              {t("formulaHeading")}
            </h2>
            <div className="space-y-2 rounded-lg bg-medical-50 p-4 font-medium text-medical-900">
              <p>{t("boysFormula")}</p>
              <p>{t("girlsFormula")}</p>
            </div>
            <p>{t("formulaExplanation")}</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-medical-900">
              {t("workedTitle")}
            </h2>
            <p>{t("workedBoy")}</p>
            <p>{t("workedGirl")}</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-medical-900">
              {t("rangeTitle")}
            </h2>
            <p>{t("rangeExplanation")}</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-medical-900">
              {t("growth.guideTitle")}
            </h2>
            <p>{t("growth.guideText")}</p>
            <p>{t("growth.guideScenario")}</p>
            <p>{t("growth.guideMethod")}</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-medical-900">
              {t("limitsTitle")}
            </h2>
            <p>{t("limitsText")}</p>
            <p>{t("consultText")}</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-medical-900">
              {t("faqTitle")}
            </h2>
            <div className="divide-y rounded-lg border px-4">
              {faqKeys.map((key) => (
                <details key={key} className="py-3">
                  <summary className="cursor-pointer font-medium text-medical-900">
                    <h3 className="inline">{t(`faq.${key}.q`)}</h3>
                  </summary>
                  <p className="pt-3">{t(`faq.${key}.a`)}</p>
                </details>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-medical-900">
              {t("sourcesTitle")}
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              {[
                [
                  "https://www.cmh.edu/health-care-providers/pediatrician-guides/endocrinology/growth-failure/",
                  "sourceMethod",
                ],
                [sourceFamily, "sourceFamily"],
                [
                  "https://www.cdc.gov/growthcharts/cdc-data-files.htm",
                  "sourceCdc",
                ],
                [
                  "https://pedsendo.org/patient-resource/short-stature/",
                  "sourceGrowth",
                ],
              ].map(([href, key]) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-medical-700 underline underline-offset-4"
                  >
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs">{t("updated")}</p>
            <Link
              href="/disclaimer"
              className="inline-block text-medical-700 underline"
            >
              {t("disclaimerLink")}
            </Link>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-medical-900">
              {t("relatedTitle")}
            </h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-3 font-medium text-medical-700 underline underline-offset-4">
              <li>
                <Link href="/calculators/growth-calculator">
                  {t("growthLink")}
                </Link>
              </li>
              <li>
                <Link href="/charts">{t("chartsLink")}</Link>
              </li>
              <li>
                <Link href="/calculators/bmi-calculator">{t("bmiLink")}</Link>
              </li>
            </ul>
          </section>
        </article>
      </details>
    </>
  );
}
