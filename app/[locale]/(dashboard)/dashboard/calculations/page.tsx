"use client";
import React from "react";
import { useCalculations } from "@/hooks/use-calculations";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import CalculationTable from "@/app/[locale]/(dashboard)/dashboard/calculations/CalculationTable";
import DashboardTitle from "@/components/DashboardTitle";
import StatsCard from "@/components/StatsCard";
import { CalculatorIcon, CalendarIcon, UsersIcon } from "lucide-react";

const Calculations = () => {
  const { calculations, pagination, isLoading, error } = useCalculations();
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-medical-600">
        Something went wrong loading your profile.
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <LoaderSpinnner />;
  }

  return (
    <div className="my-6">
      <DashboardTitle
        title="Calculations Dashboard"
        subtitle="View and manage growth percentile calculations for all patients"
      />
      <div className="flex flex-col-reverse md:flex-col gap-4 md:gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Calculations"
            value={pagination?.totalCalculations || 0}
            icon={<CalculatorIcon className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Unique Patients"
            value={Object.keys(calculations || {}).length}
            icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Calculations This Month"
            value={Object.values(calculations || {}).flat().length}
            icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <CalculationTable calculations={Object.values(calculations || {}).flat()} />
      </div>
    </div>
  );
};

export default Calculations;