// app/api/dashboard/appointments/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { z } from "zod";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
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
    const apiSchedule = await prisma.doctorAvailability.findMany({
      where: {
        doctorId,
      },
      orderBy: {
        dayOfWeek: "asc",
      },
    });

    // Map the API schedule to the format expected by the component
    const weeklySchedule = DAYS_OF_WEEK.map((_, index) => {
      const scheduleForDay = apiSchedule.find(
        (schedule) => schedule.dayOfWeek === index
      );
      return scheduleForDay
        ? {
            dayOfWeek: index,
            isActive: scheduleForDay.isActive,
            startTime: scheduleForDay.startTime,
            endTime: scheduleForDay.endTime,
            slotDuration: scheduleForDay.slotDuration,
            breakStartTime: scheduleForDay.breakStartTime || undefined,
            breakEndTime: scheduleForDay.breakEndTime || undefined,
          }
        : {
            dayOfWeek: index,
            isActive: false,
            startTime: "09:00",
            endTime: "17:00",
            slotDuration: 30,
          };
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
      validatedData.weeklySchedule.map((schedule) =>
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

  // Get the doctor's availability
  const availability = await prisma.doctorAvailability.findMany({
    where: { doctorId, isActive: true },
  });

  let totalSlotsGenerated = 0;

  // Generate slots for each active day
  // Generate slots for each active day
  for (const schedule of availability) {
    // Parse start and end times
    const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
    const [endHour, endMinute] = schedule.endTime.split(":").map(Number);

    // Calculate break times if they exist
    let breakStartMinutes = -1;
    let breakEndMinutes = -1;

    if (schedule.breakStartTime && schedule.breakEndTime) {
      const [breakStartHour, breakStartMin] = schedule.breakStartTime
        .split(":")
        .map(Number);
      const [breakEndHour, breakEndMin] = schedule.breakEndTime
        .split(":")
        .map(Number);

      breakStartMinutes = breakStartHour * 60 + breakStartMin;
      breakEndMinutes = breakEndHour * 60 + breakEndMin;
    }

    // Calculate start and end minutes of the day
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Generate slots for the next 4 weeks
    for (let week = 0; week < 4; week++) {
      // Calculate the date for this schedule's day of the week
      const currentDate = new Date();
      currentDate.setDate(
        currentDate.getDate() +
          week * 7 +
          ((schedule.dayOfWeek - currentDate.getDay() + 7) % 7)
      );

      // Skip dates that have overrides
      const dateString = currentDate.toISOString().split("T")[0];
      const hasOverride = await prisma.doctorAvailabilityOverride.findFirst({
        where: {
          doctorId,
          date: {
            gte: new Date(`${dateString}T00:00:00Z`),
            lt: new Date(`${dateString}T23:59:59Z`),
          },
        },
      });

      if (hasOverride) continue;

      // Generate slots for this day
      let slotMinute = startMinutes;
      let slotsForDay = 0;

      while (slotMinute + schedule.slotDuration <= endMinutes) {
        // Skip slots during break time
        if (
          breakStartMinutes !== -1 &&
          slotMinute >= breakStartMinutes &&
          slotMinute < breakEndMinutes
        ) {
          slotMinute = breakEndMinutes;
          continue;
        }

        // Create the slot
        const slotHour = Math.floor(slotMinute / 60);
        const slotMin = slotMinute % 60;

        const startTime = new Date(currentDate);
        startTime.setHours(slotHour, slotMin, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + schedule.slotDuration);

        // Only create slots that are in the future
        if (startTime > new Date()) {
          await prisma.appointmentSlot.create({
            data: {
              doctorId,
              startTime,
              endTime,
              status: "AVAILABLE",
            },
          });

          slotsForDay++;
        }

        // Move to the next slot
        slotMinute += schedule.slotDuration;
      }

      totalSlotsGenerated += slotsForDay;
    }
  }

  // Optional: Log or validate slot generation
  console.log(
    `Generated ${totalSlotsGenerated} appointment slots for doctor ${doctorId}`
  );

  return totalSlotsGenerated;
}
