import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { JsonLd } from "@/components/JsonLd";
import { getSeoMetadata } from "@/lib/seo";
import {
  getBreadcrumbSchema,
  getCalculatorSchema,
} from "@/lib/structured-data";
import { CorrectedAgeForm } from "./CorrectedAgeForm";
const route = "/calculators/corrected-age-calculator";
export async function generateMetadata({
  params: { locale = "en" },
}: {
  params: { locale?: string };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: "CorrectedAgeCalculator",
  });
  return getSeoMetadata({
    title: t("seoTitle"),
    description: t("seoDescription"),
    url: `https://www.pedimath.com/${locale}${route}`,
    locale,
    calculator: "corrected-age-calculator",
    keywords:
      locale === "es"
        ? [
            "edad corregida prematuros",
            "calculadora edad corregida",
            "edad posmenstrual",
            "edad cronológica bebé",
          ]
        : [
            "corrected age calculator",
            "adjusted age calculator",
            "premature baby age",
            "postmenstrual age calculator",
          ],
  });
}
export default async function CorrectedAgePage({
  params: { locale = "en" },
}: {
  params: { locale?: string };
}) {
  const t = await getTranslations({
    locale,
    namespace: "CorrectedAgeCalculator",
  });
  const url = `https://www.pedimath.com/${locale}${route}`;
  const parentSource =
    locale === "es"
      ? "https://www.healthychildren.org/Spanish/ages-stages/baby/preemie/Paginas/Corrected-Age-For-Preemies.aspx"
      : "https://www.healthychildren.org/English/ages-stages/baby/preemie/Pages/Corrected-Age-For-Preemies.aspx";
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
      <header className="mx-auto mb-6 max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold text-medical-900 font-heading">
          {t("title")}
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>
      <CorrectedAgeForm />
      <p className="mx-auto mt-5 max-w-3xl text-sm">
        <Link href={`${route}/results`} className="text-medical-700 underline">
          {t("resultsPreviewLink")}
        </Link>
      </p>
      <article
        className="mx-auto mt-8 max-w-3xl space-y-7 rounded-xl border bg-white p-5 text-sm leading-7 text-muted-foreground sm:p-7"
        aria-labelledby="age-guide-title"
      >
        <section className="space-y-3">
          <h2
            id="age-guide-title"
            className="text-2xl font-semibold text-medical-900"
          >
            {t("guideTitle")}
          </h2>
          <p>{t("intro")}</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-medical-900">
            {t("formulaTitle")}
          </h2>
          <p className="rounded-lg bg-medical-50 p-4 font-medium text-medical-900">
            {t("formula")}
          </p>
          <p>{t("formulaText")}</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-medical-900">
            {t("exampleTitle")}
          </h2>
          <p>{t("exampleText")}</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-medical-900">
            {t("visualTitle")}
          </h2>
          <p>{t("visualText")}</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-medical-900">
            {t("useTitle")}
          </h2>
          <p>{t("useText")}</p>
          <p>{t("useText2")}</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-medical-900">
            {t("faqTitle")}
          </h2>
          {(
            [
              "difference",
              "negative",
              "due",
              "months",
              "calendar",
              "share",
            ] as const
          ).map((key) => (
            <details key={key} className="rounded-lg border p-3">
              <summary className="cursor-pointer font-medium text-medical-900">
                {t(`faq.${key}.q`)}
              </summary>
              <p className="mt-2">{t(`faq.${key}.a`)}</p>
            </details>
          ))}
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-medical-900">
            {t("references")}
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <a href={parentSource} className="text-medical-700 underline">
                AAP · {t("developmentLink")}
              </a>
            </li>
            <li>
              <a
                href="https://www.aap.org/en/patient-care/newborn-infant-and-early-childhood-nutrition/newborn-and-infant-nutrition-assessment-tools/term-infant-growth-tools/"
                className="text-medical-700 underline"
              >
                AAP · Term Infant Growth Tools
              </a>
            </li>
            <li>
              <a
                href="https://www.nice.org.uk/guidance/ng72/chapter/Recommendations"
                className="text-medical-700 underline"
              >
                NICE NG72 ·{" "}
                {locale === "es"
                  ? "Seguimiento del desarrollo de niños nacidos prematuramente"
                  : "Developmental follow-up of children born preterm"}
              </a>
            </li>
            <li>
              <Link
                href="/calculators/growth-calculator"
                className="text-medical-700 underline"
              >
                {t("growthLink")}
              </Link>
            </li>
          </ul>
          <p className="text-xs">{t("reviewed")}</p>
        </section>
      </article>
    </>
  );
}
