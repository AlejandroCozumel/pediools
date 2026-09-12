import Link from "next/link";

type ChartInputPromptProps = { locale: string };

export default function ChartInputPrompt({ locale }: ChartInputPromptProps) {
  const isSpanish = locale === "es";

  return (
    <section
      className="container mx-auto my-6 rounded-lg border border-medical-100 bg-medical-50 p-6"
      aria-labelledby="chart-input-prompt-title"
    >
      <h2 id="chart-input-prompt-title" className="text-xl font-semibold text-medical-900">
        {isSpanish ? "Prepare sus datos para ver la gráfica" : "Prepare your data to view the chart"}
      </h2>
      <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
        {isSpanish
          ? "Esta gráfica necesita edad, sexo y mediciones de crecimiento. Use la calculadora para introducir los datos y abrir una gráfica personalizada."
          : "This chart needs age, sex, and growth measurements. Use the calculator to enter the data and open a personalized chart."}
      </p>
      <Link
        className="mt-4 inline-flex rounded-md bg-medical-700 px-4 py-2 font-medium text-white hover:bg-medical-800"
        href={`/${locale}/calculators/growth-calculator`}
      >
        {isSpanish ? "Abrir calculadora de crecimiento" : "Open growth calculator"}
      </Link>
    </section>
  );
}
