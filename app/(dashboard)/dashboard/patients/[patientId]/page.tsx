"use client";
import React from "react";
import { usePatient } from "@/hooks/use-patient";
import { useParams } from "next/navigation";
import LoaderSpinner from "@/components/LoaderSpinnner";
import PatientInformation from "./PatientInformation";

const Patient = () => {
  const params = useParams();
  const patientId = params.patientId as string;
  const { patient, isLoading, isError } = usePatient(patientId);
console.log(patient)
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-medical-600">
        Error loading patient profile.
      </div>
    );
  }

  if (isLoading) {
    return <LoaderSpinner />;
  }

  return (
    <div>
      <PatientInformation patient={patient} />
    </div>
  );
};

export default Patient;