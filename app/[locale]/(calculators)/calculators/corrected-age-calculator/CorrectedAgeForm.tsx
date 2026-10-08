"use client";
import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CalendarDays } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateOnlyPicker } from "@/components/DateOnlyPicker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CorrectedAgeSteps } from "@/components/CorrectedAgeSteps";
import {
  addCalendarMonths,
  calculateCorrectedAge,
  CorrectedAgeError,
  CorrectedAgeInput,
  correctedAgeFragment,
  dateDay,
  dayDate,
  readCorrectedAgeFragment,
  todayDate,
} from "@/lib/calculations/corrected-age";

export function CorrectedAgeForm() {
  const t = useTranslations("CorrectedAgeCalculator"),
    router = useRouter();
  const schema = useMemo(
    () =>
      z
        .object({
          birth: z.string(),
          assessment: z.string(),
          mode: z.enum(["gestation", "dueDate"]),
          weeks: z.string(),
          days: z.string(),
          dueDate: z.string(),
        })
        .superRefine((data, ctx) => {
          const reported = new Set<string>();
          const issue = (field: keyof CorrectedAgeInput, message: string) => {
            if (!reported.has(field))
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [field],
                message,
              });
            reported.add(field);
          };
          for (const field of ["birth", "assessment"] as const) {
            if (!data[field])
              issue(field, t("requiredField", { field: t(field) }));
            else {
              try {
                dateDay(data[field]);
              } catch {
                issue(field, t(`errors.${field}`));
              }
            }
          }
          if (data.mode === "gestation") {
            for (const field of ["weeks", "days"] as const) {
              if (!data[field])
                issue(field, t("requiredField", { field: t(field) }));
              else if (
                !/^\d+$/.test(data[field]) ||
                Number(data[field]) < (field === "weeks" ? 20 : 0) ||
                Number(data[field]) > (field === "weeks" ? 36 : 6)
              )
                issue(field, t(`errors.${field}`));
            }
          } else if (!data.dueDate)
            issue("dueDate", t("requiredField", { field: t("dueDate") }));
          try {
            calculateCorrectedAge(data);
          } catch (error) {
            if (error instanceof CorrectedAgeError) {
              const field =
                error.code === "futureBirth"
                  ? "birth"
                  : ["order", "assessmentRange"].includes(error.code)
                    ? "assessment"
                    : error.code === "gestation"
                      ? "weeks"
                      : error.code;
              issue(
                field as keyof CorrectedAgeInput,
                t(`errors.${error.code}`),
              );
            }
          }
        }),
    [t],
  );
  const form = useForm<CorrectedAgeInput>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      birth: "",
      assessment: "",
      mode: "gestation",
      weeks: "",
      days: "0",
      dueDate: "",
    },
  });
  const {
    register,
    control,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = form;
  const input = watch();
  const previous = useRef({ birth: "", mode: "gestation" });
  useEffect(() => {
    const restore = () =>
      reset(
        readCorrectedAgeFragment(window.location.hash) ?? {
          birth: "",
          assessment: todayDate(),
          mode: "gestation",
          weeks: "",
          days: "0",
          dueDate: "",
        },
      );
    restore();
    window.addEventListener("hashchange", restore);
    return () => window.removeEventListener("hashchange", restore);
  }, [reset]);
  useEffect(() => {
    if (input.birth !== previous.current.birth && input.birth) {
      if (input.assessment) void trigger("assessment");
      if (input.mode === "dueDate" && input.dueDate) void trigger("dueDate");
    }
    if (input.mode !== previous.current.mode && form.formState.isDirty)
      void trigger(["weeks", "days", "dueDate"]);
    previous.current = { birth: input.birth, mode: input.mode };
  }, [
    input.birth,
    input.mode,
    input.assessment,
    input.dueDate,
    trigger,
    form.formState.isDirty,
  ]);
  let assessmentMax = "2100-12-31",
    dueMin = "1900-01-01",
    dueMax = "2100-12-31";
  try {
    if (input.birth) {
      assessmentMax = addCalendarMonths(input.birth, 36);
      dueMin = dayDate(dateDay(input.birth) + 22);
      dueMax = dayDate(dateDay(input.birth) + 140);
    }
  } catch {
    /* Keep valid picker bounds while a link is being restored. */
  }
  function label(key: "birth" | "assessment" | "dueDate" | "weeks" | "days") {
    return (
      <label
        htmlFor={`age-${key}`}
        className={`text-sm font-medium ${errors[key] ? "text-red-700" : ""}`}
      >
        {t(key)}{" "}
        <span aria-hidden="true" className="text-red-600">
          *
        </span>
        <span className="sr-only"> {t("required")}</span>
      </label>
    );
  }
  function error(key: keyof CorrectedAgeInput) {
    return errors[key] ? (
      <p
        id={`age-${key}-error`}
        role="alert"
        className="text-xs leading-5 text-red-700"
      >
        {errors[key]?.message}
      </p>
    ) : null;
  }
  const field = (key: "birth" | "assessment" | "dueDate", hint?: string) => (
    <div className="min-w-0 space-y-2">
      {label(key)}
      <Controller
        name={key}
        control={control}
        render={({ field }) => (
          <DateOnlyPicker
            id={`age-${key}`}
            label={t(key)}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            buttonRef={field.ref}
            required
            invalid={!!errors[key]}
            min={
              key === "assessment" && input.birth
                ? input.birth
                : key === "dueDate"
                  ? dueMin
                  : "1900-01-01"
            }
            max={
              key === "birth"
                ? todayDate()
                : key === "assessment"
                  ? assessmentMax
                  : dueMax
            }
            describedBy={
              `${hint ? `age-${key}-hint ` : ""}${errors[key] ? `age-${key}-error` : ""}`.trim() ||
              undefined
            }
          />
        )}
      />
      {error(key)}
      {hint && (
        <p
          id={`age-${key}-hint`}
          className="text-xs leading-6 text-muted-foreground"
        >
          {t(hint)}
        </p>
      )}
    </div>
  );
  return (
    <div className="mx-auto max-w-3xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <CorrectedAgeSteps step={1} />
      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-start gap-3">
          <span className="rounded-lg bg-medical-50 p-2 text-medical-700">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-medical-900">
              {t("formTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("formHint")}
            </p>
          </div>
        </div>
        <form
          noValidate
          onSubmit={form.handleSubmit((data) =>
            router.push(
              `/calculators/corrected-age-calculator/results${correctedAgeFragment(data)}`,
            ),
          )}
          className="space-y-6"
        >
          <p className="text-xs text-muted-foreground">
            <span className="text-red-600" aria-hidden="true">
              *
            </span>{" "}
            {t("requiredHint")}
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {field("birth")}
            {field("assessment", "assessmentHint")}
          </div>
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-medium">{t("method")}</legend>
            <Controller
              control={control}
              name="mode"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {(["gestation", "dueDate"] as const).map((mode) => (
                    <label
                      key={mode}
                      htmlFor={`age-method-${mode}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${input.mode === mode ? "border-medical-300 bg-medical-50 text-medical-900" : "hover:bg-slate-50"}`}
                    >
                      <RadioGroupItem id={`age-method-${mode}`} value={mode} />
                      {t(mode)}
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
          </fieldset>
          {input.mode === "gestation" ? (
            <fieldset
              className="space-y-3"
              aria-describedby="age-gestation-hint"
            >
              <legend className="sr-only">{t("gestation")}</legend>
              <div className="grid grid-cols-2 gap-5">
                {(["weeks", "days"] as const).map((key) => (
                  <div key={key} className="space-y-2">
                    {label(key)}
                    <Input
                      {...register(key)}
                      id={`age-${key}`}
                      type="number"
                      inputMode="numeric"
                      min={key === "weeks" ? 20 : 0}
                      max={key === "weeks" ? 36 : 6}
                      step={1}
                      required
                      aria-required="true"
                      aria-invalid={!!errors[key]}
                      aria-describedby={
                        errors[key] ? `age-${key}-error` : "age-gestation-hint"
                      }
                      placeholder={key === "weeks" ? "32" : undefined}
                      className={`h-10 bg-white ${errors[key] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {error(key)}
                  </div>
                ))}
              </div>
              <p
                id="age-gestation-hint"
                className="text-xs leading-6 text-muted-foreground"
              >
                {t("gestationHint")}
              </p>
            </fieldset>
          ) : (
            field("dueDate", "dueHint")
          )}
          <Button type="submit" className="h-11 w-full">
            {t("calculate")}
            <ArrowRight aria-hidden="true" />
          </Button>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                reset({
                  birth: "2026-01-01",
                  assessment: "2026-04-23",
                  mode: "gestation",
                  weeks: "32",
                  days: "0",
                  dueDate: "",
                })
              }
            >
              {t("example")}
            </Button>
            <p className="text-xs text-muted-foreground">{t("exampleHint")}</p>
          </div>
          <p className="border-t pt-4 text-xs leading-6 text-muted-foreground">
            {t("privacy")}
          </p>
        </form>
      </section>
    </div>
  );
}
