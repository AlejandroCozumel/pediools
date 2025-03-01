// components/appointments/settings/DateExceptions.tsx
import React, { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DateOverride } from "@/types/appointments";
import {
  generateTimeOptions,
  isEndTimeAfterStartTime,
} from "@/lib/appointments/timeUtils";

interface DateExceptionsProps {
  dateOverrides: DateOverride[];
  onDateOverridesChange: (overrides: DateOverride[]) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const DateExceptions: React.FC<DateExceptionsProps> = ({
  dateOverrides,
  onDateOverridesChange,
  onSave,
  isSaving,
}) => {
  const { toast } = useToast();
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  // State for new exception form
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDateAvailable, setIsDateAvailable] = useState(true);
  const [exceptionStartTime, setExceptionStartTime] = useState("09:00");
  const [exceptionEndTime, setExceptionEndTime] = useState("17:00");

  // Add a new date exception
  const handleAddDateException = useCallback(() => {
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
      onDateOverridesChange(updatedOverrides);
    } else {
      // Add new override
      onDateOverridesChange([
        ...dateOverrides,
        {
          date: selectedDate,
          isAvailable: isDateAvailable,
          startTime: isDateAvailable ? exceptionStartTime : undefined,
          endTime: isDateAvailable ? exceptionEndTime : undefined,
        },
      ]);
    }

    // Reset form
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
  }, [
    selectedDate,
    isDateAvailable,
    exceptionStartTime,
    exceptionEndTime,
    dateOverrides,
    onDateOverridesChange,
    toast,
  ]);

  // Remove a date exception
  const handleRemoveDateException = useCallback(
    (index: number) => {
      const updatedOverrides = [...dateOverrides];
      updatedOverrides.splice(index, 1);
      onDateOverridesChange(updatedOverrides);
    },
    [dateOverrides, onDateOverridesChange]
  );

  // Save all date exceptions
  const handleSave = useCallback(async () => {
    try {
      await onSave();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save date exceptions.",
      });
    }
  }, [onSave, toast]);

  // Sort date overrides by date
  const sortedDateOverrides = useMemo(
    () =>
      [...dateOverrides].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [dateOverrides]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-medical-600">
        Add exceptions to your regular schedule for specific dates, such as
        holidays or special events.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exception creation form */}
        <div className="space-y-4">
          <div className="p-4 border rounded-md border-medical-100">
            <h3 className="text-sm font-medium mb-4">Add Date Exception</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-medical-500 mb-1 block">
                  Select Date
                </label>
                <div className="border rounded-md border-medical-200">
                  <Calendar
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
                  onCheckedChange={(checked) => setIsDateAvailable(!!checked)}
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
                        {timeOptions.map((option) => (
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

        {/* Exceptions list */}
        <div>
          <h3 className="text-sm font-medium mb-4">Date Exceptions</h3>

          {sortedDateOverrides.length > 0 ? (
            <div className="space-y-3">
              {sortedDateOverrides.map((override, index) => (
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

          {sortedDateOverrides.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSave}
                className="bg-medical-600 hover:bg-medical-700"
                disabled={isSaving}
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
      </div>
    </div>
  );
};

export default React.memo(DateExceptions);
