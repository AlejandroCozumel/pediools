"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  ChevronDown,
  Pill,
  RotateCcw,
  Search,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import pediatricData from "@/app/data/pediatric-dose.json";
import {
  BsaDoseInput,
  CustomDoseInput,
  DoseInputError,
  DoseResult,
  MedicationRecord,
  PatientInput,
  calculateBsa,
  calculateCustom,
  calculateMedication,
  formatDose,
} from "@/lib/calculations/dose-calculations";

const medications: MedicationRecord[] = pediatricData.medications;
const emptyPatient: PatientInput = {
  weight: "",
  weightUnit: "kg",
  age: "",
  ageUnit: "years",
  height: "",
  heightUnit: "cm",
};
const emptyCustom: CustomDoseInput = {
  dose: "",
  doseUnit: "mg",
  basis: "kg-day",
  frequency: "BID",
  concentration: "",
  concentrationUnit: "mg/mL",
  maximum: "",
};
const emptyBsa: BsaDoseInput = {
  dose: "",
  doseUnit: "mg",
  basis: "day",
  frequency: "qD",
  concentration: "",
  concentrationUnit: "mg/mL",
  maximum: "",
  method: "actual",
  medicationName: "",
};
type MedicationDraft = {
  concentration: string;
  frequency: string;
  duration: string;
};
type View = "medication" | "custom" | "references";
function medicationDefaults(medication?: MedicationRecord): MedicationDraft {
  const common =
    medication?.concentrations.findIndex((option) => option.common) ?? -1;
  return {
    concentration: String(common >= 0 ? common : 0),
    frequency:
      medication?.frequencies.find((option) => option.common)?.value ??
      medication?.frequencies[0]?.value ??
      "",
    duration: String(medication?.durationDefault ?? ""),
  };
}
const controlClass =
  "h-10 min-w-0 border border-input bg-white px-3 text-sm font-normal text-foreground shadow-sm";

