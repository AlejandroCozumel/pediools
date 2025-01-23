const typeMappingToTranslation = {
  // Chart Types
  GROWTH_CDC: "Types.chartTypes.GROWTH_CDC",
  GROWTH_WHO: "Types.chartTypes.GROWTH_WHO",
  GROWTH_INTERGROWTH: "Types.chartTypes.GROWTH_INTERGROWTH",

  // Shared Types (used in both charts and calculations)
  BLOOD_PRESSURE: (isChart: boolean) =>
    `Types.${isChart ? "chartTypes" : "calculationTypes"}.BLOOD_PRESSURE`,
  HEART_RATE: (isChart: boolean) =>
    `Types.${isChart ? "chartTypes" : "calculationTypes"}.HEART_RATE`,
  BILIRUBIN: (isChart: boolean) =>
    `Types.${isChart ? "chartTypes" : "calculationTypes"}.BILIRUBIN`,

  // Calculation Types Only
  GROWTH_PERCENTILE: "Types.calculationTypes.GROWTH_PERCENTILE",
} as const;

export type TypeMapping = keyof typeof typeMappingToTranslation;

export const getTranslationKey = (
  type: TypeMapping,
  isChart = false
): string => {
  const value = typeMappingToTranslation[type];
  return typeof value === "function" ? value(isChart) : value;
};
