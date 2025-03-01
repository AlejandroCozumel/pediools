// app/dashboard/appointments/settings/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { format, parseISO, differenceInMinutes } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useDoctorAvailability } from "@/hooks/use-appointments";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardTitle from "@/components/DashboardTitle";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type BreakPeriod = {
  id: string;
  startTime: string;
  endTime: string;
};

type DaySchedule = {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  breaks: BreakPeriod[];
};

// Array of days
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Helper to generate time options for dropdowns
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      const time = `${formattedHour}:${formattedMinute}`;
      const label = format(new Date().setHours(hour, minute), "h:mm a");
      options.push({ value: time, label });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();
const slotDurationOptions = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1 hour 30 minutes" },
  { value: 120, label: "2 hours" },
];

// Helper function to calculate time difference in minutes
const calculateMinutesBetween = (
  startTime: string,
  endTime: string
): number => {
  const start = parseISO(`2000-01-01T${startTime}`);
  const end = parseISO(`2000-01-01T${endTime}`);
  return differenceInMinutes(end, start);
};

// Validate if end time is after start time
const isEndTimeAfterStartTime = (
  startTime: string,
  endTime: string
): boolean => {
  const start = parseISO(`2000-01-01T${startTime}`);
  const end = parseISO(`2000-01-01T${endTime}`);
  return end > start;
};

// Minimum availability requirements
const MIN_HOURS_PER_WEEK = 8; // Minimum total hours of availability per week
const MIN_HOURS_PER_DAY = 2; // Minimum hours per active day

