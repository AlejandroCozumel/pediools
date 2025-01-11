"use client";
import React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CalendarDays, Baby, UserPlus } from "lucide-react";

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
    status: string;
  }>;
}

const take = 5

const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  recentPatients,
  recentCalculations,
}) => {
  return (
    <div className="my-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Patients */}
        <Card className="border-medical-100">
          <CardHeader className="!pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-heading text-medical-900">
                Recent Patients
              </CardTitle>
              <UserPlus className="h-5 w-5 text-medical-500" />
            </div>
            <CardDescription>
              Latest {take} patients activity and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/dashboard/patients/${patient.id}`}
                  className="block hover:bg-medical-100 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between p-3 bg-medical-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Baby
                        className={`h-5 w-5 transition-colors duration-300 ease-in-out
                        ${
                          patient.gender === "FEMALE"
                            ? "text-medical-pink-500"
                            : "text-medical-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-medical-900">
                          {patient.name}
                        </p>
                        <p className="text-sm text-medical-600">
                          {patient.age}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-medical-200 text-medical-700"
                    >
                      {patient.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Calculations */}
        <Card className="border-medical-100">
          <CardHeader className="!pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-heading text-medical-900">
                Recent Calculations
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-medical-500" />
            </div>
            <CardDescription>Latest {take} calculations and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCalculations.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/dashboard/calculations/${activity.id}`}
                  className="block hover:bg-medical-100 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between p-3 bg-medical-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-5 w-5 text-medical-500" />
                      <div>
                        <p className="font-medium text-medical-900">
                          {activity.type}
                        </p>
                        <p className="text-sm text-medical-600">
                          {activity.patient}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border-medical-200 ${
                        activity.status === "Completed"
                          ? "text-green-600"
                          : activity.status === "In Progress"
                          ? "text-orange-600"
                          : "text-medical-700"
                      }`}
                    >
                      {activity.status}
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
