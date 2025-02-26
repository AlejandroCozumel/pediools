"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  useCalculations,
  UseCalculationsOptions,
} from "@/hooks/use-calculations";
import PatientCalculationTable from "./PatientCalculationTable";
import { CalculationTableSkeleton } from "./CalculationTableSkeleton";

const PatientCalculations = () => {
  const params = useParams();
  const patientId = params.patientId as string;
  const [currentPage, setCurrentPage] = useState(1);
  const options: UseCalculationsOptions = {
    pagination: {
      page: currentPage,
      limit: 10,
    },
    includeCharts: true,
  };

  const {
    calculations,
    pagination,
    error,
    deleteCalculation,
    batchDeleteCalculations,
    updateCalculationNotes,
    isLoading, // Make sure your hook returns an isLoading state
  } = useCalculations(patientId, options);

  // Error handling
  if (error) {
    return (
      <div className="text-center text-medical-600">
        Error loading calculations: {error.message}
      </div>
    );
  }

  // Show skeleton during loading
  if (isLoading) {
    return (
      <div className="my-6">
        <CalculationTableSkeleton />
      </div>
    );
  }

  return (
    <div className="my-6">
      <PatientCalculationTable
        patientId={patientId}
        calculations={calculations || {}}
        onDeleteCalculation={(variables) => deleteCalculation.mutate(variables)}
        onBatchDeleteCalculations={(variables) =>
          batchDeleteCalculations.mutate(variables)
        }
        onUpdateNotes={(variables) => updateCalculationNotes.mutate(variables)}
        pagination={pagination}
        onPageChange={setCurrentPage}
        error={error}
      />
    </div>
  );
};

export default PatientCalculations;