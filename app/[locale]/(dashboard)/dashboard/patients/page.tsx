"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { usePatients } from "@/hooks/use-patient";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import PatientsDashboard from "./PatientsDashboard";
import DashboardTitle from "@/components/DashboardTitle";
import StatsCard from "@/components/StatsCard";
import { UsersIcon, CalendarIcon, CalculatorIcon, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ErrorMessage from "@/components/Error";

const Patients = () => {
  const { data, isLoading, error } = usePatients();
  const t = useTranslations("Patients");

  if (error) {
    return <ErrorMessage message={error?.message} />;
  }

  if (isLoading) return <LoaderSpinnner />;

  return (
    <div className="my-6">
      <div className="flex flex-col md:flex-row justify-between mb-4 md:mb-0 ">
        <DashboardTitle title={t("title")} subtitle={t("subtitle")} />
        <Link href="/dashboard/patients/add">
          <Button className="bg-medical-600 hover:bg-medical-700">
            <Plus className="h-4 w-4 mr-2" />
            {t("addPatient")}
          </Button>
        </Link>
      </div>
      <div className="flex flex-col-reverse md:flex-col gap-4 md:gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title={t("stats.totalPatients")}
            value={data?.totalPatients || 0}
            icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title={t("stats.patientsWithCalculations")}
            value={data?.patientsWithCalculations || 0}
            icon={<CalculatorIcon className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title={t("stats.newPatientsThisMonth")}
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