const AppointmentSettings = () => {
  const t = useTranslations("Appointments.settings");
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"weekly" | "exceptions">("weekly");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDateAvailable, setIsDateAvailable] = useState(true);
  const [exceptionStartTime, setExceptionStartTime] = useState("09:00");
  const [exceptionEndTime, setExceptionEndTime] = useState("17:00");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [defaultSlotDuration, setDefaultSlotDuration] = useState(30);

  const {
    availability,
    isLoading,
    saveAvailability,
    saveAvailabilityOverride,
  } = useDoctorAvailability();

  // State for weekly schedule
  const [weeklySchedule, setWeeklySchedule] = useState<
    Array<{
      dayOfWeek: number;
      isActive: boolean;
      startTime: string;
      endTime: string;
      slotDuration: number;
      breakStartTime?: string;
      breakEndTime?: string;
      breaks: BreakPeriod[];
    }>
  >(
    DAYS_OF_WEEK.map((_, index) => ({
      dayOfWeek: index,
      isActive: index < 5,
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      breaks: [],
    }))
  );

  const [daysOfOperation, setDaysOfOperation] = useState<number[]>(
    availability?.daysOfOperation || [1, 2, 3, 4, 5] // Default to Monday to Friday
  );

  // State for default start time and end time
  const [defaultStartTime, setDefaultStartTime] = useState(
    availability?.defaultStartTime || "09:00"
  );
  const [defaultEndTime, setDefaultEndTime] = useState(
    availability?.defaultEndTime || "17:00"
  );

  // State for date exceptions
  const [dateOverrides, setDateOverrides] = useState<
    Array<{
      date: Date;
      isAvailable: boolean;
      startTime?: string;
      endTime?: string;
      reason?: string;
    }>
  >(availability?.dateOverrides || []);

  // Update state when data loads
  useEffect(() => {
    if (availability) {
      // Only update if there's actual availability data with active days
      const hasActiveAvailability = availability.weeklySchedule?.some(
        (day: any) => day.isActive
      );

      if (hasActiveAvailability) {
        // Use ensureBreaksExist here
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

  // Validate the schedule and show warnings
  useEffect(() => {
    const errors: string[] = [];

    // Calculate total available hours per week
    let totalMinutes = 0;
    let activeDays = 0;

    weeklySchedule.forEach((day) => {
      if (day.isActive) {
        activeDays++;

        // Check if end time is after start time
        if (!isEndTimeAfterStartTime(day.startTime, day.endTime)) {
          errors.push(
            `${DAYS_OF_WEEK[day.dayOfWeek]}: End time (${
              day.endTime
            }) must be after start time (${day.startTime}).`
          );
        }

        // Check if slot duration fits in the time window
        const dayMinutes = calculateMinutesBetween(day.startTime, day.endTime);
        if (dayMinutes < day.slotDuration) {
          errors.push(
            `${DAYS_OF_WEEK[day.dayOfWeek]}: Slot duration (${
              day.slotDuration
            } min) exceeds available time (${dayMinutes} min).`
          );
        }

        // Validate break times if present
        let breakMinutes = 0;
        if (day.breakStartTime && day.breakEndTime) {
          // Ensure break start and end times are valid
          if (!isEndTimeAfterStartTime(day.breakStartTime, day.breakEndTime)) {
            errors.push(
              `${
                DAYS_OF_WEEK[day.dayOfWeek]
              }: Break end time must be after break start time.`
            );
          } else {
            // Calculate break duration
            breakMinutes = calculateMinutesBetween(
              day.breakStartTime,
              day.breakEndTime
            );
          }

          // Ensure break is within working hours
          if (
            !isEndTimeAfterStartTime(day.startTime, day.breakStartTime) ||
            !isEndTimeAfterStartTime(day.breakEndTime, day.endTime)
          ) {
            errors.push(
              `${
                DAYS_OF_WEEK[day.dayOfWeek]
              }: Break must be within working hours.`
            );
          }
        }

        const availableMinutes = dayMinutes - breakMinutes;
        totalMinutes += availableMinutes;

        // Check minimum hours per day
        if (availableMinutes < MIN_HOURS_PER_DAY * 60) {
          errors.push(
            `${
              DAYS_OF_WEEK[day.dayOfWeek]
            } has less than ${MIN_HOURS_PER_DAY} hours of availability.`
          );
        }
      }
    });

    // Check if no days are active
    if (activeDays === 0) {
      errors.push(
        "No active days set. Please activate at least one day of the week."
      );
    }

    // Check total hours per week
    const totalHours = totalMinutes / 60;
    if (totalHours < MIN_HOURS_PER_WEEK) {
      errors.push(
        `Total weekly availability (${totalHours.toFixed(
          1
        )} hours) is less than the minimum requirement of ${MIN_HOURS_PER_WEEK} hours.`
      );
    }

    setValidationErrors(errors);
  }, [weeklySchedule]);

  // Handle changes to the weekly schedule
  const handleScheduleChange = (
    index: number,
    field: string,
    value: string | number | boolean | undefined
  ) => {
    const updatedSchedule = [...weeklySchedule];
    updatedSchedule[index] = {
      ...updatedSchedule[index],
      [field]: value,
      breaks: updatedSchedule[index].breaks || [], // Ensure breaks always exists
    };

    // Special handling for break times
    if (field === "breakStartTime" && value === undefined) {
      // If break start time is removed, also remove break end time
      updatedSchedule[index].breakEndTime = undefined;
    }
    if (field === "isActive" && !value) {
      // If a day is deactivated, remove it from daysOfOperation
      setDaysOfOperation((prevDays) => prevDays.filter((day) => day !== index));
    } else if (field === "isActive" && value) {
      // If a day is activated, add it to daysOfOperation
      setDaysOfOperation((prevDays) =>
        prevDays.includes(index) ? prevDays : [...prevDays, index].sort()
      );
    }

    setWeeklySchedule(updatedSchedule);
  };

  // Add a date exception
  const handleAddDateException = () => {
    if (!selectedDate) return;

    // Validate exception times
    if (
      isDateAvailable &&
      !isEndTimeAfterStartTime(exceptionStartTime, exceptionEndTime)
    ) {
      toast({
        variant: "destructive",
        title: "Invalid Time Range",
        description: "End time must be after start time.",
      });
      return;
    }

    // Check if date already exists in overrides
    const existingIndex = dateOverrides.findIndex(
      (override) =>
        format(override.date, "yyyy-MM-dd") ===
        format(selectedDate, "yyyy-MM-dd")
    );

    if (existingIndex >= 0) {
      // Update existing override
      const updatedOverrides = [...dateOverrides];
      updatedOverrides[existingIndex] = {
        ...updatedOverrides[existingIndex],
        isAvailable: isDateAvailable,
        startTime: isDateAvailable ? exceptionStartTime : undefined,
        endTime: isDateAvailable ? exceptionEndTime : undefined,
      };
      setDateOverrides(updatedOverrides);
    } else {
      // Add new override
      setDateOverrides([
        ...dateOverrides,
        {
          date: selectedDate,
          isAvailable: isDateAvailable,
          startTime: isDateAvailable ? exceptionStartTime : undefined,
          endTime: isDateAvailable ? exceptionEndTime : undefined,
        },
      ]);
    }

    // Reset selection
    setSelectedDate(undefined);
    setIsDateAvailable(true);
    setExceptionStartTime("09:00");
    setExceptionEndTime("17:00");

    toast({
      title: "Date Exception Added",
      description: `Successfully ${
        isDateAvailable ? "modified hours for" : "blocked"
      } ${format(selectedDate, "MMMM d, yyyy")}.`,
    });
  };

  // Remove a date exception
  const handleRemoveDateException = (index: number) => {
    const updatedOverrides = [...dateOverrides];
    updatedOverrides.splice(index, 1);
    setDateOverrides(updatedOverrides);
  };

  // Save the availability settings
  const handleSaveAvailability = async () => {
    try {
      // Ensure all days have a breaks array before saving
      const validSchedule = ensureBreaksExist(weeklySchedule);

      // Perform validation - but allow saving with warnings
      if (validationErrors.length > 0) {
        const proceed = window.confirm(
          "There are warnings with your availability settings. Are you sure you want to proceed?"
        );
        if (!proceed) return;
      }

      await saveAvailability.mutateAsync({
        weeklySchedule: validSchedule, // Use the validated schedule
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
    }
  };

  const calculateAvailableMinutes = (day: any): number => {
    const dayMinutes = calculateMinutesBetween(day.startTime, day.endTime);

    // Handle legacy breaks if present
    if (day.breakStartTime && day.breakEndTime) {
      const breakMinutes = calculateMinutesBetween(
        day.breakStartTime,
        day.breakEndTime
      );
      return dayMinutes - breakMinutes;
    }

    // Handle new breaks array
    const breaks = day.breaks || [];
    const breakMinutes = breaks.reduce((total: number, break_: BreakPeriod) => {
      if (
        isEndTimeAfterStartTime(break_.startTime, break_.endTime) &&
        isEndTimeAfterStartTime(day.startTime, break_.startTime) &&
        isEndTimeAfterStartTime(break_.endTime, day.endTime)
      ) {
        return (
          total + calculateMinutesBetween(break_.startTime, break_.endTime)
        );
      }
      return total;
    }, 0);

    return dayMinutes - breakMinutes;
  };

  // Save date exceptions/overrides
  const handleSaveDateOverrides = async () => {
    try {
      await saveAvailabilityOverride.mutateAsync({
        dateOverrides,
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
    }
  };

  const ensureBreaksExist = (schedule: any[]) => {
    return schedule.map((day) => ({
      ...day,
      breaks: day.breaks || [],
    }));
  };

  const addBreakPeriod = (dayIndex: number) => {
    const day = weeklySchedule[dayIndex];
    if (!day.isActive) return;

    // Find a default 1-hour slot for the break
    // Try to place it at noon, or find another available time
    const defaultBreakStart = "12:00";
    const defaultBreakEnd = "13:00";

    // Check if the default break time conflicts with existing breaks
    const hasConflict = day.breaks.some(
      (break_) =>
        (isEndTimeAfterStartTime(break_.startTime, defaultBreakStart) &&
          isEndTimeAfterStartTime(defaultBreakStart, break_.endTime)) ||
        (isEndTimeAfterStartTime(break_.startTime, defaultBreakEnd) &&
          isEndTimeAfterStartTime(defaultBreakEnd, break_.endTime))
    );

    if (
      !hasConflict &&
      isEndTimeAfterStartTime(day.startTime, defaultBreakStart) &&
      isEndTimeAfterStartTime(defaultBreakEnd, day.endTime)
    ) {
      // Default noon break works
      const updatedSchedule = [...weeklySchedule];
      updatedSchedule[dayIndex].breaks.push({
        id: crypto.randomUUID(), // Generate a unique ID
        startTime: defaultBreakStart,
        endTime: defaultBreakEnd,
      });
      setWeeklySchedule(updatedSchedule);
    } else {
      // Find another available slot
      // For simplicity, just add a 30-minute break at the start of the day
      const breakStart = day.startTime;

      // Add 30 minutes to get the break end time
      const startDate = parseISO(`2000-01-01T${breakStart}`);
      const endDate = new Date(startDate.getTime() + 30 * 60000);
      const breakEnd = format(endDate, "HH:mm");

      const updatedSchedule = [...weeklySchedule];
      updatedSchedule[dayIndex].breaks.push({
        id: crypto.randomUUID(),
        startTime: breakStart,
        endTime: breakEnd,
      });
      setWeeklySchedule(updatedSchedule);
    }
  };

  const removeBreakPeriod = (dayIndex: number, breakId: string) => {
    const updatedSchedule = [...weeklySchedule];
    updatedSchedule[dayIndex].breaks = updatedSchedule[dayIndex].breaks.filter(
      (break_) => break_.id !== breakId
    );
    setWeeklySchedule(updatedSchedule);
  };

  const updateBreakTime = (
    dayIndex: number,
    breakId: string,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const updatedSchedule = [...weeklySchedule];
    const breakIndex = updatedSchedule[dayIndex].breaks.findIndex(
      (break_) => break_.id === breakId
    );

    if (breakIndex === -1) return;

    const currentBreak = updatedSchedule[dayIndex].breaks[breakIndex];
    const day = updatedSchedule[dayIndex];

    // Check if the new time is valid
    if (field === "startTime") {
      // Check if start time is after day start and before break end
      if (
        isEndTimeAfterStartTime(day.startTime, value) &&
        isEndTimeAfterStartTime(value, currentBreak.endTime)
      ) {
        updatedSchedule[dayIndex].breaks[breakIndex].startTime = value;
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Break Time",
          description:
            "Break start time must be within working hours and before break end time.",
        });
        return;
      }
    } else if (field === "endTime") {
      // Check if end time is after break start and before day end
      if (
        isEndTimeAfterStartTime(currentBreak.startTime, value) &&
        isEndTimeAfterStartTime(value, day.endTime)
      ) {
        updatedSchedule[dayIndex].breaks[breakIndex].endTime = value;
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Break Time",
          description:
            "Break end time must be after break start time and within working hours.",
        });
        return;
      }
    }

    // Check for conflicts with other breaks
    const otherBreaks = updatedSchedule[dayIndex].breaks.filter(
      (_, i) => i !== breakIndex
    );

    const hasConflict = otherBreaks.some((break_) => {
      const newBreak = updatedSchedule[dayIndex].breaks[breakIndex];

      return (
        (isEndTimeAfterStartTime(break_.startTime, newBreak.startTime) &&
          isEndTimeAfterStartTime(newBreak.startTime, break_.endTime)) ||
        (isEndTimeAfterStartTime(break_.startTime, newBreak.endTime) &&
          isEndTimeAfterStartTime(newBreak.endTime, break_.endTime)) ||
        (isEndTimeAfterStartTime(newBreak.startTime, break_.startTime) &&
          isEndTimeAfterStartTime(break_.endTime, newBreak.endTime))
      );
    });

    if (hasConflict) {
      toast({
        variant: "destructive",
        title: "Break Time Conflict",
        description: "Break times cannot overlap with other breaks.",
      });
      return;
    }

    setWeeklySchedule(updatedSchedule);
  };

  // In the validation effect, update to handle multiple breaks
  useEffect(() => {
    const errors: string[] = [];

    // Calculate total available hours per week
    let totalMinutes = 0;
    let activeDays = 0;

    weeklySchedule.forEach((day) => {
      if (day.isActive) {
        activeDays++;

        // Check if end time is after start time
        if (!isEndTimeAfterStartTime(day.startTime, day.endTime)) {
          errors.push(
            `${DAYS_OF_WEEK[day.dayOfWeek]}: End time (${
              day.endTime
            }) must be after start time (${day.startTime}).`
          );
        }

        // Check if slot duration fits in the time window
        const dayMinutes = calculateMinutesBetween(day.startTime, day.endTime);
        if (dayMinutes < day.slotDuration) {
          errors.push(
            `${DAYS_OF_WEEK[day.dayOfWeek]}: Slot duration (${
              day.slotDuration
            } min) exceeds available time (${dayMinutes} min).`
          );
        }

        // Validate breaks and calculate total break time
        let breakMinutes = 0;
        const breakErrors: string[] = [];

        day.breaks.forEach((break_, index) => {
          // Check if break times are valid
          if (!isEndTimeAfterStartTime(break_.startTime, break_.endTime)) {
            breakErrors.push(
              `Break ${index + 1}: End time must be after start time.`
            );
          }

          // Check if break is within working hours
          if (
            !isEndTimeAfterStartTime(day.startTime, break_.startTime) ||
            !isEndTimeAfterStartTime(break_.endTime, day.endTime)
          ) {
            breakErrors.push(
              `Break ${index + 1}: Must be within working hours.`
            );
          }

          // Add the break duration to total break minutes
          if (
            isEndTimeAfterStartTime(break_.startTime, break_.endTime) &&
            isEndTimeAfterStartTime(day.startTime, break_.startTime) &&
            isEndTimeAfterStartTime(break_.endTime, day.endTime)
          ) {
            breakMinutes += calculateMinutesBetween(
              break_.startTime,
              break_.endTime
            );
          }
        });

        // Check for overlapping breaks
        for (let i = 0; i < day.breaks.length; i++) {
          for (let j = i + 1; j < day.breaks.length; j++) {
            const breakA = day.breaks[i];
            const breakB = day.breaks[j];

            if (
              (isEndTimeAfterStartTime(breakA.startTime, breakB.startTime) &&
                isEndTimeAfterStartTime(breakB.startTime, breakA.endTime)) ||
              (isEndTimeAfterStartTime(breakA.startTime, breakB.endTime) &&
                isEndTimeAfterStartTime(breakB.endTime, breakA.endTime)) ||
              (isEndTimeAfterStartTime(breakB.startTime, breakA.startTime) &&
                isEndTimeAfterStartTime(breakA.endTime, breakB.endTime))
            ) {
              breakErrors.push(`Breaks ${i + 1} and ${j + 1} overlap.`);
            }
          }
        }

        // Add break errors to main errors if any
        if (breakErrors.length > 0) {
          errors.push(`${DAYS_OF_WEEK[day.dayOfWeek]} breaks have issues:`);
          breakErrors.forEach((error) => {
            errors.push(`  - ${error}`);
          });
        }

        const availableMinutes = dayMinutes - breakMinutes;
        totalMinutes += availableMinutes;

        // Check minimum hours per day
        if (availableMinutes < MIN_HOURS_PER_DAY * 60) {
          errors.push(
            `${
              DAYS_OF_WEEK[day.dayOfWeek]
            } has less than ${MIN_HOURS_PER_DAY} hours of availability.`
          );
        }
      }
    });

    // Rest of validation remains the same...
  }, [weeklySchedule]);

  const renderBreakTimeUI = (day: any, dayIndex: number) => {
    // Ensure breaks is always an array
    const breaks = day.breaks || [];

    return (
      <div className="col-span-1 md:col-span-3 mt-4 border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-medical-700">
            Unavailable Time Periods
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addBreakPeriod(dayIndex)}
          >
            Add Break
          </Button>
        </div>
        {breaks.length === 0 ? (
          <p className="text-sm text-medical-500 italic">
            No breaks added. You are available all day.
          </p>
        ) : (
          <div className="space-y-3">
            {breaks.map((break_: BreakPeriod) => (
              // Rest of your code stays the same
              <div
                key={break_.id}
                className="flex items-end space-x-2 p-3 bg-gray-50 rounded-md"
              >
                <div className="flex-1">
                  <label className="text-xs text-medical-500 mb-1 block">
                    Start Time
                  </label>
                  <Select
                    value={break_.startTime}
                    onValueChange={(value) =>
                      updateBreakTime(dayIndex, break_.id, "startTime", value)
                    }
                  >
                    <SelectTrigger className="border-medical-200">
                      <SelectValue placeholder="Break start" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions
                        .filter(
                          (option) =>
                            isEndTimeAfterStartTime(
                              day.startTime,
                              option.value
                            ) &&
                            isEndTimeAfterStartTime(
                              option.value,
                              day.endTime
                            ) &&
                            (!break_.endTime ||
                              isEndTimeAfterStartTime(
                                option.value,
                                break_.endTime
                              ))
                        )
                        .map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="text-xs text-medical-500 mb-1 block">
                    End Time
                  </label>
                  <Select
                    value={break_.endTime}
                    onValueChange={(value) =>
                      updateBreakTime(dayIndex, break_.id, "endTime", value)
                    }
                  >
                    <SelectTrigger className="border-medical-200">
                      <SelectValue placeholder="Break end" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions
                        .filter(
                          (option) =>
                            break_.startTime &&
                            isEndTimeAfterStartTime(
                              break_.startTime,
                              option.value
                            ) &&
                            isEndTimeAfterStartTime(option.value, day.endTime)
                        )
                        .map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 rounded-full p-1.5 mb-1 ml-2 transition-colors duration-200"
                  onClick={() => removeBreakPeriod(dayIndex, break_.id)}
                  title="Remove break"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
                  <Calendar className="h-4 w-4" />
                  {t("weeklySchedule")}
                </TabsTrigger>
                <TabsTrigger
                  value="exceptions"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  {t("exceptions")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === "weekly" ? (
            <div className="space-y-6">
              <p className="text-sm text-medical-600">
                {t("weeklyScheduleDescription")}
              </p>

              {/* Validation Warnings */}
              {validationErrors.length > 0 && (
                <Alert
                  variant="default"
                  className="bg-amber-50 border-amber-300"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Availability Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Select default slot duration */}
              <div className="max-w-xs">
                <label className="text-sm font-medium text-medical-700 mb-1 block">
                  {t("defaultAppointmentDuration")}
                </label>
              </div>
              <Select
                value={
                  weeklySchedule
                    .find((day) => day.isActive)
                    ?.slotDuration.toString() || defaultSlotDuration.toString()
                }
                onValueChange={(value) => {
                  const parsedValue = parseInt(value);
                  setDefaultSlotDuration(parsedValue);

                  // Update all active days with this slot duration
                  const updatedSchedule = weeklySchedule.map((day) => ({
                    ...day,
                    slotDuration: day.isActive ? parsedValue : day.slotDuration,
                  }));
                  setWeeklySchedule(updatedSchedule);
                }}
              >
                <SelectTrigger className="border-medical-200">
                  <SelectValue>
                    {
                      slotDurationOptions.find(
                        (option) =>
                          option.value ===
                          (weeklySchedule.find((day) => day.isActive)
                            ?.slotDuration || defaultSlotDuration)
                      )?.label
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {slotDurationOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Separator />

              {/* Weekly schedule editor */}
              <div className="space-y-4">
                {weeklySchedule.map((day, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-md ${
                      validationErrors.some((error) =>
                        error.includes(DAYS_OF_WEEK[day.dayOfWeek])
                      )
                        ? "border-amber-300 bg-amber-50"
                        : "border-medical-100"
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <Checkbox
                        id={`day-${index}`}
                        checked={day.isActive}
                        onCheckedChange={(checked) =>
                          handleScheduleChange(index, "isActive", checked)
                        }
                      />
                      <label
                        htmlFor={`day-${index}`}
                        className="ml-2 text-sm font-medium text-medical-900"
                      >
                        {DAYS_OF_WEEK[day.dayOfWeek]}
                      </label>
                    </div>
                    {day.isActive && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-medical-500 mb-1 block">
                            Start Time
                          </label>
                          <Select
                            value={day.startTime}
                            onValueChange={(value) =>
                              handleScheduleChange(index, "startTime", value)
                            }
                          >
                            <SelectTrigger className="border-medical-200">
                              <SelectValue placeholder="Start time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-medical-500 mb-1 block">
                            End Time
                          </label>
                          <Select
                            value={day.endTime}
                            onValueChange={(value) =>
                              handleScheduleChange(index, "endTime", value)
                            }
                          >
                            <SelectTrigger className="border-medical-200">
                              <SelectValue placeholder="End time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-medical-500 mb-1 block">
                            Appointment Duration
                          </label>
                          <Select
                            value={day.slotDuration.toString()}
                            onValueChange={(value) =>
                              handleScheduleChange(
                                index,
                                "slotDuration",
                                parseInt(value)
                              )
                            }
                          >
                            <SelectTrigger className="border-medical-200">
                              <SelectValue placeholder="Duration" />
                            </SelectTrigger>
                            <SelectContent>
                              {slotDurationOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value.toString()}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Breaks/Unavailable Periods */}
                        <div className="col-span-1 md:col-span-3 mt-4 border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-medical-700">
                              Unavailable Time Periods
                            </label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addBreakPeriod(index)}
                            >
                              Add Break
                            </Button>
                          </div>
                          {day.breaks && day.breaks.length > 0 ? (
                            <div className="space-y-3">
                              {day.breaks.map(
                                (break_: BreakPeriod, breakIndex: number) => (
                                  <div
                                    key={break_.id}
                                    className="flex items-end space-x-2 p-3 bg-gray-50 rounded-md"
                                  >
                                    <div className="flex-1">
                                      <label className="text-xs text-medical-500 mb-1 block">
                                        Start Time
                                      </label>
                                      <Select
                                        value={break_.startTime}
                                        onValueChange={(value) =>
                                          updateBreakTime(
                                            index,
                                            break_.id,
                                            "startTime",
                                            value
                                          )
                                        }
                                      >
                                        <SelectTrigger className="border-medical-200">
                                          <SelectValue placeholder="Break start" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {timeOptions
                                            .filter(
                                              (option) =>
                                                isEndTimeAfterStartTime(
                                                  day.startTime,
                                                  option.value
                                                ) &&
                                                isEndTimeAfterStartTime(
                                                  option.value,
                                                  day.endTime
                                                ) &&
                                                (!break_.endTime ||
                                                  isEndTimeAfterStartTime(
                                                    option.value,
                                                    break_.endTime
                                                  ))
                                            )
                                            .map((option) => (
                                              <SelectItem
                                                key={option.value}
                                                value={option.value}
                                              >
                                                {option.label}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-xs text-medical-500 mb-1 block">
                                        End Time
                                      </label>
                                      <Select
                                        value={break_.endTime}
                                        onValueChange={(value) =>
                                          updateBreakTime(
                                            index,
                                            break_.id,
                                            "endTime",
                                            value
                                          )
                                        }
                                      >
                                        <SelectTrigger className="border-medical-200">
                                          <SelectValue placeholder="Break end" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {timeOptions
                                            .filter(
                                              (option) =>
                                                break_.startTime &&
                                                isEndTimeAfterStartTime(
                                                  break_.startTime,
                                                  option.value
                                                ) &&
                                                isEndTimeAfterStartTime(
                                                  option.value,
                                                  day.endTime
                                                )
                                            )
                                            .map((option) => (
                                              <SelectItem
                                                key={option.value}
                                                value={option.value}
                                              >
                                                {option.label}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 rounded-full p-1.5 mb-1 ml-2 transition-colors duration-200"
                                      onClick={() =>
                                        removeBreakPeriod(index, break_.id)
                                      }
                                      title="Remove break"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-medical-500 italic">
                              No breaks added. You are available all day.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Show availability calculations for the day */}
                    {day.isActive && (
                      <div className="mt-4 text-sm text-medical-600">
                        {(() => {
                          const availableMinutes =
                            calculateAvailableMinutes(day);
                          const hours = Math.floor(availableMinutes / 60);
                          const minutes = availableMinutes % 60;
                          const slots = Math.floor(
                            availableMinutes / day.slotDuration
                          );
                          return (
                            <div className="flex justify-between">
                              <span>
                                Total availability: {hours}h {minutes}m
                              </span>
                              <span>Available slots: {slots}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleSaveAvailability}
                  className="bg-medical-600 hover:bg-medical-700"
                  disabled={saveAvailability.isPending}
                >
                  {saveAvailability.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Weekly Schedule"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-medical-600">
                {t("exceptionsDescription")}
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-md border-medical-100">
                    <h3 className="text-sm font-medium mb-4">
                      Add Date Exception
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-medical-500 mb-1 block">
                          Select Date
                        </label>
                        <div className="border rounded-md border-medical-200">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md"
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is-available"
                          checked={isDateAvailable}
                          onCheckedChange={(checked) =>
                            setIsDateAvailable(!!checked)
                          }
                        />
                        <label
                          htmlFor="is-available"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Available this day
                        </label>
                      </div>

                      {isDateAvailable && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-medical-500 mb-1 block">
                              Start Time
                            </label>
                            <Select
                              value={exceptionStartTime}
                              onValueChange={setExceptionStartTime}
                            >
                              <SelectTrigger className="border-medical-200">
                                <SelectValue placeholder="Start time" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-xs text-medical-500 mb-1 block">
                              End Time
                            </label>
                            <Select
                              value={exceptionEndTime}
                              onValueChange={setExceptionEndTime}
                            >
                              <SelectTrigger className="border-medical-200">
                                <SelectValue placeholder="End time" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleAddDateException}
                        className="w-full bg-medical-600 hover:bg-medical-700"
                        disabled={!selectedDate}
                      >
                        Add Exception
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-4"> </h3>

                  {dateOverrides.length > 0 ? (
                    <div className="space-y-3">
                      {dateOverrides.map((override, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-md border-medical-100 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {format(override.date, "MMMM d, yyyy")}
                            </p>
                            <p className="text-sm text-medical-600">
                              {override.isAvailable
                                ? `Available: ${override.startTime} - ${override.endTime}`
                                : "Not available"}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveDateException(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-medical-500 border border-dashed border-medical-200 rounded-md">
                      No date exceptions added
                    </div>
                  )}
                  {dateOverrides.length > 0 && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleSaveDateOverrides}
                        className="bg-medical-600 hover:bg-medical-700"
                        disabled={saveAvailabilityOverride.isPending}
                      >
                        {saveAvailabilityOverride.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Exceptions"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentSettings;
