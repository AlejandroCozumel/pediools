const typeMappingToTranslation = {
  // Chart Types
  GROWTH_CDC: "Types.chartTypes.GROWTH_CDC",
  GROWTH_WHO: "Types.chartTypes.GROWTH_WHO",
  GROWTH_INTERGROWTH: "Types.chartTypes.GROWTH_INTERGROWTH",
  // Shared Types
  BLOOD_PRESSURE: (isChart: boolean) =>
    `Types.${isChart ? "chartTypes" : "calculationTypes"}.BLOOD_PRESSURE`,
  HEART_RATE: (isChart: boolean) =>
    `Types.${isChart ? "chartTypes" : "calculationTypes"}.HEART_RATE`,
  BILIRUBIN: (isChart: boolean) =>
    `Types.${isChart ? "chartTypes" : "calculationTypes"}.BILIRUBIN`,
  // Calculation Types
  GROWTH_PERCENTILE: "Types.calculationTypes.GROWTH_PERCENTILE",
  // Blood Types
  A_POSITIVE: "Types.bloodTypes.A_POSITIVE",
  A_NEGATIVE: "Types.bloodTypes.A_NEGATIVE",
  B_POSITIVE: "Types.bloodTypes.B_POSITIVE",
  B_NEGATIVE: "Types.bloodTypes.B_NEGATIVE",
  O_POSITIVE: "Types.bloodTypes.O_POSITIVE",
  O_NEGATIVE: "Types.bloodTypes.O_NEGATIVE",
  AB_POSITIVE: "Types.bloodTypes.AB_POSITIVE",
  AB_NEGATIVE: "Types.bloodTypes.AB_NEGATIVE",
  // Guardian Relations
  MOTHER: "Types.guardianRelations.MOTHER",
  FATHER: "Types.guardianRelations.FATHER",
  STEPMOTHER: "Types.guardianRelations.STEPMOTHER",
  STEPFATHER: "Types.guardianRelations.STEPFATHER",
  GRANDMOTHER: "Types.guardianRelations.GRANDMOTHER",
  GRANDFATHER: "Types.guardianRelations.GRANDFATHER",
  AUNT: "Types.guardianRelations.AUNT",
  UNCLE: "Types.guardianRelations.UNCLE",
  SIBLING: "Types.guardianRelations.SIBLING",
  LEGAL_GUARDIAN: "Types.guardianRelations.LEGAL_GUARDIAN",
  FOSTER_PARENT: "Types.guardianRelations.FOSTER_PARENT",
  CAREGIVER: "Types.guardianRelations.CAREGIVER",
  OTHER: "Types.guardianRelations.OTHER",
} as const;

export type TypeMapping = keyof typeof typeMappingToTranslation;

export const getTranslationKey = (
  type: TypeMapping,
  isChart = false
): string => {
  const value = typeMappingToTranslation[type];
  return typeof value === "function" ? value(isChart) : value;
};
