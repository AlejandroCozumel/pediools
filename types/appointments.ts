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

export type DateOverride = {
  date: Date;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
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