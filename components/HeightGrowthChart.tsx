"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FocusEvent, KeyboardEvent, PointerEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  HeightMeasurement,
  heightReference,
  heightAtZ,
  yearlyHeightReference,
} from "@/lib/calculations/height-growth";

// Population curves and entered measurements are kept separate from a conditional scenario.
// This component can be reused by other height tools without generating an AI forecast.
export function HeightGrowthChart({
  sex,
  unit,
  measurements,
  target,
}: {
  sex: "male" | "female";
  unit: "cm" | "in";
  measurements: HeightMeasurement[];
  target?: { targetCm: number; lowerCm: number; upperCm: number };
}) {
  const t = useTranslations("TargetHeightCalculator.growth");
  const locale = useLocale();
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const keyboardInspection = useRef(false);
  const [inspection, setInspection] = useState<{
    ageMonths: number;
    source: "chart" | "table";
    left: number;
    top: number;
  } | null>(null);
  const [showScenario, setShowScenario] = useState(true);
  const current = measurements[0];
  const sorted = [...measurements].sort((a, b) => a.ageMonths - b.ageMonths);
  const reference = useMemo(
    () => Array.from({ length: 217 }, (_, i) => heightReference(24 + i, sex)),
    [sex],
  );
  const annual = useMemo(
    () => yearlyHeightReference(sex, current),
    [sex, current],
  );
  const scenario = useMemo(
    () =>
      current && showScenario
        ? [
            current.ageMonths,
            ...reference
              .filter((p) => p.ageMonths > current.ageMonths)
              .map((p) => p.ageMonths),
          ]
            .map((ageMonths) => ({
              ageMonths,
              height: heightAtZ(
                heightReference(ageMonths, sex),
                current.zScore,
              ),
            }))
            .filter(
              (p): p is { ageMonths: number; height: number } =>
                p.height !== null,
            )
        : [],
    [current, showScenario, reference, sex],
  );
  const endpoint = annual[annual.length - 1].scenario;
  const convert = (cm: number) => (unit === "in" ? cm / 2.54 : cm);
  const number = (value: number, digits = 1) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  const height = (cm: number) => `${number(convert(cm))} ${unit}`;
  const age = (months: number) =>
    t("ageValue", { years: Math.floor(months / 12), months: months % 12 });
  const percentile = (p: number) =>
    p < 0.1
      ? "<0.1".replace(".", locale === "es" ? "," : ".")
      : p > 99.9
        ? ">99.9".replace(".", locale === "es" ? "," : ".")
        : number(p);
  const referenceNow = current ? heightReference(current.ageMonths, sex) : null;
  const plottedValues = [
    ...reference.flatMap((p) => [p.P3, p.P97]),
    ...measurements.map((p) => p.heightCm),
    ...scenario.map((p) => p.height),
  ];
  const step = unit === "cm" ? 20 : 10;
  const minimum = Math.max(
    0,
    Math.floor(convert(Math.min(...plottedValues)) / step) * step - step,
  );
  const maximum =
    Math.ceil(convert(Math.max(...plottedValues)) / step) * step + step;
  const x = (months: number) => 60 + ((months - 24) / 216) * 600;
  const y = (cm: number) =>
    285 - ((convert(cm) - minimum) / (maximum - minimum)) * 250;
  const path = (points: { ageMonths: number; height: number }[]) =>
    points
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${x(p.ageMonths).toFixed(2)},${y(p.height).toFixed(2)}`,
      )
      .join(" ");
  const band = `${path(reference.map((p) => ({ ageMonths: p.ageMonths, height: p.P3 })))} ${path([...reference].reverse().map((p) => ({ ageMonths: p.ageMonths, height: p.P97 }))).replace(/^M/, "L")} Z`;
  const comparison =
    endpoint === null
      ? "unavailable"
      : endpoint < (target?.lowerCm ?? -Infinity)
        ? "belowFamily"
        : endpoint > (target?.upperCm ?? Infinity)
          ? "aboveFamily"
          : "withinFamily";

  useEffect(() => {
    const dismiss = () =>
      setInspection((previous) => {
        const focused =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        if (
          !previous ||
          !keyboardInspection.current ||
          focused?.dataset.heightInspection !== previous.source
        )
          return null;
        const bounds =
          previous.source === "chart"
            ? svgRef.current?.getBoundingClientRect()
            : focused.getBoundingClientRect();
        if (!bounds) return null;
        const clientX =
          previous.source === "chart"
            ? bounds.left +
              ((60 + ((previous.ageMonths - 24) / 216) * 600) / 720) *
                bounds.width
            : bounds.left + bounds.width / 2;
        return {
          ...previous,
          left: Math.max(8, Math.min(window.innerWidth - 268, clientX + 16)),
          top: Math.max(8, Math.min(window.innerHeight - 240, bounds.top + 66)),
        };
      });
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, []);
  const inspectedReference = inspection
    ? heightReference(inspection.ageMonths, sex)
    : null;
  const inspectedMeasurement = inspection
    ? measurements.find((point) => point.ageMonths === inspection.ageMonths)
    : undefined;
  const inspectedScenario =
    inspectedReference &&
    current &&
    showScenario &&
    inspectedReference.ageMonths >= current.ageMonths
      ? heightAtZ(inspectedReference, current.zScore)
      : null;
  function inspect(
    ageMonths: number,
    source: "chart" | "table",
    clientX: number,
    clientY: number,
  ) {
    const left = Math.max(8, Math.min(window.innerWidth - 268, clientX + 16));
    const top = Math.max(8, Math.min(window.innerHeight - 240, clientY + 16));
    setInspection({
      ageMonths: Math.max(24, Math.min(240, ageMonths)),
      source,
      left,
      top,
    });
  }
  function inspectChart(event: PointerEvent<SVGSVGElement>) {
    keyboardInspection.current = false;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    if (point.x < 60 || point.x > 660 || point.y < 35 || point.y > 285) {
      setInspection(null);
      return;
    }
    let ageMonths = Math.round(24 + ((point.x - 60) / 600) * 216);
    const measured = measurements.find(
      (measurement) => Math.abs(x(measurement.ageMonths) - point.x) <= 5,
    );
    if (measured) ageMonths = measured.ageMonths;
    inspect(ageMonths, "chart", event.clientX, event.clientY);
  }
  function inspectKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    keyboardInspection.current = true;
    if (event.key === "Escape") {
      setInspection(null);
      return;
    }
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const ageMonths =
      event.key === "Home"
        ? 24
        : event.key === "End"
          ? 240
          : (inspection?.ageMonths ?? current?.ageMonths ?? 120) +
            (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 12 : 1);
    const bounds = svgRef.current?.getBoundingClientRect();
    if (bounds)
      inspect(
        ageMonths,
        "chart",
        bounds.left +
          (x(Math.max(24, Math.min(240, ageMonths))) / 720) * bounds.width,
        bounds.top + 50,
      );
  }
  function inspectFocus(
    event: FocusEvent<HTMLElement> | KeyboardEvent<HTMLElement>,
    ageMonths: number,
    source: "chart" | "table",
  ) {
    keyboardInspection.current = true;
    const bounds = event.currentTarget.getBoundingClientRect();
    inspect(ageMonths, source, bounds.left + bounds.width / 2, bounds.top);
  }
  const rowInteraction = (ageMonths: number) => ({
    "data-height-inspection": "table",
    tabIndex: 0,
    "aria-describedby":
      inspection?.source === "table" && inspection.ageMonths === ageMonths
        ? `${id}-tooltip`
        : undefined,
    onPointerEnter: (event: PointerEvent<HTMLTableRowElement>) => {
      // Scrolling a keyboard-focused row into view can put a stationary pointer
      // over another row. Keep keyboard inspection until the pointer moves.
      if (
        keyboardInspection.current &&
        document.activeElement?.hasAttribute("data-height-inspection")
      )
        return;
      keyboardInspection.current = false;
      inspect(ageMonths, "table", event.clientX, event.clientY);
    },
    onPointerMove: (event: PointerEvent<HTMLTableRowElement>) => {
      keyboardInspection.current = false;
      inspect(ageMonths, "table", event.clientX, event.clientY);
    },
    onPointerDown: (event: PointerEvent<HTMLTableRowElement>) => {
      keyboardInspection.current = false;
      inspect(ageMonths, "table", event.clientX, event.clientY);
    },
    onFocus: (event: FocusEvent<HTMLTableRowElement>) =>
      inspectFocus(event, ageMonths, "table"),
    onBlur: () => setInspection(null),
    onPointerLeave: (event: PointerEvent<HTMLTableRowElement>) => {
      if (event.pointerType !== "touch" && !keyboardInspection.current)
        setInspection(null);
    },
    onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key === "Escape") setInspection(null);
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        inspectFocus(event, ageMonths, "table");
      }
    },
    className: `border-b cursor-pointer transition-colors duration-150 motion-reduce:transition-none hover:bg-medical-50 focus-visible:bg-medical-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-medical-500 ${inspection?.ageMonths === ageMonths ? "bg-medical-50" : ""}`,
  });

  return (
    <section
      className="space-y-5 rounded-xl border bg-white p-4 sm:p-6"
      aria-labelledby={`${id}-title`}
    >
      <header className="space-y-2">
        <h2
          id={`${id}-title`}
          className="text-xl font-semibold text-medical-900"
        >
          {t("title")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("referenceLabel", { sex: t(sex) })}
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {current && (
            <span
              data-testid="child-height-chart-summary"
              className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-900"
            >
              {height(current.heightCm)} · {age(current.ageMonths)} ·{" "}
              {t("percentileValue", { value: percentile(current.percentile) })}
            </span>
          )}
          {target && (
            <span className="rounded-full bg-medical-50 px-3 py-1.5 text-medical-900">
              {t("targetChip", { value: height(target.targetCm) })}
            </span>
          )}
        </div>
        {target && (
          <div
            data-testid="height-top-summary"
            className="rounded-lg border border-medical-100 bg-medical-50/50 px-4 py-3 text-sm leading-6 text-medical-900"
          >
            <h3 className="mb-1 font-semibold">
              {t(
                current && showScenario && endpoint !== null
                  ? "scenarioSummaryTitle"
                  : "familySummaryTitle",
              )}
            </h3>
            {current && showScenario && endpoint !== null ? (
              <p>
                {t.rich("topEndpoint", {
                  value: height(endpoint),
                  height: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            ) : (
              <p>
                {t("topFamilySummary", {
                  value: height(target.targetCm),
                  lower: height(target.lowerCm),
                  upper: height(target.upperCm),
                })}
              </p>
            )}
          </div>
        )}
      </header>
      {current && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id={`${id}-scenario`}
              checked={showScenario}
              onCheckedChange={(value) => setShowScenario(value === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor={`${id}-scenario`}
              className="cursor-pointer leading-5"
            >
              {t("scenarioToggle")}
            </Label>
          </div>
        </div>
      )}
      <div
        className="flex flex-wrap gap-x-5 gap-y-2 text-xs"
        aria-label={t("legend")}
      >
        <span className="flex items-center gap-2">
          <span className="h-3 w-4 rounded-sm border border-blue-300 bg-blue-50" />
          {t("band")}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 border-t-2 border-blue-700" />
          {t("median")}
        </span>
        {current && (
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-700" />
            {t("measured")}
          </span>
        )}
        {scenario.length > 0 && (
          <span className="flex items-center gap-2">
            <span className="w-4 border-t-2 border-dashed border-amber-700" />
            {t("scenario")}
          </span>
        )}
      </div>
      <div
        className="overflow-x-auto rounded-lg border bg-white"
        tabIndex={0}
        role="region"
        aria-label={t("chartRegion")}
        data-height-inspection="chart"
        aria-describedby={`${id}-interaction-hint${inspection?.source === "chart" ? ` ${id}-tooltip` : ""}`}
        onFocus={(event) =>
          inspectFocus(event, current?.ageMonths ?? 120, "chart")
        }
        onBlur={() => setInspection(null)}
        onKeyDown={inspectKeyboard}
        onPointerLeave={(event) => {
          if (event.pointerType !== "touch" && !keyboardInspection.current)
            setInspection(null);
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 720 335"
          className="block w-full min-w-[600px]"
          role="img"
          aria-labelledby={`${id}-svg-title ${id}-svg-desc`}
          onPointerMove={inspectChart}
          onPointerDown={inspectChart}
        >
          <title id={`${id}-svg-title`}>{t("title")}</title>
          <desc id={`${id}-svg-desc`}>{t("chartDescription")}</desc>
          <text x="60" y="19" fill="#475569" fontSize="12">
            {t("heightAxis", { unit })}
          </text>
          {Array.from(
            { length: Math.round((maximum - minimum) / step) + 1 },
            (_, i) => minimum + i * step,
          ).map((value) => {
            const position =
              285 - ((value - minimum) / (maximum - minimum)) * 250;
            return (
              <g key={value}>
                <line
                  x1="60"
                  x2="660"
                  y1={position}
                  y2={position}
                  stroke="#e2e8f0"
                />
                <text
                  x="50"
                  y={position + 4}
                  textAnchor="end"
                  fill="#475569"
                  fontSize="12"
                >
                  {number(value, 0)}
                </text>
              </g>
            );
          })}
          {Array.from({ length: 10 }, (_, i) => 2 + i * 2).map((year) => (
            <g key={year}>
              <line
                x1={x(year * 12)}
                x2={x(year * 12)}
                y1="35"
                y2="285"
                stroke="#f1f5f9"
              />
              <text
                x={x(year * 12)}
                y="305"
                textAnchor="middle"
                fill="#475569"
                fontSize="12"
              >
                {year}
              </text>
            </g>
          ))}
          <path d={band} fill="#eff6ff" />
          {(["P3", "P50", "P97"] as const).map((key) => (
            <g key={key}>
              <path
                d={path(
                  reference.map((p) => ({
                    ageMonths: p.ageMonths,
                    height: p[key],
                  })),
                )}
                fill="none"
                stroke={key === "P50" ? "#1d4ed8" : "#60a5fa"}
                strokeWidth={key === "P50" ? 2.5 : 1.5}
                pathLength={1}
                className="height-reference-curve"
              />
              <text
                x="667"
                y={y(reference[reference.length - 1][key]) + 4}
                fontSize="11"
                fill="#1e40af"
              >
                {key}
              </text>
            </g>
          ))}
          {scenario.length > 0 && (
            <path
              d={path(scenario)}
              fill="none"
              stroke="#b45309"
              strokeWidth="2.5"
              strokeDasharray="7 5"
              className="height-scenario-curve"
            />
          )}
          {sorted.length > 1 && (
            <path
              d={path(
                sorted.map((p) => ({
                  ageMonths: p.ageMonths,
                  height: p.heightCm,
                })),
              )}
              fill="none"
              stroke="#7e22ce"
              strokeWidth="2"
            />
          )}
          {sorted.map((p) => (
            <circle
              key={p.ageMonths}
              cx={x(p.ageMonths)}
              cy={y(p.heightCm)}
              r="5"
              className="height-measurement-point"
              fill="#7e22ce"
              stroke="white"
              strokeWidth="2"
            >
              <title>
                {age(p.ageMonths)}: {height(p.heightCm)} ·{" "}
                {t("percentileValue", { value: percentile(p.percentile) })}
              </title>
            </circle>
          ))}
          {inspectedReference && (
            <g aria-hidden="true" pointerEvents="none">
              <line
                x1={x(inspectedReference.ageMonths)}
                x2={x(inspectedReference.ageMonths)}
                y1="35"
                y2="285"
                stroke="#64748b"
                strokeDasharray="4 4"
              />
              {(["P3", "P50", "P97"] as const).map((key) => (
                <circle
                  key={key}
                  cx={x(inspectedReference.ageMonths)}
                  cy={y(inspectedReference[key])}
                  r="4"
                  fill="white"
                  stroke="#1d4ed8"
                  strokeWidth="2"
                />
              ))}
              {inspectedScenario !== null && (
                <circle
                  cx={x(inspectedReference.ageMonths)}
                  cy={y(inspectedScenario)}
                  r="5"
                  fill="white"
                  stroke="#b45309"
                  strokeWidth="2"
                />
              )}
              {inspectedMeasurement && (
                <circle
                  cx={x(inspectedMeasurement.ageMonths)}
                  cy={y(inspectedMeasurement.heightCm)}
                  r="8"
                  fill="none"
                  stroke="#7e22ce"
                  strokeWidth="2"
                />
              )}
            </g>
          )}
          <text
            x="360"
            y="328"
            textAnchor="middle"
            fill="#475569"
            fontSize="12"
          >
            {t("ageAxis")}
          </text>
        </svg>
      </div>
      <p
        id={`${id}-interaction-hint`}
        className="text-xs leading-5 text-muted-foreground"
      >
        {t("interactionHint")}
      </p>
      <p className="text-xs leading-5 text-muted-foreground">
        {t("chartHint")}
      </p>
      <p className="text-sm leading-6 text-muted-foreground">{t("intro")}</p>
      {current && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-950">
          {t("scenarioWarning")}
        </p>
      )}
      {current && referenceNow && target ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-medical-100 bg-medical-50/50 p-4">
            <h3 className="text-sm font-medium text-medical-900">
              {t("current")}
            </h3>
            <p
              className="mt-2 text-2xl font-semibold text-medical-900"
              data-testid="child-height-percentile"
            >
              {t("percentileValue", { value: percentile(current.percentile) })}
            </p>
            <p className="mt-1 text-sm">
              {height(current.heightCm)} · {age(current.ageMonths)}
            </p>
            <p className="mt-2 text-sm text-medical-800">
              {t(
                current.heightCm < referenceNow.P50
                  ? "belowMedian"
                  : current.heightCm > referenceNow.P50
                    ? "aboveMedian"
                    : "atMedian",
              )}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t(current.position)}
            </p>
          </div>
          <div className="rounded-lg border p-4 text-sm">
            <h3 className="font-medium text-medical-900">
              {t("familyComparison")}
            </h3>
            <p className="mt-2 leading-6">
              {t("familyReminder", {
                value: height(target.targetCm),
                lower: height(target.lowerCm),
                upper: height(target.upperCm),
              })}
            </p>
            {showScenario && endpoint !== null && (
              <p
                className="mt-3 leading-6"
                data-testid="family-scenario-comparison"
              >
                {t("endpoint", { value: height(endpoint) })}{" "}
                <strong>{t(comparison)}</strong>
              </p>
            )}
            {showScenario && endpoint === null && (
              <p className="mt-3">{t("unavailable")}</p>
            )}
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              {t("comparisonExplanation")}
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-lg bg-medical-50 p-4 text-sm leading-6 text-medical-800">
          {t("noMeasurement")}
        </p>
      )}
      {measurements.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="pb-3 text-left font-medium text-medical-900">
              {t("measurementTable")}
            </caption>
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-3">{t("ageColumn")}</th>
                <th className="py-2 pr-3">{t("heightColumn")}</th>
                <th className="py-2">{t("percentileColumn")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.ageMonths} {...rowInteraction(p.ageMonths)}>
                  <th scope="row" className="py-2 pr-3 font-normal">
                    {age(p.ageMonths)}
                  </th>
                  <td className="py-2 pr-3">{height(p.heightCm)}</td>
                  <td className="py-2">{percentile(p.percentile)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium text-medical-900">
          {t("yearTable")}
        </summary>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          {t("tableHint")}
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm tabular-nums">
            <caption className="sr-only">{t("yearTable")}</caption>
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-3">{t("ageColumn")}</th>
                {["P3", "P50", "P97"].map((p) => (
                  <th key={p} className="py-2 pr-3">
                    {p} ({unit})
                  </th>
                ))}
                {current && showScenario && (
                  <th className="py-2 pr-3">
                    {t("scenarioColumn")} ({unit})
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {annual.map((row) => (
                <tr key={row.ageMonths} {...rowInteraction(row.ageMonths)}>
                  <th scope="row" className="py-2 pr-3 font-normal">
                    {row.ageMonths / 12}
                  </th>
                  {(["P3", "P50", "P97"] as const).map((key) => (
                    <td key={key} className="py-2 pr-3">
                      {number(convert(row[key]))}
                    </td>
                  ))}
                  {current && showScenario && (
                    <td className="py-2 pr-3">
                      {row.scenario === null
                        ? "—"
                        : `≈ ${number(convert(row.scenario))}`}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="text-xs leading-6 text-muted-foreground">
        {t("interpretation")}
      </p>
      <a
        href="https://www.cdc.gov/growthcharts/cdc-data-files.htm"
        target="_blank"
        rel="noreferrer"
        className="inline-block text-xs font-medium text-medical-700 underline"
      >
        {t("source")}
      </a>
      {inspection &&
        inspectedReference &&
        createPortal(
          <div
            id={`${id}-tooltip`}
            role="tooltip"
            data-testid="height-chart-tooltip"
            className="pointer-events-none fixed z-50 w-[260px] rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg"
            style={{ left: inspection.left, top: inspection.top }}
          >
            <p className="mb-2 font-semibold text-medical-900">
              {age(inspection.ageMonths)}
            </p>
            <dl className="space-y-1.5 tabular-nums">
              {(["P3", "P50", "P97"] as const).map((key) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt className="font-medium text-blue-700">{key}</dt>
                  <dd>{height(inspectedReference[key])}</dd>
                </div>
              ))}
              {inspectedMeasurement && (
                <div className="flex justify-between gap-3 font-semibold text-violet-800">
                  <dt>
                    {t("measured")} (P
                    {percentile(inspectedMeasurement.percentile)})
                  </dt>
                  <dd className="shrink-0">
                    {height(inspectedMeasurement.heightCm)}
                  </dd>
                </div>
              )}
              {inspectedScenario !== null && (
                <div className="flex justify-between gap-3 text-amber-800">
                  <dt>{t("scenarioColumn")}*</dt>
                  <dd className="shrink-0">≈ {height(inspectedScenario)}</dd>
                </div>
              )}
            </dl>
            {inspectedScenario !== null && (
              <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                {t("tooltipScenarioHint")}
              </p>
            )}
          </div>,
          document.body,
        )}
    </section>
  );
}
