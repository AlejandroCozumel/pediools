// components/appointments/settings/BreakManager.tsx
import React, { useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Trash } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DaySchedule, BreakPeriod, TimeOption } from "@/types/appointments";
import {
  isEndTimeAfterStartTime,
  generateTimeOptions,
} from "@/lib/appointments/timeUtils";
import { wouldBreakOverlap } from "@/lib/appointments/validation";

interface BreakManagerProps {
  day: DaySchedule;
  dayIndex: number;
  onBreakAdded: (dayIndex: number, breakPeriod: BreakPeriod) => void;
  onBreakRemoved: (dayIndex: number, breakId: string) => void;
  onBreakUpdated: (
    dayIndex: number,
    breakId: string,
    field: "startTime" | "endTime",
    value: string
  ) => void;
}

const BreakManager: React.FC<BreakManagerProps> = ({
  day,
  dayIndex,
  onBreakAdded,
  onBreakRemoved,
  onBreakUpdated,
}) => {
  const { toast } = useToast();
  const timeOptions = useMemo(() => generateTimeOptions(), []);
  const t = useTranslations("Appointments.settings.weekly.breakManager");

  // Add a break period sequentially
  const addBreakPeriod = useCallback(() => {
    if (!day.isActive) return;

    // Get all 30-minute increments within the day's working hours
    const availableTimeSlots: { startTime: string; endTime: string }[] = [];
    const duration = 60; // 1-hour break duration

    // Parse start and end times
    const startDate = parseISO(`2000-01-01T${day.startTime}`);
    const endDate = parseISO(`2000-01-01T${day.endTime}`);

    // Generate all possible 30-minute increment start times
    for (
      let currentTime = new Date(startDate);
      currentTime < new Date(endDate.getTime() - duration * 60 * 1000);
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000)
    ) {
      const slotStart = format(currentTime, "HH:mm");
      const slotEnd = format(
        new Date(currentTime.getTime() + duration * 60 * 1000),
        "HH:mm"
      );

      availableTimeSlots.push({
        startTime: slotStart,
        endTime: slotEnd,
      });
    }

    // Filter out time slots that overlap with existing breaks
    const nonOverlappingSlots = availableTimeSlots.filter(
      (slot) => !wouldBreakOverlap(slot, day.breaks)
    );

    // Sort slots by start time
    nonOverlappingSlots.sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });

    if (nonOverlappingSlots.length > 0) {
      // Take the first available slot (earliest in the day)
      const newBreak = nonOverlappingSlots[0];

      onBreakAdded(dayIndex, {
        id: crypto.randomUUID(),
        startTime: newBreak.startTime,
        endTime: newBreak.endTime,
      });
    } else {
      // If no slot found, notify the user
      toast({
        variant: "destructive",
        title: t("cannotAddBreak.title"),
        description: t("cannotAddBreak.description"),
      });
    }
  }, [day, dayIndex, onBreakAdded, toast]);

  return (
    <div className="col-span-1 md:col-span-3 mt-4 border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-medical-700">
          {t("unavailableTimePeriods")}
        </label>
        <Button size="sm" variant="outline" onClick={addBreakPeriod}>
          {t("addBreak")}
        </Button>
      </div>

      {day.breaks.length === 0 ? (
        <p className="text-sm text-medical-500 italic">{t("noBreaksAdded")}</p>
      ) : (
        <div className="space-y-3">
          {day.breaks.map((breakPeriod: BreakPeriod) => (
            <BreakItem
              key={breakPeriod.id}
              breakPeriod={breakPeriod}
              day={day}
              dayIndex={dayIndex}
              timeOptions={timeOptions}
              onBreakUpdated={onBreakUpdated}
              onBreakRemoved={onBreakRemoved}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface BreakItemProps {
  breakPeriod: BreakPeriod;
  day: DaySchedule;
  dayIndex: number;
  timeOptions: TimeOption[];
  onBreakUpdated: (
    dayIndex: number,
    breakId: string,
    field: "startTime" | "endTime",
    value: string
  ) => void;
  onBreakRemoved: (dayIndex: number, breakId: string) => void;
}

// Separate component for each break item, to prevent unnecessary rerenders
const BreakItem = React.memo(
  ({
    breakPeriod,
    day,
    dayIndex,
    timeOptions,
    onBreakUpdated,
    onBreakRemoved,
  }: BreakItemProps) => {
    const { toast } = useToast();
    const t = useTranslations("Appointments.settings.weekly.breakManager");

    const handleTimeChange = useCallback(
      (field: "startTime" | "endTime", value: string) => {
        // Basic validation to prevent duplicate errors in parent component
        if (
          field === "startTime" &&
          !isEndTimeAfterStartTime(value, breakPeriod.endTime)
        ) {
          toast({
            variant: "destructive",
            title: t("breakItem.invalidBreakTime.title"),
            description:
              field === "startTime"
                ? t("breakItem.invalidBreakTime.startBeforeEnd")
                : t("breakItem.invalidBreakTime.endAfterStart"),
          });
          return;
        }

        if (
          field === "endTime" &&
          !isEndTimeAfterStartTime(breakPeriod.startTime, value)
        ) {
          toast({
            variant: "destructive",
            title: "Invalid Break Time",
            description: "End time must be after start time.",
          });
          return;
        }

        onBreakUpdated(dayIndex, breakPeriod.id, field, value);
      },
      [breakPeriod, dayIndex, onBreakUpdated, toast]
    );

    return (
      <div className="flex items-end space-x-2 p-3 bg-gray-50 rounded-md">
        <div className="flex-1">
          <label className="text-xs text-medical-500 mb-1 block">
            {t("breakItem.startTime")}
          </label>
          <Select
            value={breakPeriod.startTime || day.startTime} // Ensure we always have a value
            onValueChange={(value) => handleTimeChange("startTime", value)}
          >
            <SelectTrigger className="border-medical-200">
              <SelectValue>
                {timeOptions.find(
                  (option) => option.value === breakPeriod.startTime
                )?.label || "Select time"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {timeOptions
                .filter(
                  (option) =>
                    isEndTimeAfterStartTime(day.startTime, option.value) &&
                    isEndTimeAfterStartTime(option.value, day.endTime) &&
                    (!breakPeriod.endTime ||
                      isEndTimeAfterStartTime(
                        option.value,
                        breakPeriod.endTime
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
            {t("breakItem.endTime")}
          </label>
          <Select
            value={
              breakPeriod.endTime ||
              (breakPeriod.startTime
                ? format(
                    parseISO(`2000-01-01T${breakPeriod.startTime}`).getTime() +
                      60 * 60 * 1000,
                    "HH:mm"
                  )
                : day.endTime)
            }
            onValueChange={(value) => handleTimeChange("endTime", value)}
          >
            <SelectTrigger className="border-medical-200">
              <SelectValue>
                {timeOptions.find(
                  (option) => option.value === breakPeriod.endTime
                )?.label || "Select time"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {timeOptions
                .filter(
                  (option) =>
                    breakPeriod.startTime &&
                    isEndTimeAfterStartTime(
                      breakPeriod.startTime,
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
          onClick={() => onBreakRemoved(dayIndex, breakPeriod.id)}
          title={t("breakItem.removeBreak")}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);

BreakItem.displayName = "BreakItem";

export default React.memo(BreakManager);
