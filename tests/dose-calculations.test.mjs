import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  new URL("../lib/calculations/dose-calculations.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ES2020,
  },
}).outputText;
const {
  calculateMedication,
  calculateCustom,
  calculateBsa,
  frequencyCount,
  formatDose,
  DoseInputError,
} = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const records = JSON.parse(
  readFileSync(
    new URL("../app/data/pediatric-dose.json", import.meta.url),
    "utf8",
  ),
).medications;
const med = (id) => records.find((item) => item.id === id);
const patient = {
  weight: "20",
  weightUnit: "kg",
  age: "5",
  ageUnit: "years",
  height: "110",
  heightUnit: "cm",
};
const custom = {
  dose: "10",
  doseUnit: "mg",
  basis: "kg-day",
  frequency: "BID",
  concentration: "20",
  concentrationUnit: "mg/mL",
  maximum: "",
};
const bsa = {
  dose: "100",
  doseUnit: "mg",
  basis: "day",
  frequency: "BID",
  concentration: "10",
  concentrationUnit: "mg/mL",
  maximum: "",
  method: "actual",
  medicationName: "",
};
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
function rejects(run, field, code) {
  assert.throws(
    run,
    (error) =>
      error instanceof DoseInputError &&
      error.field === field &&
      (!code || error.code === code),
  );
}

