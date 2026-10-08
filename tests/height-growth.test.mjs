import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const data = JSON.parse(
  readFileSync(
    new URL("../app/data/cdc-data-height.json", import.meta.url),
    "utf8",
  ),
);
const source = readFileSync(
  new URL("../lib/calculations/height-growth.ts", import.meta.url),
  "utf8",
).replace(
  'import statureData from "@/app/data/cdc-data-height.json";',
  `const statureData = ${JSON.stringify(data)};`,
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ES2020,
  },
}).outputText;
const {
  heightReference,
  heightAtZ,
  assessHeight,
  calculateHeightMeasurements,
  yearlyHeightReference,
  HeightGrowthInputError,
} = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const near = (actual, expected, tolerance = 1e-7) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );

test("both sexes reproduce published CDC LMS and selected percentile values at source ages", () => {
  for (const row of data) {
    const reference = heightReference(
      row.Agemos,
      row.Sex === 1 ? "male" : "female",
    );
    for (const key of ["L", "M", "S", "P50"]) near(reference[key], row[key]);
    // Published percentile columns are rounded; regenerate using precise normal quantiles.
    near(reference.P3, row.P3, 0.001);
    near(reference.P97, row.P97, 0.001);
  }
});
test("age interpolation brackets adjacent records and interpolates all LMS parameters", () => {
  const a = heightReference(119.5, "male"),
    b = heightReference(120.5, "male"),
    middle = heightReference(120, "male");
  for (const key of ["L", "M", "S"]) near(middle[key], (a[key] + b[key]) / 2);
  near(middle.P3, heightAtZ(middle, -1.8807936081512509));
});
test("median and outer percentiles invert correctly for boys and girls", () => {
  for (const sex of ["male", "female"]) {
    for (const age of [24, 24.5, 120, 180, 239.9, 240]) {
      const reference = heightReference(age, sex);
      for (const [key, expected] of [
        ["P3", 3],
        ["P50", 50],
        ["P97", 97],
      ])
        near(
          assessHeight(age, reference[key], sex).percentile,
          expected,
          0.00002,
        );
      assert.equal(assessHeight(age, reference.P3, sex).position, "within");
      assert.equal(assessHeight(age, reference.P97, sex).position, "within");
      assert.equal(assessHeight(age, reference.P3 - 1, sex).position, "below");
      assert.equal(assessHeight(age, reference.P97 + 1, sex).position, "above");
    }
  }
});
test("illustration preserves z-score through future years and never invents past child heights", () => {
  const current = assessHeight(126, 142, "male");
  const years = yearlyHeightReference("male", current);
  assert.equal(years.length, 19);
  assert.equal(years[0].ageMonths, 24);
  assert.equal(years.at(-1).ageMonths, 240);
  for (const row of years) {
    if (row.ageMonths < current.ageMonths) assert.equal(row.scenario, null);
    else
      near(
        assessHeight(row.ageMonths, row.scenario, "male").zScore,
        current.zScore,
      );
  }
  near(
    heightAtZ(heightReference(current.ageMonths, "male"), current.zScore),
    current.heightCm,
  );
  assert.ok(
    yearlyHeightReference("female").every((row) => row.scenario === null),
  );
});
test("inch and metric measurements produce identical percentiles and scenarios", () => {
  const cm = calculateHeightMeasurements(
    [{ years: "10", months: "3", height: "139.7" }],
    "female",
    "cm",
  )[0];
  const inches = calculateHeightMeasurements(
    [{ years: "10", months: "3", height: "55" }],
    "female",
    "in",
  )[0];
  for (const key of ["heightCm", "zScore", "percentile"])
    near(cm[key], inches[key]);
});
test("supported boundary ages work and unsupported ages and missing values are rejected", () => {
  const base = { years: "10", months: "0", height: "140" };
  for (const years of ["2", "20"])
    assert.equal(
      calculateHeightMeasurements([{ ...base, years }], "male", "cm")[0]
        .ageMonths,
      Number(years) * 12,
    );
  for (const values of [
    { years: "1" },
    { years: "21" },
    { years: "" },
    { years: "10.5" },
    { months: "12" },
    { months: "" },
    { months: "-1" },
    { months: "0.5" },
    { years: "20", months: "1" },
    { height: "" },
    { height: "0" },
    { height: "-1" },
    { height: "251" },
    { height: "Infinity" },
  ])
    assert.throws(
      () => calculateHeightMeasurements([{ ...base, ...values }], "male", "cm"),
      (e) => e instanceof HeightGrowthInputError && e.index === 0,
    );
  for (const age of [23.9, 240.1, NaN, Infinity])
    assert.throws(() => heightReference(age, "male"), RangeError);
  assert.throws(() => heightReference(120, "other"), RangeError);
  assert.throws(
    () => calculateHeightMeasurements([base], "male", "mm"),
    RangeError,
  );
});
test("history is entered data with unique earlier ages; no implicit extra measurements", () => {
  const current = { years: "10", months: "0", height: "140" };
  const prior = { years: "9", months: "0", height: "134" };
  assert.equal(
    calculateHeightMeasurements([current, prior], "male", "cm").length,
    2,
  );
  for (const rows of [
    [current, current],
    [current, { ...prior, years: "11" }],
    [current, prior, prior],
  ])
    assert.throws(
      () => calculateHeightMeasurements(rows, "male", "cm"),
      (e) => e.field === "order",
    );
});
test("inverse LMS handles L=0 and unsupported extreme scenarios without fake values", () => {
  near(heightAtZ({ L: 0, M: 100, S: 0.1 }, 2), 100 * Math.exp(0.2));
  assert.equal(heightAtZ({ L: 1, M: 100, S: 0.1 }, -11), null);
  assert.equal(heightAtZ({ L: 0, M: 100, S: 0.1 }, Infinity), null);
});
