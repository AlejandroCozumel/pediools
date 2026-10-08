"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Check, Copy, Ruler } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeightGrowthChart } from "@/components/HeightGrowthChart";
import { TargetHeightSteps } from "@/components/TargetHeightSteps";
import { calculateTargetHeight } from "@/lib/calculations/target-height";
import { calculateHeightMeasurements } from "@/lib/calculations/height-growth";
import {
  readTargetHeightFragment,
  targetHeightFragment,
  TargetHeightLinkData,
} from "@/lib/calculations/target-height-link";

const route = "/calculators/target-height-calculator";
export function TargetHeightResults() {
  const t = useTranslations("TargetHeightCalculator");
  const locale = useLocale();
  const [data, setData] = useState<TargetHeightLinkData | null>();
  const [shareState, setShareState] = useState<"idle" | "copied" | "manual">(
    "idle",
  );
  const [shareUrl, setShareUrl] = useState("");
  const [localPreview, setLocalPreview] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setLocalPreview(
      ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname),
    );
    const read = () => {
      setData(readTargetHeightFragment(window.location.hash));
      setShareState("idle");
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    if (data) titleRef.current?.focus({ preventScroll: true });
  }, [data]);
  useEffect(() => {
    if (shareState === "manual") {
      linkRef.current?.focus();
      linkRef.current?.select();
    }
  }, [shareState]);
  async function copyLink() {
    const url = window.location.href;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch {
      setShareState("manual");
    }
  }
  if (data === undefined)
    return (
      <div className="rounded-xl border bg-white p-6" role="status">
        {t("steps.loading")}
      </div>
    );
  if (data === null)
    return (
      <section className="space-y-4 rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-semibold text-medical-900">
          {t("steps.invalidTitle")}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("steps.invalidText")}
        </p>
        <Button asChild>
          <Link href={route}>{t("steps.startAgain")}</Link>
        </Button>
      </section>
    );
  const result = calculateTargetHeight(data.input);
  const measurements = calculateHeightMeasurements(
    data.measurements,
    data.input.sex,
    data.input.unit,
  );
  const number = (value: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  return (
    <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
      <TargetHeightSteps step={2} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="text-2xl font-bold text-medical-900 font-heading focus:outline-none"
        >
          {t("steps.resultPageTitle")}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`${route}${targetHeightFragment(data)}`}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              {t("steps.edit")}
            </Link>
          </Button>
          <Button onClick={copyLink}>
            {shareState === "copied" ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            {t(shareState === "copied" ? "steps.copied" : "steps.copyLink")}
          </Button>
        </div>
      </header>
      <HeightGrowthChart
        sex={data.input.sex}
        unit={data.input.unit}
        measurements={measurements}
        target={result}
      />
      <div className="space-y-2 rounded-lg border bg-medical-50/50 p-4 text-xs leading-6 text-muted-foreground">
        <p>{t("steps.shareHint")}</p>
        {localPreview && <p>{t("steps.localHint")}</p>}
        <p role="status" aria-live="polite">
          {shareState === "copied"
            ? t("steps.copySuccess")
            : shareState === "manual"
              ? t("steps.copyManual")
              : null}
        </p>
        {shareState === "manual" && (
          <Input
            ref={linkRef}
            readOnly
            value={shareUrl}
            aria-label={t("steps.linkLabel")}
            className="h-10 bg-white"
          />
        )}
      </div>
      <section
        className="space-y-5 rounded-xl border bg-white p-4 sm:p-6"
        aria-labelledby="target-result-title"
      >
        <h2
          id="target-result-title"
          className="flex items-center gap-2 text-xl font-semibold text-medical-900"
        >
          <Ruler aria-hidden="true" className="h-5 w-5" />
          {t("resultTitle")}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("resultBasis")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-medical-50 p-4">
            <output
              data-testid="target-height-result"
              aria-label={t("resultTitle")}
              className="block text-4xl font-semibold tracking-tight text-medical-900"
            >
              {number(result.targetCm)} <span className="text-lg">cm</span>
            </output>
            <p className="mt-2 text-sm text-muted-foreground">
              {number(result.targetCm / 2.54)} in
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-medical-900">
              {t("range")}
            </h3>
            <output
              data-testid="target-height-range"
              aria-label={t("range")}
              className="mt-2 block text-xl font-semibold text-medical-900"
            >
              {number(result.lowerCm)}–{number(result.upperCm)} cm
            </output>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {t("rangeHint")}
            </p>
          </div>
        </div>
        <details className="rounded-lg border p-4 text-sm">
          <summary className="cursor-pointer font-medium text-medical-900">
            {t("formulaTitle")}
          </summary>
          <div className="mt-3 space-y-3">
            <p>
              {t("father")}: {number(result.fatherCm)} cm · {t("mother")}:{" "}
              {number(result.motherCm)} cm · {t("sex")}: {t(data.input.sex)}
            </p>
            <p className="break-words tabular-nums">
              ({number(result.fatherCm)} + {number(result.motherCm)}{" "}
              {result.adjustment > 0 ? "+" : "−"} 13) ÷ 2 ≈{" "}
              {number(result.targetCm)} cm
            </p>
            <p className="text-xs leading-6 text-muted-foreground">
              {t("formulaCaption")}
            </p>
            <a
              href="https://www.cmh.edu/health-care-providers/pediatrician-guides/endocrinology/growth-failure/"
              target="_blank"
              rel="noreferrer"
              className="text-medical-700 underline"
            >
              Children’s Mercy:{" "}
              {locale === "es" ? "fórmula y rango" : "formula and range"}
            </a>
          </div>
        </details>
        <p className="text-xs leading-6 text-muted-foreground">
          {t("resultSafety")}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-medical-700 underline">
          <Link href="/calculators/growth-calculator">{t("growthLink")}</Link>
          <Link href="/disclaimer">{t("disclaimerLink")}</Link>
        </div>
      </section>
    </div>
  );
}
