// lib/appointments/timeUtils.ts
import { format, parseISO, differenceInMinutes, addMinutes, isBefore, isAfter, startOfMonth, endOfMonth, addDays, setHours, setMinutes, isSameDay, isSameMonth } from "date-fns";
import { TimeOption, DurationOption } from "@/types/appointments";
import prisma from "@/lib/prismadb";
import { SlotStatus } from "@prisma/client";

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

/**
 * Generate appointment slots for a doctor for a given month and year.
 * - Only generates if slots for that month don't already exist.
 * - Respects working hours, slot duration, and exceptions.
 * - Will not generate slots for months more than 1 year in advance.
 * @param doctorId string
 * @param year number (e.g. 2024)
 * @param month number (1-12)
 * @param workingHours { startHour: number, endHour: number, daysOfWeek: number[] } (0=Sunday)
 * @param slotDuration number (minutes)
 * @param exceptions Date[] (dates to skip)
 */
export async function generateSlotsForMonth({
  doctorId,
  year,
  month,
  workingHours,
  slotDuration,
  exceptions = [],
}: {
  doctorId: string;
  year: number;
  month: number; // 1-12
  workingHours: { startHour: number; endHour: number; daysOfWeek: number[] };
  slotDuration: number;
  exceptions?: Date[];
}) {
  const now = new Date();
  const targetMonth = new Date(year, month - 1, 1);
  const maxAdvance = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  if (isAfter(targetMonth, maxAdvance)) {
    throw new Error("Cannot generate slots more than 1 year in advance");
  }

  // Check if slots already exist for this doctor/month
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);
  const existing = await prisma.appointmentSlot.findFirst({
    where: {
      doctorId,
      startTime: { gte: monthStart, lte: monthEnd },
    },
  });
  if (existing) return { created: 0, message: "Slots already exist for this month" };

  let created = 0;
  let slotsToCreate = [];
  for (let day = 1; day <= 31; day++) {
    const date = new Date(year, month - 1, day);
    if (!isSameMonth(date, targetMonth)) break;
    if (!workingHours.daysOfWeek.includes(date.getDay())) continue;
    if (exceptions.some(ex => isSameDay(ex, date))) continue;
    let slotTime = setHours(setMinutes(date, 0), workingHours.startHour);
    const endTime = setHours(setMinutes(date, 0), workingHours.endHour);
    while (isBefore(slotTime, endTime)) {
      slotsToCreate.push({
        doctorId,
        startTime: slotTime,
        endTime: addMinutes(slotTime, slotDuration),
        status: SlotStatus.AVAILABLE,
      });
      slotTime = addMinutes(slotTime, slotDuration);
      created++;
    }
  }
  if (slotsToCreate.length > 0) {
    await prisma.appointmentSlot.createMany({ data: slotsToCreate });
  }
  return { created, message: `Created ${created} slots for ${year}-${month}` };
}