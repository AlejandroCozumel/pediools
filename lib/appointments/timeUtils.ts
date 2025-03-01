// lib/appointments/timeUtils.ts
import { format, parseISO, differenceInMinutes } from "date-fns";
import { TimeOption, DurationOption } from "@/types/appointments";

/**
 * Calculate the difference in minutes between two time strings (HH:MM)
 */
export const calculateMinutesBetween = (
  startTime: string,
  endTime: string
): number => {
  const start = parseISO(`2000-01-01T${startTime}`);
  const end = parseISO(`2000-01-01T${endTime}`);
  return differenceInMinutes(end, start);
};

/**
 * Check if the end time is after the start time
 */
export const isEndTimeAfterStartTime = (
  startTime: string,
  endTime: string
): boolean => {
  const start = parseISO(`2000-01-01T${startTime}`);
  const end = parseISO(`2000-01-01T${endTime}`);
  return end > start;
};

/**
 * Generate time options in half-hour increments for time selectors
 */
export const generateTimeOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];
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

/**
 * Standard slot duration options
 */
export const slotDurationOptions: DurationOption[] = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1 hour 30 minutes" },
  { value: 120, label: "2 hours" },
];

/**
 * Format minutes as hours and minutes
 */
export const formatMinutesAsHoursAndMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
};

/**
 * Add minutes to a time string
 */
export const addMinutesToTime = (time: string, minutes: number): string => {
  const date = parseISO(`2000-01-01T${time}`);
  const newDate = new Date(date.getTime() + minutes * 60000);
  return format(newDate, "HH:mm");
};

/**
 * Find the next available time slot after a break
 * Returns a time string in HH:MM format
 */
export const findNextAvailableSlot = (
  startTime: string,
  endTime: string,
  breaks: { start: number; end: number }[]
): string => {
  const start = parseISO(`2000-01-01T${startTime}`);
  const end = parseISO(`2000-01-01T${endTime}`);

  // If no breaks, return the start time
  if (breaks.length === 0) {
    return format(start, "HH:mm");
  }

  // Sort breaks by start time
  const sortedBreaks = [...breaks].sort((a, b) => a.start - b.start);

  // Find a slot that doesn't overlap with any break
  let currentMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  while (currentMinutes < endMinutes) {
    // Check if current time overlaps with any break
    const overlapsBreak = sortedBreaks.some(
      (breakPeriod) =>
        currentMinutes >= breakPeriod.start &&
        currentMinutes < breakPeriod.end
    );

    if (!overlapsBreak) {
      // Found a slot that doesn't overlap
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }

    // Move to the next time increment
    currentMinutes += 30;
  }

  // If no available slot found, return the end time
  return endTime;
};