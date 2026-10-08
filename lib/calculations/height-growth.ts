import statureData from "@/app/data/cdc-data-height.json";

export type HeightMeasurementInput = {
  years: string;
  months: string;
  height: string;
};
export type HeightMeasurement = {
  ageMonths: number;
  heightCm: number;
  percentile: number;
  zScore: number;
  position: "below" | "within" | "above";
};
export class HeightGrowthInputError extends Error {
  constructor(
    public index: number,
    public field: "years" | "months" | "height" | "order",
  ) {
    super(field);
  }
}
type Sex = "male" | "female";
const rowsFor = (sex: Sex) =>
  statureData.filter((row) => row.Sex === (sex === "male" ? 1 : 2));

// CDC permits interpolation of LMS parameters at finer age intervals.
// Bracket the requested age; never extrapolate beyond the 2–20 year reference.
export function heightReference(ageMonths: number, sex: Sex) {
  if (
    !Number.isFinite(ageMonths) ||
    ageMonths < 24 ||
    ageMonths > 240 ||
    !["male", "female"].includes(sex)
  )
    throw new RangeError("Unsupported CDC stature reference");
  const rows = rowsFor(sex);
  const upperIndex = rows.findIndex((row) => row.Agemos >= ageMonths);
  const upper = rows[upperIndex];
  const lower = rows[Math.max(0, upperIndex - 1)];
  const fraction =
    upper.Agemos === lower.Agemos
      ? 0
      : (ageMonths - lower.Agemos) / (upper.Agemos - lower.Agemos);
  const mix = (key: "L" | "M" | "S") =>
    lower[key] + fraction * (upper[key] - lower[key]);
  const L = mix("L"),
    M = mix("M"),
    S = mix("S");
  const atZ = (z: number) => heightAtZ({ L, M, S }, z);
  return {
    ageMonths,
    L,
    M,
    S,
    P3: atZ(-1.8807936081512509)!,
    P50: M,
    P97: atZ(1.8807936081512509)!,
  };
}

export function heightAtZ(
  reference: { L: number; M: number; S: number },
  z: number,
): number | null {
  const { L, M, S } = reference;
  const base = 1 + L * S * z;
  if (L !== 0 && base <= 0) return null;
  const value =
    L === 0 ? M * Math.exp(S * z) : M * Math.exp(Math.log1p(L * S * z) / L);
  return Number.isFinite(value) && value > 0 ? value : null;
}
function percentile(z: number) {
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return Math.max(0, Math.min(100, 50 * (1 + (z < 0 ? -erf : erf))));
}
export function assessHeight(
  ageMonths: number,
  heightCm: number,
  sex: Sex,
): HeightMeasurement {
  if (!Number.isFinite(heightCm) || heightCm <= 0 || heightCm > 250)
    throw new RangeError("Invalid stature");
  const reference = heightReference(ageMonths, sex);
  const zScore =
    reference.L === 0
      ? Math.log(heightCm / reference.M) / reference.S
      : Math.expm1(reference.L * Math.log(heightCm / reference.M)) /
        (reference.L * reference.S);
  return {
    ageMonths,
    heightCm,
    zScore,
    percentile: percentile(zScore),
    position:
      heightCm < reference.P3
        ? "below"
        : heightCm > reference.P97
          ? "above"
          : "within",
  };
}
export function calculateHeightMeasurements(
  inputs: HeightMeasurementInput[],
  sex: Sex,
  unit: "cm" | "in",
) {
  if (!["cm", "in"].includes(unit))
    throw new RangeError("Unsupported height unit");
  const measurements = inputs.map((input, index) => {
    const years = Number(input.years),
      months = Number(input.months),
      height = Number(input.height);
    if (
      !input.years.trim() ||
      !Number.isInteger(years) ||
      years < 2 ||
      years > 20
    )
      throw new HeightGrowthInputError(index, "years");
    if (
      !input.months.trim() ||
      !Number.isInteger(months) ||
      months < 0 ||
      months > 11 ||
      years * 12 + months > 240
    )
      throw new HeightGrowthInputError(index, "months");
    const heightCm = height * (unit === "in" ? 2.54 : 1);
    if (
      !input.height.trim() ||
      !Number.isFinite(heightCm) ||
      heightCm <= 0 ||
      heightCm > 250
    )
      throw new HeightGrowthInputError(index, "height");
    return assessHeight(years * 12 + months, heightCm, sex);
  });
  // First input is the current measurement; previous measurements must be earlier and unique.
  const ages = new Set<number>();
  measurements.forEach((point, index) => {
    if (
      ages.has(point.ageMonths) ||
      (index > 0 && point.ageMonths >= measurements[0].ageMonths)
    )
      throw new HeightGrowthInputError(index, "order");
    ages.add(point.ageMonths);
  });
  return measurements;
}
export function yearlyHeightReference(sex: Sex, current?: HeightMeasurement) {
  return Array.from({ length: 19 }, (_, index) => {
    const reference = heightReference((index + 2) * 12, sex);
    return {
      ...reference,
      scenario:
        current && reference.ageMonths >= current.ageMonths
          ? heightAtZ(reference, current.zScore)
          : null,
    };
  });
}
