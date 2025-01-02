"use client";
import React from "react";
import { useCalculations } from "@/hooks/use-calculations";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import CalculationsDashboard from "@/app/(dashboard)/dashboard/calculations/CalculationsDashboard";
import CalculationTable from "@/app/(dashboard)/dashboard/calculations/CalculationTable";
import DashboardTitle from "@/components/DashboardTitle";

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
  return (
    <div className="my-6">
      <DashboardTitle
        title="Calculations Dashboard"
        subtitle="View and manage growth percentile calculations for all patients"
      />
      <CalculationTable calculations={calculations} />
      {/* <CalculationsDashboard calculations={calculations} /> */}
    </div>
  );
};

export default Calculations;
