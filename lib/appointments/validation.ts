// lib/appointments/validation.ts
import { parseISO } from 'date-fns';
import { DaySchedule, BreakPeriod, WeeklySchedule } from "@/types/appointments";
import { calculateMinutesBetween, isEndTimeAfterStartTime } from "./timeUtils";

// Constants for validation
export const MIN_HOURS_PER_WEEK = 8; // Minimum total hours of availability per week
export const MIN_HOURS_PER_DAY = 2; // Minimum hours per active day

// Type for validation errors
export type ValidationError = {
  dayOfWeek?: number;
  message: string;
  type: "warning" | "error";
};

/**
 * Ensure all day schedules have a breaks array
 */
export const ensureBreaksExist = (schedule: any[]): WeeklySchedule => {
  return schedule.map((day) => ({
    ...day,
    breaks: Array.isArray(day.breaks) ? day.breaks : [],
  }));
};

/**
 * Validate a single day's breaks for overlaps
 */
export const validateBreaks = (day: DaySchedule): ValidationError[] => {
  const errors: ValidationError[] = [];
  const breaks = day.breaks || [];

  // Check each break
  breaks.forEach((breakPeriod, index) => {
    // Check if break times are valid
    if (!isEndTimeAfterStartTime(breakPeriod.startTime, breakPeriod.endTime)) {
      errors.push({
        dayOfWeek: day.dayOfWeek,
        message: `Break ${index + 1}: End time must be after start time.`,
        type: "error",
      });
    }

    // Check if break is within working hours
    if (
      !isEndTimeAfterStartTime(day.startTime, breakPeriod.startTime) ||
      !isEndTimeAfterStartTime(breakPeriod.endTime, day.endTime)
    ) {
      errors.push({
        dayOfWeek: day.dayOfWeek,
        message: `Break ${index + 1}: Must be within working hours.`,
        type: "error",
      });
    }
  });

  // Check for overlapping breaks
  for (let i = 0; i < breaks.length; i++) {
    for (let j = i + 1; j < breaks.length; j++) {
      const breakA = breaks[i];
      const breakB = breaks[j];

      // Detect duplicate breaks (same start and end time)
      if (
        breakA.startTime === breakB.startTime &&
        breakA.endTime === breakB.endTime
      ) {
        errors.push({
          dayOfWeek: day.dayOfWeek,
          message: `Breaks ${i + 1} and ${j + 1} have identical times.`,
          type: "error",
        });
      }
      // Detect overlapping breaks
      else if (
        (isEndTimeAfterStartTime(breakA.startTime, breakB.startTime) &&
          isEndTimeAfterStartTime(breakB.startTime, breakA.endTime)) ||
        (isEndTimeAfterStartTime(breakA.startTime, breakB.endTime) &&
          isEndTimeAfterStartTime(breakB.endTime, breakA.endTime)) ||
        (isEndTimeAfterStartTime(breakB.startTime, breakA.startTime) &&
          isEndTimeAfterStartTime(breakA.endTime, breakB.endTime))
      ) {
        errors.push({
          dayOfWeek: day.dayOfWeek,
          message: `Breaks ${i + 1} and ${j + 1} overlap.`,
          type: "error",
        });
      }
    }
  }

  return errors;
};

/**
 * Calculate available minutes in a day after accounting for breaks
 */
export const calculateAvailableMinutes = (day: DaySchedule): number => {
  const dayMinutes = calculateMinutesBetween(day.startTime, day.endTime);

  // Calculate total break time
  const breaks = day.breaks || [];
  const breakMinutes = breaks.reduce(
    (total: number, breakPeriod: BreakPeriod) => {
      if (
        isEndTimeAfterStartTime(breakPeriod.startTime, breakPeriod.endTime) &&
        isEndTimeAfterStartTime(day.startTime, breakPeriod.startTime) &&
        isEndTimeAfterStartTime(breakPeriod.endTime, day.endTime)
      ) {
        return (
          total +
          calculateMinutesBetween(breakPeriod.startTime, breakPeriod.endTime)
        );
      }
      return total;
    },
    0
  );

  return dayMinutes - breakMinutes;
};

/**
 * Validate the entire weekly schedule
 */
export const validateWeeklySchedule = (
  weeklySchedule: WeeklySchedule
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Calculate total available hours per week
  let totalMinutes = 0;
  let activeDays = 0;

  weeklySchedule.forEach((day) => {
    if (day.isActive) {
      activeDays++;

      // Check if end time is after start time
      if (!isEndTimeAfterStartTime(day.startTime, day.endTime)) {
        errors.push({
          dayOfWeek: day.dayOfWeek,
          message: `End time (${day.endTime}) must be after start time (${day.startTime}).`,
          type: "error",
        });
      }

      // Check if slot duration fits in the time window
      const dayMinutes = calculateMinutesBetween(day.startTime, day.endTime);
      if (dayMinutes < day.slotDuration) {
        errors.push({
          dayOfWeek: day.dayOfWeek,
          message: `Slot duration (${day.slotDuration} min) exceeds available time (${dayMinutes} min).`,
          type: "error",
        });
      }

      // Validate breaks and calculate total break time
      const breakErrors = validateBreaks(day);
      if (breakErrors.length > 0) {
        errors.push(...breakErrors);
      }

      const availableMinutes = calculateAvailableMinutes(day);
      totalMinutes += availableMinutes;

      // Check minimum hours per day
      if (availableMinutes < MIN_HOURS_PER_DAY * 60) {
        errors.push({
          dayOfWeek: day.dayOfWeek,
          message: `Has less than ${MIN_HOURS_PER_DAY} hours of availability.`,
          type: "warning",
        });
      }
    }
  });

  // Check if no days are active
  if (activeDays === 0) {
    errors.push({
      message:
        "No active days set. Please activate at least one day of the week.",
      type: "error",
    });
  }

  // Check total hours per week
  const totalHours = totalMinutes / 60;
  if (totalHours < MIN_HOURS_PER_WEEK) {
    errors.push({
      message: `Total weekly availability (${totalHours.toFixed(
        1
      )} hours) is less than the minimum requirement of ${MIN_HOURS_PER_WEEK} hours.`,
      type: "warning",
    });
  }

  return errors;
};

