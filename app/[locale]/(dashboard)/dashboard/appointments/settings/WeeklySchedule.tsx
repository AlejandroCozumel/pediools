// components/appointments/settings/WeeklySchedule.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BreakPeriod,
  DaySchedule,
  WeeklySchedule as WeeklyScheduleType,
} from "@/types/appointments";
import {
  validateWeeklySchedule,
  ensureBreaksExist,
  ValidationError,
} from "@/lib/appointments/validation";
import { slotDurationOptions } from "@/lib/appointments/timeUtils";
import DayScheduleComponent from "./DaySchedule";

interface WeeklyScheduleProps {
  weeklySchedule: WeeklyScheduleType;
  daysOfOperation: number[];
  defaultStartTime: string;
  defaultEndTime: string;
  onWeeklyScheduleChange: (schedule: WeeklyScheduleType) => void;
  onDaysOfOperationChange: (days: number[]) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

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

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  weeklySchedule,
  daysOfOperation,
  defaultStartTime,
  defaultEndTime,
  onWeeklyScheduleChange,
  onDaysOfOperationChange,
  onSave,
  isSaving,
}) => {
  const { toast } = useToast();
  const [defaultSlotDuration, setDefaultSlotDuration] = useState(30);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const t = useTranslations("Appointments.settings.weekly");

  // Filter only errors to display at the top
  const criticalErrors = useMemo(
    () =>
      validationErrors.filter(
        (error) => error.type === "error" && !error.dayOfWeek
      ),
    [validationErrors]
  );

  // Filter only warnings to display at the top
  const generalWarnings = useMemo(
    () =>
      validationErrors.filter(
        (error) => error.type === "warning" && !error.dayOfWeek
      ),
    [validationErrors]
  );

  // Run validation whenever the schedule changes
  useEffect(() => {
    const errors = validateWeeklySchedule(weeklySchedule);
    setValidationErrors(errors);
  }, [weeklySchedule]);

  // Handle changes to an individual day's schedule
  const handleScheduleChange = useCallback(
    (
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

      // Special handling for deactivating a day
      if (field === "isActive" && !value) {
        // If a day is deactivated, remove it from daysOfOperation
        onDaysOfOperationChange(daysOfOperation.filter((day) => day !== index));
      } else if (field === "isActive" && value) {
        // If a day is activated, add it to daysOfOperation
        onDaysOfOperationChange(
          daysOfOperation.includes(index)
            ? daysOfOperation
            : [...daysOfOperation, index].sort()
        );
      }

      onWeeklyScheduleChange(updatedSchedule);
    },
    [
      weeklySchedule,
      daysOfOperation,
      onWeeklyScheduleChange,
      onDaysOfOperationChange,
    ]
  );

  // Handle adding a break to a day
  const handleBreakAdded = useCallback(
    (dayIndex: number, breakPeriod: BreakPeriod) => {
      // Create a completely new copy of the weeklySchedule
      const updatedSchedule = [...weeklySchedule];

      // Create a new day object with the break added to a new breaks array
      updatedSchedule[dayIndex] = {
        ...updatedSchedule[dayIndex],
        breaks: [...updatedSchedule[dayIndex].breaks, breakPeriod],
      };

      // Update state with the new schedule
      onWeeklyScheduleChange(updatedSchedule);
    },
    [weeklySchedule, onWeeklyScheduleChange]
  );

  // Handle removing a break from a day
  const handleBreakRemoved = useCallback(
    (dayIndex: number, breakId: string) => {
      const updatedSchedule = [...weeklySchedule];
      updatedSchedule[dayIndex] = {
        ...updatedSchedule[dayIndex],
        breaks: updatedSchedule[dayIndex].breaks.filter(
          (breakPeriod) => breakPeriod.id !== breakId
        ),
      };
      onWeeklyScheduleChange(updatedSchedule);
    },
    [weeklySchedule, onWeeklyScheduleChange]
  );

  // Handle updating a break in a day
  const handleBreakUpdated = useCallback(
    (
      dayIndex: number,
      breakId: string,
      field: "startTime" | "endTime",
      value: string
    ) => {
      const updatedSchedule = [...weeklySchedule];
      const breakIndex = updatedSchedule[dayIndex].breaks.findIndex(
        (breakPeriod) => breakPeriod.id === breakId
      );

      if (breakIndex === -1) return;

      const updatedBreaks = [...updatedSchedule[dayIndex].breaks];
      updatedBreaks[breakIndex] = {
        ...updatedBreaks[breakIndex],
        [field]: value,
      };

      updatedSchedule[dayIndex] = {
        ...updatedSchedule[dayIndex],
        breaks: updatedBreaks,
      };

      onWeeklyScheduleChange(updatedSchedule);
    },
    [weeklySchedule, onWeeklyScheduleChange]
  );

  // Update default slot duration for all active days
  const handleDefaultSlotDurationChange = useCallback(
    (value: string) => {
      const parsedValue = parseInt(value);
      setDefaultSlotDuration(parsedValue);

      // Update all active days with this slot duration
      const updatedSchedule = weeklySchedule.map((day) => ({
        ...day,
        slotDuration: day.isActive ? parsedValue : day.slotDuration,
      }));

      onWeeklyScheduleChange(updatedSchedule);
    },
    [weeklySchedule, onWeeklyScheduleChange]
  );

  // Handle saving the weekly schedule
  const handleSave = useCallback(async () => {
    try {
      // Ensure all days have a breaks array before saving
      const validSchedule = ensureBreaksExist(weeklySchedule);
      onWeeklyScheduleChange(validSchedule);

      // Perform validation
      if (criticalErrors.length > 0) {
        toast({
          variant: "destructive",
          title: t("alerts.validationErrors.cannotSave"),
          description: t("alerts.validationErrors.fixErrorsBeforeSaving"),
        });
        return;
      }
      if (generalWarnings.length > 0) {
        const proceed = window.confirm(t("alerts.warnings.confirmProceed"));
        if (!proceed) return;
      }
      await onSave();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: t("errors.failedToSave"),
      });
    }
  }, [
    weeklySchedule,
    onWeeklyScheduleChange,
    onSave,
    criticalErrors,
    generalWarnings,
    toast,
  ]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-medical-600">{t("description")}</p>

      {/* Critical Errors */}
      {criticalErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("validationErrors")}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2">
              {criticalErrors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {generalWarnings.length > 0 && (
        <Alert variant="default" className="bg-amber-50 border-amber-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("availabilityWarnings")}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2">
              {generalWarnings.map((warning, index) => (
                <li key={index} className="text-sm">
                  {warning.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Default slot duration selector */}
      <div className="max-w-xs">
        <label className="text-sm font-medium text-medical-700 mb-1 block">
        {t("defaultAppointmentDuration")}
        </label>
        <Select
          value={defaultSlotDuration.toString()}
          onValueChange={handleDefaultSlotDurationChange}
        >
          <SelectTrigger className="border-medical-200">
            <SelectValue>
              {
                slotDurationOptions.find(
                  (option) => option.value === defaultSlotDuration
                )?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {slotDurationOptions.map((option) => (
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
          <DayScheduleComponent
            key={index}
            day={day}
            index={index}
            dayName={DAYS_OF_WEEK[day.dayOfWeek]}
            errors={validationErrors.filter(
              (error) => error.dayOfWeek === day.dayOfWeek
            )}
            onScheduleChange={handleScheduleChange}
            onBreakAdded={handleBreakAdded}
            onBreakRemoved={handleBreakRemoved}
            onBreakUpdated={handleBreakUpdated}
          />
        ))}
      </div>

      <div className="pt-4 flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-medical-600 hover:bg-medical-700"
          disabled={isSaving || criticalErrors.length > 0}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            t("saveWeeklySchedule")
          )}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(WeeklySchedule);
