import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

// GET all email notifications or patient-specific notifications
export async function GET(
  request: NextRequest,
  { params }: { params: { patientId?: string } }
) {
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
      ...(params.patientId ? { patientId: params.patientId } : {})
    };

    const emailNotificationsThisMonth = await prisma.emailNotification.findMany({
      where: {
        ...baseWhere,
        sentAt: { gte: firstDayOfMonth },
      },
      include: {
        patient: {
          select: {
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

    return NextResponse.json({
      emailNotifications: emailNotificationsThisMonth,
      totalEmailNotifications,
      emailNotificationsThisMonth: emailNotificationsThisMonth.length,
      emailNotificationsLastMonth: emailNotificationsLastMonth.length,
    });
  } catch (error) {
    console.error("[EMAIL_NOTIFICATIONS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE a specific email notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });
    if (!doctor)
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("notificationId");

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    await prisma.emailNotification.deleteMany({
      where: {
        id: notificationId,
        patientId: params.patientId,
        doctorId: doctor.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EMAIL_NOTIFICATION_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST to resend an email notification
export async function POST(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });
    if (!doctor)
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Fetch the existing notification
    const existingNotification = await prisma.emailNotification.findUnique({
      where: { id: notificationId },
      include: {
        patient: true,
        chart: true,
      },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // TODO: Implement actual email resend logic
    // This would typically involve:
    // 1. Regenerating the PDF if needed
    // 2. Sending the email again
    // 3. Updating the notification status

    // For now, we'll just update the sent timestamp
    const updatedNotification = await prisma.emailNotification.update({
      where: { id: notificationId },
      data: {
        sentAt: new Date(),
        status: "SENT",
        deliveryAttempts: { increment: 1 },
      },
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error("[EMAIL_NOTIFICATION_RESEND]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}