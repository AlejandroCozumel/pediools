// app/api/dashboard/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { z } from "zod";
import { startOfDay, endOfDay, parseISO } from "date-fns";

// Get all appointments with filtering
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
    const url = new URL(req.url);

    // Extract query parameters
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const status = url.searchParams.get("status");
    const patientId = url.searchParams.get("patientId");

    // Build filter object
    let filters: any = {
      doctorId,
    };

    if (startDate && endDate) {
      filters.datetime = {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      };
    } else if (startDate) {
      filters.datetime = {
        gte: startOfDay(parseISO(startDate)),
      };
    } else if (endDate) {
      filters.datetime = {
        lte: endOfDay(parseISO(endDate)),
      };
    }

    if (status) {
      filters.status = status;
    }

    if (patientId) {
      filters.patientId = patientId;
    }

    // Get appointments with patient information
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
            email: true,
            phoneNumber: true,
          },
        },
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

    // Validate input data
    const appointmentSchema = z.object({
      patientId: z.string(),
      datetime: z.string().datetime(),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
      type: z.string().optional(),
      notes: z.any().optional(),
      appointmentSlotId: z.string().optional(),
      consultationMotive: z.string().optional(),
      presentedSymptoms: z.any().optional(),
    });

    const validatedData = appointmentSchema.parse(body);

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        ...validatedData,
        doctorId,
      },
    });

    // If appointmentSlotId is provided, update the slot status
    if (validatedData.appointmentSlotId) {
      await prisma.appointmentSlot.update({
        where: { id: validatedData.appointmentSlotId },
        data: { status: "BOOKED" },
      });
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("[APPOINTMENT_POST]", error);
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