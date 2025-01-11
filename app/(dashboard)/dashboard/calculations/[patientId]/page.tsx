"use client";
import React from "react";
import { useParams } from "next/navigation";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import DashboardTitle from "@/components/DashboardTitle";
import PatientCalculationTable from "./PatientCalculationTable";

// Detailed Calculation interface
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
  charts?: {
    pdfUrl?: string;
  }[];
  patient: {
    firstName: string;
    lastName: string;
    gender: "male" | "female";
    dateOfBirth: string;
    email: string | null | undefined;
    guardianEmail: string | null | undefined;
  };
}

// Interface for delete mutation
interface DeleteCalculationMutation {
  mutate: (variables: {
    patientId: string;
    calculationId: string
  }) => void;
}

// Props interface for PatientCalculationTable
interface PatientCalculationTableProps {
  type: string;
  patientId: string;
  calculations: Calculation[];
  onDeleteCalculation?: DeleteCalculationMutation;
}

// Calculations hook type
interface CalculationsHookResult {
  calculations: Record<string, Calculation[]> | undefined;
  isLoading: boolean;
  error: Error | null;
  deleteCalculation: DeleteCalculationMutation;
}

// Import the hook and other dependencies
import { useCalculations } from "@/hooks/use-calculations";

const PatientCalculations = () => {
  // Destructure the calculations hook result
  const params = useParams();
  const patientId = params.patientId as string;
  const {
    calculations,
    isLoading,
    error,
    deleteCalculation
  }: CalculationsHookResult = useCalculations(patientId);

  // Error handling
  if (error)
    return (
      <div className="text-center text-medical-600">
        Error loading calculations.
      </div>
    );

  // Loading state
  if (isLoading) return <LoaderSpinnner />;

  // Main render
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
              onDeleteCalculation={deleteCalculation}
            />
          </div>
        ))}
    </div>
  );
};

export default PatientCalculations;