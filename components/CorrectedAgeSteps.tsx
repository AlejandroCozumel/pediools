"use client";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
export function CorrectedAgeSteps({ step }: { step: 1 | 2 }) {
  const t = useTranslations("CorrectedAgeCalculator");
  return (
    <ol
      aria-label={t("progress")}
      className="mb-5 grid grid-cols-2 gap-3 text-sm print:hidden"
    >
      {([1, 2] as const).map((number) => (
        <li
          key={number}
          aria-current={step === number ? "step" : undefined}
          className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${step === number ? "border-medical-200 bg-medical-50 font-semibold text-medical-900" : "text-muted-foreground"}`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${step >= number ? "bg-medical-700 text-white" : "bg-slate-100"}`}
          >
            {step > number ? (
              <Check aria-hidden="true" className="h-4 w-4" />
            ) : (
              number
            )}
          </span>
          {t(number === 1 ? "information" : "results")}
        </li>
      ))}
    </ol>
  );
}
