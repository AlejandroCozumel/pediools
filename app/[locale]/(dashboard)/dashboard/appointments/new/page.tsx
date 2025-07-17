"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { format, addMonths, startOfMonth, isSameDay } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import DashboardTitle from "@/components/DashboardTitle";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Loader2,
  Check,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarComponent,
  DateAvailability,
} from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  useAppointmentSlots,
  useAppointment,
  useDoctorAvailability,
} from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patient";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PatientData } from "@/hooks/use-patient";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

const appointmentTypes = [
  "Check-up",
  "Consultation",
  "Follow-up",
  "Lab Review",
  "Urgent Care",
  "Other",
];

const CreateAppointment = () => {
  const t = useTranslations("Appointments");
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // State for form
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] =
    useState<string>("Consultation");
  const [notes, setNotes] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch available slots for the selected date
  const { data: slotsData, isLoading: slotsLoading } = useAppointmentSlots({
    startDate: format(selectedDate, "yyyy-MM-dd"),
    endDate: format(selectedDate, "yyyy-MM-dd"),
    status: "AVAILABLE",
  });

  // Fetch doctor's availability to determine available days
  const { availability, isLoading: availabilityLoading } =
    useDoctorAvailability();

  // Fetch patients
  const { data: patientsData, isLoading: patientsLoading } = usePatients();

  // Filtered patients based on search
  const filteredPatients = useMemo(() => {
    return (patientsData?.patients || []).filter((patient: PatientData) => {
      if (!searchQuery) return true;
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [patientsData?.patients, searchQuery]);

  // Create appointment mutation
  const { saveAppointment } = useAppointment();

  // Generate date availability data for current and next month
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
      // Skip past days
      if (day < today) continue;

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

  // Handle slot selection
  const handleSelectSlot = (slotId: string) => {
    setSelectedSlot(selectedSlot === slotId ? null : slotId);
  };

  // Helper to get initials from name
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedPatient || !selectedSlot) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select both a patient and a time slot.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Find the selected slot to get its datetime
      const slots = (slotsData?.slots as Slot[]) || [];
      const slot = slots.find((s) => s.id === selectedSlot);

      await saveAppointment.mutateAsync({
        patientId: selectedPatient,
        doctorId: "", // This will be automatically set on the server from the authenticated user
        appointmentSlotId: selectedSlot,
        datetime: slot?.startTime || new Date().toISOString(),
        status: "SCHEDULED",
        type: appointmentType,
        notes: notes ? { text: notes } : undefined,
      });
      router.refresh();
      toast({
        title: "Appointment Created",
        description: "The appointment has been successfully scheduled.",
      });
      router.push("/dashboard/appointments");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create appointment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group time slots by hour for better UI
  const groupedSlots = useMemo(() => {
    if (!slotsData?.slots) return {};

    const slots = slotsData.slots as Slot[];
    return slots.reduce((acc: Record<string, Slot[]>, slot: Slot) => {
      const hour = format(new Date(slot.startTime), "h a");
      if (!acc[hour]) {
        acc[hour] = [];
      }
      acc[hour].push(slot);
      return acc;
    }, {});
  }, [slotsData?.slots]);

  return (
    <div className="my-6">
      <DashboardTitle
        title={t("newAppointment")}
        subtitle={t("newAppointmentDescription")}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Patient selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-heading">
              {t("form.selectPatient")}
            </CardTitle>
            <CardDescription>{t("form.patientInfo")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                <Input
                  placeholder={t("PatientSelector.search.placeholder")}
                  className="pl-8 border-medical-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {patientsLoading ? (
                <div className="space-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="p-3 border rounded-md">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-medical-100" />
                          <div className="ml-3">
                            <div className="h-4 w-24 bg-medical-100 rounded" />
                            <div className="h-3 w-16 bg-medical-100 rounded mt-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient: PatientData) => (
                      <div
                        key={patient.id}
                        className={`p-3 border rounded-md cursor-pointer hover:bg-medical-50 transition-colors ${
                          selectedPatient === patient.id
                            ? "border-2 border-medical-500 bg-medical-50"
                            : "border-medical-200"
                        }`}
                        onClick={() => setSelectedPatient(patient.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 bg-medical-100">
                              <AvatarFallback className="text-medical-700">
                                {getInitials(
                                  patient.firstName,
                                  patient.lastName
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-3">
                              <p className="font-medium">
                                {patient.firstName} {patient.lastName}
                              </p>
                              <p className="text-xs text-medical-500">
                                {format(
                                  new Date(patient.dateOfBirth),
                                  "MMM d, yyyy"
                                )}
                              </p>
                            </div>
                          </div>
                          {selectedPatient === patient.id && (
                            <Check className="h-5 w-5 text-medical-600" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-medical-500 border border-dashed border-medical-200 rounded-md">
                      {t("PatientSelector.noResults.empty")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Right column - Date & Time selection + Appointment details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-heading">
              {t("form.appointmentDate")}
            </CardTitle>
            <CardDescription>{t("form.appointmentTime")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar */}
              <div>
                <label className="text-sm font-medium text-medical-700 mb-2 block">
                  {t("form.appointmentDate")}
                </label>
                <div className="border rounded-md border-medical-200">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 flex items-center gap-1.5 p-2">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 bg-green-500 rounded-full"></span>
                        Available
                      </span>
                      <span className="flex items-center gap-1 ml-3">
                        <span className="inline-block h-2 w-2 bg-red-500 rounded-full"></span>
                        Exception
                      </span>
                    </div>
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setSelectedSlot(null);
                        }
                      }}
                      onMonthChange={handleMonthChange}
                      className="w-full rounded-md"
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      availabilityData={availabilityData}
                    />
                  </div>
                </div>
              </div>
              {/* Time slots */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-medical-700">
                    {t("form.availableSlots")}
                  </label>
                  <p className="text-xs text-medical-500">
                    {format(selectedDate, "EEEE, MMMM d")}
                  </p>
                </div>
                {slotsLoading ? (
                  <div className="space-y-3">
                    {Array(4)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="border rounded-md border-medical-200 p-3"
                        >
                          <div className="h-4 bg-medical-100 rounded w-20 mb-2" />
                          <div className="flex flex-wrap gap-2">
                            {Array(3)
                              .fill(0)
                              .map((_, j) => (
                                <div
                                  key={j}
                                  className="h-8 bg-medical-100 rounded w-16"
                                />
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : Object.keys(groupedSlots).length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {Object.entries(groupedSlots).map(([hour, slots]) => (
                      <div
                        key={hour}
                        className="border rounded-md border-medical-200 p-3"
                      >
                        <h4 className="text-sm font-medium text-medical-700 mb-2">
                          {hour}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot: Slot) => (
                            <Button
                              key={slot.id}
                              variant={
                                selectedSlot === slot.id ? "default" : "outline"
                              }
                              size="sm"
                              className={
                                selectedSlot === slot.id
                                  ? "bg-medical-600"
                                  : "border-medical-200"
                              }
                              onClick={() => handleSelectSlot(slot.id)}
                            >
                              {format(new Date(slot.startTime), "h:mm a")}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-medical-500 border border-dashed border-medical-200 rounded-md">
                    {t("noAppointments")}
                  </div>
                )}
              </div>
            </div>
            {/* Appointment details */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-medical-700 mb-2 block">
                  {t("form.appointmentType")}
                </label>
                <Select
                  value={appointmentType}
                  onValueChange={setAppointmentType}
                >
                  <SelectTrigger className="border-medical-200">
                    <SelectValue placeholder={t("form.appointmentType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`types.${type}`, { defaultValue: type })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-medical-700 mb-2 block">
                  {t("form.notes")}
                </label>
                <Textarea
                  placeholder={t("form.notes")}
                  className="border-medical-200 min-h-[100px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4">
            <Button
              onClick={handleSubmit}
              className="bg-medical-600 hover:bg-medical-700"
              disabled={!selectedPatient || !selectedSlot || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("form.scheduling")}
                </>
              ) : (
                t("actions.schedule")
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CreateAppointment;
