// app/api/dashboard/email-notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });
    if (!doctor)
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const firstDayOfLastMonth = startOfMonth(subMonths(now, 1));
    const lastDayOfLastMonth = endOfMonth(subMonths(now, 1));

    const baseWhere = {
      doctorId: doctor.id,
    };

    const emailNotificationsThisMonth = await prisma.emailNotification.findMany({
      where: {
        ...baseWhere,
        sentAt: { gte: firstDayOfMonth },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        chart: true,
      },
      orderBy: { sentAt: "desc" },
    });

    const emailNotificationsLastMonth = await prisma.emailNotification.findMany({
      where: {
        ...baseWhere,
        sentAt: {
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth,
        },
      },
    });

    const totalEmailNotifications = await prisma.emailNotification.count({
      where: baseWhere,
    });

    const uniquePatients = await prisma.emailNotification.findMany({
      where: baseWhere,
      distinct: ['patientId'],
      select: { patientId: true },
    });

    return NextResponse.json({
      emailNotifications: emailNotificationsThisMonth,
      totalEmailNotifications,
      uniquePatients: uniquePatients.length,
      emailNotificationsThisMonth: emailNotificationsThisMonth.length,
      emailNotificationsLastMonth: emailNotificationsLastMonth.length,
    });
  } catch (error) {
    console.error("[EMAIL_NOTIFICATIONS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}