/**
 * Check if a new break would overlap with existing breaks
 */
export const wouldBreakOverlap = (
  newBreak: { startTime: string; endTime: string },
  existingBreaks: BreakPeriod[]
): boolean => {
  return existingBreaks.some((existingBreak) => {
    // Check for identical times
    if (
      existingBreak.startTime === newBreak.startTime &&
      existingBreak.endTime === newBreak.endTime
    ) {
      return true;
    }

    // Check for overlaps
    return (
      (isEndTimeAfterStartTime(existingBreak.startTime, newBreak.startTime) &&
        isEndTimeAfterStartTime(newBreak.startTime, existingBreak.endTime)) ||
      (isEndTimeAfterStartTime(existingBreak.startTime, newBreak.endTime) &&
        isEndTimeAfterStartTime(newBreak.endTime, existingBreak.endTime)) ||
      (isEndTimeAfterStartTime(newBreak.startTime, existingBreak.startTime) &&
        isEndTimeAfterStartTime(existingBreak.endTime, newBreak.endTime))
    );
  });
};

/**
 * Find a non-overlapping time slot for a break
 */
export const findNonOverlappingBreakSlot = (
  day: DaySchedule
): { startTime: string; endTime: string } | null => {
  const dayStartMinutes =
    parseISO(`2000-01-01T${day.startTime}`).getHours() * 60 +
    parseISO(`2000-01-01T${day.startTime}`).getMinutes();
  const dayEndMinutes =
    parseISO(`2000-01-01T${day.endTime}`).getHours() * 60 +
    parseISO(`2000-01-01T${day.endTime}`).getMinutes();

  // Try to find a 1-hour slot
  const slotDuration = 60; // 1 hour

  // Create a list of all break periods in minutes
  const breakPeriods = day.breaks.map((break_) => {
    const startMinutes =
      parseISO(`2000-01-01T${break_.startTime}`).getHours() * 60 +
      parseISO(`2000-01-01T${break_.startTime}`).getMinutes();
    const endMinutes =
      parseISO(`2000-01-01T${break_.endTime}`).getHours() * 60 +
      parseISO(`2000-01-01T${break_.endTime}`).getMinutes();
    return { start: startMinutes, end: endMinutes };
  });

  // Try different start times
  for (
    let startMinute = dayStartMinutes;
    startMinute <= dayEndMinutes - slotDuration;
    startMinute += 30
  ) {
    const endMinute = startMinute + slotDuration;

    // Check if this slot overlaps with any existing break
    const overlaps = breakPeriods.some(
      (period) =>
        (startMinute >= period.start && startMinute < period.end) ||
        (endMinute > period.start && endMinute <= period.end) ||
        (startMinute <= period.start && endMinute >= period.end)
    );

    if (!overlaps) {
      // Found a non-overlapping slot
      const startHour = Math.floor(startMinute / 60);
      const startMin = startMinute % 60;
      const endHour = Math.floor(endMinute / 60);
      const endMin = endMinute % 60;

      return {
        startTime: `${startHour.toString().padStart(2, "0")}:${startMin
          .toString()
          .padStart(2, "0")}`,
        endTime: `${endHour.toString().padStart(2, "0")}:${endMin
          .toString()
          .padStart(2, "0")}`,
      };
    }
  }

  // If we couldn't find a 1-hour slot, try a 30-minute slot
  if (slotDuration === 60) {
    const halfSlotDuration = 30;

    for (
      let startMinute = dayStartMinutes;
      startMinute <= dayEndMinutes - halfSlotDuration;
      startMinute += 30
    ) {
      const endMinute = startMinute + halfSlotDuration;

      const overlaps = breakPeriods.some(
        (period) =>
          (startMinute >= period.start && startMinute < period.end) ||
          (endMinute > period.start && endMinute <= period.end) ||
          (startMinute <= period.start && endMinute >= period.end)
      );

      if (!overlaps) {
        const startHour = Math.floor(startMinute / 60);
        const startMin = startMinute % 60;
        const endHour = Math.floor(endMinute / 60);
        const endMin = endMinute % 60;

        return {
          startTime: `${startHour.toString().padStart(2, "0")}:${startMin
            .toString()
            .padStart(2, "0")}`,
          endTime: `${endHour.toString().padStart(2, "0")}:${endMin
            .toString()
            .padStart(2, "0")}`,
        };
      }
    }
  }

  // Couldn't find any non-overlapping slot
  return null;
};
