import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const moduleUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText).toString("base64")}`;
const targetUrl = moduleUrl(read("../lib/calculations/target-height.ts"));
const growthUrl = moduleUrl(
  read("../lib/calculations/height-growth.ts").replace(
    'import statureData from "@/app/data/cdc-data-height.json";',
    `const statureData = ${read("../app/data/cdc-data-height.json")};`,
  ),
);
const linkSource = read("../lib/calculations/target-height-link.ts")
  .replace('from "./target-height"', `from "${targetUrl}"`)
  .replace('from "./height-growth"', `from "${growthUrl}"`);
const { targetHeightFragment, readTargetHeightFragment } = await import(
  moduleUrl(linkSource)
);
const data = {
  input: { father: "178", mother: "165", sex: "male", unit: "cm" },
  measurements: [
    { years: "10", months: "0", height: "140" },
    { years: "9", months: "0", height: "134" },
  ],
};
const encode = (value) => `#data=${encodeURIComponent(JSON.stringify(value))}`;
test("shared links round-trip all inputs, historical records, sex and units", () => {
  for (const sex of ["male", "female"])
    for (const unit of ["cm", "in"]) {
      const value =
        unit === "cm"
          ? { ...data, input: { ...data.input, sex } }
          : {
              input: { father: "70", mother: "65", sex, unit },
              measurements: [{ years: "10", months: "4", height: "55" }],
            };
      const fragment = targetHeightFragment(value);
      assert.ok(fragment.startsWith("#data="));
      assert.ok(!fragment.includes("?"));
      assert.deepEqual(readTargetHeightFragment(fragment), value);
      assert.equal(
        new URL(
          `https://www.pedimath.com/es/calculators/target-height-calculator/results${fragment}`,
        ).search,
        "",
      );
    }
});
test("parents-only links work without creating fictional measurements", () => {
  assert.deepEqual(
    readTargetHeightFragment(
      targetHeightFragment({ ...data, measurements: [] }),
    ),
    { ...data, measurements: [] },
  );
});
test("invalid, incomplete, oversized and clinically invalid URLs fail safely", () => {
  for (const value of [
    "",
    "#other=x",
    "#data=%E0%A4%A",
    "#data=%7Bbad",
    `#data=${"x".repeat(10001)}`,
    encode({ ...data, v: 2 }),
    encode({ v: 1 }),
    encode({ ...data, v: 1, measurements: null }),
    encode({
      ...data,
      v: 1,
      measurements: Array(13).fill(data.measurements[0]),
    }),
    encode({ ...data, v: 1, input: { ...data.input, sex: "other" } }),
    encode({ ...data, v: 1, input: { ...data.input, father: 178 } }),
    encode({
      ...data,
      v: 1,
      measurements: [{ years: "1", months: "0", height: "140" }],
    }),
    encode({
      ...data,
      v: 1,
      measurements: [data.measurements[0], data.measurements[0]],
    }),
    encode({ ...data, v: 1, measurements: [null] }),
  ])
    assert.equal(readTargetHeightFragment(value), null);
});
test("decoded links discard unexpected fields and normalize input number formatting", () => {
  assert.deepEqual(
    readTargetHeightFragment(
      encode({
        ...data,
        v: 1,
        patientName: "Do not carry this field",
        input: { ...data.input, unrelated: "ignore" },
      }),
    ),
    data,
  );
  const normalized = readTargetHeightFragment(
    targetHeightFragment({
      ...data,
      input: { ...data.input, father: "00000000000000000000000178.00" },
    }),
  );
  assert.equal(normalized.input.father, "178");
});
