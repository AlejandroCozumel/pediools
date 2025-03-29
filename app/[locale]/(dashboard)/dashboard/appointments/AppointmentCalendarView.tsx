// app/dashboard/appointments/components/AppointmentCalendarView.tsx
"use client";
import React, { useState, useMemo } from "react";
import { Calendar, DateAvailability } from "@/components/ui/calendar";
import { format, parseISO, addMonths, startOfMonth, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import { AppointmentWithPatient } from "@/hooks/use-appointments";
import { useDoctorAvailability } from "@/hooks/use-appointments";

interface AppointmentCalendarViewProps {
  appointments: AppointmentWithPatient[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const AppointmentCalendarView = ({
  appointments,
  currentDate,
  onDateChange,
}: AppointmentCalendarViewProps) => {
  const [calendarMonth, setCalendarMonth] = useState<Date>(currentDate);
  const { availability } = useDoctorAvailability();

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    return appointments.reduce((acc, appointment) => {
      const dateKey = format(parseISO(appointment.datetime), "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(appointment);
      return acc;
    }, {} as Record<string, AppointmentWithPatient[]>);
  }, [appointments]);

  // Generate date availability data for the calendar
  const availabilityData = useMemo(() => {
    if (!availability) return [];

    const data: DateAvailability[] = [];
    const today = new Date();
    const startDate = startOfMonth(calendarMonth);
    const endDate = addMonths(startDate, 2); // Include current and next month
    const weeklySchedule = availability.weeklySchedule || [];
    const dateOverrides = availability.dateOverrides || [];

    // Get day-level overrides
    const dayLevelOverrides = dateOverrides.filter(
      (override: any) => !override.slotId
    );
    const slotLevelOverrides = dateOverrides.filter(
      (override: any) => !!override.slotId
    );

    // For each day in range
    for (
      let day = new Date(startDate);
      day < endDate;
      day.setDate(day.getDate() + 1)
    ) {
      // Skip past days that are before today
      if (day < new Date(today.setHours(0, 0, 0, 0))) continue;

      const currentDate = new Date(day);
      const dayOfWeek = currentDate.getDay(); // 0-6, Sunday to Saturday
      const daySchedule = weeklySchedule[dayOfWeek];

      // Check if day has an override (day-level only)
      const dayOverride = dayLevelOverrides.find((override: any) => {
        const overrideDate = new Date(override.date);
        return isSameDay(overrideDate, currentDate);
      });

      // Check if day has any slot-level overrides
      const hasSlotOverrides = slotLevelOverrides.some((override: any) => {
        const overrideDate = new Date(override.date);
        return isSameDay(overrideDate, currentDate);
      });

      // Determine availability status based on day-level override and regular schedule
      const isAvailable = dayOverride
        ? dayOverride.isAvailable
        : daySchedule && daySchedule.isActive;

      // Determine if the day has exceptions (overrides that affect availability)
      const hasExceptions =
        (dayOverride &&
          dayOverride.isAvailable !== (daySchedule && daySchedule.isActive)) ||
        hasSlotOverrides;

      data.push({
        date: currentDate,
        hasSlots: isAvailable,
        hasExceptions,
        isDisabled: !isAvailable,
      });
    }

    return data;
  }, [availability, calendarMonth]);

  // Handle calendar month change
  const handleMonthChange = (month: Date) => {
    setCalendarMonth(month);
  };


  return (
    <div className="p-4 lg:p-0">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-7/12">
          {/* Calendar container with improved styling */}
          <div className="border rounded-lg p-2 bg-white w-full">
            <div className="text-xs text-gray-500 flex items-center gap-1.5 p-2">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 bg-green-500 rounded-full"></span>
                <span>Available</span>
              </span>
              <span className="flex items-center gap-1 ml-3">
                <span className="inline-block h-2 w-2 bg-red-500 rounded-full"></span>
                <span>Exception</span>
              </span>
              <span className="flex items-center gap-1 ml-3">
                <span className="inline-block h-2 w-2 bg-medical-200 rounded-full"></span>
                <span>Has Appointments</span>
              </span>
            </div>

            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && onDateChange(date)}
              onMonthChange={handleMonthChange}
              className="w-full"
              availabilityData={availabilityData}
              classNames={{
                month: "w-full space-y-4",
                caption:
                  "flex justify-center pt-1 relative items-center w-full",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button:
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full justify-between",
                head_cell:
                  "text-muted-foreground rounded-md font-normal text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-2 justify-between",
                cell: "relative flex-1 text-center text-sm p-0 focus-within:relative focus-within:z-20",
                day: "h-10 w-10 p-0 mx-auto flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors",
                day_selected:
                  "bg-medical-600 text-medical-50 hover:bg-medical-600 hover:text-medical-50 focus:bg-medical-600 focus:text-medical-50",
                day_today: "border border-medical-500",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              components={{
                DayContent: ({ date }) => {
                  const dateString = format(date, "yyyy-MM-dd");
                  const dayAppointments = appointmentsByDate[dateString] || [];
                  const hasAppointments = dayAppointments.length > 0;

                  return (
                    <div className="relative flex flex-col h-full w-full items-center justify-center">
                      {/* Day number is centered */}
                      <span className="z-10">{date.getDate()}</span>

                      {/* Position badges carefully to avoid overlap */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        {/* If there are appointments, show the badge at the bottom */}
                        {hasAppointments && (
                          <div className="absolute bottom-0 left-0 right-0 flex justify-center z-10">
                            <Badge
                              variant="secondary"
                              className="text-[9px] h-3 px-1 py-0 min-w-5 flex items-center justify-center bg-medical-200 text-medical-800 border-medical-200"
                            >
                              {dayAppointments.length}
                            </Badge>
                          </div>
                        )}

                        {/* We'll let the availability indicators show at the top rather than the center
                            (the Calendar component handles this automatically based on availabilityData) */}
                      </div>
                    </div>
                  );
                },
              }}
            />
          </div>
        </div>

        <div className="lg:w-5/12">
          <h3 className="text-lg font-medium text-medical-800 mb-4">
            {format(currentDate, "EEEE, MMMM d, yyyy")}
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {appointmentsByDate[format(currentDate, "yyyy-MM-dd")]?.map(
              (appointment) => (
                <Link
                  href={`/dashboard/appointments/${appointment.id}`}
                  key={appointment.id}
                  className="block"
                >
                  <div className="p-3 rounded-md border border-medical-200 hover:border-medical-300 hover:bg-medical-50 hover:shadow transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-medical-800">
                          {appointment.patient.firstName}{" "}
                          {appointment.patient.lastName}
                        </p>
                        <p className="text-sm text-medical-600">
                          {format(parseISO(appointment.datetime), "h:mm a")}
                        </p>
                      </div>
                      <Badge
                        className={
                          appointment.status === "SCHEDULED"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : appointment.status === "COMPLETED"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : appointment.status === "CANCELLED"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                    {appointment.type && (
                      <p className="text-sm text-medical-500 mt-1">
                        {appointment.type}
                      </p>
                    )}
                  </div>
                </Link>
              )
            )}
            {!appointmentsByDate[format(currentDate, "yyyy-MM-dd")] && (
              <div className="text-center py-8 text-medical-500 border border-dashed border-medical-200 rounded-md">
                No appointments scheduled for this day
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendarView;
