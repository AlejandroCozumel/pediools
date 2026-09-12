import pediatricDoseData from "@/app/data/pediatric-dose.json";
import laboratoryData from "@/app/data/lab-philadelphia.json";

export const medicationIds = pediatricDoseData.medications.map((medication) => medication.id);

export function getMedicationById(id: string) {
  return pediatricDoseData.medications.find((medication) => medication.id === id);
}

export type LabReferenceTest = {
  testKey: string;
  categoryKey: string;
  name: string;
  nombre?: string;
  unit: string;
  ageRanges: Array<Record<string, unknown>>;
};

type LabCategory = {
  tests: Record<string, Omit<LabReferenceTest, "testKey" | "categoryKey">>;
};

export const labReferenceTests: LabReferenceTest[] = Object.entries(laboratoryData)
  .filter(([categoryKey]) => categoryKey !== "metadata")
  .flatMap(([categoryKey, category]) => {
    const categoryData = category as LabCategory;
    return Object.entries(categoryData.tests).map(([testKey, test]) => ({
      testKey,
      categoryKey,
      name: test.name,
      nombre: test.nombre,
      unit: test.unit,
      ageRanges: test.ageRanges,
    }));
  });

// The source includes glucose in two panels. Keep one canonical URL for the
// shared test key rather than publishing duplicate pages with identical slugs.
export const uniqueLabReferenceTests = labReferenceTests.filter(
  (test, index, tests) => tests.findIndex((candidate) => candidate.testKey === test.testKey) === index,
);

export const labTestKeys = uniqueLabReferenceTests.map((test) => test.testKey);

export function getLabReferenceTest(testKey: string) {
  return labReferenceTests.find((test) => test.testKey === testKey);
}
