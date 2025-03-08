"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";

type DashboardTitleProps = {
  title: string;
  subtitle: string;
  align?: "left" | "center" | "right";
  backButtonText?: string;
  showBackButton?: boolean;
};

const DashboardTitle: React.FC<DashboardTitleProps> = ({
  title,
  subtitle,
  align = "left",
  backButtonText = "Back",
  showBackButton = true,
}) => {
  const alignmentClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  return (
    <div className="mb-8">
      {showBackButton && (
        <div className="flex items-center gap-2 text-medical-600 mb-2">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm hover:text-medical-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {backButtonText}
          </button>
        </div>
      )}

      <div className={`flex flex-col gap-1 ${alignmentClasses[align]}`}>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight font-heading">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl text-medical-800">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardTitle;