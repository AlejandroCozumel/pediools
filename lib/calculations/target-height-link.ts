import { calculateTargetHeight, TargetHeightInput } from "./target-height";
import {
  calculateHeightMeasurements,
  HeightMeasurementInput,
} from "./height-growth";

export type TargetHeightLinkData = {
  input: TargetHeightInput;
  measurements: HeightMeasurementInput[];
};
// The URL fragment stays in the browser; it is not sent in HTTP requests.
// This is portable link data, not encryption or access control.
export function targetHeightFragment(data: TargetHeightLinkData) {
  calculateTargetHeight(data.input);
  calculateHeightMeasurements(
    data.measurements,
    data.input.sex,
    data.input.unit,
  );
  if (data.measurements.length > 12)
    throw new RangeError("Too many measurements");
  const input = {
    ...data.input,
    father: String(Number(data.input.father)),
    mother: String(Number(data.input.mother)),
  };
  const measurements = data.measurements.map((point) => ({
    years: String(Number(point.years)),
    months: String(Number(point.months)),
    height: String(Number(point.height)),
  }));
  return `#data=${encodeURIComponent(JSON.stringify({ v: 1, input, measurements }))}`;
}
export function readTargetHeightFragment(
  fragment: string,
): TargetHeightLinkData | null {
  if (!fragment.startsWith("#data=") || fragment.length > 10000) return null;
  try {
    const data = JSON.parse(decodeURIComponent(fragment.slice(6)));
    if (
      data?.v !== 1 ||
      !data.input ||
      !Array.isArray(data.measurements) ||
      data.measurements.length > 12
    )
      return null;
    const scalar = (value: unknown): value is string =>
      typeof value === "string" && value.length <= 24;
    const { father, mother, sex, unit } = data.input;
    if (
      !scalar(father) ||
      !scalar(mother) ||
      !["male", "female"].includes(sex) ||
      !["cm", "in"].includes(unit)
    )
      return null;
    if (
      !data.measurements.every(
        (point: HeightMeasurementInput) =>
          point &&
          scalar(point.years) &&
          scalar(point.months) &&
          scalar(point.height),
      )
    )
      return null;
    const input: TargetHeightInput = { father, mother, sex, unit };
    const measurements: HeightMeasurementInput[] = data.measurements.map(
      ({ years, months, height }: HeightMeasurementInput) => ({
        years,
        months,
        height,
      }),
    );
    calculateTargetHeight(input);
    calculateHeightMeasurements(measurements, sex, unit);
    return { input, measurements };
  } catch {
    return null;
  }
}
