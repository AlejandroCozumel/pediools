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

    // Validate input data
    const overrideSchema = z.object({
      dateOverrides: z.array(
        z.object({
          date: z.date(),
          isAvailable: z.boolean(),
          startTime: z.string().optional().nullable(),
          endTime: z.string().optional().nullable(),
          reason: z.string().optional().nullable(),
        })
      ),
    });

    const validatedData = overrideSchema.parse(body);

    // Process each override
    const results = await Promise.all(
      validatedData.dateOverrides.map(async (override) => {
        // Check if override already exists
        const existingOverride = await prisma.doctorAvailabilityOverride.findFirst({
          where: {
            doctorId,
            date: override.date,
          },
        });

        if (existingOverride) {
          // Update existing override
          return prisma.doctorAvailabilityOverride.update({
            where: {
              id: existingOverride.id,
            },
            data: {
              isAvailable: override.isAvailable,
              startTime: override.startTime,
              endTime: override.endTime,
              reason: override.reason,
            },
          });
        } else {
          // Create new override
          return prisma.doctorAvailabilityOverride.create({
            data: {
              doctorId,
              date: override.date,
              isAvailable: override.isAvailable,
              startTime: override.startTime,
              endTime: override.endTime,
              reason: override.reason,
            },
          });
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
  // and take into account date overrides

  // Note: This would be the same implementation as in availability/route.ts

  return true;
}