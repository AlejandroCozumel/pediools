"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  useCalculations,
  UseCalculationsOptions,
} from "@/hooks/use-calculations";
import PatientCalculationTable from "./PatientCalculationTable";

const PatientCalculations = () => {
  const params = useParams();
  const patientId = params.patientId as string;

  // State for pagination (only needed state since filtering is handled by child)
  const [currentPage, setCurrentPage] = useState(1);

  // Prepare query options with minimal defaults
  const options: UseCalculationsOptions = {
    pagination: {
      page: currentPage,
      limit: 10,
    },
    includeCharts: true,
  };

  // Use the hook with minimal options
  const {
    calculations,
    pagination,
    error,
    deleteCalculation,
    batchDeleteCalculations,
    updateCalculationNotes,
  } = useCalculations(patientId, options);

  // Error handling
  if (error) {
    return (
      <div className="text-center text-medical-600">
        Error loading calculations: {error.message}
      </div>
    );
  }

  return (
    <div className="my-6">
      {/* Map through each calculation type and render a table for it */}
      {calculations && Object.entries(calculations).map(([type, typeCalculations]) => (
        <div key={type} className="mt-6">
          <PatientCalculationTable
          />
        </div>
      ))}
    </div>
  );
};

export default PatientCalculations;