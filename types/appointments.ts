// types/appointments.ts
export type BreakPeriod = {
  id: string;
  startTime: string;
  endTime: string;
};

export type DaySchedule = {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  breaks: BreakPeriod[];
};

export type WeeklySchedule = DaySchedule[];

export type DateOverrideType = 'day' | 'slot';
export type DateOverrideStatus = 'available' | 'blocked';

export type DateOverride = {
  date: Date;
  isAvailable: boolean;  // Whether the day is available
  startTime?: string;    // For available dates with custom hours
  endTime?: string;      // For available dates with custom hours
  reason?: string;       // Optional reason for the override

  // Added fields for slot-level availability
  slotId?: string;       // ID of the specific slot
  slotIsAvailable?: boolean; // Whether the specific slot is available
};

export type TimeOption = {
  value: string;
  label: string;
};

export type DurationOption = {
  value: number;
  label: string;
};

export type AvailabilityData = {
  weeklySchedule: WeeklySchedule;
  daysOfOperation: number[];
  defaultStartTime: string;
  defaultEndTime: string;
  dateOverrides?: DateOverride[];
};