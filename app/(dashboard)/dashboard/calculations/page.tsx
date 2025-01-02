"use client";
import React from "react";
import { useCalculations } from "@/hooks/use-calculations";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import CalculationTable from "@/app/(dashboard)/dashboard/calculations/CalculationTable";
import DashboardTitle from "@/components/DashboardTitle";
import StatsCard from "@/components/StatsCard";
import { CalculatorIcon, CalendarIcon, UsersIcon } from "lucide-react";

const Calculations = () => {
  const { calculations, isLoading, error } = useCalculations();
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
  console.log(calculations);
  return (
    <div className="my-6">
      <DashboardTitle
        title="Calculations Dashboard"
        subtitle="View and manage growth percentile calculations for all patients"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Calculations"
          value={calculations.totalCalculations}
          previousValue={calculations.previousTotalCalculations}
          icon={<CalculatorIcon className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Unique Patients"
          value={calculations.uniquePatients}
          previousValue={calculations.previousUniquePatients}
          icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Calculations This Month"
          value={calculations.calculationsThisMonth}
          previousValue={calculations.calculationsLastMonth}
          icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      <CalculationTable calculations={calculations.calculations} />
    </div>
  );
};

export default Calculations;
