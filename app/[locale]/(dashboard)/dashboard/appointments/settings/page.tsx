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
import { Calendar, Clock, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
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

type DaySchedule = {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  breakStartTime?: string;
  breakEndTime?: string;
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

// Validate if slot duration fits within time window
const isDurationValid = (
  startTime: string,
  endTime: string,
  slotDuration: number
): boolean => {
  const minutesBetween = calculateMinutesBetween(startTime, endTime);
  return minutesBetween >= slotDuration;
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
    }>
  >(
    DAYS_OF_WEEK.map((_, index) => ({
      dayOfWeek: index,
      isActive: index < 5,
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
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
        (day: DaySchedule) => day.isActive
      );

      if (hasActiveAvailability) {
        setWeeklySchedule(availability.weeklySchedule);
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
      // Perform validation - but allow saving with warnings
      if (validationErrors.length > 0) {
        const proceed = window.confirm(
          "There are warnings with your availability settings. Are you sure you want to proceed?"
        );
        if (!proceed) return;
      }

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
    }
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

                        {/* Optional: Break time */}
                        <div className="col-span-1 md:col-span-3">
                          <label className="text-xs text-medical-500 mb-1 block">
                            Break Time
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-medical-700">
                              {day.breakStartTime || "None"} -{" "}
                              {day.breakEndTime || "None"}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // If no break exists, set a default break
                                if (!day.breakStartTime) {
                                  // Set a default 1-hour break from 12:00 to 13:00
                                  handleScheduleChange(
                                    index,
                                    "breakStartTime",
                                    "12:00"
                                  );
                                  handleScheduleChange(
                                    index,
                                    "breakEndTime",
                                    "13:00"
                                  );
                                } else {
                                  // If break exists, remove it completely
                                  handleScheduleChange(
                                    index,
                                    "breakStartTime",
                                    undefined
                                  );
                                  handleScheduleChange(
                                    index,
                                    "breakEndTime",
                                    undefined
                                  );
                                }
                              }}
                            >
                              {day.breakStartTime
                                ? "Remove Break"
                                : "Add Break"}
                            </Button>
                          </div>

                          {day.breakStartTime && (
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <Select
                                value={day.breakStartTime}
                                onValueChange={(value) => {
                                  // Validate break start time is after work start and before work end
                                  if (
                                    isEndTimeAfterStartTime(
                                      day.startTime,
                                      value
                                    ) &&
                                    isEndTimeAfterStartTime(value, day.endTime)
                                  ) {
                                    handleScheduleChange(
                                      index,
                                      "breakStartTime",
                                      value
                                    );

                                    // If break end time is before new break start time, reset it
                                    if (
                                      day.breakEndTime &&
                                      !isEndTimeAfterStartTime(
                                        value,
                                        day.breakEndTime
                                      )
                                    ) {
                                      handleScheduleChange(
                                        index,
                                        "breakEndTime",
                                        undefined
                                      );
                                    }
                                  } else {
                                    toast({
                                      variant: "destructive",
                                      title: "Invalid Break Time",
                                      description:
                                        "Break must be within working hours.",
                                    });
                                  }
                                }}
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
                              <Select
                                value={day.breakEndTime}
                                onValueChange={(value) => {
                                  // Validate break end time is after break start and before work end
                                  if (
                                    day.breakStartTime && // Ensure break start time exists
                                    isEndTimeAfterStartTime(
                                      day.breakStartTime,
                                      value
                                    ) &&
                                    isEndTimeAfterStartTime(value, day.endTime)
                                  ) {
                                    handleScheduleChange(
                                      index,
                                      "breakEndTime",
                                      value
                                    );
                                  } else {
                                    toast({
                                      variant: "destructive",
                                      title: "Invalid Break Time",
                                      description:
                                        "Break end time must be after break start and before work end.",
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger className="border-medical-200">
                                  <SelectValue placeholder="Break end" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions
                                    .filter(
                                      (option) =>
                                        day.breakStartTime && // Ensure break start time exists
                                        isEndTimeAfterStartTime(
                                          day.breakStartTime,
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
                          )}
                        </div>
                      </div>
                    )}

                    {/* Show availability calculations for the day */}
                    {day.isActive && (
                      <div className="mt-4 text-sm text-medical-600">
                        {(() => {
                          const dayMinutes = calculateMinutesBetween(
                            day.startTime,
                            day.endTime
                          );
                          let breakMinutes = 0;
                          if (day.breakStartTime && day.breakEndTime) {
                            breakMinutes = calculateMinutesBetween(
                              day.breakStartTime,
                              day.breakEndTime
                            );
                          }
                          const availableMinutes = dayMinutes - breakMinutes;
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
                              Available slots: {slots}
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
