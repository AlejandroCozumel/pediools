// app/dashboard/appointments/page.tsx
"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import DashboardTitle from "@/components/DashboardTitle";
import ErrorMessage from "@/components/Error";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar as CalendarIcon, Plus, List, Calendar } from "lucide-react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useAppointments } from "@/hooks/use-appointments";
import AppointmentsSkeleton from "./AppointmentsSkeleton";
import AppointmentCalendarView from "./AppointmentCalendarView";
import AppointmentListView from "./AppointmentListView";

const AppointmentsDashboard = () => {
  const t = useTranslations("Appointments");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");

  // Set up date range for current month
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  const { data, isLoading, error } = useAppointments({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  if (error) {
    return <ErrorMessage message={error?.message} />;
  }

  return (
    <div className="my-6">
      <div className="flex flex-col md:flex-row justify-between mb-4 md:mb-0">
        <DashboardTitle title={t("title")} subtitle={t("subtitle")} />
        <div className="flex space-x-2">
          <Link href="/dashboard/appointments/settings">
            <Button variant="outline" className="border-medical-200">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t("manageAvailability")}
            </Button>
          </Link>
          <Link href="/dashboard/appointments/new">
            <Button className="bg-medical-600 hover:bg-medical-700">
              <Plus className="h-4 w-4 mr-2" />
              {t("newAppointment")}
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-heading">
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <CardDescription>
                {t("viewingAppointments")}
              </CardDescription>
            </div>

            <div className="flex items-center gap-4">
              <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
                <TabsList>
                  <TabsTrigger value="calendar" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t("calendar")}
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    {t("list")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 lg:p-6">
          {isLoading ? (
            <AppointmentsSkeleton />
          ) : view === "calendar" ? (
            <AppointmentCalendarView
              appointments={data?.appointments || []}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />
          ) : (
            <AppointmentListView
              appointments={data?.appointments || []}
              currentDate={currentDate}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentsDashboard;