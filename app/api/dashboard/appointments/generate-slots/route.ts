import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { generateSlotsForMonth } from "@/lib/appointments/timeUtils";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    // Find doctor by Clerk user ID
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: user.id },
    });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }
    const body = await req.json();
    const { year, month, workingHours, slotDuration, exceptions } = body;
    if (!year || !month || !workingHours || !slotDuration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Parse exceptions as Date[] if provided
    const parsedExceptions = (exceptions || []).map((d: string) => new Date(d));
    const result = await generateSlotsForMonth({
      doctorId: doctor.id,
      year,
      month,
      workingHours,
      slotDuration,
      exceptions: parsedExceptions,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}