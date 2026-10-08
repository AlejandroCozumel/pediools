export type GrowthChartStandard = "cdc_child" | "cdc_infant" | "who" | "intergrowth";
export type GrowthChartMetric = "weight" | "height";
export type GrowthChartGender = "male" | "female";

export const growthChartConfig = {
  cdc_child: {
    name: "CDC", minMonths: 24, maxMonths: 240,
    range: { en: "2–20 years", es: "2–20 años" },
    source: "https://www.cdc.gov/growthcharts/cdc-data-files.htm",
  },
  cdc_infant: {
    name: "CDC", minMonths: 0, maxMonths: 36,
    range: { en: "Birth–36 months", es: "Nacimiento–36 meses" },
    source: "https://www.cdc.gov/growthcharts/cdc-data-files.htm",
  },
  who: {
    name: "WHO", minMonths: 0, maxMonths: 24,
    range: { en: "Birth–24 months", es: "Nacimiento–24 meses" },
    source: "https://www.who.int/tools/child-growth-standards",
  },
  intergrowth: {
    name: "INTERGROWTH-21st", minMonths: 0, maxMonths: 0,
    range: { en: "24 weeks–42 weeks + 6 days at birth", es: "24 semanas–42 semanas + 6 días al nacer" },
    source: "https://intergrowth21.tghn.org/standards-tools/",
  },
} as const;

export function referenceChartData(gender: GrowthChartGender) {
  return {
    success: true,
    originalInput: { weight: { gender }, height: { gender } },
    data: { weight: [], height: [] },
  };
}
