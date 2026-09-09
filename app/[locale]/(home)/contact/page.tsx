import { getSeoMetadata } from "@/lib/seo";
import { Link } from "@/i18n/routing";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "Contact" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "Contact - PediMath" }),
    description:
      locale === "es"
        ? "Contacta a PediMath para soporte, comentarios, reporte de errores o sugerencias sobre calculadoras pediatricas y referencias clinicas."
        : "Contact PediMath for support, feedback, error reports, or suggestions about pediatric calculators, growth charts, clinical references, and safety notes.",
    url: `https://www.pedimath.com/${locale}/contact`,
    image: "/og-image.jpg",
    locale,
    keywords: ["contact PediMath", "support", "medical calculators"]
  });
};

export default function Contact({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const isSpanish = locale === "es";

  return (
    <main className="mx-auto my-8 max-w-3xl space-y-8 px-4">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-medical-900 font-heading">
          {isSpanish ? "Contacto" : "Contact"}
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          {isSpanish
            ? "Envia comentarios, preguntas de soporte o reportes de posibles errores en calculadoras y referencias."
            : "Send feedback, support questions, or reports of possible errors in calculators and references."}
        </p>
      </section>

      <section className="space-y-4 rounded-lg border border-border p-5">
        <h2 className="text-xl font-semibold text-medical-900 font-heading">
          {isSpanish ? "Correo de soporte" : "Support Email"}
        </h2>
        <p className="leading-7 text-muted-foreground">
          {isSpanish
            ? "Para que el reporte sea util, incluye la pagina, datos ingresados, resultado observado, resultado esperado y referencia clinica si la tienes."
            : "For useful reports, include the page, entered values, observed result, expected result, and clinical reference if available."}
        </p>
        <a href="mailto:alejandro@pedimath.com" className="inline-flex text-sm font-semibold text-medical-700 hover:text-medical-900">
          alejandro@pedimath.com
        </a>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-medical-900 font-heading">
          {isSpanish ? "Que incluir en un reporte" : "What to Include in a Report"}
        </h2>
        <ul className="list-disc space-y-2 pl-6 leading-7 text-muted-foreground">
          <li>{isSpanish ? "Nombre de la calculadora o grafica usada." : "Name of the calculator or chart used."}</li>
          <li>{isSpanish ? "Valores ingresados, unidades y fecha aproximada de medicion." : "Entered values, units, and approximate measurement date."}</li>
          <li>{isSpanish ? "Resultado observado y resultado esperado." : "Observed result and expected result."}</li>
          <li>{isSpanish ? "Referencia clinica que respalda el comentario, si esta disponible." : "Clinical reference supporting the comment, if available."}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-medical-900 font-heading">
          {isSpanish ? "Antes de usar resultados clinicos" : "Before Using Clinical Results"}
        </h2>
        <p className="leading-7 text-muted-foreground">
          {isSpanish
            ? "Verifica decisiones importantes con guias actualizadas, protocolos institucionales y juicio profesional. PediMath no esta disenado para reemplazar atencion medica."
            : "Verify important decisions against current guidelines, institutional protocols, and professional judgment. PediMath is not designed to replace medical care."}
        </p>
      </section>

      <Link href="/disclaimer" className="inline-flex rounded-md border border-medical-200 px-4 py-2 text-sm font-medium text-medical-700 hover:bg-medical-50">
        {isSpanish ? "Leer aviso legal" : "Read disclaimer"}
      </Link>
    </main>
  );
}
