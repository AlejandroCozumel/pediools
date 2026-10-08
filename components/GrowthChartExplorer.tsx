"use client";

import { FormEvent, ReactNode, useEffect, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonths, parseISO, isValid } from "date-fns";
import { Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ToggleViewChart from "@/components/ToggleViewChart";
import { growthChartConfig, GrowthChartGender, GrowthChartMetric, GrowthChartStandard } from "@/lib/growth-chart-config";

type ChartInput = {
  gender: GrowthChartGender;
  dateOfBirth?: string;
  type?: GrowthChartMetric;
  measurements: { date?: string; weight?: number; height?: number; value?: number; gestationalAge?: number; gestationalDays?: number; type?: GrowthChartMetric }[];
};

function readInput(value: string | null): ChartInput | null {
  if (!value) return null;
  try {
    const input = JSON.parse(value);
    if (!input || !["male", "female"].includes(input.gender) ||
      (input.dateOfBirth !== undefined && (typeof input.dateOfBirth !== "string" || !isValid(parseISO(input.dateOfBirth)))) ||
      !Array.isArray(input.measurements) || !input.measurements.length ||
      !input.measurements.every((measurement: ChartInput["measurements"][number]) => {
        if (!measurement || typeof measurement !== "object") return false;
        if (measurement.date !== undefined && (typeof measurement.date !== "string" || !isValid(parseISO(measurement.date)))) return false;
        return (["weight", "height", "value", "gestationalAge", "gestationalDays"] as const).every(key =>
          measurement[key] === undefined || (typeof measurement[key] === "number" && Number.isFinite(measurement[key])));
      })) return null;
    return input;
  } catch {
    return null;
  }
}

function dateField(value?: string) {
  if (!value) return "";
  const date = parseISO(value);
  if (!isValid(date)) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type Props = {
  standard: GrowthChartStandard;
  isLoading: boolean;
  error: Error | null;
  isInvalid: boolean;
  onRetry: () => void;
  renderChart: (metric: GrowthChartMetric, gender: GrowthChartGender) => ReactNode;
};

export default function GrowthChartExplorer({ standard, isLoading, error, isInvalid, onRetry, renderChart }: Props) {
  const locale = useLocale();
  const es = locale === "es";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const weightInput = readInput(searchParams.get("weightData"));
  const heightInput = readInput(searchParams.get("heightData"));
  const gender: GrowthChartGender = weightInput?.gender ?? (searchParams.get("sex") === "female" ? "female" : "male");
  const metric: GrowthChartMetric = searchParams.get("metric") === "height" ? "height" : "weight";
  const hasMeasurements = Boolean(searchParams.get("weightData") && searchParams.get("heightData"));
  const inputInvalid = hasMeasurements && (!weightInput || !heightInput || weightInput.gender !== heightInput.gender);
  const config = growthChartConfig[standard];
  const range = config.range[es ? "es" : "en"];
  const heightLabel = standard === "cdc_child" ? (es ? "Talla (cm)" : "Height (cm)") : (es ? "Longitud (cm)" : "Length (cm)");

  useEffect(() => {
    if (error || isInvalid || inputInvalid) setFormOpen(true);
  }, [error, isInvalid, inputInvalid]);

  function navigate(params: URLSearchParams, replace = true) {
    startTransition(() => {
      const url = `${pathname}${params.size ? `?${params}` : ""}`;
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    });
  }

  function changeGender(next: GrowthChartGender) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sex", next);
    for (const key of ["weightData", "heightData"]) {
      const input = readInput(params.get(key));
      if (input) params.set(key, JSON.stringify({ ...input, gender: next }));
    }
    navigate(params);
  }

  function clearMeasurements() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["weightData", "heightData", "patientId", "calculationId"]) params.delete(key);
    params.set("sex", gender);
    setFormOpen(false);
    navigate(params, false);
  }

  return (
    <section className="my-6 space-y-4" aria-label={es ? "Explorar gráfica de crecimiento" : "Explore growth chart"} aria-busy={isPending}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-medical-50 px-3 py-1 font-medium text-medical-800">{config.name}</span>
        <span className="text-muted-foreground">{range}</span>
        <span className="ml-auto text-xs text-muted-foreground" role="status">
          {hasMeasurements ? (es ? "Con tus medidas" : "With your measurements") : (es ? "Curvas de referencia" : "Reference curves")}
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4 sm:gap-6">
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-muted-foreground">{es ? "Sexo" : "Sex"}</legend>
          <div className="flex gap-1 rounded-lg bg-medical-50 p-1">
            {(["male", "female"] as const).map(value => (
              <Button key={value} size="sm" variant={gender === value ? "default" : "ghost"} aria-pressed={gender === value} disabled={isPending} onClick={() => changeGender(value)}>
                {value === "male" ? (es ? "Niño" : "Boy") : (es ? "Niña" : "Girl")}
              </Button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-muted-foreground">{es ? "Medida" : "Measurement"}</legend>
          <div className="flex gap-1 rounded-lg bg-medical-50 p-1">
            {(["weight", "height"] as const).map(value => (
              <Button key={value} size="sm" variant={metric === value ? "default" : "ghost"} aria-pressed={metric === value} disabled={isPending} onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("metric", value);
                navigate(params);
              }}>
                {value === "weight" ? (es ? "Peso (kg)" : "Weight (kg)") : heightLabel}
              </Button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button variant="outline" onClick={() => setFormOpen(!formOpen)} aria-expanded={formOpen} aria-controls="chart-measurements">
            {formOpen ? <X /> : <Plus />}
            {formOpen ? (es ? "Cerrar" : "Close") : hasMeasurements ? (es ? "Editar medidas" : "Edit measurements") : (es ? "Añadir medidas" : "Add measurements")}
          </Button>
          {hasMeasurements && <Button variant="ghost" disabled={isPending} onClick={clearMeasurements}><RotateCcw />{es ? "Limpiar" : "Clear"}</Button>}
        </div>
      </div>
      {formOpen && <MeasurementForm
        key={`${searchParams.get("weightData") ?? ""}${searchParams.get("heightData") ?? ""}`}
        standard={standard} gender={gender} weightInput={weightInput} heightInput={heightInput} es={es} disabled={isPending}
        onSubmit={inputs => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("weightData", JSON.stringify(inputs.weight));
          params.set("heightData", JSON.stringify(inputs.height));
          params.set("sex", gender);
          // Edited measurements no longer refer to a saved patient calculation.
          params.delete("patientId");
          params.delete("calculationId");
          setFormOpen(false);
          navigate(params, false);
        }}
      />}
      {hasMeasurements && (error || isInvalid || inputInvalid) ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-900">{es ? "No se pudo mostrar la medición" : "Unable to display the measurement"}</h2>
          <p className="mt-1 text-sm text-red-800">{es ? "Revisa los datos, las fechas y el rango de edad. Puedes corregir las medidas arriba o limpiar los datos para explorar las curvas." : "Check the measurements, dates, and age range. Edit the measurements above or clear the data to browse the curves."}</p>
          <Button className="mt-3" variant="outline" disabled={isPending} onClick={onRetry}>{es ? "Reintentar" : "Try again"}</Button>
        </div>
      ) : hasMeasurements && isLoading ? (
        <div role="status" className="flex min-h-64 items-center justify-center text-muted-foreground">{es ? "Calculando percentiles…" : "Calculating percentiles…"}</div>
      ) : (
        <>
          {hasMeasurements && <ToggleViewChart />}
          {renderChart(metric, gender)}
          {!hasMeasurements && <p className="text-center text-sm text-muted-foreground">{es ? "Explora las curvas o añade medidas para situar tu punto en la gráfica." : "Explore the curves or add measurements to plot your point on the chart."}</p>}
        </>
      )}
    </section>
  );
}

function MeasurementForm({ standard, gender, weightInput, heightInput, es, disabled, onSubmit }: {
  standard: GrowthChartStandard; gender: GrowthChartGender; weightInput: ChartInput | null; heightInput: ChartInput | null;
  es: boolean; disabled: boolean; onSubmit: (inputs: { weight: ChartInput; height: ChartInput }) => void;
}) {
  const [error, setError] = useState("");
  const weight = weightInput?.measurements.at(-1);
  const height = heightInput?.measurements.at(-1);
  const config = growthChartConfig[standard];
  const intergrowth = standard === "intergrowth";
  const today = dateField(new Date().toISOString());
  const id = (name: string) => `${standard}-${name}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const fields = new FormData(event.currentTarget);
    const weightValue = Number(fields.get("weight"));
    const heightValue = Number(fields.get("height"));
    if (![weightValue, heightValue].every(value => Number.isFinite(value) && value > 0)) {
      setError(es ? "Introduce peso y talla o longitud mayores que cero." : "Enter weight and height or length greater than zero.");
      return;
    }
    if (intergrowth) {
      const weeks = Number(fields.get("weeks"));
      const days = Number(fields.get("days"));
      if (!Number.isInteger(weeks) || weeks < 24 || weeks > 42 || !Number.isInteger(days) || days < 0 || days > 6) {
        setError(es ? "Introduce de 24 a 42 semanas y de 0 a 6 días." : "Enter 24 to 42 weeks and 0 to 6 days.");
        return;
      }
      onSubmit({
        weight: { gender, measurements: [{ value: weightValue, gestationalAge: weeks, gestationalDays: days, type: "weight" }] },
        height: { gender, measurements: [{ value: heightValue, gestationalAge: weeks, gestationalDays: days, type: "height" }] },
      });
      return;
    }
    const birth = parseISO(String(fields.get("birthDate")));
    const measurement = parseISO(String(fields.get("measurementDate")));
    if (!isValid(birth) || !isValid(measurement) || measurement < birth || dateField(measurement.toISOString()) > today) {
      setError(es ? "La fecha de medición debe ser igual o posterior al nacimiento y no puede estar en el futuro." : "The measurement date must be on or after birth and cannot be in the future.");
      return;
    }
    if (measurement < addMonths(birth, config.minMonths) || measurement > addMonths(birth, config.maxMonths)) {
      setError(es ? `La edad debe estar en el rango ${config.range.es}.` : `Age must be within ${config.range.en}.`);
      return;
    }
    const common = { gender, dateOfBirth: birth.toISOString() };
    onSubmit({
      weight: { ...common, type: "weight", measurements: [{ date: measurement.toISOString(), weight: weightValue }] },
      height: { ...common, type: "height", measurements: [{ date: measurement.toISOString(), height: heightValue }] },
    });
  }

  return (
    <form id="chart-measurements" className="space-y-4 rounded-xl border border-medical-200 bg-medical-50/50 p-4 sm:p-5" onSubmit={submit} onChange={() => setError("")}>
      <h2 className="font-semibold text-medical-900">{es ? "Tu medición" : "Your measurement"}</h2>
      <p className="text-sm text-muted-foreground">{es ? "Introduce ambas medidas para poder cambiar entre las dos gráficas." : "Enter both measurements so you can switch between the two charts."}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {intergrowth ? <>
          <div><label htmlFor={id("weeks")} className="mb-1.5 block text-sm font-medium">{es ? "Semanas al nacimiento" : "Weeks at birth"}</label><Input id={id("weeks")} name="weeks" type="number" min="24" max="42" step="1" required defaultValue={weight?.gestationalAge ?? ""} /></div>
          <div><label htmlFor={id("days")} className="mb-1.5 block text-sm font-medium">{es ? "Días adicionales" : "Additional days"}</label><Input id={id("days")} name="days" type="number" min="0" max="6" step="1" required defaultValue={weight?.gestationalDays ?? 0} /></div>
        </> : <>
          <div><label htmlFor={id("birthDate")} className="mb-1.5 block text-sm font-medium">{es ? "Fecha de nacimiento" : "Date of birth"}</label><Input id={id("birthDate")} name="birthDate" type="date" max={today} required defaultValue={dateField(weightInput?.dateOfBirth)} /></div>
          <div><label htmlFor={id("measurementDate")} className="mb-1.5 block text-sm font-medium">{es ? "Fecha de medición" : "Measurement date"}</label><Input id={id("measurementDate")} name="measurementDate" type="date" max={today} required defaultValue={dateField(weight?.date) || today} /></div>
        </>}
        <div><label htmlFor={id("weight")} className="mb-1.5 block text-sm font-medium">{es ? "Peso (kg)" : "Weight (kg)"}</label><Input id={id("weight")} name="weight" type="number" min="0.001" step="any" inputMode="decimal" required defaultValue={weight?.weight ?? weight?.value ?? ""} /></div>
        <div><label htmlFor={id("height")} className="mb-1.5 block text-sm font-medium">{standard === "cdc_child" ? (es ? "Talla (cm)" : "Height (cm)") : (es ? "Longitud (cm)" : "Length (cm)")}</label><Input id={id("height")} name="height" type="number" min="0.001" step="any" inputMode="decimal" required defaultValue={height?.height ?? height?.value ?? ""} /></div>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      <Button type="submit" disabled={disabled}>{es ? "Mostrar mi punto" : "Plot my measurement"}</Button>
    </form>
  );
}
