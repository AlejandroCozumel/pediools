import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doctor = await prisma.doctor.findUnique({ where: { clerkUserId: userId } });
    if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

    const calculations = await prisma.calculation.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        charts: true,
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    return NextResponse.json(calculations);
  } catch (error) {
    console.error("[CALCULATIONS_DASHBOARD_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}