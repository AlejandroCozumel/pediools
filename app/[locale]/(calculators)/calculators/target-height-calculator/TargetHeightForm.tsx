"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Ruler, RotateCcw, ArrowRight } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { TargetHeightSteps } from "@/components/TargetHeightSteps";
import {
  readTargetHeightFragment,
  targetHeightFragment,
  TargetHeightLinkData,
} from "@/lib/calculations/target-height-link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  calculateHeightMeasurements,
  HeightGrowthInputError,
  HeightMeasurementInput,
} from "@/lib/calculations/height-growth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateTargetHeight,
  TargetHeightInput,
  TargetHeightInputError,
} from "@/lib/calculations/target-height";

const empty: TargetHeightInput = {
  father: "",
  mother: "",
  sex: "male",
  unit: "cm",
};
const example: TargetHeightInput = {
  father: "178",
  mother: "165",
  sex: "male",
  unit: "cm",
};
export function TargetHeightForm() {
  const t = useTranslations("TargetHeightCalculator");
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [input, setInput] = useState<TargetHeightInput>(empty);
  const historyRef = useRef<HTMLDetailsElement>(null);
  const [childEnabled, setChildEnabled] = useState(false);
  const [measurements, setMeasurements] = useState<HeightMeasurementInput[]>([
    { years: "", months: "0", height: "" },
  ]);
  const [error, setError] = useState<{ field: string; message: string } | null>(
    null,
  );
  useEffect(() => {
    const restore = () => {
      const data = readTargetHeightFragment(window.location.hash);
      if (!data) return;
      setInput(data.input);
      setChildEnabled(data.measurements.length > 0);
      setMeasurements(
        data.measurements.length
          ? data.measurements
          : [{ years: "", months: "0", height: "" }],
      );
    };
    restore();
    window.addEventListener("hashchange", restore);
    return () => window.removeEventListener("hashchange", restore);
  }, []);
  function showResults(data: TargetHeightLinkData) {
    const fragment = targetHeightFragment(data);
    startTransition(() =>
      router.push(`/calculators/target-height-calculator/results${fragment}`),
    );
  }
  function update<K extends keyof TargetHeightInput>(
    field: K,
    value: TargetHeightInput[K],
  ) {
    setInput((current) => ({ ...current, [field]: value }));
    setError(null);
  }
  function changeUnit(unit: TargetHeightInput["unit"]) {
    if (unit !== "cm" && unit !== "in") return;
    if (unit === input.unit) return;
    const convert = (value: string) => {
      if (!value.trim() || !Number.isFinite(Number(value))) return value;
      const converted = Number(value) * (unit === "in" ? 1 / 2.54 : 2.54);
      return Number.isFinite(converted)
        ? String(Number(converted.toFixed(3)))
        : value;
    };
    setInput((current) => ({
      ...current,
      unit,
      father: convert(current.father),
      mother: convert(current.mother),
    }));
    setMeasurements((current) =>
      current.map((point) => ({ ...point, height: convert(point.height) })),
    );
    setError(null);
  }
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      calculateTargetHeight(input);
      if (childEnabled)
        calculateHeightMeasurements(measurements, input.sex, input.unit);
      showResults({ input, measurements: childEnabled ? measurements : [] });
    } catch (failure) {
      if (failure instanceof HeightGrowthInputError) {
        const field = `child-${failure.index}-${failure.field === "order" ? "years" : failure.field}`;
        setError({
          field,
          message: t(
            `growth.error${failure.field === "height" ? "Height" : failure.field === "order" ? "Order" : "Age"}`,
          ),
        });
        if (failure.index > 0 && historyRef.current)
          historyRef.current.open = true;
        document.getElementById(`target-${field}`)?.focus();
        return;
      }
      const field =
        failure instanceof TargetHeightInputError ? failure.field : "heights";
      setError({
        field,
        message: t(
          field === "sex"
            ? "errorSex"
            : field === "unit"
              ? "errorUnit"
              : field === "heights"
                ? "errorScale"
                : "errorHeight",
        ),
      });
      document
        .getElementById(`target-${field === "heights" ? "father" : field}`)
        ?.focus();
    }
  }
  function updateMeasurement(
    index: number,
    field: keyof HeightMeasurementInput,
    value: string,
  ) {
    setMeasurements((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
    setError(null);
  }
  const measurementFields = (point: HeightMeasurementInput, index: number) => (
    <fieldset key={index} className="space-y-3 rounded-lg border bg-white p-3">
      <legend className="px-1 text-sm font-medium text-medical-900">
        {t(index === 0 ? "growth.currentInput" : "growth.previousInput", {
          number: index,
        })}
      </legend>
      <div className="grid grid-cols-2 gap-3">
        {(["years", "months"] as const).map((field) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={`target-child-${index}-${field}`}>
              {t(`growth.${field}`)}
            </Label>
            <Input
              id={`target-child-${index}-${field}`}
              type="number"
              inputMode="numeric"
              min={field === "years" ? 2 : 0}
              max={field === "years" ? 20 : 11}
              step="1"
              value={point[field]}
              className="h-10"
              aria-required="true"
              aria-invalid={error?.field === `child-${index}-${field}`}
              aria-describedby={
                error?.field === `child-${index}-${field}`
                  ? "target-error"
                  : undefined
              }
              onChange={(event) =>
                updateMeasurement(index, field, event.target.value)
              }
            />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`target-child-${index}-height`}>
          {t("growth.childHeight")}
        </Label>
        <div className="relative">
          <Input
            id={`target-child-${index}-height`}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={point.height}
            className="h-10 pr-12"
            aria-required="true"
            aria-invalid={error?.field === `child-${index}-height`}
            aria-describedby={
              error?.field === `child-${index}-height`
                ? "target-error"
                : undefined
            }
            onChange={(event) =>
              updateMeasurement(index, "height", event.target.value)
            }
          />
          <span
            className="pointer-events-none absolute right-3 top-2.5 text-sm text-muted-foreground"
            aria-hidden="true"
          >
            {input.unit}
          </span>
        </div>
      </div>
      {index > 0 && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={t("growth.removeLabel", { number: index })}
          onClick={() => {
            setMeasurements((current) =>
              current.filter((_, rowIndex) => rowIndex !== index),
            );
            setError(null);
          }}
        >
          {t("growth.remove")}
        </Button>
      )}
    </fieldset>
  );
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
      <TargetHeightSteps step={1} />
      <form
        noValidate
        onSubmit={calculate}
        className="min-w-0 space-y-5 rounded-xl border bg-white p-4 sm:p-5"
        aria-labelledby="target-input-title"
      >
        <h2
          id="target-input-title"
          className="flex items-center gap-2 text-lg font-semibold text-medical-900"
        >
          <Ruler aria-hidden="true" className="h-5 w-5" />
          {t("formTitle")}
        </h2>
        <div className="grid items-start gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium text-medical-900">
                {t("sex")}
              </legend>
              <RadioGroup
                id="target-sex"
                value={input.sex}
                onValueChange={(value) =>
                  update("sex", value as TargetHeightInput["sex"])
                }
                className="grid grid-cols-2"
                aria-label={t("sex")}
              >
                {(["male", "female"] as const).map((sex) => (
                  <Label
                    key={sex}
                    htmlFor={`target-sex-${sex}`}
                    className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-md border p-3 ${input.sex === sex ? "border-medical-200 bg-medical-50 text-medical-900" : "bg-white text-muted-foreground"}`}
                  >
                    <RadioGroupItem id={`target-sex-${sex}`} value={sex} />
                    {t(sex)}
                  </Label>
                ))}
              </RadioGroup>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("sexHint")}
              </p>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="target-unit">{t("unit")}</Label>
              <Select
                value={input.unit}
                onValueChange={(value) =>
                  changeUnit(value as TargetHeightInput["unit"])
                }
              >
                <SelectTrigger id="target-unit" className="h-10 bg-white">
                  <SelectValue>{t(input.unit)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="cm">{t("cm")}</SelectItem>
                  <SelectItem value="in">{t("in")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              {(["father", "mother"] as const).map((parent) => (
                <div key={parent} className="space-y-2">
                  <Label htmlFor={`target-${parent}`}>{t(parent)}</Label>
                  <div className="relative">
                    <Input
                      id={`target-${parent}`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={input[parent]}
                      onChange={(event) => update(parent, event.target.value)}
                      className="h-10 pr-12"
                      aria-required="true"
                      aria-invalid={
                        error?.field === parent || error?.field === "heights"
                      }
                      aria-describedby={`target-height-hint${error?.field === parent || error?.field === "heights" ? " target-error" : ""}`}
                    />
                    <span
                      className="pointer-events-none absolute right-3 top-2.5 text-sm text-muted-foreground"
                      aria-hidden="true"
                    >
                      {input.unit}
                    </span>
                  </div>
                </div>
              ))}
              <p
                id="target-height-hint"
                className="text-xs leading-5 text-muted-foreground"
              >
                {t("measurementHint")}
              </p>
            </div>
          </div>
          <div className="space-y-4 rounded-lg border bg-medical-50/40 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="target-child-enabled"
                checked={childEnabled}
                onCheckedChange={(value) => {
                  setChildEnabled(value === true);
                  setError(null);
                }}
                className="mt-0.5"
              />
              <Label
                htmlFor="target-child-enabled"
                className="cursor-pointer leading-5"
              >
                {t("growth.enable")}
              </Label>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("growth.inputHint")}
            </p>
            {childEnabled && (
              <div className="space-y-4">
                {measurementFields(measurements[0], 0)}
                <details
                  ref={historyRef}
                  className="space-y-3 rounded-lg border bg-white p-3"
                >
                  <summary className="cursor-pointer text-sm font-medium text-medical-900">
                    {t("growth.historyTitle", {
                      count: measurements.length - 1,
                    })}
                  </summary>
                  {measurements
                    .slice(1)
                    .map((point, index) => measurementFields(point, index + 1))}

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={measurements.length >= 12}
                    onClick={() => {
                      setMeasurements((current) => [
                        ...current,
                        { years: "", months: "0", height: "" },
                      ]);
                      setError(null);
                    }}
                  >
                    {t("growth.addPrevious")}
                  </Button>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t("growth.previousHint")}
                  </p>
                </details>
              </div>
            )}
          </div>
        </div>
        {error && (
          <p
            id="target-error"
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error.message}
          </p>
        )}
        <Button
          type="submit"
          disabled={isNavigating}
          className="h-11 w-full sm:max-w-sm"
        >
          {t(isNavigating ? "steps.opening" : "calculate")}
          <ArrowRight aria-hidden="true" />
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const points = [
                { years: "10", months: "0", height: "140" },
                { years: "9", months: "0", height: "134" },
              ];
              setInput(example);
              setChildEnabled(true);
              setMeasurements(points);
              showResults({ input: example, measurements: points });
              setError(null);
            }}
          >
            {t("example")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setInput(empty);
              setChildEnabled(false);
              setMeasurements([{ years: "", months: "0", height: "" }]);
              setError(null);
            }}
          >
            <RotateCcw aria-hidden="true" />
            {t("reset")}
          </Button>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          {t("exampleHint")}
        </p>
      </form>
    </div>
  );
}
