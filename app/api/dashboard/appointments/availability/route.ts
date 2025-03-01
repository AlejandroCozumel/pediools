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

    // Get regular weekly schedule WITH BREAKS
    const apiSchedule = await prisma.doctorAvailability.findMany({
      where: {
        doctorId,
      },
      include: {
        breaks: true, // Include the breaks relationship
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
            breaks: scheduleForDay.breaks || [], // Return the breaks array
          }
        : {
            dayOfWeek: index,
            isActive: false,
            startTime: "09:00",
            endTime: "17:00",
            slotDuration: 30,
            breaks: [], // Initialize with empty breaks array
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

    // Use transaction to handle all database operations
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing availability entries
      await tx.doctorAvailability.deleteMany({
        where: {
          doctorId,
        },
      });

      // Delete existing break periods
      await tx.doctorAvailabilityBreak.deleteMany({
        where: {
          doctorAvailability: {
            doctorId,
          },
        },
      });

      // 2. Create new schedule entries with their breaks
      for (const schedule of body.weeklySchedule) {
        // Only create availability for active days
        if (schedule.isActive) {
          // Create the doctor availability entry
          const availability = await tx.doctorAvailability.create({
            data: {
              doctorId,
              dayOfWeek: schedule.dayOfWeek,
              isActive: schedule.isActive,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              slotDuration: schedule.slotDuration,
            },
          });

          // Handle breaks
          const breaks = schedule.breaks || [];

          // Create break periods for this day
          for (const breakPeriod of breaks) {
            try {
              const createdBreak = await tx.doctorAvailabilityBreak.create({
                data: {
                  doctorAvailabilityId: availability.id,
                  startTime: breakPeriod.startTime,
                  endTime: breakPeriod.endTime,
                },
              });
            } catch (breakError) {
              console.error(
                `Error creating break for day ${schedule.dayOfWeek}:`,
                breakError
              );
            }
          }
        }
      }
    });

    // Generate appointment slots based on the updated availability
    await generateAppointmentSlots(doctorId);

    // Get the updated schedule to return
    const updatedSchedule = await prisma.doctorAvailability.findMany({
      where: {
        doctorId,
      },
      include: {
        breaks: true,
      },
      orderBy: {
        dayOfWeek: "asc",
      },
    });

    return NextResponse.json({
      message: "Availability schedule updated successfully",
      weeklySchedule: updatedSchedule,
    });
  } catch (error) {
    console.error("[AVAILABILITY_POST]", error);
    return NextResponse.json(
      { error: "Failed to update availability", details: error },
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

  // Get the doctor's availability WITH BREAKS
  const availability = await prisma.doctorAvailability.findMany({
    where: { doctorId, isActive: true },
    include: {
      breaks: true,
    },
  });

  let totalSlotsGenerated = 0;

  // Generate slots for each active day
  for (const schedule of availability) {
    // Parse start and end times
    const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
    const [endHour, endMinute] = schedule.endTime.split(":").map(Number);

    // Calculate start and end minutes of the day
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Convert breaks to minutes for easier processing
    const breakPeriods = schedule.breaks.map((breakPeriod) => {
      const [breakStartHour, breakStartMin] = breakPeriod.startTime
        .split(":")
        .map(Number);
      const [breakEndHour, breakEndMin] = breakPeriod.endTime
        .split(":")
        .map(Number);
      return {
        start: breakStartHour * 60 + breakStartMin,
        end: breakEndHour * 60 + breakEndMin,
      };
    });

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
        // Check if the current slot overlaps with any break
        const isBreakTime = breakPeriods.some(
          (breakPeriod) =>
            (slotMinute >= breakPeriod.start && slotMinute < breakPeriod.end) ||
            (slotMinute + schedule.slotDuration > breakPeriod.start &&
              slotMinute + schedule.slotDuration <= breakPeriod.end) ||
            (slotMinute <= breakPeriod.start &&
              slotMinute + schedule.slotDuration >= breakPeriod.end)
        );

        if (isBreakTime) {
          // Find the next available slot after all breaks
          // that overlap with the current time
          const relevantBreaks = breakPeriods.filter(
            (breakPeriod) => slotMinute < breakPeriod.end
          );

          if (relevantBreaks.length > 0) {
            const latestBreakEnd = Math.max(
              ...relevantBreaks.map((b) => b.end)
            );
            slotMinute = latestBreakEnd;
            continue;
          }
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
