export type PatientInput = {
  weight: string;
  weightUnit: "kg" | "lb";
  age: string;
  ageUnit: "years" | "months";
  height: string;
  heightUnit: "cm" | "in";
};
export type MedicationRecord = {
  id: string;
  names: { en: string; es: string };
  inputs: string[];
  dosingType: string;
  doseDefault?: number;
  doseRange?: number[];
  maxDose?: number;
  maxDailyDose?: number;
  ageBrackets?: { minAge: number; maxAge: number; dose: number }[];
  weightBrackets?: { minWeight: number; maxWeight: number; dose: number }[];
  concentrations: {
    mg: number;
    mL: number;
    type: string;
    labels: { en: string; es: string };
    common?: boolean;
  }[];
  frequencies: {
    value: string;
    labels: { en: string; es: string };
    descriptions?: { en: string; es: string };
    common?: boolean;
  }[];
  durationOptions?: number[];
  durationDefault?: number;
  notes?: { en: string; es: string };
  referenceUrl?: string;
};
export type DoseResult = {
  perDose: number;
  total: number | null;
  volume: number;
  totalVolume: number | null;
  unit: "mg" | "mcg" | "units";
  volumeUnit: "mL" | "tablets";
  period: "day" | "cycle" | "hour" | "unknown";
  originalPerDose: number;
  originalTotal: number | null;
  limited: boolean;
  limits: { value: number; period: "dose" | "day" | "cycle" }[];
  timesPerDay: number | null;
  formula: string;
  bsa?: number;
  effectiveBsa?: number;
};
export class DoseInputError extends Error {
  constructor(
    public field: string,
    public code: string,
  ) {
    super(code);
  }
}
export function positive(value: string, field: string, allowZero = false) {
  const number = Number(value);
  if (
    !value.trim() ||
    !Number.isFinite(number) ||
    (allowZero ? number < 0 : number <= 0)
  )
    throw new DoseInputError(field, "positive");
  return number;
}
function maximum(value: string) {
  return value.trim() ? positive(value, "maximum") : null;
}
export function metricWeight(patient: PatientInput) {
  return (
    positive(patient.weight, "weight") *
    (patient.weightUnit === "lb" ? 0.453592 : 1)
  );
}
export function frequencyCount(frequency: string): number | null {
  if (frequency === "PRN" || /^q\d+-\d+h$/.test(frequency)) return null;
  const named: Record<string, number> = { qD: 1, BID: 2, TID: 3, QID: 4 };
  if (named[frequency]) return named[frequency];
  const interval = /^q(\d+)h$/.exec(frequency);
  if (interval && Number(interval[1]) > 0) return 24 / Number(interval[1]);
  throw new DoseInputError("frequency", "frequency");
}
function finiteResult(result: DoseResult) {
  if (
    ![
      result.perDose,
      result.volume,
      result.originalPerDose,
      result.total ?? 0,
      result.totalVolume ?? 0,
    ].every(Number.isFinite) ||
    result.perDose <= 0 ||
    result.volume <= 0
  ) {
    throw new DoseInputError("dose", "positive");
  }
  return result;
}
export function calculateMedication(
  medication: MedicationRecord,
  patient: PatientInput,
  concentrationIndex: number,
  frequency: string,
): DoseResult {
  if (!medication.frequencies.some((option) => option.value === frequency))
    throw new DoseInputError("frequency", "frequency");
  const concentration = medication.concentrations[concentrationIndex];
  if (!concentration || !(concentration.mg > 0) || !(concentration.mL > 0))
    throw new DoseInputError("concentration", "concentration");
  const weight = medication.inputs.includes("weight")
    ? metricWeight(patient)
    : null;
  const age = medication.inputs.includes("age")
    ? positive(patient.age, "age", true) /
      (patient.ageUnit === "months" ? 12 : 1)
    : null;
  const times = frequencyCount(frequency);
  let perDose = 0;
  let formula = "";
  if (
    medication.dosingType === "mg/kg/day" ||
    medication.dosingType === "mg/kg/dose"
  ) {
    if (!weight || !medication.doseDefault)
      throw new DoseInputError("medication", "medication");
    if (medication.dosingType === "mg/kg/day" && !times)
      throw new DoseInputError("frequency", "fixedFrequency");
    perDose =
      (medication.doseDefault * weight) /
      (medication.dosingType === "mg/kg/day" ? times! : 1);
    formula = `${medication.doseDefault} ${medication.dosingType} × ${formatDose(weight)} kg${medication.dosingType === "mg/kg/day" ? ` ÷ ${times}` : ""}`;
  } else if (medication.dosingType === "weight_brackets") {
    const bracket = medication.weightBrackets?.find(
      (b) => weight! >= b.minWeight && weight! <= b.maxWeight,
    );
    if (!bracket) throw new DoseInputError("weight", "bracket");
    perDose = bracket.dose;
    formula = `${bracket.minWeight}–${bracket.maxWeight} kg → ${perDose} mg`;
  } else if (medication.dosingType === "age_brackets") {
    const bracket = medication.ageBrackets?.find(
      (b) => age! >= b.minAge && age! <= b.maxAge,
    );
    if (!bracket) throw new DoseInputError("age", "bracket");
    perDose = bracket.dose;
    formula = `${bracket.minAge}–${bracket.maxAge} y → ${perDose} mg`;
  } else throw new DoseInputError("medication", "medication");
  const originalPerDose = perDose;
  const originalTotal = times ? perDose * times : null;
  const limits: DoseResult["limits"] = [];
  if (medication.maxDailyDose && weight && times) {
    const limit = medication.maxDailyDose * weight;
    limits.push({ value: limit, period: "day" });
    perDose = Math.min(perDose, limit / times);
  }
  if (medication.maxDose) {
    limits.push({ value: medication.maxDose, period: "dose" });
    perDose = Math.min(perDose, medication.maxDose);
  }
  const volume = (perDose / concentration.mg) * concentration.mL;
  return finiteResult({
    perDose,
    total: times ? perDose * times : null,
    volume,
    totalVolume: times ? volume * times : null,
    unit: "mg",
    volumeUnit: concentration.type === "tablet" ? "tablets" : "mL",
    period: times ? "day" : "unknown",
    originalPerDose,
    originalTotal,
    limited: perDose < originalPerDose,
    limits,
    timesPerDay: times,
    formula,
  });
}
export type CustomDoseInput = {
  dose: string;
  doseUnit: "mg" | "mL" | "tablets";
  basis: "kg-day" | "kg-dose" | "day" | "dose";
  frequency: string;
  concentration: string;
  concentrationUnit: "mg/mL" | "mg/tablet";
  maximum: string;
};
export function calculateCustom(
  input: CustomDoseInput,
  patient: PatientInput,
): DoseResult {
  const dose = positive(input.dose, "dose");
  const concentration = positive(input.concentration, "concentration");
  const times = frequencyCount(input.frequency);
  if (!times) throw new DoseInputError("frequency", "fixedFrequency");
  if (
    (input.doseUnit === "mL" && input.concentrationUnit !== "mg/mL") ||
    (input.doseUnit === "tablets" && input.concentrationUnit !== "mg/tablet")
  ) {
    throw new DoseInputError("concentration", "units");
  }
  const weight = input.basis.startsWith("kg") ? metricWeight(patient) : 1;
  // Convert the entered quantity to mg before applying any mass-based limits.
  const mass = dose * (input.doseUnit === "mg" ? 1 : concentration);
  const originalPerDose =
    (mass * weight) / (input.basis.endsWith("day") ? times : 1);
  const originalTotal = originalPerDose * times;
  const limit = maximum(input.maximum);
  const perDose = limit
    ? Math.min(originalPerDose, limit / times)
    : originalPerDose;
  return finiteResult({
    perDose,
    total: perDose * times,
    volume: perDose / concentration,
    totalVolume: (perDose * times) / concentration,
    unit: "mg",
    volumeUnit: input.concentrationUnit === "mg/tablet" ? "tablets" : "mL",
    period: "day",
    originalPerDose,
    originalTotal,
    limited: perDose < originalPerDose,
    limits: limit ? [{ value: limit, period: "day" }] : [],
    timesPerDay: times,
    formula: `${formatDose(mass)} mg${input.basis.startsWith("kg") ? ` × ${formatDose(weight)} kg` : ""}${input.basis.endsWith("day") ? ` ÷ ${times}` : ""}`,
  });
}
export type BsaDoseInput = {
  dose: string;
  doseUnit: "mg" | "mcg" | "units";
  basis: "day" | "dose";
  frequency: string;
  concentration: string;
  concentrationUnit: "mg/mL" | "mcg/mL" | "units/mL";
  maximum: string;
  method: "actual" | "normalized";
  medicationName: string;
};
export function calculateBsa(
  input: BsaDoseInput,
  patient: PatientInput,
): DoseResult {
  const height =
    positive(patient.height, "height") *
    (patient.heightUnit === "in" ? 2.54 : 1);
  const weight = metricWeight(patient);
  const dose = positive(input.dose, "dose");
  let concentration = positive(input.concentration, "concentration");
  const concentrationMass = input.concentrationUnit.split("/")[0];
  if ((input.doseUnit === "units") !== (concentrationMass === "units"))
    throw new DoseInputError("concentration", "units");
  if (input.doseUnit === "mcg" && concentrationMass === "mg")
    concentration *= 1000;
  if (input.doseUnit === "mg" && concentrationMass === "mcg")
    concentration /= 1000;
  const bsa = Math.sqrt((height * weight) / 3600);
  const effectiveBsa = input.method === "normalized" ? 1.73 : bsa;
  const originalTotal = dose * effectiveBsa;
  const cycle = ["weekly", "q2weeks", "q3weeks"].includes(input.frequency);
  const infusion = input.frequency === "continuous";
  if (infusion && input.basis !== "day")
    throw new DoseInputError("dose", "infusionBasis");
  const times = cycle ? null : infusion ? 24 : frequencyCount(input.frequency);
  if (!cycle && !times) throw new DoseInputError("frequency", "fixedFrequency");
  const divider = !cycle && input.basis === "day" ? times! : 1;
  const originalPerDose = originalTotal / divider;
  const limit = maximum(input.maximum);
  const amount = limit ? Math.min(originalTotal, limit) : originalTotal;
  const perDose = amount / divider;
  const total = cycle
    ? amount
    : input.basis === "day"
      ? amount
      : amount * times!;
  const period = cycle ? "cycle" : infusion ? "hour" : "day";
  const limitPeriod = cycle ? "cycle" : input.basis === "day" ? "day" : "dose";
  return finiteResult({
    perDose,
    total,
    volume: perDose / concentration,
    totalVolume: total / concentration,
    unit: input.doseUnit,
    volumeUnit: "mL",
    period,
    originalPerDose,
    originalTotal:
      cycle || input.basis === "day" ? originalTotal : originalTotal * times!,
    limited: amount < originalTotal,
    limits: limit ? [{ value: limit, period: limitPeriod }] : [],
    timesPerDay: times,
    bsa,
    effectiveBsa,
    formula: `${dose} ${input.doseUnit}/m² × ${formatDose(effectiveBsa, 4)} m²${divider !== 1 ? ` ÷ ${divider}` : ""}`,
  });
}
export function formatDose(value: number, digits = 3) {
  // Leading zero, no trailing zeroes; preserve small nonzero quantities.
  if (value !== 0 && Math.abs(value) < 10 ** -digits)
    return new Intl.NumberFormat("en-US", {
      useGrouping: false,
      maximumSignificantDigits: 3,
    }).format(value);
  return String(Number(value.toFixed(digits)));
}
