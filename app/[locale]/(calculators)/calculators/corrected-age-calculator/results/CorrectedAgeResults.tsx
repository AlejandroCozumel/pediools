"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Copy,
  Printer,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateOnlyPicker } from "@/components/DateOnlyPicker";
import { Slider } from "@/components/ui/slider";
import { CorrectedAgeSteps } from "@/components/CorrectedAgeSteps";
import {
  addCalendarMonths,
  calculateCorrectedAge,
  CorrectedAgeInput,
  correctedAgeFragment,
  dateDay,
  dayDate,
  readCorrectedAgeFragment,
  todayDate,
} from "@/lib/calculations/corrected-age";

const route = "/calculators/corrected-age-calculator";

export function CorrectedAgeResults() {
  const t = useTranslations("CorrectedAgeCalculator"),
    locale = useLocale();
  const [input, setInput] = useState<CorrectedAgeInput | null>();
  const [invalidLink, setInvalidLink] = useState(false);
  const [original, setOriginal] = useState("");
  const [dateError, setDateError] = useState("");
  const [share, setShare] = useState<"idle" | "copied" | "manual">("idle");
  const [link, setLink] = useState("");
  const [local, setLocal] = useState(false);
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const title = useRef<HTMLHeadingElement>(null),
    copyInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const read = () => {
      const data = readCorrectedAgeFragment(window.location.hash);
      setInput(data);
      setInvalidLink(!!window.location.hash && !data);
      setOriginal(data?.assessment ?? "");
      setShare("idle");
      setDateError("");
      setHoverDay(null);
    };
    read();
    setLocal(
      ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname),
    );
    title.current?.focus({ preventScroll: true });
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const hasInput = !!input;
  useEffect(() => {
    if (hasInput) {
      title.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [hasInput]);
  useEffect(() => {
    if (share === "manual") {
      copyInput.current?.focus();
      copyInput.current?.select();
    }
  }, [share]);

  if (input === undefined)
    return (
      <section className="rounded-xl border bg-white p-6">
        <h1 className="mb-3 text-2xl font-semibold text-medical-900">
          {t("resultTitle")}
        </h1>
        <p role="status">{t("loading")}</p>
      </section>
    );
  if (!input)
    return (
      <section className="space-y-4 rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-semibold text-medical-900">
          {t(invalidLink ? "invalidTitle" : "resultTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(invalidLink ? "invalidText" : "emptyText")}
        </p>
        <Button asChild>
          <Link href={route}>{t("start")}</Link>
        </Button>
      </section>
    );

  const result = calculateCorrectedAge(input);
  const currentInput = input;
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00Z`));
  const weeksDays = (days: number) =>
    t("weekDay", {
      weeks: Math.floor(Math.abs(days) / 7),
      days: Math.abs(days) % 7,
    });
  const monthsDays = (age: { months: number; days: number }) =>
    t("monthDay", age);
  const assessmentMax = addCalendarMonths(input.birth, 36);
  const endDay = Math.min(
    dateDay(assessmentMax),
    Math.max(result.dueDay + 28, result.assessmentDay + 28),
  );
  const sliderEnd = Math.min(
    dateDay("2100-12-31"),
    Math.max(
      dateDay(addCalendarMonths(result.dueDate, 24)),
      result.assessmentDay,
    ),
  );
  const x = (day: number) =>
    42 + ((day - result.birthDay) / (endDay - result.birthDay)) * 816;
  const selectedX = x(result.assessmentDay),
    dueX = x(result.dueDay);
  const preview =
    hoverDay === null
      ? null
      : calculateCorrectedAge({ ...input, assessment: dayDate(hoverDay) });
  const before = result.correctedDays < 0;
  const parentSource =
    locale === "es"
      ? "https://www.healthychildren.org/Spanish/ages-stages/baby/preemie/Paginas/Corrected-Age-For-Preemies.aspx"
      : "https://www.healthychildren.org/English/ages-stages/baby/preemie/Pages/Corrected-Age-For-Preemies.aspx";

  function selectDate(value: string) {
    try {
      const next = { ...currentInput, assessment: value };
      calculateCorrectedAge(next);
      setInput(next);
      setDateError("");
      setShare("idle");
      setHoverDay(null);
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${correctedAgeFragment(next)}`,
      );
    } catch {
      setDateError(
        t(
          value && value < currentInput.birth
            ? "errors.order"
            : value > assessmentMax
              ? "errors.assessmentRange"
              : "errors.assessment",
        ),
      );
    }
  }
  async function copy() {
    const url = `${window.location.origin}${window.location.pathname}${correctedAgeFragment(currentInput)}`;
    setLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setShare("copied");
    } catch {
      setShare("manual");
    }
  }
  function pointerDate(
    event: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>,
  ) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const coordinate = ((event.clientX - bounds.left) / bounds.width) * 900;
    return Math.min(
      dateDay("2100-12-31"),
      Math.round(
        result.birthDay +
          Math.max(0, Math.min(1, (coordinate - 42) / 816)) *
            (endDay - result.birthDay),
      ),
    );
  }
  const cards = [
    {
      key: "chronological",
      days: result.chronologicalDays,
      calendar: result.chronologicalCalendar,
      color: "border-medical-200 bg-medical-50/70",
      valueColor: "text-medical-900",
      hint: "chronologicalHint",
    },
    {
      key: before ? "untilDue" : "corrected",
      days: result.correctedDays,
      calendar: result.correctedCalendar,
      color: "border-teal-200 bg-teal-50/70",
      valueColor: "text-teal-900",
      hint: before ? "beforeDue" : "correctedHint",
    },
    {
      key: "postmenstrual",
      days: result.postmenstrualDays,
      calendar: null,
      color: "border-violet-200 bg-violet-50/70",
      valueColor: "text-violet-900",
      hint: "postmenstrualHint",
    },
  ];
  return (
    <div
      className="printable-results space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500"
      data-testid="corrected-age-results"
    >
      <CorrectedAgeSteps step={2} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1
          ref={title}
          tabIndex={-1}
          className="text-2xl font-bold text-medical-900 font-heading focus:outline-none"
        >
          {t("resultTitle")}
        </h1>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" asChild>
            <Link href={`${route}${correctedAgeFragment(input)}`}>
              <ArrowLeft aria-hidden="true" />
              {t("edit")}
            </Link>
          </Button>
          <Button onClick={copy}>
            {share === "copied" ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            {t(share === "copied" ? "copied" : "share")}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            {t("print")}
          </Button>
        </div>
      </header>

      <section
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
        aria-labelledby="age-timeline-title"
      >
        <div className="space-y-3 border-b p-5 sm:p-6">
          <div className="flex items-center gap-2 text-medical-700">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <h2
              id="age-timeline-title"
              className="text-xl font-semibold text-medical-900"
            >
              {t("timelineTitle")}
            </h2>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {t("timelineHint")}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-violet-50 px-3 py-1.5 font-medium text-violet-800">
              {t("bornAt", { age: weeksDays(result.gestationDays) })}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-900">
              {t("early", { age: weeksDays(result.correctionDays) })}
            </span>
          </div>
        </div>
        <figure className="p-4 sm:p-6">
          <div className="overflow-x-auto print:overflow-visible">
            <svg
              viewBox="0 0 900 230"
              className="w-full min-w-[600px] cursor-crosshair print:min-w-0"
              role="img"
              aria-labelledby="age-svg-title age-svg-description"
              onPointerMove={(event) => setHoverDay(pointerDate(event))}
              onPointerLeave={() => setHoverDay(null)}
              onClick={(event) => selectDate(dayDate(pointerDate(event)))}
            >
              <title id="age-svg-title">{t("timelineTitle")}</title>
              <desc id="age-svg-description">
                {t("birthMarker")}: {date(input.birth)}. {t("dueMarker")}:{" "}
                {date(result.dueDate)}. {t("selectedMarker")}:{" "}
                {date(input.assessment)}. {t("correctionHint")}
              </desc>
              <rect
                x="42"
                y="58"
                width={dueX - 42}
                height="28"
                rx="14"
                fill="#fef3c7"
              />
              <rect
                x={dueX}
                y="58"
                width={858 - dueX}
                height="28"
                rx="14"
                fill="#ccfbf1"
              />
              <line
                x1="42"
                x2="858"
                y1="72"
                y2="72"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <line
                x1="42"
                x2="42"
                y1="50"
                y2="88"
                stroke="#1d4ed8"
                strokeWidth="2"
              />
              <circle cx="42" cy="72" r="7" fill="#1d4ed8" />
              <text x="42" y="22" fontSize="12" fill="#1e3a8a" fontWeight="600">
                {t("birthMarker")}
              </text>
              <text x="42" y="40" fontSize="12" fill="#64748b">
                {date(input.birth)}
              </text>
              <line
                x1={dueX}
                x2={dueX}
                y1="50"
                y2="100"
                stroke="#0f766e"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <circle cx={dueX} cy="72" r="7" fill="#0f766e" />
              <text
                x={dueX}
                y="122"
                fontSize="12"
                fill="#115e59"
                fontWeight="600"
              >
                {t("dueMarker")}
              </text>
              <text x={dueX} y="140" fontSize="12" fill="#64748b">
                {date(result.dueDate)}
              </text>
              <line
                x1={selectedX}
                x2={selectedX}
                y1="46"
                y2="93"
                stroke="#7c3aed"
                strokeWidth="3"
              />
              <circle
                cx={selectedX}
                cy="72"
                r="9"
                fill="#7c3aed"
                stroke="white"
                strokeWidth="3"
              />
              <text
                x={858}
                y="22"
                fontSize="12"
                textAnchor="end"
                fill="#6d28d9"
                fontWeight="600"
              >
                {t("selectedMarker")}
              </text>
              <text
                x={858}
                y="40"
                fontSize="12"
                textAnchor="end"
                fill="#64748b"
              >
                {date(input.assessment)}
              </text>
              <line
                x1="42"
                x2={selectedX}
                y1="168"
                y2="168"
                stroke="#2563eb"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <text x="42" y="189" fontSize="12" fill="#1e3a8a">
                {t("chronological")}: {weeksDays(result.chronologicalDays)}
              </text>
              <line
                x1={Math.min(dueX, selectedX)}
                x2={Math.max(dueX, selectedX)}
                y1="204"
                y2="204"
                stroke="#0d9488"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={before ? "5 5" : undefined}
              />
              <text x="42" y="227" fontSize="12" fill="#115e59">
                {t(before ? "untilDue" : "corrected")}:{" "}
                {weeksDays(result.correctedDays)}
              </text>
              {hoverDay !== null && (
                <line
                  x1={x(hoverDay)}
                  x2={x(hoverDay)}
                  y1="48"
                  y2="213"
                  stroke="#475569"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}
            </svg>
          </div>
          <figcaption className="mt-3 text-xs leading-6 text-muted-foreground">
            {t(input.mode === "gestation" ? "dateInferred" : "dateEntered")}{" "}
            {t("correctionHint")}
          </figcaption>
          <div
            className="mt-3 min-h-[52px] rounded-lg border bg-slate-50 p-3 text-xs leading-6 print:hidden"
            aria-hidden="true"
          >
            {preview ? (
              <div className="flex flex-wrap gap-x-4">
                <strong>{date(dayDate(hoverDay!))}</strong>
                <span>
                  {t("chronological")}: {weeksDays(preview.chronologicalDays)}
                </span>
                <span>
                  {t(preview.correctedDays < 0 ? "untilDue" : "corrected")}:{" "}
                  {weeksDays(preview.correctedDays)}
                </span>
              </div>
            ) : (
              t("explorerHint")
            )}
          </div>
        </figure>
        <div
          className="grid gap-3 px-4 pb-5 sm:grid-cols-3 sm:px-6"
          aria-live="polite"
          aria-atomic="true"
        >
          {cards.map((card) => (
            <div
              key={card.key}
              className={`rounded-xl border p-4 ${card.color}`}
              data-testid={`age-${card.key}`}
            >
              <h3 className={`text-sm font-medium ${card.valueColor}`}>
                {t(card.key)}
              </h3>
              <p
                className={`my-2 text-xl font-bold tabular-nums ${card.valueColor}`}
              >
                {weeksDays(card.days)}
              </p>
              {card.calendar && (
                <p className="mb-2 text-xs text-muted-foreground">
                  {monthsDays(card.calendar)}
                </p>
              )}
              <p className="text-xs leading-5 text-muted-foreground">
                {t(card.hint)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="age-explorer-title"
        className="space-y-4 rounded-xl border bg-white p-5 sm:p-6 print:hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="age-explorer-title"
            className="text-lg font-semibold text-medical-900"
          >
            {t("explore")}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={todayDate() < input.birth}
              onClick={() => selectDate(todayDate())}
            >
              {t("today")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectDate(original)}
            >
              {t("asEntered")}
            </Button>
          </div>
        </div>
        <div className="grid items-center gap-5 sm:grid-cols-[1fr_220px]">
          <div>
            <label className="sr-only" htmlFor="age-range">
              {t("sliderLabel")}
            </label>
            <Slider
              id="age-range"
              min={result.birthDay}
              max={sliderEnd}
              value={[result.assessmentDay]}
              step={1}
              thumbLabel={t("sliderLabel")}
              thumbValueText={date(input.assessment)}
              onValueChange={(values) => selectDate(dayDate(values[0]))}
              className="h-8"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{date(input.birth)}</span>
              <span>{date(dayDate(sliderEnd))}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="age-explore-date" className="text-xs font-medium">
              {t("assessment")}
            </label>
            <DateOnlyPicker
              id="age-explore-date"
              label={t("assessment")}
              min={input.birth}
              max={assessmentMax}
              value={input.assessment}
              onChange={selectDate}
              invalid={!!dateError}
              describedBy={dateError ? "age-date-error" : undefined}
            />
          </div>
        </div>
        {dateError && (
          <p role="alert" id="age-date-error" className="text-sm text-red-700">
            {dateError}
          </p>
        )}
        {input.assessment > todayDate() && (
          <p className="rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-900">
            {t("future")}
          </p>
        )}
      </section>
      {result.chronologicalCalendar.months >= 24 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {t("older")}
        </p>
      )}

      <section
        aria-labelledby="age-calendar-title"
        className="rounded-xl border bg-white p-5 sm:p-6"
      >
        <div className="mb-3 flex items-center gap-2 text-medical-700">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
          <h2
            id="age-calendar-title"
            className="text-xl font-semibold text-medical-900"
          >
            {t("calendarTitle")}
          </h2>
        </div>
        <p className="mb-5 max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("calendarHint")}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm print:min-w-0">
            <caption className="sr-only">{t("calendarCaption")}</caption>
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th scope="col" className="py-3 pr-3 font-medium">
                  {t("ageColumn")}
                </th>
                <th scope="col" className="py-3 pr-3 font-medium">
                  {t("dateColumn")}
                </th>
                <th scope="col" className="py-3 font-medium">
                  {t("chronColumn")}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.calendar.map((row) => (
                <tr
                  key={row.months}
                  className={`border-b last:border-0 transition-colors hover:bg-medical-50 focus-within:bg-medical-50 ${row.date === input.assessment ? "bg-medical-50" : ""}`}
                >
                  <th
                    scope="row"
                    className="py-3 pr-3 font-medium text-medical-900"
                  >
                    {row.months === 0
                      ? t("zero")
                      : t("monthsLabel", { months: row.months })}
                  </th>
                  <td className="py-3 pr-3">
                    <button
                      disabled={row.date > "2100-12-31"}
                      onClick={() => selectDate(row.date)}
                      aria-label={t("selectDate", { date: date(row.date) })}
                      aria-pressed={row.date === input.assessment}
                      className="inline-flex items-center gap-2 rounded px-1 py-1 font-medium text-medical-700 underline decoration-medical-200 underline-offset-4 hover:decoration-medical-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-medical-600 print:no-underline"
                    >
                      {date(row.date)}
                      {row.date === input.assessment && (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 tabular-nums text-muted-foreground">
                    {weeksDays(dateDay(row.date) - result.birthDay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-medical-50/50 p-5 text-sm leading-6 sm:p-6">
        <h2 className="text-lg font-semibold text-medical-900">
          {t("nextTitle")}
        </h2>
        <p className="text-muted-foreground">{t("nextText")}</p>
        <div className="flex flex-wrap gap-3 print:hidden">
          <Button variant="outline" asChild>
            <Link href="/calculators/growth-calculator">{t("growthLink")}</Link>
          </Button>
          <a
            href={parentSource}
            className="self-center text-sm text-medical-700 underline"
          >
            {t("developmentLink")}
          </a>
        </div>
      </section>
      <div className="space-y-2 rounded-lg border p-4 text-xs leading-6 text-muted-foreground print:hidden">
        <p>{t("shareHint")}</p>
        {local && <p>{t("localHint")}</p>}
        <p role="status" aria-live="polite">
          {share === "copied"
            ? t("copied")
            : share === "manual"
              ? t("manual")
              : null}
        </p>
        {share === "manual" && (
          <Input
            ref={copyInput}
            readOnly
            value={link}
            aria-label={t("share")}
            className="bg-white"
          />
        )}
      </div>
      <p className="hidden border-t pt-3 text-xs leading-6 print:block">
        {t("printNote")}
      </p>
      <style>{`@media print { body { background: white !important; } header > nav, main > nav, footer { display: none !important; } section, figure, tr { break-inside: avoid; } svg { max-height: 260px; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
    </div>
  );
}
