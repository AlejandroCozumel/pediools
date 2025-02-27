// app/api/dashboard/appointments/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { z } from "zod";

// Get doctor availability
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

    // Get regular weekly schedule
    const weeklySchedule = await prisma.doctorAvailability.findMany({
      where: {
        doctorId,
        isActive: true,
      },
      orderBy: {
        dayOfWeek: "asc",
      },
    });

    // Get date overrides
    const dateOverrides = await prisma.doctorAvailabilityOverride.findMany({
      where: {
        doctorId,
        date: {
          gte: new Date(),
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json({
      weeklySchedule,
      dateOverrides,
    });
  } catch (error) {
    console.error("[AVAILABILITY_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

// Update weekly availability
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
    const availabilitySchema = z.object({
      weeklySchedule: z.array(
        z.object({
          dayOfWeek: z.number().min(0).max(6),
          isActive: z.boolean(),
          startTime: z.string(),
          endTime: z.string(),
          slotDuration: z.number().min(15).max(120),
          breakStartTime: z.string().optional().nullable(),
          breakEndTime: z.string().optional().nullable(),
        })
      ),
    });

    const validatedData = availabilitySchema.parse(body);

    // Delete existing schedule
    await prisma.doctorAvailability.deleteMany({
      where: {
        doctorId,
      },
    });

    // Create new schedule entries
    const availabilityEntries = await Promise.all(
      validatedData.weeklySchedule.map(schedule =>
        prisma.doctorAvailability.create({
          data: {
            doctorId,
            dayOfWeek: schedule.dayOfWeek,
            isActive: schedule.isActive,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: schedule.slotDuration,
            breakStartTime: schedule.breakStartTime,
            breakEndTime: schedule.breakEndTime,
          },
        })
      )
    );

    // Generate appointment slots based on the updated availability
    await generateAppointmentSlots(doctorId);

    return NextResponse.json({
      message: "Availability schedule updated successfully",
      weeklySchedule: availabilityEntries,
    });
  } catch (error) {
    console.error("[AVAILABILITY_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid availability data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}

// Helper function to generate appointment slots based on availability
async function generateAppointmentSlots(doctorId: string) {
  // Implementation logic for generating slots
  // This would create future slots based on weekly availability
  // and take into account date overrides

  // Note: This is a simplified implementation - you'd want to
  // add more robust logic for a production environment

  // Clear future slots that haven't been booked
  await prisma.appointmentSlot.deleteMany({
    where: {
      doctorId,
      startTime: {
        gte: new Date(),
      },
      status: "AVAILABLE",
    },
  });

  // For each day in the next 4 weeks, generate slots based on availability
  // This would be where you implement the slot generation logic

  return true;
}