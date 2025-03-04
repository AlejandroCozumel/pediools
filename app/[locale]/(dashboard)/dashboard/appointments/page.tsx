"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import DashboardTitle from "@/components/DashboardTitle";
import ErrorMessage from "@/components/Error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { startOfMonth, endOfMonth } from "date-fns";
import { useDoctorAvailability, useAppointments, type DaySchedule } from "@/hooks/use-appointments";
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

  // Fetch appointments
  const { data, isLoading, error } = useAppointments({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  // Fetch doctor availability
  const { availability, isLoading: availabilityLoading } = useDoctorAvailability();

  // Check if doctor has set up availability
  const hasAvailability = availability &&
  availability.weeklySchedule &&
  availability.weeklySchedule.some((day: DaySchedule) => day.isActive);

  if (error) {
    return <ErrorMessage message={error?.message} />;
  }

  return (
    <div className="my-6">
      <div className="flex flex-col md:flex-row justify-between mb-4 md:mb-0">
        <DashboardTitle
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="flex space-x-2">
          <Link href="/dashboard/appointments/settings">
            <Button variant="outline" className="border-medical-200">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t("manageAvailability")}
            </Button>
          </Link>
          {hasAvailability && (
            <Link href="/dashboard/appointments/new">
              <Button className="bg-medical-600 hover:bg-medical-700">
                <Plus className="h-4 w-4 mr-2" />
                {t("newAppointment")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Availability Not Set Alert */}
      {!availabilityLoading && !hasAvailability ? (
        <Card className="border-l-4 border-l-yellow-400 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-800">{t("noAvailabilityTitle")}</h3>
                <p className="text-yellow-700 mt-1">{t("noAvailabilityDescription")}</p>
                <div className="mt-4">
                  <Link href="/dashboard/appointments/settings">
                    <Button className="bg-medical-600 hover:bg-medical-700">
                      {t("setupAvailability")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Only show appointments calendar if availability is set
        availabilityLoading ? (
          <AppointmentsSkeleton />
        ) : (
          <>
            {/* Calendar/List View */}
            <Card className="mt-6">
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
          </>
        )
      )}
    </div>
  );
};

export default AppointmentsDashboard;