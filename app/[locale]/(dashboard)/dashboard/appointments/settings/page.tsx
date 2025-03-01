// app/dashboard/appointments/settings/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Clock, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import DashboardTitle from "@/components/DashboardTitle";
import { useToast } from "@/hooks/use-toast";
import { useDoctorAvailability } from "@/hooks/use-appointments";
import { ensureBreaksExist } from "@/lib/appointments/validation";
import { WeeklySchedule, DateOverride } from "@/types/appointments";

import WeeklyScheduleComponent from "./WeeklySchedule";
import DateExceptionsComponent from "./DateExceptions";

// Default values for new schedules
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const AppointmentSettings = () => {
  const t = useTranslations("Appointments.settings");
  const router = useRouter();
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<"weekly" | "exceptions">("weekly");

  // Get availability data from API
  const {
    availability,
    isLoading,
    saveAvailability,
    saveAvailabilityOverride,
  } = useDoctorAvailability();

  // State for weekly schedule
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(
    DAYS_OF_WEEK.map((_, index) => ({
      dayOfWeek: index,
      isActive: index < 5, // Monday to Friday active by default
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      breaks: [],
    }))
  );

  // State for days of operation
  const [daysOfOperation, setDaysOfOperation] = useState<number[]>(
    [0, 1, 2, 3, 4] // Default to Monday to Friday
  );

  // State for default times
  const [defaultStartTime, setDefaultStartTime] = useState("09:00");
  const [defaultEndTime, setDefaultEndTime] = useState("17:00");

  // State for date exceptions
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);

  // Update state when data loads from API
  useEffect(() => {
    if (availability) {
      // Only update if there's actual availability data with active days
      const hasActiveAvailability = availability.weeklySchedule?.some(
        (day: any) => day.isActive
      );

      if (hasActiveAvailability) {
        // Ensure breaks exist on all days
        setWeeklySchedule(ensureBreaksExist(availability.weeklySchedule));
      }

      if (availability.dateOverrides) {
        setDateOverrides(availability.dateOverrides);
      }

      if (availability.daysOfOperation) {
        setDaysOfOperation(availability.daysOfOperation);
      }

      if (availability.defaultStartTime) {
        setDefaultStartTime(availability.defaultStartTime);
      }

      if (availability.defaultEndTime) {
        setDefaultEndTime(availability.defaultEndTime);
      }
    }
  }, [availability]);

  // Save weekly schedule
  const handleSaveWeeklySchedule = useCallback(async () => {
    try {
      await saveAvailability.mutateAsync({
        weeklySchedule,
        daysOfOperation,
        defaultStartTime,
        defaultEndTime,
      });

      toast({
        title: "Availability Updated",
        description:
          "Your weekly availability schedule has been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save availability settings.",
      });
      throw error; // Re-throw to handle in the component
    }
  }, [
    weeklySchedule,
    daysOfOperation,
    defaultStartTime,
    defaultEndTime,
    saveAvailability,
    toast,
  ]);

  // Save date exceptions
  const handleSaveDateOverrides = useCallback(async () => {
    try {
      await saveAvailabilityOverride.mutateAsync({
        dateOverrides: dateOverrides.map((override) => ({
          date: override.date,
          type: override.type,
          status: override.status,
          slotId: override.slotId,
          startTime: override.startTime,
          endTime: override.endTime,
        })),
      });
      toast({
        title: "Exceptions Updated",
        description: "Your date exceptions have been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save date exceptions.",
      });
      throw error;
    }
  }, [dateOverrides, saveAvailabilityOverride, toast]);

  return (
    <div className="my-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/appointments">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <DashboardTitle title={t("title")} subtitle={t("subtitle")} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-medical-500" />
            <CardTitle className="text-xl font-heading">
              {t("availabilitySettings")}
            </CardTitle>
          </div>
          <CardDescription>{t("availabilityDescription")}</CardDescription>

          <div className="pt-4">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "weekly" | "exceptions")
              }
            >
              <TabsList>
                <TabsTrigger value="weekly" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("weeklySchedule")}
                </TabsTrigger>
                <TabsTrigger
                  value="exceptions"
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  {t("exceptions")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-medical-500">
              Loading availability settings...
            </div>
          ) : activeTab === "weekly" ? (
            <WeeklyScheduleComponent
              weeklySchedule={weeklySchedule}
              daysOfOperation={daysOfOperation}
              defaultStartTime={defaultStartTime}
              defaultEndTime={defaultEndTime}
              onWeeklyScheduleChange={setWeeklySchedule}
              onDaysOfOperationChange={setDaysOfOperation}
              onSave={handleSaveWeeklySchedule}
              isSaving={saveAvailability.isPending}
            />
          ) : (
            <DateExceptionsComponent
              weeklySchedule={weeklySchedule}
              dateOverrides={dateOverrides}
              onDateOverridesChange={setDateOverrides}
              onSave={handleSaveDateOverrides}
              isSaving={saveAvailabilityOverride.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentSettings;
