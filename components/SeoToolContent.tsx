type SeoToolContentProps = {
  locale?: string;
  title: string;
  summary: string;
  inputs: string[];
  references: string;
  safety: string;
  related?: { href: string; label: string }[];
};

export function SeoToolContent({
  locale = "en",
  title,
  summary,
  inputs,
  references,
  safety,
  related = [],
}: SeoToolContentProps) {
  const isSpanish = locale === "es";

  return (
    <section className="mt-8 space-y-6 rounded-lg border border-border bg-white p-5 text-sm leading-7 text-muted-foreground">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-medical-900 font-heading">
          {isSpanish ? `Sobre ${title}` : `About ${title}`}
        </h2>
        <p>{summary}</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-medical-900 font-heading">
          {isSpanish ? "Datos necesarios" : "Required Inputs"}
        </h3>
        <ul className="list-disc space-y-1 pl-6">
          {inputs.map((input) => (
            <li key={input}>{input}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-medical-900 font-heading">
          {isSpanish ? "Referencias y limites" : "References and Limits"}
        </h3>
        <p>{references}</p>
        <p>{safety}</p>
        <p>
          {isSpanish
            ? "Interpreta los resultados como una ayuda estructurada para revisar datos clinicos, no como una respuesta automatica. Si los datos no coinciden con la exploracion, repite la medicion, revisa unidades y confirma que la edad o fecha usada sea correcta."
            : "Interpret results as a structured aid for reviewing clinical data, not as an automatic answer. If the output does not match the exam, repeat the measurement, review units, and confirm that the age or date used is correct."}
        </p>
        <p>
          {isSpanish
            ? "Para seguimiento, compara resultados con mediciones previas y documenta la fuente de referencia utilizada. Los cambios importantes, valores extremos o decisiones terapeuticas deben evaluarse con guias actualizadas y criterio profesional."
            : "For follow-up, compare results with prior measurements and document the reference source used. Important changes, extreme values, or therapeutic decisions should be evaluated with current guidelines and professional judgment."}
        </p>
      </div>

      {related.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-medical-900 font-heading">
            {isSpanish ? "Herramientas relacionadas" : "Related Tools"}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {related.map((item) => (
              <li key={item.href}>
                <a className="font-medium text-medical-700 hover:text-medical-900" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