test("medication per-dose regimen produces mass and volume in consistent units", () => {
  const result = calculateMedication(med("paracetamol"), patient, 0, "q6h");
  assert.equal(result.perDose, 300);
  assert.equal(result.total, 1200);
  assert.equal(result.volume, 9.375);
  assert.equal(result.limited, false);
});
test("daily regimen is divided by frequency", () => {
  const result = calculateMedication(med("amoxicillin"), patient, 0, "BID");
  assert.equal(result.total, 1200);
  assert.equal(result.perDose, 600);
});
test("q12h is twice daily, including medication records absent from the old global map", () => {
  const result = calculateMedication(med("ibuprofen"), patient, 0, "q12h");
  assert.equal(result.timesPerDay, 2);
  assert.equal(result.perDose, 150);
  assert.equal(result.total, 300);
});
test("daily and single-dose caps agree with the final dose and volume", () => {
  const result = calculateMedication(
    med("paracetamol"),
    { ...patient, weight: "60" },
    0,
    "q6h",
  );
  assert.equal(result.originalPerDose, 900);
  assert.equal(result.perDose, 640);
  assert.equal(result.total, 2560);
  assert.equal(result.volume, 20);
  assert.equal(result.limited, true);
});
test("daily cap can be stricter than the per-dose cap", () => {
  const record = { ...med("paracetamol"), maxDailyDose: 30 };
  const result = calculateMedication(record, patient, 0, "q6h");
  assert.equal(result.perDose, 150);
  assert.equal(result.total, 600);
  assert.equal(result.volume, 4.6875);
});
test("tablet equivalents are not rounded up", () => {
  const record = med("paracetamol");
  const index = record.concentrations.findIndex(
    (item) => item.type === "tablet" && item.mg === 160,
  );
  const result = calculateMedication(record, patient, index, "q6h");
  assert.equal(result.volumeUnit, "tablets");
  assert.equal(result.volume, 1.875);
  assert.equal(result.perDose, 300);
});
test("required age cannot be omitted even when weight is present", () => {
  rejects(
    () =>
      calculateMedication(
        med("paracetamol"),
        { ...patient, age: "" },
        0,
        "q6h",
      ),
    "age",
  );
});
test("age in months is converted to years for age brackets", () => {
  const result = calculateMedication(
    med("loratadine"),
    { ...patient, age: "24", ageUnit: "months" },
    0,
    "qD",
  );
  assert.equal(result.perDose, 5);
});
test("unsupported age and weight brackets fail instead of yielding a zero or extrapolated dose", () => {
  rejects(
    () =>
      calculateMedication(med("loratadine"), { ...patient, age: "1" }, 0, "qD"),
    "age",
    "bracket",
  );
  rejects(
    () =>
      calculateMedication(
        med("ondansetron"),
        { ...patient, weight: "7" },
        0,
        "q8h",
      ),
    "weight",
    "bracket",
  );
});
test("as-needed dosing has no invented daily total", () => {
  const result = calculateMedication(med("ondansetron"), patient, 0, "PRN");
  assert.equal(result.perDose, 4);
  assert.equal(result.total, null);
  assert.equal(result.totalVolume, null);
  assert.equal(result.timesPerDay, null);
});
test("variable intervals have no silently chosen frequency", () => {
  const result = calculateMedication(
    med("salbutamol_nebulizer"),
    patient,
    0,
    "q4-6h",
  );
  assert.equal(result.total, null);
  assert.equal(frequencyCount("q6-8h"), null);
});
test("unsupported medication frequency and formulation are rejected", () => {
  rejects(
    () => calculateMedication(med("paracetamol"), patient, 0, "weekly"),
    "frequency",
  );
  rejects(
    () => calculateMedication(med("paracetamol"), patient, 999, "q6h"),
    "concentration",
  );
});
test("custom kg/day and kg/dose are distinct", () => {
  assert.equal(calculateCustom(custom, patient).perDose, 100);
  assert.equal(
    calculateCustom({ ...custom, basis: "kg-dose" }, patient).perDose,
    200,
  );
});
test("fixed doses do not require or multiply patient weight", () => {
  assert.equal(
    calculateCustom(
      { ...custom, dose: "100", basis: "dose" },
      { ...patient, weight: "" },
    ).perDose,
    100,
  );
});
test("pounds and kilograms produce equivalent results", () => {
  const result = calculateCustom(custom, {
    ...patient,
    weight: String(20 / 0.453592),
    weightUnit: "lb",
  });
  near(result.perDose, 100);
});
test("mL input is converted to mg before applying a daily limit", () => {
  const result = calculateCustom(
    {
      ...custom,
      dose: "2",
      doseUnit: "mL",
      basis: "kg-dose",
      frequency: "q6h",
      concentration: "100",
      maximum: "300",
    },
    { ...patient, weight: "10" },
  );
  assert.equal(result.originalPerDose, 2000);
  assert.equal(result.perDose, 75);
  assert.equal(result.total, 300);
  assert.equal(result.volume, 0.75);
  assert.equal(result.limited, true);
});
test("tablet input respects mass limits and retains fractional equivalents", () => {
  const result = calculateCustom(
    {
      ...custom,
      dose: "2",
      doseUnit: "tablets",
      basis: "dose",
      concentration: "100",
      concentrationUnit: "mg/tablet",
      maximum: "150",
    },
    patient,
  );
  assert.equal(result.perDose, 75);
  assert.equal(result.volume, 0.75);
  assert.equal(result.total, 150);
});
test("incompatible formulations and invalid optional maxima are rejected", () => {
  rejects(
    () =>
      calculateCustom(
        { ...custom, doseUnit: "mL", concentrationUnit: "mg/tablet" },
        patient,
      ),
    "concentration",
    "units",
  );
  rejects(
    () => calculateCustom({ ...custom, maximum: "-1" }, patient),
    "maximum",
  );
});
test("empty, negative, NaN and infinite values never produce a result", () => {
  for (const value of ["", "-1", "NaN", "Infinity", "1e999", "20kg"])
    rejects(() => calculateCustom({ ...custom, dose: value }, patient), "dose");
});
test("Mosteller calculation and daily splitting match a hand calculation", () => {
  const result = calculateBsa(bsa, { ...patient, weight: "20", height: "180" });
  assert.equal(result.bsa, 1);
  assert.equal(result.perDose, 50);
  assert.equal(result.total, 100);
  assert.equal(result.volume, 5);
});
test("BSA per-dose basis does not split the dose", () => {
  const result = calculateBsa(
    { ...bsa, basis: "dose" },
    { ...patient, height: "180" },
  );
  assert.equal(result.perDose, 100);
  assert.equal(result.total, 200);
});
test("BSA mcg and mg concentration units convert correctly", () => {
  const result = calculateBsa(
    { ...bsa, doseUnit: "mcg", basis: "dose", concentration: "1" },
    { ...patient, height: "180" },
  );
  assert.equal(result.perDose, 100);
  assert.equal(result.unit, "mcg");
  assert.equal(result.volume, 0.1);
});
test("BSA units cannot be converted into mass units", () => {
  rejects(
    () => calculateBsa({ ...bsa, doseUnit: "units" }, patient),
    "concentration",
    "units",
  );
});
test("BSA cycles are labelled per cycle, not per day", () => {
  const result = calculateBsa(
    { ...bsa, frequency: "q3weeks" },
    { ...patient, height: "180" },
  );
  assert.equal(result.period, "cycle");
  assert.equal(result.perDose, 100);
  assert.equal(result.total, 100);
  assert.equal(result.timesPerDay, null);
});
test("continuous BSA infusion is hourly with a daily total and limit", () => {
  const result = calculateBsa(
    { ...bsa, frequency: "continuous", dose: "240", maximum: "120" },
    { ...patient, height: "180" },
  );
  assert.equal(result.period, "hour");
  assert.equal(result.perDose, 5);
  assert.equal(result.total, 120);
  assert.equal(result.volume, 0.5);
  rejects(
    () =>
      calculateBsa({ ...bsa, frequency: "continuous", basis: "dose" }, patient),
    "dose",
    "infusionBasis",
  );
});
test("BSA normalized reference is explicit and separate from patient BSA", () => {
  const result = calculateBsa(
    { ...bsa, method: "normalized" },
    { ...patient, height: "180" },
  );
  assert.equal(result.bsa, 1);
  assert.equal(result.effectiveBsa, 1.73);
  assert.equal(result.total, 173);
});
test("safe numeric display includes a leading zero, no trailing zeroes, and preserves tiny values", () => {
  assert.equal(formatDose(4), "4");
  assert.equal(formatDose(4.5), "4.5");
  assert.equal(formatDose(0.4), "0.4");
  assert.equal(formatDose(1.875), "1.875");
  assert.notEqual(formatDose(0.00001), "0");
  assert.equal(formatDose(0.0000001), "0.0000001");
});
