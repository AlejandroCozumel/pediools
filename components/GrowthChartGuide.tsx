import Link from "next/link";
import { growthChartConfig, GrowthChartStandard } from "@/lib/growth-chart-config";

export default function GrowthChartGuide({ standard, locale }: { standard: GrowthChartStandard; locale: string }) {
  const language = locale === "es" ? "es" : "en";
  const es = language === "es";
  const config = growthChartConfig[standard];
  return (
    <section className="my-8 rounded-xl border bg-white p-5 text-sm leading-7 text-muted-foreground sm:p-6" aria-labelledby="growth-chart-guide">
      <h2 id="growth-chart-guide" className="mb-4 text-xl font-semibold text-medical-900">
        {es ? "Cómo leer esta gráfica" : "How to read this chart"}
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <h3 className="font-semibold text-medical-900">{es ? "Rango y medidas" : "Range and measurements"}</h3>
          <p>{config.name} · {config.range[language]}. {es
            ? `Peso en kilogramos y ${standard === "cdc_child" ? "talla" : "longitud"} en centímetros, con curvas separadas para niños y niñas.`
            : `Weight in kilograms and ${standard === "cdc_child" ? "height" : "length"} in centimeters, with separate curves for boys and girls.`}</p>
          {standard === "who" && <p>{es ? "Esta página muestra los primeros 24 meses del estándar OMS." : "This page displays the first 24 months of the WHO standard."}</p>}
          {standard === "intergrowth" && <p>{es ? "Usa la edad gestacional y las medidas al nacimiento; esta gráfica no muestra el crecimiento posnatal." : "Use gestational age and measurements at birth; this chart does not show postnatal growth."}</p>}
        </div>
        <div>
          <h3 className="font-semibold text-medical-900">{es ? "Qué significa un percentil" : "What a percentile means"}</h3>
          <p>{es ? "P50 es la mediana: aproximadamente la mitad del grupo de referencia tiene una medida menor y la otra mitad, mayor. P10 indica que aproximadamente el 10 % tiene una medida menor, para la misma edad y sexo." : "P50 is the median: approximately half of the reference group has a smaller measurement and half has a larger one. P10 means approximately 10% has a smaller measurement at the same age and sex."}</p>
        </div>
        <div>
          <h3 className="font-semibold text-medical-900">{es ? "Añade una medición" : "Add a measurement"}</h3>
          <p>{es ? "Explora las curvas sin introducir datos. Para añadir tu punto, selecciona el sexo, abre «Añadir medidas» e introduce las fechas y las medidas. El punto rojo representa la medición; cambia entre peso y talla o longitud con los controles." : "Browse the curves without entering data. To add your point, select the sex, open “Add measurements,” and enter the dates and measurements. The red point represents the measurement; use the controls to switch between weight and height or length."}</p>
        </div>
        <div>
          <h3 className="font-semibold text-medical-900">{es ? "Fuente e interpretación" : "Source and interpretation"}</h3>
          <p>{es ? "Un percentil aislado no es un diagnóstico ni una meta de crecimiento. Interpreta las medidas junto con la evolución y el contexto clínico." : "A single percentile is not a diagnosis or a growth target. Interpret measurements alongside growth over time and clinical context."}</p>
          <a href={config.source} target="_blank" rel="noreferrer" className="font-medium text-medical-700 underline">
            {es ? `Consultar la referencia ${config.name}` : `View the ${config.name} reference`}
          </a>
        </div>
      </div>
      {standard === "cdc_infant" && <p className="mt-4">{es ? "En la práctica clínica de EE. UU., CDC recomienda los estándares OMS desde el nacimiento hasta los 2 años. Esta página permite consultar la referencia CDC infantil." : "For U.S. clinical practice, CDC recommends WHO standards from birth to age 2. This page lets you explore the CDC infant reference."} <a className="text-medical-700 underline" href="https://www.cdc.gov/growth-chart-training/hcp/overview/recommended.html" target="_blank" rel="noreferrer">{es ? "Recomendaciones CDC" : "CDC recommendations"}</a>.</p>}
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 font-medium text-medical-700">
        <Link href={`/${locale}/charts`}>{es ? "Todas las gráficas" : "All growth charts"}</Link>
        <Link href={`/${locale}/calculators/growth-calculator`}>{es ? "Calculadora de crecimiento" : "Growth calculator"}</Link>
      </div>
    </section>
  );
}
