"use client";
import React from "react";
import { useDashboardHome } from "@/hooks/use-dashboard";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import DashboardStats from "./DashboardStats";
import PatientQuickActions from "@/components/QuickActions";
import { Baby, LineChart, Calendar1 } from "lucide-react";
import DashboardTitle from "@/components/DashboardTitle";

const Dashboard = () => {
  const { data, isLoading, error } = useDashboardHome();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-medical-600">
        Something went wrong loading your dashboard.
      </div>
    );
  }

  if (isLoading) {
    return <LoaderSpinnner />;
  }

  return (
    <div className="my-6">
      <DashboardTitle
        title="Dashboard"
        subtitle="Welcome back"
      />
      <div className="flex flex-col gap-6">
        <PatientQuickActions
          actions={[
            {
              link: `/dashboard/patients`,
              icon: <Baby className="h-8 w-8 text-medical-500" />,
              title: "Patients",
              description: "View and manage patient documents",
              category: "Records",
            },
            {
              link: `/dashboard/appointments`,
              icon: <Calendar1 className="h-8 w-8 text-medical-500" />,
              title: "Appointments",
              description: "Manage patient appointments",
              category: "Appointments",
            },
            {
              link: `/dashboard/calculations`,
              icon: <LineChart className="h-8 w-8 text-medical-500" />,
              title: "Calculations",
              description: "View patient's growth charts and calculations",
              category: "Graphs",
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