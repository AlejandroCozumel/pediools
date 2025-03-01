import React, { useState, useCallback, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DateOverride } from "@/types/appointments";
import { DayModifiers } from "react-day-picker";
import {
  generateTimeOptions,
  isEndTimeAfterStartTime,
} from "@/lib/appointments/timeUtils";

interface DateExceptionsProps {
  weeklySchedule: any[]; // Replace with actual type
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

  // Toggle day availability
  const toggleDayAvailability = useCallback(
    (date: Date) => {
      const existingDayOverrideIndex = dateOverrides.findIndex(
        (override) =>
          override.date.toDateString() === date.toDateString() &&
          override.type === "day"
      );

      if (existingDayOverrideIndex !== -1) {
        // Remove existing day override
        const updatedOverrides = [...dateOverrides];
        updatedOverrides.splice(existingDayOverrideIndex, 1);
        onDateOverridesChange(updatedOverrides);
      } else {
        // Add new day override
        onDateOverridesChange([
          ...dateOverrides,
          {
            date,
            type: "day",
            status: "blocked",
          },
        ]);
      }
    },
    [dateOverrides, onDateOverridesChange]
  );

  // Toggle slot availability
  const toggleSlotAvailability = useCallback(
    (date: Date, slotId: string) => {
      const existingOverrideIndex = dateOverrides.findIndex(
        (override) =>
          override.date.toDateString() === date.toDateString() &&
          override.type === "slot" &&
          override.slotId === slotId
      );

      if (existingOverrideIndex !== -1) {
        // Remove existing override
        const updatedOverrides = [...dateOverrides];
        updatedOverrides.splice(existingOverrideIndex, 1);
        onDateOverridesChange(updatedOverrides);
      } else {
        // Add new slot override
        onDateOverridesChange([
          ...dateOverrides,
          {
            date,
            type: "slot",
            status: "blocked",
            slotId,
          },
        ]);
      }
    },
    [dateOverrides, onDateOverridesChange]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      await onSave();
      toast({
        title: "Exceptions Saved",
        description: "Your date exceptions have been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save date exceptions.",
      });
    }
  }, [onSave, toast]);

  // Generate slots for a specific date based on weekly schedule
  const generateDateSlots = useCallback(
    (date: Date) => {
      const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
      const daySchedule = weeklySchedule[dayOfWeek];

      if (!daySchedule || !daySchedule.isActive) return [];

      const slots: Array<{
        id: string;
        startTime: string;
        endTime: string;
        available: boolean;
      }> = [];

      const startTime = parseISO(`2000-01-01T${daySchedule.startTime}`);
      const endTime = parseISO(`2000-01-01T${daySchedule.endTime}`);
      const slotDuration = daySchedule.slotDuration || 30;

      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);

        if (slotEnd > endTime) break;

        const slotId = `${format(currentTime, "HH:mm")}-${format(
          slotEnd,
          "HH:mm"
        )}`;

        // Check if this slot is blocked by any existing override
        const isBlocked = dateOverrides.some(
          (override) =>
            override.date.toDateString() === date.toDateString() &&
            override.type === "slot" &&
            override.status === "blocked" &&
            override.slotId === slotId
        );

        slots.push({
          id: slotId,
          startTime: format(currentTime, "HH:mm"),
          endTime: format(slotEnd, "HH:mm"),
          available: !isBlocked,
        });

        currentTime = slotEnd;
      }

      return slots;
    },
    [weeklySchedule, dateOverrides]
  );

  // Custom day modifier to show availability indicators
  const getDayModifiers = useCallback(
    (date: Date): DayModifiers => {
      const dayOfWeek = date.getDay();
      const daySchedule = weeklySchedule[dayOfWeek];

      // Create an object to store modifiers
      const modifiers: DayModifiers = {};

      // Check if day is completely blocked
      const isDayBlocked = dateOverrides.some(
        (override) =>
          override.date.toDateString() === date.toDateString() &&
          override.type === "day" &&
          override.status === "blocked"
      );

      // If day is blocked
      if (isDayBlocked) {
        modifiers.disabled = true;
        modifiers.blocked = true;
        return modifiers;
      }

      // If no active schedule for this day
      if (!daySchedule || !daySchedule.isActive) {
        modifiers.disabled = true;
        modifiers.unavailable = true;
        return modifiers;
      }

      // Generate slots for this day
      const slots = generateDateSlots(date);

      // If no slots available
      if (slots.length === 0) {
        modifiers.disabled = true;
        modifiers.unavailable = true;
        return modifiers;
      }

      // Check if all slots are blocked
      const allSlotsBlocked = slots.every((slot) =>
        dateOverrides.some(
          (override) =>
            override.date.toDateString() === date.toDateString() &&
            override.type === "slot" &&
            override.slotId === slot.id &&
            override.status === "blocked"
        )
      );

      // If all slots are blocked
      if (allSlotsBlocked) {
        modifiers.disabled = true;
        modifiers.blocked = true;
        return modifiers;
      }

      // If some slots are available
      modifiers.hasSlots = true;
      return modifiers;
    },
    [weeklySchedule, dateOverrides, generateDateSlots]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-medical-600">
        Manage your availability by blocking specific dates or individual time
        slots.
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
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) =>
                date < new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
          </CardContent>
        </Card>

        {/* Slots and Exceptions Management */}
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
                const slots = generateDateSlots(selectedDate);

                // Check if day is completely blocked
                const isDayBlocked = dateOverrides.some(
                  (override) =>
                    override.date.toDateString() ===
                      selectedDate.toDateString() &&
                    override.type === "day" &&
                    override.status === "blocked"
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

                // If day is blocked
                if (isDayBlocked) {
                  return (
                    <div className="text-center text-red-500 space-y-2">
                      <XCircle className="mx-auto h-12 w-12 text-red-300" />
                      <p>Day is completely blocked</p>
                      <p className="text-xs">No appointments are available</p>
                    </div>
                  );
                }

                // If no slots available
                if (slots.length === 0) {
                  return (
                    <div className="text-center text-medical-500 space-y-2">
                      <XCircle className="mx-auto h-12 w-12 text-medical-300" />
                      <p>No available time slots</p>
                      <p className="text-xs">Check your scheduling settings</p>
                    </div>
                  );
                }

                // Render slots
                return (
                  <div className="space-y-4">
                    {/* Day-level Toggle */}
                    <div>
                      <Button
                        variant="destructive"
                        onClick={() => toggleDayAvailability(selectedDate)}
                        className="w-full"
                      >
                        Block Entire Day
                      </Button>
                    </div>

                    {/* Slot Management */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Time Slots</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant={slot.available ? "outline" : "destructive"}
                            size="sm"
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

      {/* Existing Exceptions */}
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
              {dateOverrides.map((override, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 border rounded-md"
                >
                  <div>
                    <p className="font-medium">
                      {format(override.date, "MMMM d, yyyy")}
                    </p>
                    <Badge
                      variant={
                        override.status === "blocked"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {override.type === "day"
                        ? override.status === "blocked"
                          ? "Entire Day Blocked"
                          : "Entire Day Available"
                        : `Slot ${override.slotId} ${
                            override.status === "blocked"
                              ? "Blocked"
                              : "Available"
                          }`}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updatedOverrides = dateOverrides.filter(
                        (_, i) => i !== index
                      );
                      onDateOverridesChange(updatedOverrides);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
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
