"use client";

import React from "react";
import { useCalculations } from "@/hooks/use-calculations";
import { useParams } from "next/navigation";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import DashboardTitle from "@/components/DashboardTitle";
import PatientCalculationTable from "./PatientCalculationTable";

interface Calculation {
  id: string;
  type: string;
  date: string;
  results: {
    calculationType: string;
    weight?: {
      value: number;
      percentiles?: {
        calculatedPercentile: number;
        zScore: number;
      };
    };
    height?: {
      value: number;
      percentiles?: {
        calculatedPercentile: number;
        zScore: number;
      };
    };
  };
  patientId: string;
  patient: {
    firstName: string;
    lastName: string;
    gender: "male" | "female";
    dateOfBirth: string;
  };
}

const PatientCalculations = () => {
  const params = useParams();
  const patientId = params.patientId as string;
  const { calculations, isLoading, error, deleteCalculation } =
    useCalculations(patientId);

  if (error)
    return (
      <div className="text-center text-medical-600">
        Error loading calculations.
      </div>
    );

  if (isLoading) return <LoaderSpinnner />;

  return (
    <div className="my-6">
      <DashboardTitle
        title="Patient Calculations"
        subtitle="View and manage calculations for this patient"
      />
      {calculations &&
        Object.entries(calculations).map(([type, typeCalculations]) => (
          <div key={type} className="mt-6">
            <PatientCalculationTable
              type={type}
              patientId={patientId}
              calculations={typeCalculations as Calculation[]}
            />
          </div>
        ))}
    </div>
  );
};

export default PatientCalculations;
