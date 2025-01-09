// app/api/dashboard/email-notifications/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { Resend } from "resend";
import prisma from "@/lib/prismadb";
import { generateGrowthChartPDF } from "@/lib/generatePDF";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      emailSubject,
      additionalMessage,
      patientId,
      chartData,
      chartType,
      recipientEmail,
    } = await request.json();

    // Get doctor details
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      include: {
        profile: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Get patient details
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Generate PDF
    const pdfBlob = await generateGrowthChartPDF(
      chartData,
      {},
      patient
    );
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Create email notification record
    const emailNotification = await prisma.emailNotification.create({
      data: {
        type: "CALCULATION_RESULTS",
        status: "PENDING",
        patientId,
        doctorId: doctor.id,
        emailSubject,
        chartId: chartData.id,
      },
    });

    // Send email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${doctor.name} <${process.env.RESEND_FROM_EMAIL}>`,
      to: recipientEmail,
      subject:
        emailSubject ||
        `Growth Chart Report for ${patient.firstName} ${patient.lastName}`,
      text:
        additionalMessage ||
        `Please find attached the growth chart report for ${patient.firstName} ${patient.lastName}.`,
      attachments: [
        {
          filename: `growth-chart-report-${patient.firstName}-${patient.lastName}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (emailError || !emailData) {
      throw new Error(emailError?.message || "Failed to send email");
    }

    // Update email notification status
    await prisma.emailNotification.update({
      where: { id: emailNotification.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      emailId: emailData.id, // This is now properly typed
      notificationId: emailNotification.id,
    });
  } catch (error) {
    console.error("[EMAIL_NOTIFICATIONS_SEND]", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}