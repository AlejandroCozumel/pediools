"use client";
import React from "react";
import { usePatient } from "@/hooks/use-patient";
import { useParams } from "next/navigation";
import LoaderSpinner from "@/components/LoaderSpinnner";
import PatientInformation from "./PatientInformation";
import CalculationTable from "./CalculationTable";
import { Calendar, FileText, LineChart } from "lucide-react";
import PatientQuickActions from "./PatientQuickActions";

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
      <PatientQuickActions
        actions={[
          {
            link: `/dashboard/patients/${patientId}/calculations`,
            icon: <LineChart className="h-8 w-8 text-medical-500" />,
            title: "Calculations",
            description: "View patient's growth charts and calculations",
            category: "Graphs",
          },
          {
            link: `/dashboard/patients/${patientId}/appointments`,
            icon: <Calendar className="h-8 w-8 text-medical-500" />,
            title: "Appointments",
            description: "Manage patient appointments",
            category: "Scheduling"
          },
          {
            link: `/dashboard/patients/${patientId}/documents`,
            icon: <FileText className="h-8 w-8 text-medical-500" />,
            title: "Documents",
            description: "View and manage patient documents",
            category: "Records"
          }
        ]}
      />
      <PatientInformation patient={patient?.[0]?.patient} />
    </div>
  );
};

export default Patient;
