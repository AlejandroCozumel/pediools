// app/dashboard/appointments/settings/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { format, addDays, startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useDoctorAvailability } from "@/hooks/use-appointments";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardTitle from "@/components/DashboardTitle";
import { Calendar, Clock, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Array of days
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
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

const AppointmentSettings = () => {
  const t = useTranslations("Appointments.settings");
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"weekly" | "exceptions">("weekly");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDateAvailable, setIsDateAvailable] = useState(true);
  const [exceptionStartTime, setExceptionStartTime] = useState("09:00");
  const [exceptionEndTime, setExceptionEndTime] = useState("17:00");

  const {
    availability,
    isLoading,
    saveAvailability,
    saveAvailabilityOverride
  } = useDoctorAvailability();

  // State for weekly schedule
  const [weeklySchedule, setWeeklySchedule] = useState<Array<{
    dayOfWeek: number;
    isActive: boolean;
    startTime: string;
    endTime: string;
    slotDuration: number;
    breakStartTime?: string;
    breakEndTime?: string;
  }>>(
    // Initialize with defaults, or from loaded data
    DAYS_OF_WEEK.map((_, index) => ({
      dayOfWeek: index,
      isActive: index > 0 && index < 6, // Mon-Fri active by default
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      breakStartTime: "12:00",
      breakEndTime: "13:00",
    }))
  );

  // State for date exceptions
  const [dateOverrides, setDateOverrides] = useState<Array<{
    date: Date;
    isAvailable: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }>>(availability?.dateOverrides || []);

  // Update state when data loads
  useEffect(() => {
    if (availability) {
      if (availability.weeklySchedule) {
        setWeeklySchedule(availability.weeklySchedule);
      }
      if (availability.dateOverrides) {
        setDateOverrides(availability.dateOverrides);
      }
    }
  }, [availability]);

  // Handle changes to the weekly schedule
  const handleScheduleChange = (index: number, field: string, value: any) => {
    const updatedSchedule = [...weeklySchedule];
    updatedSchedule[index] = {
      ...updatedSchedule[index],
      [field]: value,
    };
    setWeeklySchedule(updatedSchedule);
  };

  // Add a date exception
  const handleAddDateException = () => {
    if (!selectedDate) return;

    // Check if date already exists in overrides
    const existingIndex = dateOverrides.findIndex(
      override => format(override.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );

    if (existingIndex >= 0) {
      // Update existing override
      const updatedOverrides = [...dateOverrides];
      updatedOverrides[existingIndex] = {
        ...updatedOverrides[existingIndex],
        isAvailable,
        startTime: isAvailable ? exceptionStartTime : undefined,
        endTime: isAvailable ? exceptionEndTime : undefined,
      };
      setDateOverrides(updatedOverrides);
    } else {
      // Add new override
      setDateOverrides([
        ...dateOverrides,
        {
          date: selectedDate,
          isAvailable,
          startTime: isAvailable ? exceptionStartTime : undefined,
          endTime: isAvailable ? exceptionEndTime : undefined,
        }
      ]);
    }

    // Reset selection
    setSelectedDate(undefined);
    setIsDateAvailable(true);
    setExceptionStartTime("09:00");
    setExceptionEndTime("17:00");

    toast({
      title: "Date Exception Added",
      description: `Successfully ${isAvailable ? 'modified hours for' : 'blocked'} ${format(selectedDate, 'MMMM d, yyyy')}.`,
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
      await saveAvailability.mutateAsync({
        weeklySchedule,
      });

      toast({
        title: "Availability Updated",
        description: "Your weekly availability schedule has been saved successfully.",
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
        <DashboardTitle
          title={t("title")}
          subtitle={t("subtitle")}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-medical-500" />
            <CardTitle className="text-xl font-heading">
              {t("availabilitySettings")}
            </CardTitle>
          </div>
          <CardDescription>
            {t("availabilityDescription")}
          </CardDescription>

          <div className="pt-4">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "weekly" | "exceptions")}
            >
              <TabsList>
                <TabsTrigger value="weekly" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("weeklySchedule")}
                </TabsTrigger>
                <TabsTrigger value="exceptions" className="flex items-center gap-2">
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

              {/* Select default slot duration */}
              <div className="max-w-xs">
                <label className="text-sm font-medium text-medical-700 mb-1 block">
                  Default Appointment Duration
                </label>
                <Select
                  value="30"
                  onValueChange={(value) => {
                    // Update all active days with this slot duration
                    const updatedSchedule = weeklySchedule.map(day => ({
                      ...day,
                      slotDuration: day.isActive ? parseInt(value) : day.slotDuration
                    }));
                    setWeeklySchedule(updatedSchedule);
                  }}
                >
                  <SelectTrigger className="border-medical-200">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {slotDurationOptions.map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Weekly schedule editor */}
              <div className="space-y-4">
                {weeklySchedule.map((day, index) => (
                  <div key={index} className="p-4 border rounded-md border-medical-100">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                              {timeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
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
                              {timeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
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
                              handleScheduleChange(index, "slotDuration", parseInt(value))
                            }
                          >
                            <SelectTrigger className="border-medical-200">
                              <SelectValue placeholder="Duration" />
                            </SelectTrigger>
                            <SelectContent>
                              {slotDurationOptions.map(option => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

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
                    <h3 className="text-sm font-medium mb-4">Add Date Exception</h3>

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
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is-available"
                          checked={isDateAvailable}
                          onCheckedChange={setIsDateAvailable}
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
                                {timeOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
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
                                {timeOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
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
                  <h3 className="text-sm font-medium mb-4">Existing Exceptions</h3>

                  {dateOverrides.length > 0 ? (
                    <div className="space-y-3">
                      {dateOverrides.map((override, index) => (
                        <div key={index} className="p-3 border rounded-md border-medical-100 flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {format(override.date, "MMMM d, yyyy")}
                            </p>
                            <p className="text-sm text-medical-600">
                              {override.isAvailable
                                ? `Available: ${override.startTime} - ${override.endTime}`
                                : "Not available"
                              }
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