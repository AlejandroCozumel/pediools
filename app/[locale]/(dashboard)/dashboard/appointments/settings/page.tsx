"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Determine initial tab based on URL parameter
  const initialTab =
    searchParams?.get("tab") === "exceptions" ? "exceptions" : "weekly";
  const [activeTab, setActiveTab] = useState<"weekly" | "exceptions">(
    initialTab
  );

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
      isActive: index >= 1 && index <= 5,
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      breaks: [],
    }))
  );

  // State for days of operation
  const [daysOfOperation, setDaysOfOperation] = useState<number[]>(
    [1, 2, 3, 4, 5] // Explicitly set to Monday through Friday indices
  );

  // State for default times
  const [defaultStartTime, setDefaultStartTime] = useState("09:00");
  const [defaultEndTime, setDefaultEndTime] = useState("17:00");

  // State for date exceptions
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);

  // Update URL when tab changes
  const updateTabUrl = useCallback(
    (tab: "weekly" | "exceptions") => {
      const current = new URLSearchParams(
        Array.from(searchParams?.entries() || [])
      );

      if (tab === "exceptions") {
        current.set("tab", "exceptions");
      } else {
        current.delete("tab");
      }

      const search = current.toString();
      const query = search ? `?${search}` : "";

      router.replace(`/dashboard/appointments/settings${query}`, {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  // Handle tab change with URL update
  const handleTabChange = (value: "weekly" | "exceptions") => {
    setActiveTab(value);
    updateTabUrl(value);
  };

  const handleSaveWeeklySchedule = useCallback(async () => {
    try {
      await saveAvailability.mutateAsync({
        weeklySchedule,
        daysOfOperation,
        defaultStartTime,
        defaultEndTime,
      });
      toast({
        title: t("toasts.availabilityUpdated.title"),
        description: t("toasts.availabilityUpdated.description"),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("toasts.error.title"),
        description: t("toasts.error.description"),
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
    t,
  ]);

  // Save date exceptions
  const handleSaveDateOverrides = useCallback(async () => {
    try {
      await saveAvailabilityOverride.mutateAsync({
        dateOverrides: dateOverrides.map((override) => ({
          date: new Date(override.date),
          isAvailable: override.isAvailable,
          startTime: override.startTime,
          endTime: override.endTime,
          reason: override.reason,
          // Include slot information if present
          slotId: override.slotId,
          slotIsAvailable: override.slotIsAvailable,
        })),
      });
      toast({
        title: t("toasts.exceptionsUpdated.title"),
        description: t("toasts.exceptionsUpdated.description"),
      });
    } catch (error) {
      console.error("Failed to save date exceptions:", error);
      toast({
        variant: "destructive",
        title: t("toasts.error.title"),
        description: t("toasts.exceptionsError.description"),
      });
      throw error;
    }
  }, [dateOverrides, saveAvailabilityOverride, toast, t]);

  useEffect(() => {
    if (availability) {
      // Only update if there's actual availability data with active days
      const hasActiveAvailability = availability.weeklySchedule?.some(
        (day: any) => day.isActive
      );

      if (hasActiveAvailability) {
        // Ensure breaks exist on all days and map the breaks correctly
        const scheduleWithBreaks = ensureBreaksExist(
          availability.weeklySchedule.map((day: any) => ({
            ...day,
            breaks: day.breaks || [], // Explicitly ensure breaks exist
          }))
        );
        setWeeklySchedule(scheduleWithBreaks);
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

  return (
    <div className="my-6">
      <DashboardTitle title={t("title")} subtitle={t("subtitle")} />

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
                handleTabChange(value as "weekly" | "exceptions")
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
                  {t("exceptionsTab")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-medical-500">
              {t("loading")}
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
