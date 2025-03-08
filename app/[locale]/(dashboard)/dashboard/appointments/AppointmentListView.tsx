// app/dashboard/appointments/components/AppointmentListView.tsx
"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { AppointmentWithPatient } from "@/hooks/use-appointments";
import Link from "next/link";
import { Calendar, Clock, MoreHorizontal, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

interface AppointmentListViewProps {
  appointments: AppointmentWithPatient[];
  currentDate: Date;
}

const AppointmentListView = ({
  appointments,
  currentDate,
}: AppointmentListViewProps) => {
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  const t = useTranslations("Appointments");

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-medical-50">
            <TableHead className="w-[180px]">{t("list.dateTime")}</TableHead>
            <TableHead>{t("list.patient")}</TableHead>
            <TableHead>{t("list.type")}</TableHead>
            <TableHead>{t("list.status")}</TableHead>
            <TableHead className="text-right">{t("list.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAppointments.length > 0 ? (
            sortedAppointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="font-medium flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-medical-500" />
                      {format(parseISO(appointment.datetime), "MMM d, yyyy")}
                    </div>
                    <div className="text-sm text-medical-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(parseISO(appointment.datetime), "h:mm a")}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {appointment.patient.firstName}{" "}
                    {appointment.patient.lastName}
                  </div>
                  <div className="text-xs text-medical-500">
                    {format(
                      parseISO(appointment.patient.dateOfBirth),
                      "MMM d, yyyy"
                    )}{" "}
                    • {appointment.patient.gender}
                  </div>
                </TableCell>
                <TableCell>{appointment.type || t("list.general")}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/dashboard/appointments/${appointment.id}`}>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          {t("list.viewDetails")}
                        </DropdownMenuItem>
                      </Link>
                      <Link
                        href={`/dashboard/appointments/${appointment.id}/edit`}
                      >
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          {t("list.editAppointment")}
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {t("list.noAppointmentsFound")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AppointmentListView;
