"use client";
import React from "react";
import { usePatient } from "@/hooks/use-patient";
import { useParams } from "next/navigation";
import LoaderSpinner from "@/components/LoaderSpinnner";
import PatientInformation from "./PatientInformation";
import CalculationTable from "./CalculationTable";

const Patient = () => {
  const params = useParams();
  const patientId = params.patientId as string;

  const {
    patient,
    isLoading: isPatientLoading,
    isError: isPatientError,
  } = usePatient(patientId);
  if (isPatientError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-medical-600">
        Error loading patient profile.
      </div>
    );
  }

  if (isPatientLoading) {
    return <LoaderSpinner />;
  }

  // Ensure patient exists before rendering
  if (!patient) {
    return <div>No patient found</div>;
  }

  return (
    <div>
      <CalculationTable calculations={patient} patientId={patientId} />
      <PatientInformation patient={patient?.[0]?.patient} />
    </div>
  );
};

export default Patient;
