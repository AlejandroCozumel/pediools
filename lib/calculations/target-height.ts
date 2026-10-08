export type TargetHeightInput = {
  father: string;
  mother: string;
  sex: "male" | "female";
  unit: "cm" | "in";
};
export class TargetHeightInputError extends Error {
  constructor(public field: keyof TargetHeightInput | "heights") {
    super(field);
  }
}

// Children's Mercy: parental heights in cm, sex adjustment ±13 cm,
// with the conventional target range ±8.5 cm. This is not an individual prediction interval.
export function calculateTargetHeight(input: TargetHeightInput) {
  if (input.sex !== "male" && input.sex !== "female")
    throw new TargetHeightInputError("sex");
  if (input.unit !== "cm" && input.unit !== "in")
    throw new TargetHeightInputError("unit");
  const height = (field: "father" | "mother") => {
    const value = Number(input[field]);
    if (!input[field].trim() || !Number.isFinite(value) || value <= 0)
      throw new TargetHeightInputError(field);
    return value * (input.unit === "in" ? 2.54 : 1);
  };
  const fatherCm = height("father");
  const motherCm = height("mother");
  const adjustment = input.sex === "male" ? 13 : -13;
  const targetCm = (fatherCm + motherCm + adjustment) / 2;
  const lowerCm = targetCm - 8.5;
  const upperCm = targetCm + 8.5;
  if (
    ![fatherCm, motherCm, targetCm, lowerCm, upperCm].every(Number.isFinite) ||
    lowerCm <= 0
  )
    throw new TargetHeightInputError("heights");
  return { fatherCm, motherCm, targetCm, lowerCm, upperCm, adjustment };
}
