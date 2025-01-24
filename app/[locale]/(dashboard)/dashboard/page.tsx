"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useDashboardHome } from "@/hooks/use-dashboard";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import DashboardStats from "./DashboardStats";
import PatientQuickActions from "@/components/QuickActions";
import { Baby, LineChart, Calendar1 } from "lucide-react";
import DashboardTitle from "@/components/DashboardTitle";
import ErrorMessage from "@/components/Error";

const Dashboard = () => {
  const { data, isLoading, error } = useDashboardHome();
  const d = useTranslations("Dashboard");

  if (error) return <ErrorMessage message={error?.message} />;
  if (isLoading) return <LoaderSpinnner />;

  return (
    <div className="my-6">
      <DashboardTitle title={d("title")} subtitle={d("welcome")} />
      <div className="flex flex-col gap-6">
        <PatientQuickActions
          actions={[
            {
              link: `/dashboard/patients`,
              icon: <Baby className="h-8 w-8 text-medical-500" />,
              title: d("quickActions.patients.title"),
              description: d("quickActions.patients.description"),
              category: d("quickActions.patients.category"),
            },
            {
              link: `/dashboard/appointments`,
              icon: <Calendar1 className="h-8 w-8 text-medical-500" />,
              title: d("quickActions.appointments.title"),
              description: d("quickActions.appointments.description"),
              category: d("quickActions.appointments.category"),
            },
            {
              link: `/dashboard/calculations`,
              icon: <LineChart className="h-8 w-8 text-medical-500" />,
              title: d("quickActions.calculations.title"),
              description: d("quickActions.calculations.description"),
              category: d("quickActions.calculations.category"),
            },
          ]}
        />
      </div>
      <DashboardStats
        stats={data.stats}
        recentPatients={data.recentPatients}
        recentCalculations={data.recentCalculations}
      />
    </div>
  );
};

export default Dashboard;
