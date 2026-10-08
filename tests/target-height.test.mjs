import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(
  new URL("../lib/calculations/target-height.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ES2020,
  },
}).outputText;
const { calculateTargetHeight, TargetHeightInputError } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const base = { father: "178", mother: "165", sex: "male", unit: "cm" };
test("published formula gives a boy's target and conventional range", () => {
  const result = calculateTargetHeight(base);
  assert.equal(result.targetCm, 178);
  assert.equal(result.lowerCm, 169.5);
  assert.equal(result.upperCm, 186.5);
});
test("girl's adjustment is subtracted before halving", () => {
  const result = calculateTargetHeight({ ...base, sex: "female" });
  assert.equal(result.targetCm, 165);
  assert.equal(result.lowerCm, 156.5);
  assert.equal(result.upperCm, 173.5);
});
test("decimal parental heights retain precision until display", () => {
  assert.equal(
    calculateTargetHeight({ ...base, father: "178.4", mother: "165.2" })
      .targetCm,
    178.3,
  );
});
test("inch inputs use the same metric formula and range", () => {
  const metric = calculateTargetHeight({
    ...base,
    father: "177.8",
    mother: "165.1",
  });
  const imperial = calculateTargetHeight({
    ...base,
    father: "70",
    mother: "65",
    unit: "in",
  });
  for (const key of ["targetCm", "lowerCm", "upperCm"])
    assert.ok(Math.abs(metric[key] - imperial[key]) < 1e-10);
});
for (const field of ["father", "mother"]) {
  test(`${field}: missing and invalid numbers cannot produce a result`, () => {
    for (const value of [
      "",
      " ",
      "0",
      "-165",
      "NaN",
      "Infinity",
      "165cm",
      "1e999",
    ]) {
      assert.throws(
        () => calculateTargetHeight({ ...base, [field]: value }),
        (error) =>
          error instanceof TargetHeightInputError && error.field === field,
      );
    }
  });
}
test("unsupported sex and units are rejected", () => {
  for (const [field, value] of [
    ["sex", "unknown"],
    ["unit", "mm"],
  ])
    assert.throws(
      () => calculateTargetHeight({ ...base, [field]: value }),
      (error) => error.field === field,
    );
});
test("overflow and a nonpositive target range are rejected", () => {
  for (const values of [
    { father: "1e308", mother: "1e308" },
    { father: "1", mother: "1", sex: "female" },
  ])
    assert.throws(
      () => calculateTargetHeight({ ...base, ...values }),
      (error) => error.field === "heights",
    );
});
