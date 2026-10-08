const DAY = 86_400_000;
export function todayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export type CorrectedAgeInput = {
  birth: string;
  assessment: string;
  mode: "gestation" | "dueDate";
  weeks: string;
  days: string;
  dueDate: string;
};

export class CorrectedAgeError extends Error {
  constructor(
    public code:
      | "birth"
      | "assessment"
      | "order"
      | "gestation"
      | "dueDate"
      | "futureBirth"
      | "assessmentRange",
  ) {
    super(code);
  }
}

// Date-only arithmetic uses UTC day numbers, never local midnight or elapsed hours.
export function dateDay(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError("Invalid date");
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900 || year > 9999)
    throw new RangeError("Date outside supported range");
  const stamp = Date.UTC(year, month - 1, day);
  if (new Date(stamp).toISOString().slice(0, 10) !== value)
    throw new RangeError("Invalid date");
  return stamp / DAY;
}

export function dayDate(day: number): string {
  return new Date(day * DAY).toISOString().slice(0, 10);
}

// Calendar months are anchored to the original day, clamping month-end dates.
export function addCalendarMonths(value: string, months: number): string {
  const source = new Date(dateDay(value) * DAY);
  const first = new Date(
    Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + months, 1),
  );
  const last = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return dayDate(
    Date.UTC(
      first.getUTCFullYear(),
      first.getUTCMonth(),
      Math.min(source.getUTCDate(), last),
    ) / DAY,
  );
}

export function calendarAge(start: string, end: string) {
  const startDay = dateDay(start),
    endDay = dateDay(end);
  if (endDay < startDay) return null;
  const a = new Date(startDay * DAY),
    b = new Date(endDay * DAY);
  let months =
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    b.getUTCMonth() -
    a.getUTCMonth();
  if (dateDay(addCalendarMonths(start, months)) > endDay) months--;
  return { months, days: endDay - dateDay(addCalendarMonths(start, months)) };
}

export function calculateCorrectedAge(
  input: CorrectedAgeInput,
  today = todayDate(),
) {
  let birthDay: number, assessmentDay: number;
  try {
    birthDay = dateDay(input.birth);
    if (input.birth > "2100-12-31") throw new RangeError();
  } catch {
    throw new CorrectedAgeError("birth");
  }
  try {
    assessmentDay = dateDay(input.assessment);
    if (input.assessment > "2100-12-31") throw new RangeError();
  } catch {
    throw new CorrectedAgeError("assessment");
  }
  if (input.birth > today) throw new CorrectedAgeError("futureBirth");
  if (assessmentDay < birthDay) throw new CorrectedAgeError("order");
  if (assessmentDay > dateDay(addCalendarMonths(input.birth, 36)))
    throw new CorrectedAgeError("assessmentRange");
  let gestationDays: number, dueDay: number;
  if (input.mode === "gestation") {
    if (!/^\d{1,2}$/.test(input.weeks) || !/^\d$/.test(input.days))
      throw new CorrectedAgeError("gestation");
    const weeks = Number(input.weeks),
      days = Number(input.days);
    if (weeks < 20 || weeks > 36 || days < 0 || days > 6)
      throw new CorrectedAgeError("gestation");
    gestationDays = weeks * 7 + days;
    dueDay = birthDay + 280 - gestationDays;
  } else if (input.mode === "dueDate") {
    try {
      dueDay = dateDay(input.dueDate);
      if (input.dueDate > "2100-12-31") throw new RangeError();
    } catch {
      throw new CorrectedAgeError("dueDate");
    }
    gestationDays = 280 - (dueDay - birthDay);
    if (gestationDays < 140 || gestationDays > 258)
      throw new CorrectedAgeError("dueDate");
  } else {
    throw new CorrectedAgeError("gestation");
  }
  const dueDate = dayDate(dueDay);
  const chronologicalDays = assessmentDay - birthDay;
  const correctedDays = assessmentDay - dueDay;
  return {
    birthDay,
    assessmentDay,
    dueDay,
    dueDate,
    gestationDays,
    correctionDays: dueDay - birthDay,
    chronologicalDays,
    correctedDays,
    postmenstrualDays: gestationDays + chronologicalDays,
    chronologicalCalendar: calendarAge(input.birth, input.assessment)!,
    correctedCalendar:
      correctedDays >= 0 ? calendarAge(dueDate, input.assessment)! : null,
    calendar: [0, 3, 6, 9, 12, 18, 24].map((months) => ({
      months,
      date: addCalendarMonths(dueDate, months),
    })),
  };
}

export function correctedAgeFragment(input: CorrectedAgeInput): string {
  calculateCorrectedAge(input);
  // Only the values needed to reproduce this result are included. No names.
  const clean = {
    birth: input.birth,
    assessment: input.assessment,
    mode: input.mode,
    weeks: input.mode === "gestation" ? String(Number(input.weeks)) : "",
    days: input.mode === "gestation" ? String(Number(input.days)) : "",
    dueDate: input.mode === "dueDate" ? input.dueDate : "",
  };
  return `#data=${encodeURIComponent(JSON.stringify({ v: 1, input: clean }))}`;
}

export function readCorrectedAgeFragment(
  fragment: string,
): CorrectedAgeInput | null {
  if (!fragment.startsWith("#data=") || fragment.length > 2000) return null;
  try {
    const data = JSON.parse(decodeURIComponent(fragment.slice(6)));
    if (
      data?.v !== 1 ||
      !data.input ||
      !["gestation", "dueDate"].includes(data.input.mode)
    )
      return null;
    const input = Object.fromEntries(
      ["birth", "assessment", "mode", "weeks", "days", "dueDate"].map((key) => [
        key,
        data.input[key],
      ]),
    ) as CorrectedAgeInput;
    if (
      Object.values(input).some(
        (value) => typeof value !== "string" || value.length > 10,
      )
    )
      return null;
    calculateCorrectedAge(input);
    return input;
  } catch {
    return null;
  }
}
