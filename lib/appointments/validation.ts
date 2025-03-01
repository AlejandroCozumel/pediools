// lib/appointments/validation.ts
import { parseISO } from "date-fns";
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

    // Check if break is within working hours - allow break to start exactly at day start time
    const startTimeValid =
      breakPeriod.startTime >= day.startTime &&
      isEndTimeAfterStartTime(day.startTime, breakPeriod.endTime);
    const endTimeValid =
      isEndTimeAfterStartTime(breakPeriod.startTime, day.endTime) &&
      breakPeriod.endTime <= day.endTime;

    if (!startTimeValid || !endTimeValid) {
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
  let breakMinutes = 0;

  breaks.forEach((breakPeriod: BreakPeriod) => {
    // For debugging, let's log each condition separately
    const condition1 = breakPeriod.startTime >= day.startTime;
    const condition2 = isEndTimeAfterStartTime(
      day.startTime,
      breakPeriod.endTime
    );
    const condition3 = isEndTimeAfterStartTime(
      breakPeriod.startTime,
      day.endTime
    );
    const condition4 = breakPeriod.endTime <= day.endTime;
    const condition5 = isEndTimeAfterStartTime(
      breakPeriod.startTime,
      breakPeriod.endTime
    );

    // Use the updated logic for break validation
    const startTimeValid = condition1 && condition2;
    const endTimeValid = condition3 && condition4;

    if (startTimeValid && endTimeValid && condition5) {
      const breakDuration = calculateMinutesBetween(
        breakPeriod.startTime,
        breakPeriod.endTime
      );
      breakMinutes += breakDuration;
    } else {
      console.log(`- INVALID: Not counting this break in the calculation`);
    }
  });

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
