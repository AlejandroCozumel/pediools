"use client";
import React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CalendarDays } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalPatients: number;
    recentCalculations: number;
    calculationsThisMonth: number;
    calculationsLastMonth: number;
  };
  recentPatients: Array<{
    id: string;
    name: string;
    age: string;
    gender: "MALE" | "FEMALE";
    lastVisit: string | null;
    status: string;
  }>;
  recentCalculations: Array<{
    id: string;
    type: string;
    patient: string;
    date: string;
    chartType: string;
  }>;
}

const take = 5;

const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  recentPatients,
  recentCalculations,
}) => {
  const t = useTranslations("Types");
  const d = useTranslations("Dashboard");

  return (
    <div className="my-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Patients */}
        {/* <Card className="border-medical-100">
          <CardHeader className="lg:!pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-heading text-medical-900">
                {d("recentPatients")}
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-medical-500" />
            </div>
            <CardDescription>
              {d("recentPatientsDescription", { take })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCalculations.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/dashboard/calculations/${activity.id}`}
                  className="block bg-medical-10 rounded-lg hover:bg-medical-100 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-5 w-5 text-medical-500" />
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline">
                          {t(`calculationTypes.${activity.type}`)}
                        </Badge>
                        <p className="text-sm text-medical-900 font-semibold">
                          {activity.patient}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">
                      {t(`chartTypes.${activity.chartType}`)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card> */}

        {/* Recent Calculations */}
        <Card className="border-medical-100">
          <CardHeader className="lg:!pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-heading text-medical-900">
                {d("recentCalculations")}
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-medical-500" />
            </div>
            <CardDescription>
              {d("recentCalculationsDescription", { take })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCalculations.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/dashboard/calculations/${activity.id}`}
                  className="block bg-medical-10 rounded-lg hover:bg-medical-100 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-5 w-5 text-medical-500" />
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline">
                          {t(`calculationTypes.${activity.type}`)}
                        </Badge>
                        <p className="text-sm text-medical-900 font-semibold">
                          {activity.patient}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">
                      {t(`chartTypes.${activity.chartType}`)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
