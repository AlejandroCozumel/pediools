import { getSeoMetadata } from "@/lib/seo";
import { Link } from "@/i18n/routing";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "FAQ" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "FAQ - PediMath" }),
    description:
      locale === "es"
        ? "Preguntas frecuentes sobre calculadoras pediatricas, graficas de crecimiento, fuentes clinicas y limites de uso educativo en PediMath."
        : "Frequently asked questions about PediMath pediatric calculators, growth charts, clinical sources, safety limits, and responsible educational use.",
    url: `https://www.pedimath.com/${locale}/faq`,
    image: "/og-image.jpg",
    locale,
    keywords: ["FAQ", "pediatric tools", "medical calculators"]
  });
};

export default function FAQ({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const isSpanish = locale === "es";
  const items = isSpanish
    ? [
        {
          q: "PediMath reemplaza una evaluacion clinica?",
          a: "No. PediMath es una herramienta educativa de referencia. Los resultados deben verificarse con el contexto del paciente, guias actuales y protocolos institucionales.",
        },
        {
          q: "Que datos necesito para obtener resultados confiables?",
          a: "Depende de la herramienta, pero suelen requerirse edad, sexo, peso, talla, fecha de medicion, edad gestacional o valores de laboratorio correctamente ingresados.",
        },
        {
          q: "Que referencias utiliza PediMath?",
          a: "Las calculadoras y graficas usan referencias reconocidas como CDC, OMS, INTERGROWTH-21st, guias AAP 2017 de presion arterial y guias AAP 2022 de bilirrubina cuando aplica.",
        },
        {
          q: "Puedo usar los resultados en emergencias?",
          a: "No debe depender de PediMath para decisiones de emergencia. Use protocolos locales, evaluacion clinica inmediata y especialistas cuando corresponda.",
        },
        {
          q: "Como reporto un posible error?",
          a: "Use la pagina de contacto para enviar detalles del calculo, datos ingresados, resultado esperado y referencia clinica relacionada.",
        },
        {
          q: "Puedo guardar o enviar datos de pacientes?",
          a: "Las paginas publicas de calculo estan pensadas para uso puntual. Evita enviar informacion identificable por correo o formularios de soporte.",
        },
        {
          q: "Por que puede variar un resultado frente a otra herramienta?",
          a: "Puede variar por redondeo, unidad, edad exacta, estandar seleccionado, actualizacion de guias o diferencias entre referencias locales.",
        },
        {
          q: "Que hago si un resultado parece incorrecto?",
          a: "Revisa unidades, fechas y valores ingresados. Si persiste la duda, confirma con una referencia primaria y reporta el caso sin datos personales.",
        },
      ]
    : [
        {
          q: "Does PediMath replace clinical assessment?",
          a: "No. PediMath is an educational reference tool. Results should be verified against patient context, current guidelines, and institutional protocols.",
        },
        {
          q: "What data do I need for reliable results?",
          a: "It depends on the tool, but calculations commonly require correctly entered age, sex, weight, height, measurement date, gestational age, or lab values.",
        },
        {
          q: "Which references does PediMath use?",
          a: "Calculators and charts use recognized references such as CDC, WHO, INTERGROWTH-21st, 2017 AAP blood pressure guidance, and 2022 AAP bilirubin guidance where applicable.",
        },
        {
          q: "Can I use the results in emergencies?",
          a: "Do not rely on PediMath for emergency decisions. Use local protocols, immediate clinical assessment, and specialist input when needed.",
        },
        {
          q: "How do I report a possible error?",
          a: "Use the contact page and include the calculator, entered data, observed result, expected result, and related clinical reference.",
        },
        {
          q: "Can I save or send patient data?",
          a: "The public calculator pages are intended for point-in-time use. Avoid sending identifiable information through support email or feedback messages.",
        },
        {
          q: "Why might a result differ from another tool?",
          a: "Differences can come from rounding, units, exact age, selected standard, guideline updates, or differences between local reference sources.",
        },
        {
          q: "What should I do if a result looks wrong?",
          a: "Check units, dates, and entered values. If the concern remains, confirm against a primary reference and report the case without personal data.",
        },
      ];

  return (
    <main className="mx-auto my-8 max-w-4xl space-y-8 px-4">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-medical-900 font-heading">
          {isSpanish ? "Preguntas frecuentes" : "Frequently Asked Questions"}
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          {isSpanish
            ? "Respuestas breves sobre el uso responsable de las calculadoras pediatricas y graficas de crecimiento de PediMath."
            : "Short answers about responsible use of PediMath pediatric calculators and growth chart references."}
        </p>
      </section>

      <section className="space-y-5">
        {items.map((item) => (
          <article key={item.q} className="space-y-2 border-b border-border pb-5">
            <h2 className="text-xl font-semibold text-medical-900 font-heading">{item.q}</h2>
            <p className="leading-7 text-muted-foreground">{item.a}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded-lg border border-border p-5">
        <h2 className="text-xl font-semibold text-medical-900 font-heading">
          {isSpanish ? "Uso recomendado" : "Recommended Use"}
        </h2>
        <p className="leading-7 text-muted-foreground">
          {isSpanish
            ? "Use PediMath para calculos repetibles, revision de percentiles y apoyo educativo. Documenta la referencia usada cuando el resultado influye en seguimiento o comunicacion clinica."
            : "Use PediMath for repeatable calculations, percentile review, and educational support. Document the reference used when the result affects follow-up or clinical communication."}
        </p>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link href="/calculators" className="rounded-md bg-medical-600 px-4 py-2 text-sm font-medium text-white hover:bg-medical-700">
          {isSpanish ? "Abrir calculadoras" : "Open calculators"}
        </Link>
        <Link href="/contact" className="rounded-md border border-medical-200 px-4 py-2 text-sm font-medium text-medical-700 hover:bg-medical-50">
          {isSpanish ? "Contactar soporte" : "Contact support"}
        </Link>
      </section>
    </main>
  );
}
