// app/api/dashboard/appointments/slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { startOfDay, endOfDay, parseISO } from "date-fns";

// Get available appointment slots
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

    // Build filter object
    let filters: any = {
      doctorId,
    };

    if (startDate && endDate) {
      filters.startTime = {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      };
    } else if (startDate) {
      filters.startTime = {
        gte: startOfDay(parseISO(startDate)),
      };
    } else if (endDate) {
      filters.startTime = {
        lte: endOfDay(parseISO(endDate)),
      };
    }

    if (status) {
      filters.status = status;
    }

    // Get slots with their appointments
    const slots = await prisma.appointmentSlot.findMany({
      where: filters,
      include: {
        appointment: {
          select: {
            id: true,
            patientId: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("[APPOINTMENT_SLOTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment slots" },
      { status: 500 }
    );
  }
}

// Create appointment slots
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

    // Process slots manually provided by the doctor
    // This endpoint can be used to manually create specific slots
    // that may not align with regular availability

    const slots = await prisma.appointmentSlot.createMany({
      data: body.slots.map((slot: any) => ({
        doctorId,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
        status: "AVAILABLE",
      })),
    });

    return NextResponse.json({
      message: "Appointment slots created successfully",
      count: slots.count,
    });
  } catch (error) {
    console.error("[APPOINTMENT_SLOTS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create appointment slots" },
      { status: 500 }
    );
  }
}