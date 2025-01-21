"use client";
import React from "react";
import { usePatients } from "@/hooks/use-patient";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import PatientsDashboard from "./PatientsDashboard";
import DashboardTitle from "@/components/DashboardTitle";
import StatsCard from "@/components/StatsCard";
import { UsersIcon, CalendarIcon, CalculatorIcon, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Patients = () => {
  const { data, isLoading, error } = usePatients();

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
      <div className="flex flex-col md:flex-row justify-between mb-4 md:mb-0 ">
        <DashboardTitle
          title="Patients Dashboard"
          subtitle="View and manage patient information"
        />
        <Link href="/dashboard/patients/add">
          <Button className="bg-medical-600 hover:bg-medical-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </Link>
      </div>
      <div className="flex flex-col-reverse md:flex-col gap-4 md:gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Patients"
            value={data?.totalPatients || 0}
            icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Patients with Calculations"
            value={data?.patientsWithCalculations || 0}
            icon={<CalculatorIcon className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="New Patients This Month"
            value={data?.newPatientsThisMonth || 0}
            previousValue={data?.newPatientsLastMonth}
            icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <PatientsDashboard patients={data?.patients || []} />
      </div>
    </div>
  );
};

export default Patients;
