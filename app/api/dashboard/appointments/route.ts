// app/api/dashboard/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { z } from "zod";

// Get all appointments with optional filtering
export async function GET(req: NextRequest) {
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");

    // Build filters
    const filters: any = {
      doctorId,
    };

    if (startDate || endDate) {
      filters.datetime = {};
      if (startDate) {
        filters.datetime.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day for the end date
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filters.datetime.lte = endDateTime;
      }
    }

    if (status) {
      filters.status = status;
    }

    if (patientId) {
      filters.patientId = patientId;
    }

    // Get appointments with patient info
    const appointments = await prisma.appointment.findMany({
      where: filters,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        appointmentSlot: true,
      },
      orderBy: {
        datetime: "asc",
      },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("[APPOINTMENTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// Create a new appointment
export async function POST(req: NextRequest) {
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
    const body = await req.json();

    console.log("Creating appointment with data:", JSON.stringify(body, null, 2));

    // Validate input data
    const appointmentSchema = z.object({
      patientId: z.string(),
      datetime: z.string(),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
      type: z.string().optional(),
      notes: z.any().optional(),
      appointmentSlotId: z.string().optional(),
      // Other optional fields
      consultationMotive: z.string().optional(),
      presentedSymptoms: z.any().optional(),
    });

    const validatedData = appointmentSchema.parse(body);

    // Create appointment in a transaction
    const newAppointment = await prisma.$transaction(async (tx) => {
      // 1. Create the appointment
      const appointment = await tx.appointment.create({
        data: {
          patientId: validatedData.patientId,
          doctorId: doctorId,
          datetime: new Date(validatedData.datetime),
          status: validatedData.status,
          type: validatedData.type,
          notes: validatedData.notes,
          appointmentSlotId: validatedData.appointmentSlotId,
          consultationMotive: validatedData.consultationMotive,
          presentedSymptoms: validatedData.presentedSymptoms,
        },
      });

      // 2. Update the slot status if an appointmentSlotId is provided
      if (validatedData.appointmentSlotId) {
        await tx.appointmentSlot.update({
          where: { id: validatedData.appointmentSlotId },
          data: { status: "BOOKED" },
        });
      }

      return appointment;
    });

    return NextResponse.json(newAppointment);
  } catch (error) {
    console.error("[APPOINTMENTS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid appointment data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}