import React, { useState, useCallback, useMemo } from "react";
import { format, parseISO, addMonths, isSameDay, startOfMonth } from "date-fns";
import { Loader2, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar, DateAvailability } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DateOverride, WeeklySchedule } from "@/types/appointments";

interface DateExceptionsProps {
  weeklySchedule: WeeklySchedule;
  dateOverrides: DateOverride[];
  onDateOverridesChange: (overrides: DateOverride[]) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const DateExceptions: React.FC<DateExceptionsProps> = ({
  weeklySchedule,
  dateOverrides,
  onDateOverridesChange,
  onSave,
  isSaving,
}) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Instead of keeping slot overrides in separate state, we'll extract them from dateOverrides
  const dayLevelOverrides = useMemo(
    () => dateOverrides.filter((override) => !override.slotId),
    [dateOverrides]
  );

  const slotLevelOverrides = useMemo(
    () => dateOverrides.filter((override) => !!override.slotId),
    [dateOverrides]
  );

  // Generate date availability data for current and next month
  const availabilityData = useMemo(() => {
    const data: DateAvailability[] = [];
    const today = new Date();
    const startDate = startOfMonth(calendarMonth);
    const endDate = addMonths(startDate, 2); // Include current and next month

    // For each day in range
    for (
      let day = new Date(startDate);
      day < endDate;
      day.setDate(day.getDate() + 1)
    ) {
      // Skip past days
      if (day < today) continue;

      const currentDate = new Date(day);
      const dayOfWeek = currentDate.getDay(); // 0-6, Sunday to Saturday
      const daySchedule = weeklySchedule[dayOfWeek];

      // Check if day has an override (day-level only)
      const dayOverride = dayLevelOverrides.find((override) => {
        const overrideDate = new Date(override.date);
        return isSameDay(overrideDate, currentDate);
      });

      // Check if day has any slot-level overrides
      const hasSlotOverrides = slotLevelOverrides.some((override) => {
        const overrideDate = new Date(override.date);
        return isSameDay(overrideDate, currentDate);
      });

      // Determine availability status based on day-level override
      const isAvailable = dayOverride
        ? dayOverride.isAvailable
        : daySchedule && daySchedule.isActive;

      data.push({
        date: currentDate,
        hasSlots: isAvailable,
        hasExceptions: !!dayOverride || hasSlotOverrides, // Has exception if there's any override
        isDisabled: !isAvailable,
      });
    }

    return data;
  }, [weeklySchedule, dayLevelOverrides, slotLevelOverrides, calendarMonth]);

  // Toggle day availability
  const toggleDayAvailability = useCallback(
    (date: Date) => {
      // Ensure we're working with a Date object
      const normalizedDate = new Date(date);

      // Find existing day-level override
      const existingDayOverrideIndex = dateOverrides.findIndex((override) => {
        const overrideDate = new Date(override.date);
        return isSameDay(overrideDate, normalizedDate) && !override.slotId;
      });

      if (existingDayOverrideIndex !== -1) {
        // Remove existing day override
        const updatedOverrides = [...dateOverrides];
        updatedOverrides.splice(existingDayOverrideIndex, 1);

        // Also remove any slot overrides for this date
        const filteredOverrides = updatedOverrides.filter((override) => {
          const overrideDate = new Date(override.date);
          return !isSameDay(overrideDate, normalizedDate);
        });

        onDateOverridesChange(filteredOverrides);
      } else {
        // Add new day override - by default blocking the day (isAvailable: false)
        onDateOverridesChange([
          ...dateOverrides.filter((override) => {
            const overrideDate = new Date(override.date);
            return !isSameDay(overrideDate, normalizedDate);
          }),
          {
            date: normalizedDate,
            isAvailable: false,
            reason: "Manually blocked",
          },
        ]);
      }
    },
    [dateOverrides, onDateOverridesChange]
  );

  // Toggle slot availability
  const toggleSlotAvailability = useCallback(
    (date: Date, slotId: string) => {
      // Ensure we're working with a Date object
      const normalizedDate = new Date(date);

      // Find if this slot is already blocked
      const existingSlotOverrideIndex = dateOverrides.findIndex((override) => {
        const overrideDate = new Date(override.date);
        return (
          isSameDay(overrideDate, normalizedDate) && override.slotId === slotId
        );
      });

      if (existingSlotOverrideIndex !== -1) {
        // Remove the slot override
        const updatedOverrides = [...dateOverrides];
        updatedOverrides.splice(existingSlotOverrideIndex, 1);
        onDateOverridesChange(updatedOverrides);
      } else {
        // Add new slot override
        onDateOverridesChange([
          ...dateOverrides,
          {
            date: normalizedDate,
            isAvailable: true, // Day is available
            slotId, // But this specific slot is blocked
            slotIsAvailable: false,
            reason: `Blocked slot: ${slotId}`,
          },
        ]);
      }
    },
    [dateOverrides, onDateOverridesChange]
  );

