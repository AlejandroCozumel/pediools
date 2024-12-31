"use client";
import React from "react";
import { usePatients } from "@/hooks/use-patient";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import PatientsDashboard from "./PatientsDashboard";

const Patients = () => {
  const { data: patients, isLoading, error } = usePatients();
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
    <div>
      <PatientsDashboard patients={patients || []} />
    </div>
  );
};

export default Patients;
