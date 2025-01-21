import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { Resend } from "resend";
import prisma from "@/lib/prismadb";
import { EmailType, EmailStatus, Prisma } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      patientId,
      chartData,
      recipientEmail,
      emailSubject,
      additionalMessage,
      pdfUrl,
    } = await request.json();

    // Get doctor details
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      include: { profile: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Find the chart based on calculationId and patientId
    const chart = await prisma.chart.findFirst({
      where: {
        patientId: patientId,
        calculationId: chartData.calculationId,
      },
      include: {
        patient: true,
        calculation: true,
      },
    });

    if (!chart) {
      return NextResponse.json({ error: "Chart not found" }, { status: 404 });
    }

    // Send email
    try {
      await resend.emails.send({
        from: "care@pedimath.com",
        to: recipientEmail,
        subject: emailSubject,
        html: `
          <p>Dear Patient/Guardian,</p>
          <p>${additionalMessage || ""}</p>
          <p>You can download your report using the following link:</p>
          <p><a href="${pdfUrl}">Download Report</a></p>
          <p>Best regards,<br/>Dr. ${doctor.name} ${doctor.lastName || ""}</p>
        `,
      });
    } catch (error) {
      console.error("Email sending failed:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Create email notification record
    const notificationData: Prisma.EmailNotificationCreateInput = {
      type: EmailType.CALCULATION_RESULTS,
      status: EmailStatus.SENT,
      pdfUrl,
      emailSubject,
      deliveryAttempts: 1,
      doctor: { connect: { id: doctor.id } },
      chart: { connect: { id: chart.id } },
      recipientEmail,
    };

    if (chart.patient) {
      notificationData.patient = { connect: { id: chart.patient.id } };
    }

    const emailNotification = await prisma.emailNotification.create({
      data: notificationData,
    });

    return NextResponse.json({
      success: true,
      data: {
        chartId: chart.id,
        emailId: emailNotification.id,
        pdfUrl,
      },
    });
  } catch (error) {
    console.error("[CALCULATION_EMAIL_SEND]", error);
    return NextResponse.json(
      {
        error: "Failed to send email notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}