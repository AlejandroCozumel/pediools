import { getSeoMetadata } from "@/lib/seo";
import { Link } from "@/i18n/routing";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "About" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "About - PediMath" }),
    description:
      locale === "es"
        ? "Conoce el proposito de PediMath, sus calculadoras pediatricas, referencias clinicas y limites de uso para decisiones que requieren juicio profesional."
        : "Learn about PediMath, its pediatric calculators, clinical references, and use limits for decisions that require professional judgment.",
    url: `https://www.pedimath.com/${locale}/about`,
    image: "/og-image.jpg",
    locale,
    keywords: ["about PediMath", "pediatric tools", "medical calculators"]
  });
};

export default function About({ params: { locale = "en" } }: { params: { locale?: string } }) {
  const isSpanish = locale === "es";

  return (
    <main className="mx-auto my-8 max-w-4xl space-y-8 px-4">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-medical-900 font-heading">
          {isSpanish ? "Acerca de PediMath" : "About PediMath"}
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          {isSpanish
            ? "PediMath es un proyecto gratuito y sin fines de lucro que reúne calculadoras pediátricas y gráficas de crecimiento para consulta educativa y revisión de referencias. Los resultados requieren verificación independiente y no deben utilizarse como base única de decisiones clínicas ni de atención de urgencias."
            : "PediMath is a free, noncommercial project that brings together pediatric calculators and growth charts for educational consultation and reference review. Results require independent verification and must not be the sole basis for clinical decisions or emergency care."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-medical-900 font-heading">
          {isSpanish ? "Como se usan las referencias" : "How References Are Used"}
        </h2>
        <p className="leading-7 text-muted-foreground">
          {isSpanish
            ? "Las herramientas se basan en referencias publicadas como CDC, OMS, INTERGROWTH-21st, AAP 2017 para presion arterial pediatrica y AAP 2022 para bilirrubina neonatal cuando aplica. Cada resultado debe revisarse con edad, sexo, medidas, contexto clinico y guias vigentes."
            : "The tools use published references such as CDC, WHO, INTERGROWTH-21st, 2017 AAP pediatric blood pressure guidance, and 2022 AAP neonatal bilirubin guidance where applicable. Every result should be checked against age, sex, measurements, clinical context, and current guidelines."}
        </p>
        <p className="leading-7 text-muted-foreground">
          {isSpanish
            ? "PediMath es apoyo educativo para calculos y visualizacion. No reemplaza juicio clinico, protocolos institucionales, atencion de emergencia ni consejo medico profesional."
            : "PediMath is educational support for calculation and visualization. It does not replace clinical judgment, institutional protocols, emergency care, or professional medical advice."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-medical-900 font-heading">
          {isSpanish ? "Que puedes hacer aqui" : "What You Can Do Here"}
        </h2>
        <ul className="list-disc space-y-2 pl-6 leading-7 text-muted-foreground">
          <li>{isSpanish ? "Calcular percentiles de crecimiento, IMC y presion arterial." : "Calculate growth, BMI, and blood pressure percentiles."}</li>
          <li>{isSpanish ? "Revisar umbrales de bilirrubina neonatal y dosis pediatricas." : "Review neonatal bilirubin thresholds and pediatric doses."}</li>
          <li>{isSpanish ? "Interpretar valores de laboratorio con rangos pediatricos." : "Interpret laboratory values with pediatric reference ranges."}</li>
          <li>{isSpanish ? "Visualizar graficas CDC, OMS e INTERGROWTH-21st." : "Visualize CDC, WHO, and INTERGROWTH-21st growth charts."}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-medical-900 font-heading">
          {isSpanish ? "Calidad, actualizacion y seguridad" : "Quality, Updates, and Safety"}
        </h2>
        <p className="leading-7 text-muted-foreground">
          {isSpanish
            ? "Las calculadoras estan disenadas para mostrar formulas, rangos y resultados de forma clara. Cuando una referencia clinica cambia, el objetivo es revisar la herramienta correspondiente, actualizar los textos de ayuda y mantener visible el limite de uso educativo."
            : "The calculators are designed to present formulas, ranges, and results clearly. When a clinical reference changes, the goal is to review the affected tool, update help text, and keep the educational-use limitation visible."}
        </p>
        <p className="leading-7 text-muted-foreground">
          {isSpanish
            ? "PediMath no almacena historias clinicas en estas paginas publicas y evita solicitar datos identificables para calculos basicos. Si reportas un error, no incluyas informacion personal del paciente; basta con la herramienta, valores ingresados y resultado observado."
            : "PediMath does not store clinical records on these public pages and avoids asking for identifiable data for basic calculations. If you report an error, do not include personal patient information; the tool name, entered values, and observed result are enough."}
        </p>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link href="/calculators" className="rounded-md bg-medical-600 px-4 py-2 text-sm font-medium text-white hover:bg-medical-700">
          {isSpanish ? "Ver calculadoras" : "View calculators"}
        </Link>
        <Link href="/disclaimer" className="rounded-md border border-medical-200 px-4 py-2 text-sm font-medium text-medical-700 hover:bg-medical-50">
          {isSpanish ? "Leer aviso legal" : "Read disclaimer"}
        </Link>
      </section>
    </main>
  );
}
