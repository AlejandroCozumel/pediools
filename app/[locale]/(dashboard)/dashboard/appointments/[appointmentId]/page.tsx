// app/dashboard/appointments/[appointmentId]/page.tsx
"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
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
  User,
  FileText,
  Trash2,
  ClipboardCheck,
  X,
  Edit,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useAppointment } from "@/hooks/use-appointments";
import { usePatient } from "@/hooks/use-patient";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AppointmentDetails = () => {
  const t = useTranslations("Appointments");
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const appointmentId = params.appointmentId as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<"COMPLETED" | "CANCELLED" | "NO_SHOW">("COMPLETED");

  // Fetch appointment details
  const {
    appointment,
    isLoading: appointmentLoading,
    saveAppointment,
    deleteAppointment,
  } = useAppointment(appointmentId);

  // Fetch patient details if we have the patient ID
  const { patient, isLoading: patientLoading } = usePatient(
    appointment?.patientId
  );

  // Update appointment status
  const handleUpdateStatus = async () => {
    try {
      await saveAppointment.mutateAsync({
        ...appointment,
        status: newStatus,
      });

      toast({
        title: "Appointment Updated",
        description: `Appointment status has been changed to ${newStatus}.`,
      });

      setStatusDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update appointment status.",
      });
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async () => {
    try {
      await deleteAppointment.mutateAsync();
      router.refresh();
      toast({
        title: "Appointment Deleted",
        description: "Appointment has been successfully deleted.",
      });
      router.push("/dashboard/appointments");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete appointment.",
      });
    }
  };

  // Show loading state
  if (appointmentLoading || patientLoading) {
    return (
      <div className="my-6">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-7 w-64 mb-1" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle scenario where appointment doesn't exist
  if (!appointment) {
    return (
      <div className="my-6">
        <div className="flex items-center gap-2 mb-6">
          <DashboardTitle
            title="Appointment Not Found"
            subtitle="The requested appointment could not be found."
          />
        </div>

        <Card className="text-center py-8">
          <CardContent>
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Appointment Not Found</h3>
            <p className="text-medical-600 mb-6">
              The appointment you are looking for does not exist or has been deleted.
            </p>
            <Link href="/dashboard/appointments">
              <Button className="bg-medical-600 hover:bg-medical-700">
                Return to Appointments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="my-6">
      <div className="flex items-center gap-2 mb-6">
        <DashboardTitle
          title={`Appointment Details`}
          subtitle={`View and manage appointment information`}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-medical-500" />
              <CardTitle className="text-xl font-heading">
                {format(parseISO(appointment.datetime), "EEEE, MMMM d, yyyy")}
              </CardTitle>
            </div>
            <Badge
              className={
                appointment.status === "SCHEDULED" ? "bg-blue-100 text-blue-800 border-blue-200" :
                appointment.status === "COMPLETED" ? "bg-green-100 text-green-800 border-green-200" :
                appointment.status === "CANCELLED" ? "bg-red-100 text-red-800 border-red-200" :
                "bg-amber-100 text-amber-800 border-amber-200"
              }
            >
              {appointment.status}
            </Badge>
          </div>
          <CardDescription className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-medical-500" />
            {format(parseISO(appointment.datetime), "h:mm a")}
            {appointment.type && (
              <>
                <span className="mx-2">•</span>
                {appointment.type}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-md border-medical-100">
              <h3 className="text-sm font-medium text-medical-700 mb-3">
                Patient Information
              </h3>
              {patient && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-medical-500" />
                    <p className="font-medium">
                      {patient.firstName} {patient.lastName}
                    </p>
                  </div>
                  <p className="text-sm text-medical-500">
                    Date of Birth: {format(new Date(patient.dateOfBirth), "MMM d, yyyy")}
                  </p>
                  <p className="text-sm text-medical-500">
                    Gender: {patient.gender}
                  </p>
                  {patient.email && (
                    <p className="text-sm text-medical-500">
                      Email: {patient.email}
                    </p>
                  )}
                  {patient.phoneNumber && (
                    <p className="text-sm text-medical-500">
                      Phone: {patient.phoneNumber}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border rounded-md border-medical-100">
              <h3 className="text-sm font-medium text-medical-700 mb-3">
                Appointment Details
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-medical-500" />
                  <p className="font-medium">
                    {format(parseISO(appointment.datetime), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-medical-500" />
                  <p className="text-sm">
                    {format(parseISO(appointment.datetime), "h:mm a")}
                  </p>
                </div>
                {appointment.type && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-medical-500" />
                    <p className="text-sm">Type: {appointment.type}</p>
                  </div>
                )}
                <div className="flex items-center">
                  <ClipboardCheck className="h-4 w-4 mr-2 text-medical-500" />
                  <p className="text-sm">Status: {appointment.status}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes Section */}
          {appointment.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-medical-700">
                Notes
              </h3>
              <div className="p-4 bg-medical-50 rounded-md text-sm">
                {typeof appointment.notes === 'object' && appointment.notes.text
                  ? appointment.notes.text
                  : JSON.stringify(appointment.notes)
                }
              </div>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex gap-2">
            {/* Delete dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Appointment
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this appointment? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDeleteAppointment}
                  >
                    Yes, Cancel Appointment
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex gap-2">
            {/* Status change dialog */}
            <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
              <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Update Status
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Update Appointment Status</AlertDialogTitle>
                  <AlertDialogDescription>
                    Choose the new status for this appointment.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className={newStatus === "COMPLETED" ? "border-green-500 bg-green-50" : ""}
                    onClick={() => setNewStatus("COMPLETED")}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2 text-green-600" />
                    Completed
                  </Button>
                  <Button
                    variant="outline"
                    className={newStatus === "CANCELLED" ? "border-red-500 bg-red-50" : ""}
                    onClick={() => setNewStatus("CANCELLED")}
                  >
                    <X className="h-4 w-4 mr-2 text-red-600" />
                    Cancelled
                  </Button>
                  <Button
                    variant="outline"
                    className={newStatus === "NO_SHOW" ? "border-amber-500 bg-amber-50" : ""}
                    onClick={() => setNewStatus("NO_SHOW")}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                    No Show
                  </Button>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-medical-600 hover:bg-medical-700"
                    onClick={handleUpdateStatus}
                  >
                    Update Status
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Link href={`/dashboard/appointments/${appointmentId}/edit`}>
              <Button className="bg-medical-600 hover:bg-medical-700" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Appointment
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AppointmentDetails;