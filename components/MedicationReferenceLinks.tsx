import pediatricDoseData from "@/app/data/pediatric-dose.json";

export function MedicationReferenceLinks({ locale }: { locale: "en" | "es" }) {
  return (
    <section className="mt-8 rounded-lg border border-medical-100 bg-medical-50/30 p-4" aria-labelledby="medication-reference-links">
      <h2 id="medication-reference-links" className="text-lg font-semibold text-medical-900">
        {locale === "es" ? "Referencias de dosis por medicamento" : "Medication dose references"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {locale === "es"
          ? "Abre una página con el medicamento seleccionado y sus notas de referencia."
          : "Open a page with the medication selected and its reference notes."}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {pediatricDoseData.medications.map((medication) => (
          <a
            key={medication.id}
            href={`/${locale}/calculators/dose-calculator/${medication.id}`}
            className="text-sm font-medium text-medical-700 underline-offset-4 hover:underline"
          >
            {medication.names[locale]}
          </a>
        ))}
      </div>
    </section>
  );
}
