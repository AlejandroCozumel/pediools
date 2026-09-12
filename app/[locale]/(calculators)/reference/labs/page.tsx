import { Metadata } from "next";
import { getSeoMetadata } from "@/lib/seo";
import { uniqueLabReferenceTests } from "@/lib/pediatric-reference-data";

export async function generateMetadata({ params }: { params: { locale?: string } }): Promise<Metadata> {
  const locale = params.locale === "es" ? "es" : "en";
  return getSeoMetadata({
    title: locale === "es" ? "Rangos de laboratorio pediátrico" : "Pediatric Laboratory Reference Ranges",
    description:
      locale === "es"
        ? "Explora rangos de referencia de laboratorio pediátrico por prueba, edad y sexo, con enlaces a la calculadora y a la fuente CHOP."
        : "Explore pediatric laboratory reference ranges by test, age, and sex, with links to the calculator and CHOP source.",
    url: `https://www.pedimath.com/${locale}/reference/labs`,
    image: "/og-image.jpg",
    locale,
    keywords: ["pediatric lab values", "children reference ranges", "lab ranges by age"],
  });
}

export default function LabReferenceIndex({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const normalizedLocale = locale === "es" ? "es" : "en";
  const groupedTests = uniqueLabReferenceTests.reduce<Record<string, typeof uniqueLabReferenceTests>>((groups, test) => {
    (groups[test.categoryKey] ||= []).push(test);
    return groups;
  }, {});

  return (
    <main className="container mx-auto my-6">
      <h1 className="text-3xl font-bold text-medical-900 font-heading">
        {normalizedLocale === "es" ? "Rangos de laboratorio pediátrico" : "Pediatric Laboratory Reference Ranges"}
      </h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        {normalizedLocale === "es"
          ? "Selecciona una prueba para abrir la calculadora con esa referencia resaltada. Confirma siempre el rango del laboratorio local."
          : "Choose a test to open the calculator with that reference highlighted. Always confirm the local laboratory range."}
      </p>
      <div className="mt-8 space-y-6">
        {Object.entries(groupedTests).map(([categoryKey, tests]) => (
          <section key={categoryKey} aria-labelledby={`lab-category-${categoryKey}`}>
            <h2 id={`lab-category-${categoryKey}`} className="text-xl font-semibold text-medical-900">
              {categoryKey.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tests.map((test) => (
                <a
                  key={test.testKey}
                  href={`/${normalizedLocale}/reference/labs/${test.testKey}`}
                  className="rounded-lg border border-medical-100 bg-white p-4 transition hover:border-medical-300 hover:shadow-sm"
                >
                  <span className="font-medium text-medical-800">
                    {normalizedLocale === "es" && test.nombre ? test.nombre : test.name}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{test.unit}</span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
