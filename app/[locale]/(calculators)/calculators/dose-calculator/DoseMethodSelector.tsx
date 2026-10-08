import DoseCalculatorWorkspace from "@/components/DoseCalculatorWorkspace";

export function DoseMethodSelector({
  initialMedicationId,
}: {
  initialMedicationId?: string;
}) {
  return <DoseCalculatorWorkspace initialMedicationId={initialMedicationId} />;
}
