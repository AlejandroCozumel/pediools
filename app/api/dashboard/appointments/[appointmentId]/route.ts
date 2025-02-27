// app/api/dashboard/appointments/[appointmentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { z } from "zod";

// Get a specific appointment
export async function GET(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });
    if (!doctor)
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

    const doctorId = doctor.id;
    const { appointmentId } = params;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            email: true,
            phoneNumber: true,
          },
        },
        appointmentSlot: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[APPOINTMENT_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// Update an appointment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });
    if (!doctor)
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

    const doctorId = doctor.id;
    const { appointmentId } = params;
    const body = await req.json();

    // Validate input data
    const appointmentSchema = z.object({
      patientId: z.string().optional(),
      datetime: z.string().datetime().optional(),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
      type: z.string().optional().nullable(),
      notes: z.any().optional().nullable(),
      appointmentSlotId: z.string().optional().nullable(),
      consultationMotive: z.string().optional().nullable(),
      presentedSymptoms: z.any().optional().nullable(),
    });

    const validatedData = appointmentSchema.parse(body);

    // Check if appointment exists and belongs to the doctor
    const existingAppointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId,
      },
      include: {
        appointmentSlot: true,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Handle slot changes if needed
    if (validatedData.appointmentSlotId && validatedData.appointmentSlotId !== existingAppointment.appointmentSlotId) {
      // Release the old slot if it exists
      if (existingAppointment.appointmentSlotId) {
        await prisma.appointmentSlot.update({
          where: { id: existingAppointment.appointmentSlotId },
          data: { status: "AVAILABLE" },
        });
      }

      // Book the new slot
      await prisma.appointmentSlot.update({
        where: { id: validatedData.appointmentSlotId },
        data: { status: "BOOKED" },
      });
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: validatedData,
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("[APPOINTMENT_PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid appointment data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// Delete an appointment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });
    if (!doctor)
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

    const doctorId = doctor.id;
    const { appointmentId } = params;

    // Check if appointment exists and belongs to the doctor
    const existingAppointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId,
      },
      include: {
        appointmentSlot: true,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Release the slot if it exists
    if (existingAppointment.appointmentSlotId) {
      await prisma.appointmentSlot.update({
        where: { id: existingAppointment.appointmentSlotId },
        data: { status: "AVAILABLE" },
      });
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: {
        id: appointmentId,
      },
    });

    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("[APPOINTMENT_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}