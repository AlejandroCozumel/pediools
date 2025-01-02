"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calculator,
  Activity,
  Clock,
  BarChart3,
  CalendarDays,
  Baby,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import DashboardTitle from "@/components/DashboardTitle";

const Dashboard = () => {
  // Mock data
  const stats = {
    totalPatients: 248,
    recentCalculations: 52,
    activeSubscription: "PREMIUM",
    upcomingAppointments: 8,
  };

  const recentPatients = [
    {
      id: 1,
      name: "Emma Thompson",
      age: "2y 3m",
      lastVisit: "2024-12-20",
      status: "Growth Chart Updated",
    },
    {
      id: 2,
      name: "Lucas Garcia",
      age: "8m",
      lastVisit: "2024-12-22",
      status: "Blood Pressure Check",
    },
    {
      id: 3,
      name: "Sophia Chen",
      age: "4y",
      lastVisit: "2024-12-23",
      status: "BMI Calculation",
    },
    {
      id: 4,
      name: "Oliver Wilson",
      age: "1y 6m",
      lastVisit: "2024-12-24",
      status: "Height Assessment",
    },
  ];

  const recentActivity = [
    {
      type: "GROWTH_PERCENTILE",
      patient: "Emma Thompson",
      date: "2024-12-24",
      status: "Completed",
    },
    {
      type: "BLOOD_PRESSURE",
      patient: "Lucas Garcia",
      date: "2024-12-23",
      status: "PDF Generated",
    },
    {
      type: "HEART_RATE",
      patient: "Sophia Chen",
      date: "2024-12-22",
      status: "Email Sent",
    },
    {
      type: "BILIRUBIN",
      patient: "New Patient",
      date: "2024-12-21",
      status: "In Progress",
    },
  ];

  return (
    <div className="my-6">
      {/* Header Section */}
      <DashboardTitle title="Dashboard" subtitle="Welcome back, Dr. Smith" />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/dashboard/patients">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-medical-600">
                Total Patients
              </CardTitle>
              <Users className="h-4 w-4 text-medical-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-medical-900">
                {stats.totalPatients}
              </div>
              <p className="text-xs text-medical-600 mt-1">+12 this month</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="#">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-medical-600">
                Recent Calculations
              </CardTitle>
              <Calculator className="h-4 w-4 text-medical-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-medical-900">
                {stats.recentCalculations}
              </div>
              <p className="text-xs text-medical-600 mt-1">Last 7 days</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="#">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-medical-600">
                Subscription
              </CardTitle>
              <Activity className="h-4 w-4 text-medical-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-medical-900">
                {stats.activeSubscription}
              </div>
              <p className="text-xs text-medical-600 mt-1">Active Plan</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="#">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-medical-600">
                Upcoming
              </CardTitle>
              <Clock className="h-4 w-4 text-medical-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-medical-900">
                {stats.upcomingAppointments}
              </div>
              <p className="text-xs text-medical-600 mt-1">Scheduled visits</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card className="border-medical-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-heading text-medical-900">
                Recent Patients
              </CardTitle>
              <UserPlus className="h-5 w-5 text-medical-500" />
            </div>
            <CardDescription>
              Latest patient activity and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 bg-medical-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Baby className="h-5 w-5 text-medical-500" />
                    <div>
                      <p className="font-medium text-medical-900">
                        {patient.name}
                      </p>
                      <p className="text-sm text-medical-600">{patient.age}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-medical-200 text-medical-700"
                  >
                    {patient.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-medical-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-heading text-medical-900">
                Recent Activity
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-medical-500" />
            </div>
            <CardDescription>Latest calculations and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-medical-50 rounded-lg"
                >
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