  // Check if a slot is blocked
  const isSlotBlocked = useCallback(
    (date: Date, slotId: string) => {
      return dateOverrides.some((override) => {
        const overrideDate = new Date(override.date);
        return (
          isSameDay(overrideDate, date) &&
          override.slotId === slotId &&
          override.slotIsAvailable === false
        );
      });
    },
    [dateOverrides]
  );

  // Generate slots for a specific date based on weekly schedule
  const generateDateSlots = useCallback(
    (date: Date) => {
      // Ensure we're working with a Date object
      const normalizedDate = new Date(date);
      const dayOfWeek = normalizedDate.getDay(); // 0 (Sunday) to 6 (Saturday)
      const daySchedule = weeklySchedule[dayOfWeek];

      // If no schedule for this day, return empty array
      if (!daySchedule || !daySchedule.isActive) return [];

      // Check if date has a day-level override
      const dateOverride = dayLevelOverrides.find((override) => {
        const overrideDate = new Date(override.date);
        return isSameDay(overrideDate, normalizedDate);
      });

      // If date is completely blocked, return empty array
      if (dateOverride && !dateOverride.isAvailable) return [];

      // Use custom hours from override if available
      const startTimeStr = dateOverride?.startTime || daySchedule.startTime;
      const endTimeStr = dateOverride?.endTime || daySchedule.endTime;

      const startTime = parseISO(`2000-01-01T${startTimeStr}`);
      const endTime = parseISO(`2000-01-01T${endTimeStr}`);
      const slotDuration = daySchedule.slotDuration || 30;

      const slots: Array<{
        id: string;
        startTime: string;
        endTime: string;
        isBlocked: boolean;
      }> = [];

      // Account for breaks when generating slots
      const breaks = daySchedule.breaks || [];

      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
        if (slotEnd > endTime) break;

        const slotId = `${format(currentTime, "HH:mm")}-${format(
          slotEnd,
          "HH:mm"
        )}`;

        // Check if this slot is during a break
        const isDuringBreak = breaks.some((breakPeriod) => {
          const breakStart = parseISO(`2000-01-01T${breakPeriod.startTime}`);
          const breakEnd = parseISO(`2000-01-01T${breakPeriod.endTime}`);
          return (
            (currentTime >= breakStart && currentTime < breakEnd) ||
            (slotEnd > breakStart && slotEnd <= breakEnd) ||
            (currentTime <= breakStart && slotEnd >= breakEnd)
          );
        });

        // Skip this slot if it's during a break
        if (isDuringBreak) {
          currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
          continue;
        }

        // Check if slot is blocked by an override
        const slotIsBlocked = isSlotBlocked(normalizedDate, slotId);

        slots.push({
          id: slotId,
          startTime: format(currentTime, "HH:mm"),
          endTime: format(slotEnd, "HH:mm"),
          isBlocked: slotIsBlocked,
        });

        currentTime = slotEnd;
      }

      return slots;
    },
    [weeklySchedule, dayLevelOverrides, isSlotBlocked]
  );

  // Handle calendar month change
  const handleMonthChange = (month: Date) => {
    setCalendarMonth(month);
  };

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      // Just use the parent's save function now that we've integrated slot overrides
      await onSave();

      toast({
        title: "Exceptions Saved",
        description:
          "Your date and slot exceptions have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving exceptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save date exceptions.",
      });
    }
  }, [onSave, toast]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-medical-600">
        Manage your availability by blocking specific dates, setting custom
        hours, or blocking individual time slots.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar and Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-2 px-2 flex items-center gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 bg-green-500 rounded-full"></span>
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 bg-red-500 rounded-full"></span>
                  Exception
                </span>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                onMonthChange={handleMonthChange}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                availabilityData={availabilityData}
              />
            </div>
          </CardContent>
        </Card>

        {/* Date Management */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle>
                Manage {format(selectedDate, "MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const dayOfWeek = selectedDate.getDay();
                const daySchedule = weeklySchedule[dayOfWeek];

                // Find existing day override if any
                const dateOverride = dayLevelOverrides.find((override) =>
                  isSameDay(override.date, selectedDate)
                );

                // If no active schedule for this day
                if (!daySchedule || !daySchedule.isActive) {
                  return (
                    <div className="text-center text-medical-500 space-y-2">
                      <XCircle className="mx-auto h-12 w-12 text-medical-300" />
                      <p>No availability on this day</p>
                      <p className="text-xs">
                        This day is not part of your regular working schedule
                      </p>
                    </div>
                  );
                }

                // If date is blocked by an override
                if (dateOverride && !dateOverride.isAvailable) {
                  return (
                    <div className="flex flex-col items-center justify-center text-red-500 space-y-2">
                      <XCircle className="h-12 w-12 text-red-300" />
                      <p>Day is completely blocked</p>
                      <p className="text-xs mb-4">
                        No appointments are available
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => toggleDayAvailability(selectedDate)}
                      >
                        Unblock Day
                      </Button>
                    </div>
                  );
                }

                // If date has custom hours
                if (
                  dateOverride &&
                  dateOverride.isAvailable &&
                  (dateOverride.startTime || dateOverride.endTime)
                ) {
                  return (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-md bg-blue-50">
                        <h3 className="font-medium text-blue-700 mb-2">
                          Custom Hours Set
                        </h3>
                        <p className="text-sm">
                          Start:{" "}
                          {dateOverride.startTime || daySchedule.startTime}
                        </p>
                        <p className="text-sm">
                          End: {dateOverride.endTime || daySchedule.endTime}
                        </p>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedOverrides = dateOverrides.filter(
                                (override) => {
                                  const overrideDate = new Date(override.date);
                                  return (
                                    !isSameDay(overrideDate, selectedDate) ||
                                    !!override.slotId
                                  );
                                }
                              );
                              onDateOverridesChange(updatedOverrides);
                            }}
                          >
                            Reset to Default
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => toggleDayAvailability(selectedDate)}
                          >
                            Block Day
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Regular day with slots
                const slots = generateDateSlots(selectedDate);

                if (slots.length === 0) {
                  return (
                    <div className="text-center text-medical-500 space-y-2">
                      <XCircle className="mx-auto h-12 w-12 text-medical-300" />
                      <p>No available time slots</p>
                      <p className="text-xs">Check your scheduling settings</p>
                    </div>
                  );
                }

                // Show regular day controls
                return (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => toggleDayAvailability(selectedDate)}
                      >
                        Block Entire Day
                      </Button>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">
                        Available Time Slots
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        Click on a slot to toggle its availability
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant={slot.isBlocked ? "destructive" : "outline"}
                            className="text-sm p-2 h-auto"
                            onClick={() =>
                              toggleSlotAvailability(selectedDate, slot.id)
                            }
                          >
                            {slot.startTime} - {slot.endTime}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Current Exceptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Exceptions</CardTitle>
        </CardHeader>
        <CardContent>
          {dateOverrides.length === 0 ? (
            <p className="text-center text-medical-500">
              No exceptions added yet
            </p>
          ) : (
            <div className="space-y-2">
              {/* Day level overrides */}
              {dayLevelOverrides.map((override, index) => {
                // Ensure we have a proper Date object
                const overrideDate =
                  override.date instanceof Date
                    ? override.date
                    : new Date(override.date);

                return (
                  <div
                    key={`day-${index}`}
                    className="flex justify-between items-center p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">
                        {format(overrideDate, "MMMM d, yyyy")}
                      </p>
                      <Badge
                        variant={
                          override.isAvailable ? "default" : "destructive"
                        }
                      >
                        {override.isAvailable
                          ? override.startTime || override.endTime
                            ? "Custom Hours"
                            : "Available (Override)"
                          : "Blocked Day"}
                      </Badge>
                      {override.isAvailable &&
                        (override.startTime || override.endTime) && (
                          <p className="text-xs mt-1 text-gray-500">
                            {override.startTime} - {override.endTime}
                          </p>
                        )}
                      {override.reason && (
                        <p className="text-xs mt-1 text-gray-500">
                          Reason: {override.reason}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updatedOverrides = dateOverrides.filter((o) => {
                          if (!o.slotId) {
                            // For day-level overrides, filter out this one
                            const oDate = new Date(o.date);
                            return !isSameDay(oDate, overrideDate);
                          }
                          return true; // Keep all slot-level overrides
                        });
                        onDateOverridesChange(updatedOverrides);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}

              {/* Slot level overrides */}
              {slotLevelOverrides.map((override, index) => {
                // Ensure we have a proper Date object
                const overrideDate =
                  override.date instanceof Date
                    ? override.date
                    : new Date(override.date);

                return (
                  <div
                    key={`slot-${index}`}
                    className="flex justify-between items-center p-3 border rounded-md bg-orange-50"
                  >
                    <div>
                      <p className="font-medium">
                        {format(overrideDate, "MMMM d, yyyy")}
                      </p>
                      <Badge variant="destructive">
                        Blocked Slot: {override.slotId}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updatedOverrides = dateOverrides.filter(
                          (o, i) =>
                            !(
                              o.slotId === override.slotId &&
                              isSameDay(new Date(o.date), overrideDate)
                            )
                        );
                        onDateOverridesChange(updatedOverrides);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      {dateOverrides.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-medical-600 hover:bg-medical-700"
          >
            {isSaving ? (
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
  );
};

export default React.memo(DateExceptions);
