// app/dashboard/appointments/components/AppointmentCalendarView.tsx
"use client";
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AppointmentWithPatient } from "@/hooks/use-appointments";

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
  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const dateKey = format(parseISO(appointment.datetime), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, AppointmentWithPatient[]>);

  return (
    <div className="p-4 lg:p-0">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-7/12">
          {/* Updated container with full width */}
          <div className="border rounded-lg p-2 bg-white w-full">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && onDateChange(date)}
              className="w-full" // Make calendar take full width
              classNames={{
                month: "w-full space-y-4", // Ensure month takes full width
                caption: "flex justify-center pt-1 relative items-center w-full",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full justify-between", // Make header row take full width
                head_cell: "text-muted-foreground rounded-md font-normal text-[0.8rem] flex-1 text-center", // Equal width cells
                row: "flex w-full mt-2 justify-between", // Make rows take full width
                cell: "flex-1 text-center text-sm relative p-0 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent", // Equal width cells
                day: "h-9 w-full p-0 font-normal aria-selected:opacity-100", // Make days take full width
                day_selected: "bg-medical-600 text-medical-50 hover:bg-medical-600 hover:text-medical-50 focus:bg-medical-600 focus:text-medical-50",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              modifiers={{
                appointment: (date) => {
                  const dateString = format(date, "yyyy-MM-dd");
                  return !!appointmentsByDate[dateString];
                },
              }}
              modifiersClassNames={{
                appointment: "bg-medical-50 font-bold border-medical-200",
              }}
              components={{
                DayContent: ({ date }) => {
                  const dateString = format(date, "yyyy-MM-dd");
                  const dayAppointments = appointmentsByDate[dateString] || [];
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div>{date.getDate()}</div>
                      {dayAppointments.length > 0 && (
                        <div className="absolute bottom-0 text-xs">
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1 border-medical-300"
                          >
                            {dayAppointments.length}
                          </Badge>
                        </div>
                      )}
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
                  <div className="p-3 rounded-md border border-medical-200 hover:border-medical-300 hover:shadow-sm transition-all">
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