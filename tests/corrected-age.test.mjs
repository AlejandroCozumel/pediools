import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(
  new URL("../lib/calculations/corrected-age.ts", import.meta.url),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ES2020,
  },
}).outputText;
const {
  calculateCorrectedAge: calc,
  dateDay,
  dayDate,
  addCalendarMonths,
  calendarAge,
  correctedAgeFragment: encode,
  readCorrectedAgeFragment: decode,
} = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);
const sample = {
  birth: "2026-01-01",
  assessment: "2026-04-23",
  mode: "gestation",
  weeks: "32",
  days: "0",
  dueDate: "",
};
test("32-week birth, 16 weeks after birth: 8 corrected weeks and 48 PMA weeks", () => {
  const r = calc(sample);
  assert.equal(r.chronologicalDays, 112);
  assert.equal(r.correctedDays, 56);
  assert.equal(r.postmenstrualDays, 336);
  assert.equal(r.dueDate, "2026-02-26");
});
test("gestational days and equivalent due-date input give the same results", () => {
  const r = calc({ ...sample, weeks: "32", days: "3" });
  assert.equal(r.correctionDays, 53);
  assert.deepEqual(calc({ ...sample, mode: "dueDate", dueDate: r.dueDate }), r);
});
test("before, on and after due date preserve the exact signed correction", () => {
  assert.equal(
    calc({ ...sample, assessment: "2026-01-01" }).correctedDays,
    -56,
  );
  assert.equal(calc({ ...sample, assessment: "2026-02-26" }).correctedDays, 0);
  assert.equal(calc({ ...sample, assessment: "2026-02-27" }).correctedDays, 1);
  assert.equal(
    calc({ ...sample, assessment: "2026-01-01" }).correctedCalendar,
    null,
  );
});
test("date-only differences stay exact across leap day and daylight-saving changes", () => {
  assert.equal(dateDay("2024-03-01") - dateDay("2024-02-28"), 2);
  assert.equal(dateDay("2026-03-09") - dateDay("2026-03-07"), 2);
  assert.equal(dayDate(dateDay("2024-02-29")), "2024-02-29");
});
test("calendar months clamp month ends and remain anchored to the original date", () => {
  assert.equal(addCalendarMonths("2024-02-29", 12), "2025-02-28");
  assert.equal(addCalendarMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addCalendarMonths("2026-01-31", 3), "2026-04-30");
  assert.deepEqual(calendarAge("2026-01-31", "2026-03-01"), {
    months: 1,
    days: 1,
  });
  assert.deepEqual(calendarAge("2024-02-29", "2025-02-28"), {
    months: 12,
    days: 0,
  });
});
test("supported boundary dates still produce a complete future age calendar", () => {
  const r = calc(
    { ...sample, birth: "2100-12-31", assessment: "2100-12-31" },
    "2100-12-31",
  );
  assert.equal(r.dueDate, "2101-02-25");
  assert.equal(r.calendar.at(-1).date, "2103-02-25");
  assert.throws(() => calc({ ...sample, assessment: "2101-01-01" }));
});
test("age calendar uses calendar months, not four-week approximations", () => {
  const r = calc(sample);
  assert.deepEqual(
    r.calendar.find((row) => row.months === 3),
    { months: 3, date: "2026-05-26" },
  );
  assert.equal(r.calendar.at(-1).date, "2028-02-26");
});
test("rejects invalid dates, reversed dates, term births and malformed numbers", () => {
  for (const change of [
    { birth: "2025-02-29" },
    { birth: "2026-13-01" },
    { assessment: "2025-12-31" },
    { weeks: "37" },
    { weeks: "19" },
    { weeks: "32.5" },
    { days: "7" },
    { weeks: "" },
    { mode: "dueDate", dueDate: "2026-01-02" },
    { mode: "dueDate", dueDate: "2026-12-31" },
  ])
    assert.throws(() => calc({ ...sample, ...change }));
  assert.doesNotThrow(() => calc({ ...sample, weeks: "20", days: "0" }));
  assert.doesNotThrow(() => calc({ ...sample, weeks: "36", days: "6" }));
});
test("portable links round-trip both methods and omit unused values", () => {
  assert.deepEqual(decode(encode(sample)), sample);
  const due = {
    ...sample,
    mode: "dueDate",
    dueDate: "2026-02-26",
    weeks: "",
    days: "",
  };
  assert.deepEqual(decode(encode(due)), due);
  assert.equal(
    new URL(
      `https://www.pedimath.com/es/calculators/corrected-age-calculator/results${encode(sample)}`,
    ).search,
    "",
  );
});
test("shared links reject unsupported schemas and malformed values", () => {
  for (const fragment of [
    "",
    "#data=%XX",
    "#data={}",
    `#data=${"x".repeat(2001)}`,
    `#data=${encodeURIComponent(JSON.stringify({ v: 2, input: sample }))}`,
    `#data=${encodeURIComponent(JSON.stringify({ v: 1, input: { ...sample, days: 0 } }))}`,
  ])
    assert.equal(decode(fragment), null);
  const extra = `#data=${encodeURIComponent(JSON.stringify({ v: 1, input: { ...sample, name: "unused" } }))}`;
  assert.deepEqual(decode(extra), sample);
});

test("maximum assessment age and future birth dates are enforced", () => {
  assert.doesNotThrow(() => calc({ ...sample, assessment: "2029-01-01" }));
  assert.throws(
    () => calc({ ...sample, assessment: "2029-01-02" }),
    (error) => error.code === "assessmentRange",
  );
  assert.throws(
    () =>
      calc(
        { ...sample, birth: "2026-01-01", assessment: "2026-01-02" },
        "2025-12-31",
      ),
    (error) => error.code === "futureBirth",
  );
});
