// app/api/dashboard/appointments/availability/override/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { z } from "zod";

// Create or update availability overrides
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

    // Validate input data - updated to allow null values for slot fields
    const overrideSchema = z.object({
      dateOverrides: z.array(
        z.object({
          date: z.union([
            z.date(),
            z.string().transform(val => new Date(val))
          ]),
          isAvailable: z.boolean(),
          startTime: z.string().optional().nullable(),
          endTime: z.string().optional().nullable(),
          reason: z.string().optional().nullable(),
          // Allow null values for slot-level fields
          slotId: z.string().optional().nullable(),
          slotIsAvailable: z.boolean().optional().nullable()
        })
      ),
    });

    const validatedData = overrideSchema.parse(body);

    // Process each override - handling both day-level and slot-level overrides
    const results = await Promise.all(
      validatedData.dateOverrides.map(async (override) => {
        // For day-level overrides (no slotId)
        if (!override.slotId) {
          // Check if day-level override already exists
          const existingDayOverride = await prisma.doctorAvailabilityOverride.findFirst({
            where: {
              doctorId,
              date: override.date,
              slotId: null // Only day-level overrides
            },
          });

          if (existingDayOverride) {
            // Update existing day-level override
            return prisma.doctorAvailabilityOverride.update({
              where: {
                id: existingDayOverride.id,
              },
              data: {
                isAvailable: override.isAvailable,
                startTime: override.startTime,
                endTime: override.endTime,
                reason: override.reason,
                // Explicitly set slot fields to null
                slotId: null,
                slotIsAvailable: null
              },
            });
          } else {
            // Create new day-level override
            return prisma.doctorAvailabilityOverride.create({
              data: {
                doctorId,
                date: override.date,
                isAvailable: override.isAvailable,
                startTime: override.startTime,
                endTime: override.endTime,
                reason: override.reason,
                // Explicitly set slot fields to null
                slotId: null,
                slotIsAvailable: null
              },
            });
          }
        }
        // For slot-level overrides
        else {
          // Check if slot-level override already exists
          const existingSlotOverride = await prisma.doctorAvailabilityOverride.findFirst({
            where: {
              doctorId,
              date: override.date,
              slotId: override.slotId
            },
          });

          if (existingSlotOverride) {
            // Update existing slot-level override
            return prisma.doctorAvailabilityOverride.update({
              where: {
                id: existingSlotOverride.id,
              },
              data: {
                isAvailable: override.isAvailable,
                slotId: override.slotId,
                slotIsAvailable: override.slotIsAvailable,
                reason: override.reason,
              },
            });
          } else {
            // Create new slot-level override
            return prisma.doctorAvailabilityOverride.create({
              data: {
                doctorId,
                date: override.date,
                isAvailable: override.isAvailable, // Usually true for day
                slotId: override.slotId,
                slotIsAvailable: override.slotIsAvailable, // Usually false for blocked slot
                reason: override.reason,
              },
            });
          }
        }
      })
    );

    // Regenerate appointment slots to account for new overrides
    await generateAppointmentSlots(doctorId);

    return NextResponse.json({
      message: "Availability overrides updated successfully",
      overrides: results,
    });
  } catch (error) {
    console.error("[AVAILABILITY_OVERRIDE_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid override data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update availability overrides" },
      { status: 500 }
    );
  }
}

// Helper function to generate appointment slots based on availability
async function generateAppointmentSlots(doctorId: string) {
  // Implementation logic for generating slots
  // This would create future slots based on weekly availability
  // and take into account date overrides and slot overrides

  // When creating appointment slots, you would need to check both:
  // 1. If the day is available (or has a custom schedule)
  // 2. If specific slots within that day are blocked

  return true;
}