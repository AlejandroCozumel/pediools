"use client";
import React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicalDisclaimerProps {
  title: string;
  points: string[];
  variant?: "warning" | "info" | "medical";
  className?: string;
  hiddenOnPrint?: boolean;
}

export function ClinicalDisclaimer({
  title,
  points,
  variant = "warning",
  className = "",
  hiddenOnPrint = true,
}: ClinicalDisclaimerProps) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-600",
    medical: "bg-medical-50 border-medical-200 text-medical-600",
    warning: "bg-amber-50 border-amber-200 text-amber-600",
  }[variant];

  const textStyles = {
    info: "text-blue-900",
    medical: "text-medical-900",
    warning: "text-amber-900",
  }[variant];

  const bodyStyles = {
    info: "text-blue-800",
    medical: "text-medical-800",
    warning: "text-amber-800",
  }[variant];

  return (
    <div className={cn(
      "mt-4 p-3 border rounded-lg",
      styles,
      hiddenOnPrint && "no-print",
      className
    )}>
      <div className="flex items-start gap-2">
        <AlertTriangle
          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${textStyles}`}
        />
        <div className="space-y-1">
          <h4 className={`font-semibold text-sm ${textStyles}`}>{title}</h4>
          <div className={`text-xs space-y-0.5 ${bodyStyles}`}>
            {points.map((point, index) => (
              <p key={index}>{point}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}