// components/appointments/settings/BreakManager.tsx
import React, { useMemo, useCallback } from 'react';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DaySchedule, BreakPeriod, TimeOption } from '@/types/appointments';
import {
  isEndTimeAfterStartTime,
  generateTimeOptions
} from '@/lib/appointments/timeUtils';
import {
  findNonOverlappingBreakSlot,
  wouldBreakOverlap
} from '@/lib/appointments/validation';

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

  // Add a break period
  const addBreakPeriod = useCallback(() => {
    if (!day.isActive) return;

    // Try to use noon (12-1pm) as default if available
    const defaultBreak = {
      startTime: "12:00",
      endTime: "13:00"
    };

    // Check if the default break would overlap
    const hasConflict = wouldBreakOverlap(defaultBreak, day.breaks);

    if (
      !hasConflict &&
      isEndTimeAfterStartTime(day.startTime, defaultBreak.startTime) &&
      isEndTimeAfterStartTime(defaultBreak.endTime, day.endTime)
    ) {
      // Default noon break works
      onBreakAdded(dayIndex, {
        id: crypto.randomUUID(),
        ...defaultBreak
      });
    } else {
      // Find a non-overlapping slot
      const nonOverlappingSlot = findNonOverlappingBreakSlot(day);

      if (nonOverlappingSlot) {
        onBreakAdded(dayIndex, {
          id: crypto.randomUUID(),
          ...nonOverlappingSlot
        });
      } else {
        // If no slot found, notify the user
        toast({
          variant: "destructive",
          title: "Cannot Add Break",
          description: "No available time slot for a break. Please adjust existing breaks.",
        });
      }
    }
  }, [day, dayIndex, onBreakAdded, toast]);

  return (
    <div className="col-span-1 md:col-span-3 mt-4 border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-medical-700">
          Unavailable Time Periods
        </label>
        <Button
          size="sm"
          variant="outline"
          onClick={addBreakPeriod}
        >
          Add Break
        </Button>
      </div>

      {day.breaks.length === 0 ? (
        <p className="text-sm text-medical-500 italic">
          No breaks added. You are available all day.
        </p>
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
const BreakItem = React.memo(({
  breakPeriod,
  day,
  dayIndex,
  timeOptions,
  onBreakUpdated,
  onBreakRemoved
}: BreakItemProps) => {
  const { toast } = useToast();

  const handleTimeChange = useCallback((
    field: "startTime" | "endTime",
    value: string
  ) => {
    // Basic validation to prevent duplicate errors in parent component
    if (field === "startTime" && !isEndTimeAfterStartTime(value, breakPeriod.endTime)) {
      toast({
        variant: "destructive",
        title: "Invalid Break Time",
        description: "Start time must be before end time.",
      });
      return;
    }

    if (field === "endTime" && !isEndTimeAfterStartTime(breakPeriod.startTime, value)) {
      toast({
        variant: "destructive",
        title: "Invalid Break Time",
        description: "End time must be after start time.",
      });
      return;
    }

    onBreakUpdated(dayIndex, breakPeriod.id, field, value);
  }, [breakPeriod, dayIndex, onBreakUpdated, toast]);

  return (
    <div className="flex items-end space-x-2 p-3 bg-gray-50 rounded-md">
      <div className="flex-1">
        <label className="text-xs text-medical-500 mb-1 block">
          Start Time
        </label>
        <Select
          value={breakPeriod.startTime}
          onValueChange={(value) => handleTimeChange("startTime", value)}
        >
          <SelectTrigger className="border-medical-200">
            <SelectValue placeholder="Break start" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions
              .filter(
                (option) =>
                  isEndTimeAfterStartTime(day.startTime, option.value) &&
                  isEndTimeAfterStartTime(option.value, day.endTime) &&
                  (!breakPeriod.endTime ||
                    isEndTimeAfterStartTime(option.value, breakPeriod.endTime))
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
          value={breakPeriod.endTime}
          onValueChange={(value) => handleTimeChange("endTime", value)}
        >
          <SelectTrigger className="border-medical-200">
            <SelectValue placeholder="Break end" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions
              .filter(
                (option) =>
                  breakPeriod.startTime &&
                  isEndTimeAfterStartTime(breakPeriod.startTime, option.value) &&
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
        title="Remove break"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
});

BreakItem.displayName = 'BreakItem';

export default React.memo(BreakManager);