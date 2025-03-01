// components/appointments/settings/DaySchedule.tsx
import React, { useCallback, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BreakPeriod,
  DaySchedule as DayScheduleType,
  TimeOption,
} from "@/types/appointments";
import {
  calculateAvailableMinutes,
  ValidationError,
} from "@/lib/appointments/validation";
import {
  generateTimeOptions,
  slotDurationOptions,
  formatMinutesAsHoursAndMinutes,
} from "@/lib/appointments/timeUtils";
import BreakManager from "./BreakManager";

interface DayScheduleProps {
  day: DayScheduleType;
  index: number;
  dayName: string;
  errors: ValidationError[];
  onScheduleChange: (
    index: number,
    field: string,
    value: string | number | boolean | undefined
  ) => void;
  onBreakAdded: (dayIndex: number, breakPeriod: BreakPeriod) => void;
  onBreakRemoved: (dayIndex: number, breakId: string) => void;
  onBreakUpdated: (
    dayIndex: number,
    breakId: string,
    field: "startTime" | "endTime",
    value: string
  ) => void;
}

const DaySchedule: React.FC<DayScheduleProps> = ({
  day,
  index,
  dayName,
  errors,
  onScheduleChange,
  onBreakAdded,
  onBreakRemoved,
  onBreakUpdated,
}) => {
  const timeOptions = useMemo<TimeOption[]>(() => generateTimeOptions(), []);

  // Errors specific to this day
  const dayErrors = useMemo(
    () => errors.filter((error) => error.dayOfWeek === day.dayOfWeek),
    [errors, day.dayOfWeek]
  );

  // Handle change for any field in the day schedule
  const handleChange = useCallback(
    (field: string, value: string | number | boolean | undefined) => {
      onScheduleChange(index, field, value);
    },
    [index, onScheduleChange]
  );

  // Calculate availability statistics
  const availabilityStats = useMemo(() => {
    if (!day.isActive) return null;

    const availableMinutes = calculateAvailableMinutes(day);
    const hours = Math.floor(availableMinutes / 60);
    const minutes = availableMinutes % 60;
    const slots = Math.floor(availableMinutes / day.slotDuration);

    return {
      availableMinutes,
      hours,
      minutes,
      slots,
    };
  }, [day]); // Ensure this recalculates whenever day changes, including breaks

  // Determine if this day has any validation errors
  const hasErrors = useMemo(
    () => dayErrors.some((error) => error.type === "error"),
    [dayErrors]
  );

  // Determine if this day has any validation warnings
  const hasWarnings = useMemo(
    () => dayErrors.some((error) => error.type === "warning"),
    [dayErrors]
  );

  // Determine the border color based on errors/warnings
  const borderClass = useMemo(() => {
    if (hasErrors) return "border-red-300 bg-red-50";
    if (hasWarnings) return "border-amber-300 bg-amber-50";
    return "border-medical-100";
  }, [hasErrors, hasWarnings]);

  return (
    <div className={`p-4 border rounded-md ${borderClass}`}>
      <div className="flex items-center mb-4">
        <Checkbox
          id={`day-${index}`}
          checked={day.isActive}
          onCheckedChange={(checked) => handleChange("isActive", checked)}
        />
        <label
          htmlFor={`day-${index}`}
          className="ml-2 text-sm font-medium text-medical-900"
        >
          {dayName}
        </label>
      </div>

      {dayErrors.length > 0 && (
        <div className="mb-4">
          <ul className="list-disc pl-5 text-sm">
            {dayErrors.map((error, errorIndex) => (
              <li
                key={errorIndex}
                className={
                  error.type === "error" ? "text-red-600" : "text-amber-600"
                }
              >
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {day.isActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-medical-500 mb-1 block">
              Start Time
            </label>
            <Select
              value={day.startTime}
              onValueChange={(value) => handleChange("startTime", value)}
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
              value={day.endTime}
              onValueChange={(value) => handleChange("endTime", value)}
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

          <div>
            <label className="text-xs text-medical-500 mb-1 block">
              Appointment Duration
            </label>
            <Select
              value={day.slotDuration.toString()}
              onValueChange={(value) =>
                handleChange("slotDuration", parseInt(value))
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

          {/* Break Manager component for this day */}
          <BreakManager
            day={day}
            dayIndex={index}
            onBreakAdded={onBreakAdded}
            onBreakRemoved={onBreakRemoved}
            onBreakUpdated={onBreakUpdated}
          />
        </div>
      )}

      {/* Show availability calculations for the day */}
      {day.isActive && availabilityStats && (
        <div className="mt-4 text-sm text-medical-600">
          <div className="flex justify-between">
            <span>
              Total availability:{" "}
              {formatMinutesAsHoursAndMinutes(
                availabilityStats.availableMinutes
              )}
            </span>
            <span>Available slots: {availabilityStats.slots}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(DaySchedule);