export default function DoseCalculatorWorkspace({
  initialMedicationId = "",
}: {
  initialMedicationId?: string;
}) {
  const t = useTranslations("DoseWorkspace");
  const disclaimer = useTranslations("AppDisclaimer");
  const locale = useLocale() === "es" ? "es" : "en";
  const [view, setView] = useState<View>("medication");
  const [method, setMethod] = useState<"weight" | "bsa">("weight");
  const [patient, setPatient] = useState<PatientInput>(emptyPatient);
  const [medicationId, setMedicationId] = useState(initialMedicationId);
  const [drafts, setDrafts] = useState<Record<string, MedicationDraft>>({});
  const [custom, setCustom] = useState<CustomDoseInput>(emptyCustom);
  const [bsa, setBsa] = useState<BsaDoseInput>(emptyBsa);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [referenceSearch, setReferenceSearch] = useState("");
  const [error, setError] = useState<{ field: string; message: string } | null>(
    null,
  );
  const [results, setResults] = useState<
    Record<string, { signature: string; result: DoseResult }>
  >({});
  const medication = medications.find((item) => item.id === medicationId);
  const draft = drafts[medicationId] ?? medicationDefaults(medication);
  const isBsa = view === "custom" && method === "bsa";
  const cycle = ["weekly", "q2weeks", "q3weeks"].includes(bsa.frequency);
  const key =
    view === "medication" ? `medication:${medicationId}` : `custom:${method}`;
  const signature = JSON.stringify([
    key,
    patient,
    view === "medication" ? draft : isBsa ? bsa : custom,
  ]);
  const previous = results[key];
  const result = previous?.signature === signature ? previous.result : null;
  const concentration = medication?.concentrations[Number(draft.concentration)];
  const frequency =
    view === "medication"
      ? draft.frequency
      : isBsa
        ? bsa.frequency
        : custom.frequency;
  const frequencyLabel =
    view === "medication"
      ? (medication?.frequencies.find((option) => option.value === frequency)
          ?.labels[locale] ?? "")
      : t(frequency);

  useEffect(() => {
    setMedicationId(initialMedicationId);
    setView("medication");
  }, [initialMedicationId]);
  useEffect(() => {
    setError(null);
  }, [signature, view]);

  function updatePatient<K extends keyof PatientInput>(
    field: K,
    value: PatientInput[K],
  ) {
    setPatient((current) => ({ ...current, [field]: value }));
  }
  function updateDraft(field: keyof MedicationDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [medicationId]: { ...draft, [field]: value },
    }));
  }
  function updateCustom<K extends keyof CustomDoseInput>(
    field: K,
    value: CustomDoseInput[K],
  ) {
    setCustom((current) => ({ ...current, [field]: value }));
  }
  function updateBsa<K extends keyof BsaDoseInput>(
    field: K,
    value: BsaDoseInput[K],
  ) {
    setBsa((current) => ({ ...current, [field]: value }));
  }
  function selectMedication(id: string) {
    setMedicationId(id);
    setView("medication");
    setPickerOpen(false);
  }
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      let next: DoseResult;
      if (view === "medication") {
        if (!medication) throw new DoseInputError("medication", "medication");
        if (
          medication.inputs.includes("duration") &&
          !medication.durationOptions?.includes(Number(draft.duration))
        )
          throw new DoseInputError("duration", "positive");
        next = calculateMedication(
          medication,
          patient,
          Number(draft.concentration),
          draft.frequency,
        );
      } else
        next = isBsa
          ? calculateBsa(bsa, patient)
          : calculateCustom(custom, patient);
      setResults((current) => ({
        ...current,
        [key]: { signature, result: next },
      }));
    } catch (failure) {
      const issue =
        failure instanceof DoseInputError
          ? failure
          : new DoseInputError("dose", "positive");
      const messages: Record<string, string> = {
        positive: "errorPositive",
        bracket: "errorBracket",
        frequency: "errorFrequency",
        fixedFrequency: "errorFixedFrequency",
        units: "errorUnits",
        medication: "errorMedication",
        concentration: "errorConcentration",
        infusionBasis: "errorInfusionBasis",
      };
      setError({
        field: issue.field,
        message: t(messages[issue.code] ?? "errorPositive"),
      });
      document.getElementById(`dose-${issue.field}`)?.focus();
    }
  }
  function newPatient() {
    setPatient(emptyPatient);
    setCustom(emptyCustom);
    setBsa(emptyBsa);
    setDrafts({});
    setResults({});
    setError(null);
  }
  const patientNeedsWeight =
    view === "medication"
      ? medication?.inputs.includes("weight")
      : view === "custom" && (isBsa || custom.basis.startsWith("kg"));
  const patientNeedsAge =
    view === "medication" && medication?.inputs.includes("age");
  const unitLabel = (unit: string) =>
    unit === "units" ? t("units") : unit === "tablets" ? t("tablets") : unit;
  const dosingLabel = (value: string) =>
    locale === "es"
      ? value.replace("/day", "/día").replace("/dose", "/dosis")
      : value;
  const currentName =
    view === "medication"
      ? medication?.names[locale]
      : isBsa
        ? bsa.medicationName || t("bsaMethod")
        : t("customView");

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
        {t("intro")}
      </p>
      <Tabs value={view} onValueChange={(value) => setView(value as View)}>
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-medical-50 p-1.5">
          {(
            [
              ["medication", Pill, "medicationView"],
              ["custom", Calculator, "customView"],
              ["references", BookOpen, "referenceView"],
            ] as const
          ).map(([value, Icon, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-2 whitespace-normal rounded-lg px-2 py-3 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-medical-800 data-[state=active]:shadow-sm"
            >
              <Icon className="hidden h-4 w-4 shrink-0 sm:block" />
              {t(label)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={view} className="mt-5">
          <form
            id="dose-workspace"
            onSubmit={calculate}
            noValidate
            className="space-y-5"
          >
            <section
              className="rounded-xl border border-medical-100 bg-medical-50/50 p-4 sm:p-5"
              aria-labelledby="dose-patient-title"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2
                    id="dose-patient-title"
                    className="flex items-center gap-2 text-sm font-semibold text-medical-900"
                  >
                    <UserRound className="h-4 w-4" />
                    {t("patient")}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("patientHint")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={newPatient}
                >
                  <RotateCcw />
                  {t("newPatient")}
                </Button>
              </div>
              <div
                className={`grid gap-4 ${isBsa ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
              >
                <Field
                  label={t("weight")}
                  id="dose-weight"
                  optional={!patientNeedsWeight}
                >
                  <div className="flex gap-2">
                    <Input
                      id="dose-weight"
                      name="weight"
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      className="h-10 bg-white"
                      value={patient.weight}
                      onChange={(event) =>
                        updatePatient("weight", event.target.value)
                      }
                      aria-required={Boolean(patientNeedsWeight)}
                      aria-invalid={error?.field === "weight"}
                      aria-describedby={
                        error?.field === "weight" ? "dose-error" : undefined
                      }
                    />
                    <WorkspaceSelect
                      label={t("weightUnit")}
                      className="w-20 shrink-0"
                      value={patient.weightUnit}
                      onChange={(value) =>
                        updatePatient(
                          "weightUnit",
                          value as PatientInput["weightUnit"],
                        )
                      }
                      options={[
                        ["kg", "kg"],
                        ["lb", "lb"],
                      ]}
                    />
                  </div>
                  {patient.weightUnit === "lb" &&
                    Number(patient.weight) > 0 &&
                    Number.isFinite(Number(patient.weight)) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDose(Number(patient.weight) * 0.453592)} kg
                      </p>
                    )}
                </Field>
                <Field
                  label={t("age")}
                  id="dose-age"
                  optional={!patientNeedsAge}
                >
                  <div className="flex gap-2">
                    <Input
                      id="dose-age"
                      name="age"
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      className="h-10 bg-white"
                      value={patient.age}
                      onChange={(event) =>
                        updatePatient("age", event.target.value)
                      }
                      aria-required={Boolean(patientNeedsAge)}
                      aria-invalid={error?.field === "age"}
                      aria-describedby={
                        error?.field === "age" ? "dose-error" : undefined
                      }
                    />
                    <WorkspaceSelect
                      label={t("ageUnit")}
                      className="w-24 shrink-0"
                      value={patient.ageUnit}
                      onChange={(value) =>
                        updatePatient(
                          "ageUnit",
                          value as PatientInput["ageUnit"],
                        )
                      }
                      options={[
                        ["years", t("years")],
                        ["months", t("months")],
                      ]}
                    />
                  </div>
                </Field>
                {isBsa && (
                  <Field label={t("height")} id="dose-height">
                    <div className="flex gap-2">
                      <Input
                        id="dose-height"
                        name="height"
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        className="h-10 bg-white"
                        value={patient.height}
                        onChange={(event) =>
                          updatePatient("height", event.target.value)
                        }
                        aria-required
                        aria-invalid={error?.field === "height"}
                        aria-describedby={
                          error?.field === "height" ? "dose-error" : undefined
                        }
                      />
                      <WorkspaceSelect
                        label={t("heightUnit")}
                        className="w-20 shrink-0"
                        value={patient.heightUnit}
                        onChange={(value) =>
                          updatePatient(
                            "heightUnit",
                            value as PatientInput["heightUnit"],
                          )
                        }
                        options={[
                          ["cm", "cm"],
                          ["in", "in"],
                        ]}
                      />
                    </div>
                  </Field>
                )}
              </div>
            </section>
            {view === "references" ? (
              <section
                aria-labelledby="dose-library-title"
                className="space-y-4"
              >
                <div>
                  <h2
                    id="dose-library-title"
                    className="text-xl font-semibold text-medical-900"
                  >
                    {t("libraryTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("libraryIntro")}
                  </p>
                </div>
                <div className="relative max-w-lg">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    aria-label={t("searchReferences")}
                    placeholder={t("searchMedication")}
                    value={referenceSearch}
                    onChange={(event) => setReferenceSearch(event.target.value)}
                    className="h-10 pl-9"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {medications
                    .filter((item) =>
                      `${item.names.en} ${item.names.es} ${item.id}`
                        .toLowerCase()
                        .includes(referenceSearch.toLowerCase()),
                    )
                    .map((item) => (
                      <article
                        key={item.id}
                        className="min-w-0 rounded-xl border bg-white p-5"
                      >
                        <h3 className="font-semibold text-medical-900">
                          {item.names[locale]}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.doseDefault
                            ? `${item.doseDefault} ${dosingLabel(item.dosingType)}`
                            : item.dosingType === "age_brackets"
                              ? t("age")
                              : t("weight")}
                        </p>
                        <details className="mt-3 text-sm leading-6">
                          <summary className="cursor-pointer font-medium text-medical-700">
                            {t("showDetails")}
                          </summary>
                          <p className="mt-2">{item.notes?.[locale]}</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                            {item.concentrations.map((option, index) => (
                              <li key={index}>{option.labels[locale]}</li>
                            ))}
                          </ul>
                          {item.maxDose && (
                            <p className="mt-2">
                              {t("maximumDose")}: {item.maxDose} mg
                            </p>
                          )}
                          {item.maxDailyDose && (
                            <p>
                              {t("maximum")}: {item.maxDailyDose} mg/kg/
                              {locale === "es" ? "día" : "day"}
                            </p>
                          )}
                          {item.referenceUrl && (
                            <a
                              href={item.referenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-medical-700 underline"
                            >
                              {t("source")}
                            </a>
                          )}
                        </details>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => selectMedication(item.id)}
                          >
                            {t("openCalculator")}
                            <ArrowRight />
                          </Button>
                          <Link
                            className="text-xs font-medium text-medical-700 underline"
                            href={`/${locale}/calculators/dose-calculator/${item.id}`}
                          >
                            {t("referencePage")}
                          </Link>
                        </div>
                      </article>
                    ))}
                </div>
                {!medications.some((item) =>
                  `${item.names.en} ${item.names.es} ${item.id}`
                    .toLowerCase()
                    .includes(referenceSearch.toLowerCase()),
                ) && (
                  <p role="status" className="py-6 text-muted-foreground">
                    {t("noMedication")}
                  </p>
                )}
              </section>
            ) : (
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <section
                  className="min-w-0 rounded-xl border bg-white p-4 sm:p-6"
                  aria-labelledby="dose-input-title"
                >
                  <h2
                    id="dose-input-title"
                    className="mb-5 flex items-center gap-2 text-lg font-semibold text-medical-900"
                  >
                    {view === "medication" ? (
                      <Pill className="h-5 w-5" />
                    ) : (
                      <Calculator className="h-5 w-5" />
                    )}
                    {view === "medication"
                      ? t("medicationView")
                      : t("customView")}
                  </h2>
                  <div className="space-y-5">
                    {view === "medication" ? (
                      <>
                        <Field label={t("medication")} id="dose-medication">
                          <Popover
                            open={pickerOpen}
                            onOpenChange={setPickerOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                id="dose-medication"
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={pickerOpen}
                                aria-label={t("medication")}
                                className={`${controlClass} w-full justify-between gap-2 text-left hover:border-input hover:bg-white hover:text-foreground`}
                              >
                                <span className="min-w-0 flex-1 truncate">
                                  {medication?.names[locale] ??
                                    t("chooseMedication")}
                                </span>
                                <ChevronDown className="shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0"
                            >
                              <Command>
                                <CommandInput
                                  placeholder={t("searchMedication")}
                                  aria-label={t("searchMedication")}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    {t("noMedication")}
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {medications.map((item) => (
                                      <CommandItem
                                        key={item.id}
                                        value={`${item.names.en} ${item.names.es} ${item.id}`}
                                        onSelect={() =>
                                          selectMedication(item.id)
                                        }
                                        className="min-h-10 gap-2 py-2"
                                      >
                                        <Check
                                          className={
                                            item.id === medicationId
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }
                                        />
                                        <span className="min-w-0 break-words">
                                          {item.names[locale]}
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </Field>
                        {medication && (
                          <>
                            <SelectField
                              id="dose-concentration"
                              label={t("formulation")}
                              value={draft.concentration}
                              onChange={(value) =>
                                updateDraft("concentration", value)
                              }
                              options={medication.concentrations.map(
                                (option, index) => [
                                  String(index),
                                  option.labels[locale],
                                ],
                              )}
                            />
                            <p className="!mt-2 text-xs text-muted-foreground">
                              {t("formulationHint")}
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <SelectField
                                id="dose-frequency"
                                label={t("frequency")}
                                value={draft.frequency}
                                onChange={(value) =>
                                  updateDraft("frequency", value)
                                }
                                options={medication.frequencies.map(
                                  (option) => [
                                    option.value,
                                    option.labels[locale],
                                  ],
                                )}
                              />
                              {medication.inputs.includes("duration") && (
                                <SelectField
                                  id="dose-duration"
                                  label={t("duration")}
                                  value={draft.duration}
                                  onChange={(value) =>
                                    updateDraft("duration", value)
                                  }
                                  options={
                                    medication.durationOptions?.map((days) => [
                                      String(days),
                                      `${days} ${t("days")}`,
                                    ]) ?? []
                                  }
                                />
                              )}
                            </div>
                            <div className="rounded-lg border border-medical-100 bg-medical-50/60 p-3 text-sm">
                              <p className="font-medium text-medical-900">
                                {t("defaultDose")}:{" "}
                                {medication.doseDefault
                                  ? `${medication.doseDefault} ${dosingLabel(medication.dosingType)}`
                                  : medication.dosingType === "age_brackets"
                                    ? t("age")
                                    : t("weight")}
                              </p>
                              {medication.frequencies.find(
                                (option) => option.value === draft.frequency,
                              )?.descriptions?.[locale] && (
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {
                                    medication.frequencies.find(
                                      (option) =>
                                        option.value === draft.frequency,
                                    )?.descriptions?.[locale]
                                  }
                                </p>
                              )}
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs font-medium text-medical-700">
                                  {t("notes")}
                                </summary>
                                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                                  {medication.notes?.[locale]}
                                </p>
                                {medication.referenceUrl && (
                                  <a
                                    href={medication.referenceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-block text-xs text-medical-700 underline"
                                  >
                                    {t("source")}
                                  </a>
                                )}
                              </details>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div
                          role="group"
                          aria-label={t("customView")}
                          className="grid grid-cols-2 gap-1 rounded-lg bg-medical-50 p-1"
                        >
                          {(["weight", "bsa"] as const).map((value) => (
                            <Button
                              key={value}
                              type="button"
                              size="sm"
                              className="h-auto min-h-9 whitespace-normal"
                              variant={method === value ? "default" : "ghost"}
                              aria-pressed={method === value}
                              onClick={() => setMethod(value)}
                            >
                              {t(
                                value === "weight"
                                  ? "weightMethod"
                                  : "bsaMethod",
                              )}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs leading-6 text-muted-foreground">
                          {t("customIntro")}
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <NumberField
                            id="dose-dose"
                            label={t("prescribedDose")}
                            value={isBsa ? bsa.dose : custom.dose}
                            onChange={(value) =>
                              isBsa
                                ? updateBsa("dose", value)
                                : updateCustom("dose", value)
                            }
                          />
                          <SelectField
                            label={t("doseUnit")}
                            id="dose-unit"
                            value={isBsa ? bsa.doseUnit : custom.doseUnit}
                            onChange={(value) =>
                              isBsa
                                ? updateBsa(
                                    "doseUnit",
                                    value as BsaDoseInput["doseUnit"],
                                  )
                                : updateCustom(
                                    "doseUnit",
                                    value as CustomDoseInput["doseUnit"],
                                  )
                            }
                            options={(isBsa
                              ? ["mg", "mcg", "units"]
                              : ["mg", "mL", "tablets"]
                            ).map((unit) => [unit, unitLabel(unit)])}
                          />
                        </div>
                        {isBsa ? (
                          <>
                            {!cycle && (
                              <SelectField
                                label={t("bsaBasis")}
                                id="dose-basis"
                                value={bsa.basis}
                                onChange={(value) =>
                                  updateBsa(
                                    "basis",
                                    value as BsaDoseInput["basis"],
                                  )
                                }
                                options={[
                                  [
                                    "day",
                                    `${unitLabel(bsa.doseUnit)} ${t("dayBsa")}`,
                                  ],
                                  [
                                    "dose",
                                    `${unitLabel(bsa.doseUnit)} ${t("doseBsa")}`,
                                  ],
                                ]}
                              />
                            )}
                            {cycle && (
                              <p className="text-sm font-medium text-medical-900">
                                {t("cycleBasis")}
                              </p>
                            )}
                          </>
                        ) : (
                          <SelectField
                            label={t("doseBasis")}
                            id="dose-basis"
                            value={custom.basis}
                            onChange={(value) =>
                              updateCustom(
                                "basis",
                                value as CustomDoseInput["basis"],
                              )
                            }
                            options={(
                              [
                                ["kg-day", "kgDay"],
                                ["kg-dose", "kgDose"],
                                ["day", "dayBasis"],
                                ["dose", "doseBasisLabel"],
                              ] as const
                            ).map(([value, label]) => [
                              value,
                              `${unitLabel(custom.doseUnit)} ${t(label)}`,
                            ])}
                          />
                        )}
                        <SelectField
                          label={t("frequency")}
                          id="dose-frequency"
                          value={isBsa ? bsa.frequency : custom.frequency}
                          onChange={(value) => {
                            if (isBsa)
                              setBsa((current) => ({
                                ...current,
                                frequency: value,
                                basis:
                                  value === "continuous"
                                    ? "day"
                                    : current.basis,
                              }));
                            else updateCustom("frequency", value);
                          }}
                          options={(isBsa
                            ? [
                                "qD",
                                "BID",
                                "TID",
                                "weekly",
                                "q2weeks",
                                "q3weeks",
                                "continuous",
                              ]
                            : [
                                "qD",
                                "BID",
                                "TID",
                                "QID",
                                "q4h",
                                "q6h",
                                "q8h",
                                "q12h",
                              ]
                          ).map((value) => [value, t(value)])}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <NumberField
                            label={t("concentration")}
                            id="dose-concentration"
                            value={
                              isBsa ? bsa.concentration : custom.concentration
                            }
                            onChange={(value) =>
                              isBsa
                                ? updateBsa("concentration", value)
                                : updateCustom("concentration", value)
                            }
                          />
                          <SelectField
                            label={t("concentrationUnit")}
                            id="dose-concentration-unit"
                            value={
                              isBsa
                                ? bsa.concentrationUnit
                                : custom.concentrationUnit
                            }
                            onChange={(value) =>
                              isBsa
                                ? updateBsa(
                                    "concentrationUnit",
                                    value as BsaDoseInput["concentrationUnit"],
                                  )
                                : updateCustom(
                                    "concentrationUnit",
                                    value as CustomDoseInput["concentrationUnit"],
                                  )
                            }
                            options={(isBsa
                              ? ["mg/mL", "mcg/mL", "units/mL"]
                              : ["mg/mL", "mg/tablet"]
                            ).map((value) => [
                              value,
                              value === "units/mL"
                                ? `${t("units")}/mL`
                                : value === "mg/tablet"
                                  ? `mg/${t("tablets")}`
                                  : value,
                            ])}
                          />
                        </div>
                        <details className="rounded-lg border p-3">
                          <summary className="cursor-pointer text-sm font-medium text-medical-700">
                            {t("advanced")}
                          </summary>
                          <div className="mt-4 space-y-4">
                            <NumberField
                              id="dose-maximum"
                              label={`${t(isBsa && cycle ? "maximumCycle" : isBsa && bsa.basis === "dose" ? "maximumDose" : "maximum")} (${isBsa ? unitLabel(bsa.doseUnit) : "mg"})`}
                              optional
                              value={isBsa ? bsa.maximum : custom.maximum}
                              onChange={(value) =>
                                isBsa
                                  ? updateBsa("maximum", value)
                                  : updateCustom("maximum", value)
                              }
                            />
                            {isBsa && (
                              <>
                                <Field
                                  id="dose-medication-name"
                                  label={t("medicationName")}
                                  optional
                                >
                                  <Input
                                    id="dose-medication-name"
                                    value={bsa.medicationName}
                                    onChange={(event) =>
                                      updateBsa(
                                        "medicationName",
                                        event.target.value,
                                      )
                                    }
                                  />
                                </Field>
                                <SelectField
                                  id="dose-bsa-method"
                                  label={t("bsaMethodLabel")}
                                  value={bsa.method}
                                  onChange={(value) =>
                                    updateBsa(
                                      "method",
                                      value as BsaDoseInput["method"],
                                    )
                                  }
                                  options={[
                                    ["actual", t("actualBsa")],
                                    ["normalized", t("normalizedBsa")],
                                  ]}
                                />
                              </>
                            )}
                          </div>
                        </details>
                        {isBsa && bsa.method === "normalized" && (
                          <p
                            role="note"
                            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
                          >
                            {t("normalizedNotice")}
                          </p>
                        )}
                      </>
                    )}
                    {error && (
                      <div
                        id="dose-error"
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                      >
                        <strong>
                          {t("errorPrefix")}{" "}
                          {t(
                            error.field === "medication"
                              ? "medication"
                              : error.field === "dose"
                                ? "prescribedDose"
                                : error.field,
                          )}
                        </strong>
                        <p className="mt-1">{error.message}</p>
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="h-11 w-full"
                      disabled={view === "medication" && !medication}
                    >
                      <Calculator />
                      {previous && !result ? t("recalculate") : t("calculate")}
                    </Button>
                  </div>
                </section>
                <aside
                  className="min-w-0 lg:sticky lg:top-6"
                  aria-label={t("result")}
                >
                  <section
                    className="overflow-hidden rounded-xl border border-medical-200 bg-white shadow-sm"
                    aria-labelledby="dose-result-title"
                  >
                    <div className="border-b border-medical-100 bg-medical-50 px-5 py-4">
                      <h2
                        id="dose-result-title"
                        className="text-lg font-semibold text-medical-900"
                      >
                        {t("result")}
                      </h2>
                      {currentName && (
                        <p className="mt-1 text-sm text-medical-700">
                          {currentName}
                        </p>
                      )}
                    </div>
                    {result ? (
                      <div className="space-y-5 p-5" aria-live="polite">
                        {result.limited && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            <p className="font-semibold">{t("limited")}</p>
                            <p className="mt-1">
                              {t("uncapped")}:{" "}
                              {formatDose(result.originalPerDose)}{" "}
                              {unitLabel(result.unit)} · {t("applied")}:{" "}
                              {formatDose(result.perDose)}{" "}
                              {unitLabel(result.unit)}
                            </p>
                          </div>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                          <Quantity
                            label={t(
                              result.period === "hour"
                                ? "perHour"
                                : result.period === "cycle"
                                  ? "cycleTotal"
                                  : "perDose",
                            )}
                            value={formatDose(result.perDose)}
                            unit={`${unitLabel(result.unit)}${result.period === "hour" ? "/h" : ""}`}
                            testId="dose-amount"
                          />
                          <Quantity
                            label={t(
                              result.period === "hour"
                                ? "volumeHour"
                                : result.volumeUnit === "tablets"
                                  ? "tabletsDose"
                                  : "volumeDose",
                            )}
                            value={formatDose(result.volume)}
                            unit={`${unitLabel(result.volumeUnit)}${result.period === "hour" ? "/h" : ""}`}
                            testId="dose-volume"
                          />
                        </div>
                        <dl className="space-y-3 border-t pt-4 text-sm">
                          <Detail
                            label={t("frequency")}
                            value={frequencyLabel}
                          />
                          {view === "medication" && concentration && (
                            <Detail
                              label={t("formulation")}
                              value={concentration.labels[locale]}
                            />
                          )}
                          {view === "medication" &&
                            medication?.inputs.includes("duration") && (
                              <Detail
                                label={t("duration")}
                                value={`${draft.duration} ${t("days")}`}
                              />
                            )}
                          {result.total !== null &&
                            result.period !== "cycle" && (
                              <Detail
                                label={t("dailyTotal")}
                                value={`${formatDose(result.total)} ${unitLabel(result.unit)} · ${formatDose(result.totalVolume!)} ${unitLabel(result.volumeUnit)}`}
                              />
                            )}
                          {result.bsa !== undefined && (
                            <Detail
                              label={t("patientBsa")}
                              value={`${formatDose(result.bsa, 4)} m²`}
                            />
                          )}
                          {result.effectiveBsa !== undefined &&
                            result.effectiveBsa !== result.bsa && (
                              <Detail
                                label={t("usedBsa")}
                                value={`${formatDose(result.effectiveBsa, 4)} m²`}
                              />
                            )}
                        </dl>
                        {result.period === "unknown" && (
                          <p className="rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                            {t("dailyUnknown")}
                          </p>
                        )}
                        {result.volumeUnit === "tablets" &&
                          Math.abs(result.volume - Math.round(result.volume)) >
                            1e-8 && (
                            <p className="rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                              {t("fractionalTablet")}
                            </p>
                          )}
                        <details className="border-t pt-4 text-sm">
                          <summary className="cursor-pointer font-medium text-medical-700">
                            {t("details")}
                          </summary>
                          <p className="mt-3 break-words font-mono text-xs leading-6">
                            {result.formula}
                          </p>
                          {result.limits.length > 0 && (
                            <div className="mt-3">
                              <p className="font-medium">{t("limits")}</p>
                              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                                {result.limits.map((limit, index) => (
                                  <li key={index}>
                                    {formatDose(limit.value)}{" "}
                                    {unitLabel(result.unit)}{" "}
                                    {t(
                                      limit.period === "day"
                                        ? "dayPeriod"
                                        : limit.period === "cycle"
                                          ? "cyclePeriod"
                                          : "dosePeriod",
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p className="mt-3 text-xs leading-6 text-muted-foreground">
                            {t("rounding")}
                          </p>
                        </details>
                        {view === "medication" && medication?.referenceUrl && (
                          <a
                            href={medication.referenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex text-sm font-medium text-medical-700 underline"
                          >
                            {t("source")}
                          </a>
                        )}
                        <p className="border-t pt-4 text-xs leading-6 text-muted-foreground">
                          {t("verify")}{" "}
                          <Link
                            href={`/${locale}/disclaimer`}
                            className="font-medium text-medical-700 underline underline-offset-4"
                          >
                            {disclaimer("seeFullDisclaimer")}
                          </Link>
                        </p>
                      </div>
                    ) : (
                      <div
                        className="flex min-h-64 flex-col items-center justify-center p-6 text-center"
                        role="status"
                      >
                        <Calculator className="mb-4 h-8 w-8 text-medical-200" />
                        <h3 className="font-medium text-medical-900">
                          {previous ? t("staleTitle") : t("emptyTitle")}
                        </h3>
                        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                          {previous ? t("staleText") : t("emptyText")}
                        </p>
                      </div>
                    )}
                  </section>
                </aside>
              </div>
            )}
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  id,
  label,
  children,
  optional = false,
}: {
  id: string;
  label: string;
  children: ReactNode;
  optional?: boolean;
}) {
  const t = useTranslations("DoseWorkspace");
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-medical-900"
      >
        {label}
        {optional && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            ({t("optional")})
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
function NumberField({
  id,
  label,
  value,
  onChange,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <Field id={id} label={label} optional={optional}>
      <Input
        id={id}
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        className="h-10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-required={!optional}
      />
    </Field>
  );
}
function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: (readonly [string, string])[];
}) {
  return (
    <Field id={id} label={label}>
      <WorkspaceSelect
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        options={options}
      />
    </Field>
  );
}
function WorkspaceSelect({
  id,
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: (readonly [string, string])[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={`${controlClass} ${className}`}
      >
        <SelectValue>
          <span className="block truncate">
            {options.find(([key]) => key === value)?.[1]}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align="start"
        className="min-w-0 w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]"
      >
        {options.map(([key, name]) => (
          <SelectItem key={key} value={key} className="min-h-9 py-2">
            <span className="block whitespace-normal break-words">{name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function Quantity({
  label,
  value,
  unit,
  testId,
}: {
  label: string;
  value: string;
  unit: string;
  testId: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <output
        data-testid={testId}
        aria-label={label}
        className="mt-2 block break-words text-3xl font-semibold tracking-tight text-medical-900"
      >
        {value} <span className="text-base font-medium">{unit}</span>
      </output>
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-full break-words font-medium text-medical-900">
        {value}
      </dd>
    </div>
  );
}
