import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doctor = await prisma.doctor.findUnique({ where: { clerkUserId: userId } });
    if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const firstDayOfLastMonth = startOfMonth(subMonths(now, 1));
    const lastDayOfLastMonth = endOfMonth(subMonths(now, 1));

    const calculationsThisMonth = await prisma.calculation.findMany({
      where: {
        doctorId: doctor.id,
        date: { gte: firstDayOfMonth }
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        charts: true,
      },
      orderBy: { date: "desc" },
    });

    const calculationsLastMonth = await prisma.calculation.findMany({
      where: {
        doctorId: doctor.id,
        date: {
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth
        }
      }
    });

    const totalCalculations = await prisma.calculation.count({
      where: { doctorId: doctor.id }
    });

    const uniquePatients = await prisma.calculation.findMany({
      where: { doctorId: doctor.id },
      distinct: ['patientId'],
      select: { patientId: true }
    });

    return NextResponse.json({
      calculations: calculationsThisMonth,
      totalCalculations,
      uniquePatients: uniquePatients.length,
      calculationsThisMonth: calculationsThisMonth.length,
      calculationsLastMonth: calculationsLastMonth.length
    });
  } catch (error) {
    console.error("[CALCULATIONS_DASHBOARD_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}